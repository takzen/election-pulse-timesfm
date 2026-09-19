"""Bayesian-style poll aggregator: a linear Gaussian state-space model of latent support.

The model treats a poll as what it is - a noisy, biased measurement of an unobserved
state - rather than as a data point on a curve:

    state:        theta_t = theta_{t-1} + eps_t,        eps_t ~ N(0, Q)
    observation:  z_i     = theta_{t(i)} + delta_{h(i)} + eta_i,   eta_i ~ N(0, V_i)

`theta` is the additive log-ratio (ALR) of the true shares against a reference category,
`delta_h` is pollster h's house effect and `V_i` is poll i's measurement covariance.

Working in ALR space buys three things that matter:

1. Shares sum to 100% by construction on the inverse transform - never by dividing
   afterwards, so quantiles cannot break the constraint.
2. Log-ratios between parties are invariant to whether a pollster reports undecided
   voters. Polls quoted "among decided voters only" are therefore usable as-is, with
   no rescaling heuristic.
3. The observation equation stays linear in the unknowns, so the exact Kalman filter
   and smoother apply - no MCMC, no sampling error, runs in under a second on CPU.

Measurement covariance comes from multinomial theory via the delta method,
    V_kl = (1/n) * (delta_kl / p_k + 1 / p_ref),
inflated by a design effect estimated from the data, because real polls carry more
error than simple random sampling implies (clustering, weighting, nonresponse).

Variances and the design effect are fitted by maximum likelihood; house effects are
fitted by iterative recentring under a sum-to-zero constraint, which is what makes
them identifiable against the latent state.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd
from scipy.optimize import minimize

logger = logging.getLogger(__name__)

# Order matters only for reproducibility of the state vector layout.
CATEGORIES: List[str] = [
    "KO",
    "PiS",
    "Konfederacja",
    "KKP",
    "Lewica",
    "Rozwoj_Plus",
    "Razem",
    "PSL",
    "Polska_2050",
    "Inne_partie",
    "Niezdecydowani",
]

# The reference must be a party that is essentially always reported: it anchors every
# log-ratio. KO has no missing values in the source and is the largest share.
REFERENCE = "KO"

# Shares below this are treated as at the floor when computing measurement variance.
# Without it a reported 0.0% would imply infinite variance.
_SHARE_FLOOR = 0.002

# Fallback sample size for the few polls that publish none.
_DEFAULT_N = 1000

# Categories excluded from the "decided voters" base. Undecided respondents cast no
# vote, so the statutory 5% threshold and every published figure in the Polish press
# are computed without them. "Inne_partie" stays in: those are votes for other parties.
_UNDECIDED = "Niezdecydowani"


def rebase_draws(
    shares: np.ndarray,
    categories: Sequence[str],
    basis: str,
) -> np.ndarray:
    """Rescales simulated shares onto the requested percentage base.

    `basis="all"` keeps every category, summing to 100%. `basis="decided"` drops the
    undecided group and renormalises, which is the base the press and the Sejm
    threshold use. Rebasing has to happen on the draws, before any quantile is taken:
    rescaling a finished quantile would give the wrong interval, because the divisor
    is itself uncertain.
    """
    if basis == "all":
        return shares
    if basis != "decided":
        raise ValueError(f"unknown basis {basis!r}")
    keep = [i for i, c in enumerate(categories) if c != _UNDECIDED]
    sub = shares[..., keep]
    total = sub.sum(axis=-1, keepdims=True)
    return sub / total * 100.0


@dataclass
class AggregatorFit:
    """Fitted parameters and the smoothed latent path."""

    dates: pd.DatetimeIndex
    categories: List[str]
    reference: str
    # Smoothed ALR state and covariance per day.
    state: np.ndarray               # (T, K)
    state_cov: np.ndarray           # (T, K, K)
    # Fitted hyper-parameters.
    rw_sigma: np.ndarray            # (K,) daily random-walk sd per ALR dimension
    design_effect: np.ndarray       # per-dimension variance multiplier on sampling error
    house_effects: Dict[str, np.ndarray]
    pollster_counts: Dict[str, int]
    loglik: float
    n_polls_used: int
    dropped_observations: int = 0
    notes: List[str] = field(default_factory=list)

    @property
    def dim_names(self) -> List[str]:
        return [c for c in self.categories if c != self.reference]


# --------------------------------------------------------------------- transforms


def alr(shares: np.ndarray, ref_idx: int) -> np.ndarray:
    """Additive log-ratio of `shares` against the reference component."""
    shares = np.asarray(shares, dtype=float)
    keep = [i for i in range(shares.shape[-1]) if i != ref_idx]
    return np.log(shares[..., keep]) - np.log(shares[..., [ref_idx]])


def alr_inv(z: np.ndarray, ref_idx: int) -> np.ndarray:
    """Maps ALR coordinates back to shares that sum to exactly 1."""
    z = np.asarray(z, dtype=float)
    # Insert a zero for the reference, then softmax: shares sum to 1 by construction.
    full = np.insert(z, ref_idx, 0.0, axis=-1)
    full = full - full.max(axis=-1, keepdims=True)
    exp = np.exp(full)
    return exp / exp.sum(axis=-1, keepdims=True)


def sampling_covariance_alr(p: np.ndarray, n: float, ref_idx: int) -> np.ndarray:
    """Multinomial sampling covariance of ALR-transformed shares (delta method).

    V_kl = (1/n) * (delta_kl / p_k + 1 / p_ref)

    Verified numerically against multinomial draws; accurate to ~1% for shares above
    a few percent, degrading for very small ones - which the design effect absorbs.
    """
    p = np.clip(np.asarray(p, dtype=float), _SHARE_FLOOR, 1.0)
    keep = [i for i in range(len(p)) if i != ref_idx]
    p_ref = p[ref_idx]
    k = len(keep)
    cov = np.full((k, k), 1.0 / (n * p_ref))
    cov[np.diag_indices(k)] += 1.0 / (n * p[keep])
    return cov


# ------------------------------------------------------------------ observations


@dataclass
class Observation:
    """One poll reduced to a linear Gaussian observation of the latent state."""

    t: int                  # time index (day)
    dim_idx: np.ndarray     # which ALR dimensions this poll informs
    z: np.ndarray           # observed ALR values
    cov: np.ndarray         # measurement covariance (before design effect)
    pollster: str


def build_observations(
    polls: pd.DataFrame,
    dates: pd.DatetimeIndex,
    categories: Sequence[str] = tuple(CATEGORIES),
    reference: str = REFERENCE,
) -> Tuple[List[Observation], int]:
    """Turns a provenance-carrying poll table into Observations.

    Polls that omit the undecided category are kept as-is: party-versus-party
    log-ratios do not depend on that category, so no rescaling is needed. Categories a
    poll did not report separately are simply absent from its observation vector - the
    filter treats them as missing rather than imputing a value.
    """
    categories = list(categories)
    ref_idx = categories.index(reference)
    dim_names = [c for c in categories if c != reference]
    date_to_t = {d: i for i, d in enumerate(dates)}

    observations: List[Observation] = []
    dropped = 0

    for _, row in polls.iterrows():
        day = pd.Timestamp(row["date"]).normalize()
        if day not in date_to_t:
            dropped += 1
            continue

        reported = {c: float(row[c]) for c in categories if c in row and pd.notna(row[c])}
        if reference not in reported or len(reported) < 2:
            dropped += 1
            continue

        # Normalise over the reported set so values are proportions of that poll's own
        # base. The ALR itself is scale-invariant; this only calibrates the variance.
        total = sum(reported.values())
        if total <= 0:
            dropped += 1
            continue

        p_full = np.full(len(categories), _SHARE_FLOOR)
        for cat, val in reported.items():
            p_full[categories.index(cat)] = max(val / total, _SHARE_FLOOR)

        n = row.get("sample_size")
        n = float(n) if pd.notna(n) and float(n) > 0 else float(_DEFAULT_N)

        full_cov = sampling_covariance_alr(p_full, n, ref_idx)
        z_full = alr(p_full, ref_idx)

        observed_dims = [i for i, name in enumerate(dim_names) if name in reported]
        if not observed_dims:
            dropped += 1
            continue
        idx = np.asarray(observed_dims, dtype=int)

        observations.append(
            Observation(
                t=date_to_t[day],
                dim_idx=idx,
                z=z_full[idx],
                cov=full_cov[np.ix_(idx, idx)],
                pollster=str(row.get("pollster", "unknown")),
            )
        )

    observations.sort(key=lambda o: o.t)
    return observations, dropped


# ------------------------------------------------------------ filter and smoother


def _kalman(
    observations: List[Observation],
    n_days: int,
    n_dim: int,
    rw_var: np.ndarray,
    design_effect: np.ndarray,
    house: Dict[str, np.ndarray],
    x0: np.ndarray,
    p0_scale: float = 4.0,
    robust_threshold: Optional[float] = None,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, float]:
    """Runs the forward filter, returning predicted/filtered moments and log-likelihood.

    `robust_threshold`, when set, down-weights observations whose standardised residual
    exceeds it, so a single badly-fielded poll cannot drag the latent path.
    """
    by_day: Dict[int, List[Observation]] = {}
    for obs in observations:
        by_day.setdefault(obs.t, []).append(obs)

    x_pred = np.zeros((n_days, n_dim))
    p_pred = np.zeros((n_days, n_dim, n_dim))
    x_filt = np.zeros((n_days, n_dim))
    p_filt = np.zeros((n_days, n_dim, n_dim))
    loglik = 0.0

    x = x0.copy()
    p = np.eye(n_dim) * p0_scale
    q = np.diag(rw_var)

    for t in range(n_days):
        if t > 0:
            x = x_filt[t - 1].copy()
            p = p_filt[t - 1] + q
        x_pred[t] = x
        p_pred[t] = p

        for obs in by_day.get(t, []):
            idx = obs.dim_idx
            delta = house.get(obs.pollster)
            offset = delta[idx] if delta is not None else 0.0

            resid = obs.z - x[idx] - offset
            # Per-dimension variance inflation, applied as a congruent transform so the
            # covariance stays positive definite. A single scalar cannot work here: the
            # delta-method approximation degrades as a share gets small, so tiny
            # parties need more inflation than large ones, and forcing one multiplier
            # makes big-party bands too wide and small-party bands too narrow.
            scale = np.sqrt(design_effect[idx])
            s = p[np.ix_(idx, idx)] + obs.cov * np.outer(scale, scale)
            # Symmetrise for numerical safety before solving.
            s = 0.5 * (s + s.T)
            try:
                s_inv = np.linalg.inv(s)
            except np.linalg.LinAlgError:
                continue

            if robust_threshold is not None:
                maha = float(resid @ s_inv @ resid)
                dof = len(idx)
                # Scale up this poll's variance if it is a clear outlier.
                if maha > robust_threshold * dof:
                    inflate = maha / (robust_threshold * dof)
                    s = s * inflate
                    s = 0.5 * (s + s.T)
                    s_inv = np.linalg.inv(s)

            sign, logdet = np.linalg.slogdet(s)
            if sign <= 0:
                continue
            loglik += -0.5 * (logdet + float(resid @ s_inv @ resid) + len(idx) * np.log(2 * np.pi))

            gain = p[:, idx] @ s_inv
            x = x + gain @ resid
            p = p - gain @ p[idx, :]
            p = 0.5 * (p + p.T)

        x_filt[t] = x
        p_filt[t] = p

    return x_pred, p_pred, x_filt, p_filt, loglik


def _kalman_loglik(
    observations: List[Observation],
    n_days: int,
    n_dim: int,
    rw_var: np.ndarray,
    design_effect: np.ndarray,
    house: Dict[str, np.ndarray],
    x0: np.ndarray,
    p0_scale: float = 4.0,
    robust_threshold: Optional[float] = None,
) -> float:
    """Log-likelihood only, evaluated on the days that actually carry observations.

    Days without a poll contribute nothing to the likelihood; all they do is accumulate
    process variance. For a random walk that accumulation is exactly `Q * gap`, so
    skipping straight from one poll day to the next gives the identical likelihood while
    iterating over ~330 days instead of ~1060.

    This matters because the maximum-likelihood step evaluates this function several
    hundred times per fit, and validation refits the model dozens of times. The full
    daily grid is still used once, at the end, to produce the published path.
    """
    by_day: Dict[int, List[Observation]] = {}
    for obs in observations:
        by_day.setdefault(obs.t, []).append(obs)
    if not by_day:
        return 0.0

    q = np.diag(rw_var)
    x = x0.copy()
    p = np.eye(n_dim) * p0_scale
    loglik = 0.0
    previous_day = 0

    for day in sorted(by_day):
        gap = day - previous_day
        if gap > 0:
            p = p + q * gap
        previous_day = day

        for obs in by_day[day]:
            idx = obs.dim_idx
            delta = house.get(obs.pollster)
            offset = delta[idx] if delta is not None else 0.0

            resid = obs.z - x[idx] - offset
            scale = np.sqrt(design_effect[idx])
            s = p[np.ix_(idx, idx)] + obs.cov * np.outer(scale, scale)
            s = 0.5 * (s + s.T)
            try:
                s_inv = np.linalg.inv(s)
            except np.linalg.LinAlgError:
                continue

            if robust_threshold is not None:
                maha = float(resid @ s_inv @ resid)
                dof = len(idx)
                if maha > robust_threshold * dof:
                    s = s * (maha / (robust_threshold * dof))
                    s = 0.5 * (s + s.T)
                    s_inv = np.linalg.inv(s)

            sign, logdet = np.linalg.slogdet(s)
            if sign <= 0:
                continue
            loglik += -0.5 * (
                logdet + float(resid @ s_inv @ resid) + len(idx) * np.log(2 * np.pi)
            )

            gain = p[:, idx] @ s_inv
            x = x + gain @ resid
            p = p - gain @ p[idx, :]
            p = 0.5 * (p + p.T)

    return loglik


def _smooth(
    x_pred: np.ndarray,
    p_pred: np.ndarray,
    x_filt: np.ndarray,
    p_filt: np.ndarray,
    rw_var: np.ndarray,
) -> Tuple[np.ndarray, np.ndarray]:
    """Rauch-Tung-Striebel smoother for a random-walk state."""
    n_days, n_dim = x_filt.shape
    x_smooth = x_filt.copy()
    p_smooth = p_filt.copy()

    for t in range(n_days - 2, -1, -1):
        p_next_pred = p_pred[t + 1]
        try:
            j = p_filt[t] @ np.linalg.inv(p_next_pred)
        except np.linalg.LinAlgError:
            continue
        x_smooth[t] = x_filt[t] + j @ (x_smooth[t + 1] - x_pred[t + 1])
        p_smooth[t] = p_filt[t] + j @ (p_smooth[t + 1] - p_next_pred) @ j.T
        p_smooth[t] = 0.5 * (p_smooth[t] + p_smooth[t].T)

    return x_smooth, p_smooth


# ------------------------------------------------------------------------- fitting


class PollAggregator:
    """Fits the state-space model and produces nowcasts, paths and forecasts."""

    def __init__(
        self,
        categories: Sequence[str] = tuple(CATEGORIES),
        reference: str = REFERENCE,
        robust_threshold: Optional[float] = 9.0,
        house_effect_iters: int = 4,
        # Maximum-likelihood passes. The variance parameters settle after one or two
        # rounds, while house effects keep refining cheaply on top of them, so running
        # the full optimisation on every house-effect iteration costs ~4x the time for
        # no measurable change in the fit.
        mle_iters: int = 2,
        design_pooling: float = 12.0,
        seed: int = 12345,
    ):
        self.categories = list(categories)
        self.reference = reference
        if reference not in self.categories:
            raise ValueError(f"reference {reference!r} is not among the categories")
        self.ref_idx = self.categories.index(reference)
        self.dim_names = [c for c in self.categories if c != reference]
        self.robust_threshold = robust_threshold
        self.house_effect_iters = house_effect_iters
        self.mle_iters = mle_iters
        self.design_pooling = design_pooling
        self.rng = np.random.default_rng(seed)
        self.fit_: Optional[AggregatorFit] = None

    # ----------------------------------------------------------------- internals

    def _initial_state(self, observations: List[Observation], n_dim: int) -> np.ndarray:
        """Averages the earliest observations to start the filter near the data."""
        acc = np.zeros(n_dim)
        cnt = np.zeros(n_dim)
        for obs in observations[: min(8, len(observations))]:
            acc[obs.dim_idx] += obs.z
            cnt[obs.dim_idx] += 1
        out = np.where(cnt > 0, acc / np.maximum(cnt, 1), 0.0)
        return out

    def _negative_loglik(
        self,
        params: np.ndarray,
        observations: List[Observation],
        n_days: int,
        n_dim: int,
        house: Dict[str, np.ndarray],
        x0: np.ndarray,
    ) -> float:
        rw_var = np.exp(2.0 * params[:n_dim])
        log_design = params[n_dim : 2 * n_dim]
        design = np.exp(log_design)
        loglik = _kalman_loglik(
            observations,
            n_days,
            n_dim,
            rw_var,
            design,
            house,
            x0,
            robust_threshold=self.robust_threshold,
        )
        if not np.isfinite(loglik):
            return 1e12

        # Partial pooling of the per-dimension design effects towards their common
        # level. Categories that appear in few polls - a party that did not exist for
        # most of the window, or one only ever reported jointly with another - carry
        # almost no information about their own inflation factor, and an unpenalised
        # fit hands them an arbitrary value from the optimiser. Shrinking them to the
        # pooled level keeps those dimensions honest without forcing one multiplier on
        # everything.
        penalty = self.design_pooling * float(np.sum((log_design - log_design.mean()) ** 2))
        return -loglik + penalty

    def _estimate_house_effects(
        self,
        observations: List[Observation],
        x_smooth: np.ndarray,
        n_dim: int,
    ) -> Tuple[Dict[str, np.ndarray], Dict[str, int]]:
        """Mean residual per pollster, recentred so the weighted average is zero.

        The centring is what makes house effects identifiable: without it any constant
        could move from the latent state into every house effect and back.
        """
        sums: Dict[str, np.ndarray] = {}
        counts: Dict[str, np.ndarray] = {}
        polls: Dict[str, int] = {}

        for obs in observations:
            idx = obs.dim_idx
            resid = obs.z - x_smooth[obs.t][idx]
            sums.setdefault(obs.pollster, np.zeros(n_dim))[idx] += resid
            counts.setdefault(obs.pollster, np.zeros(n_dim))[idx] += 1
            polls[obs.pollster] = polls.get(obs.pollster, 0) + 1

        house = {
            name: np.where(counts[name] > 0, sums[name] / np.maximum(counts[name], 1), 0.0)
            for name in sums
        }

        # Weight by number of polls so prolific pollsters define the centre.
        total = sum(polls.values())
        if total:
            centre = np.zeros(n_dim)
            for name, delta in house.items():
                centre += delta * (polls[name] / total)
            for name in house:
                house[name] = house[name] - centre
        return house, polls

    # ---------------------------------------------------------------------- API

    def fit(
        self,
        polls: pd.DataFrame,
        end_date: Optional[pd.Timestamp] = None,
        hyperparams: Optional[Tuple[np.ndarray, float]] = None,
    ) -> AggregatorFit:
        """Fits variances, design effect, house effects and the smoothed latent path.

        `hyperparams` supplies a pre-fitted `(rw_sigma, design_effect)` pair and skips
        the maximum-likelihood step, leaving only the filter and the house effects.
        Rolling validation uses this: hyper-parameters are estimated once on the
        earliest window, so no information from the future reaches later cut-offs, and
        each refit costs a filter pass instead of a full optimisation.
        """
        polls = polls.copy()
        polls["date"] = pd.to_datetime(polls["date"]).dt.normalize()
        polls = polls.sort_values("date")
        if end_date is not None:
            polls = polls[polls["date"] <= pd.Timestamp(end_date).normalize()]
        if polls.empty:
            raise ValueError("no polls to fit")

        start = polls["date"].min()
        stop = pd.Timestamp(end_date).normalize() if end_date is not None else polls["date"].max()
        dates = pd.date_range(start, stop, freq="D")
        n_days = len(dates)
        n_dim = len(self.dim_names)

        observations, dropped = build_observations(
            polls, dates, categories=self.categories, reference=self.reference
        )
        if not observations:
            raise ValueError("no usable observations after parsing")

        x0 = self._initial_state(observations, n_dim)
        house: Dict[str, np.ndarray] = {}
        notes: List[str] = []

        # Reasonable starting point: ~0.02 daily sd in log space, sampling error as-is.
        params = np.concatenate([np.full(n_dim, np.log(0.02)), np.full(n_dim, np.log(1.5))])
        loglik = -np.inf
        counts: Dict[str, int] = {}

        if hyperparams is not None:
            given_sigma, given_design = hyperparams
            params = np.concatenate(
                [
                    np.log(np.asarray(given_sigma, dtype=float)),
                    np.log(np.asarray(given_design, dtype=float) * np.ones(n_dim)),
                ]
            )

        for iteration in range(self.house_effect_iters):
            if hyperparams is None and iteration < self.mle_iters:
                result = minimize(
                    self._negative_loglik,
                    params,
                    args=(observations, n_days, n_dim, house, x0),
                    method="L-BFGS-B",
                    bounds=(
                        [(np.log(1e-4), np.log(0.5))] * n_dim
                        + [(np.log(0.25), np.log(60.0))] * n_dim
                    ),
                    options={"maxiter": 200},
                )
                params = result.x
                loglik = -float(result.fun)

            rw_var = np.exp(2.0 * params[:n_dim])
            design = np.exp(params[n_dim : 2 * n_dim])
            x_pred, p_pred, x_filt, p_filt, _ = _kalman(
                observations, n_days, n_dim, rw_var, design, house, x0,
                robust_threshold=self.robust_threshold,
            )
            x_smooth, p_smooth = _smooth(x_pred, p_pred, x_filt, p_filt, rw_var)
            house, counts = self._estimate_house_effects(observations, x_smooth, n_dim)
            logger.debug(
                "iteration %d: loglik=%.2f median design=%.3f",
                iteration, loglik, float(np.median(design)),
            )

        rw_var = np.exp(2.0 * params[:n_dim])
        design = np.exp(params[n_dim : 2 * n_dim])
        x_pred, p_pred, x_filt, p_filt, loglik = _kalman(
            observations, n_days, n_dim, rw_var, design, house, x0,
            robust_threshold=self.robust_threshold,
        )
        x_smooth, p_smooth = _smooth(x_pred, p_pred, x_filt, p_filt, rw_var)

        median_design = float(np.median(design))
        if median_design > 4.0:
            notes.append(
                f"Median design effect {median_design:.2f} is high: published polls "
                "disagree far more than their stated sample sizes imply."
            )
        if dropped:
            notes.append(f"{dropped} rows were unusable (no reference category or no date).")

        self.fit_ = AggregatorFit(
            dates=dates,
            categories=self.categories,
            reference=self.reference,
            state=x_smooth,
            state_cov=p_smooth,
            rw_sigma=np.sqrt(rw_var),
            design_effect=design,
            house_effects=house,
            pollster_counts=counts,
            loglik=loglik,
            n_polls_used=len(observations),
            dropped_observations=dropped,
            notes=notes,
        )
        logger.info(
            "Fitted on %d polls over %d days: loglik=%.1f, median design effect=%.2f",
            len(observations), n_days, loglik, float(np.median(design)),
        )
        return self.fit_

    def _require_fit(self) -> AggregatorFit:
        if self.fit_ is None:
            raise RuntimeError("call fit() first")
        return self.fit_

    def shares_path(self, n_draws: int = 4000, basis: str = "all") -> pd.DataFrame:
        """Smoothed daily shares with quantile bands, in percent.

        Quantiles come from simulating in ALR space and transforming each draw, so the
        curvature of the transform is respected instead of being linearised away.

        Note on which figure to publish as the point estimate: every simulated draw sums
        to exactly 100%, but marginal medians of a composition do not - that is a
        property of compositions, not a bug. The `_mean` columns are the
        constraint-preserving point estimate and are what callers should display;
        `_p50` is the per-category median and is only meaningful alongside its own band.
        """
        fit = self._require_fit()
        rows = []
        for t, day in enumerate(fit.dates):
            draws = self.rng.multivariate_normal(
                fit.state[t], fit.state_cov[t], size=n_draws, method="svd"
            )
            shares = rebase_draws(
                alr_inv(draws, self.ref_idx) * 100.0, fit.categories, basis
            )
            names = [c for c in fit.categories if basis == "all" or c != _UNDECIDED]
            q = np.percentile(shares, [10, 25, 50, 75, 90], axis=0)
            means = shares.mean(axis=0)
            row: Dict[str, object] = {"date": day}
            for j, cat in enumerate(names):
                row[f"{cat}_p10"] = q[0, j]
                row[f"{cat}_p25"] = q[1, j]
                row[f"{cat}_p50"] = q[2, j]
                row[f"{cat}_p75"] = q[3, j]
                row[f"{cat}_p90"] = q[4, j]
                row[f"{cat}_mean"] = means[j]
            rows.append(row)
        return pd.DataFrame(rows)

    def nowcast(self, n_draws: int = 20000, basis: str = "all") -> pd.DataFrame:
        """Current latent support per category, with an 80% band, in percent.

        `basis="decided"` reports shares of decided voters, which is how Polish media
        and the 5% threshold express them; see `rebase_draws`.
        """
        fit = self._require_fit()
        draws = self.rng.multivariate_normal(
            fit.state[-1], fit.state_cov[-1], size=n_draws, method="svd"
        )
        shares = rebase_draws(alr_inv(draws, self.ref_idx) * 100.0, fit.categories, basis)
        names = [c for c in fit.categories if basis == "all" or c != _UNDECIDED]
        q = np.percentile(shares, [10, 25, 50, 75, 90], axis=0)
        return pd.DataFrame(
            {
                "category": names,
                "p10": q[0],
                "p25": q[1],
                "p50": q[2],
                "p75": q[3],
                "p90": q[4],
                "mean": shares.mean(axis=0),
            }
        )

    def forecast(
        self, horizon: int = 30, n_draws: int = 20000, basis: str = "all"
    ) -> pd.DataFrame:
        """Projects the latent state forward as a random walk.

        With no future polls this is the statistically correct answer: the central
        estimate holds and the bands widen with the square root of the horizon.
        """
        fit = self._require_fit()
        q_mat = np.diag(fit.rw_sigma ** 2)
        rows = []
        for step in range(1, horizon + 1):
            cov = fit.state_cov[-1] + q_mat * step
            draws = self.rng.multivariate_normal(
                fit.state[-1], cov, size=n_draws, method="svd"
            )
            shares = rebase_draws(
                alr_inv(draws, self.ref_idx) * 100.0, fit.categories, basis
            )
            names = [c for c in fit.categories if basis == "all" or c != _UNDECIDED]
            quantiles = np.percentile(shares, [10, 25, 50, 75, 90], axis=0)
            means = shares.mean(axis=0)
            day = fit.dates[-1] + pd.Timedelta(days=step)
            row: Dict[str, object] = {"date": day, "step": step}
            for j, cat in enumerate(names):
                row[f"{cat}_p10"] = quantiles[0, j]
                row[f"{cat}_p25"] = quantiles[1, j]
                row[f"{cat}_p50"] = quantiles[2, j]
                row[f"{cat}_p75"] = quantiles[3, j]
                row[f"{cat}_p90"] = quantiles[4, j]
                row[f"{cat}_mean"] = means[j]
            rows.append(row)
        return pd.DataFrame(rows)

    def predictive_band_for_poll(
        self,
        pollster: str,
        sample_size: float,
        t: Optional[int] = None,
        level: float = 0.80,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Predictive interval, in ALR space, for what `pollster` would report.

        Combines state uncertainty, that pollster's house effect and the poll's own
        measurement error, so it is the distribution a held-out poll should fall in.
        This is what the coverage check in `validation.py` tests.
        """
        fit = self._require_fit()
        t = len(fit.dates) - 1 if t is None else t
        shares = alr_inv(fit.state[t], self.ref_idx)
        scale = np.sqrt(fit.design_effect)
        meas = sampling_covariance_alr(shares, sample_size, self.ref_idx) * np.outer(scale, scale)
        total = fit.state_cov[t] + meas
        centre = fit.state[t] + fit.house_effects.get(pollster, np.zeros(len(self.dim_names)))
        sd = np.sqrt(np.clip(np.diag(total), 0.0, None))
        from scipy.stats import norm

        z_crit = float(norm.ppf(0.5 + level / 2.0))
        return centre - z_crit * sd, centre + z_crit * sd

    def house_effects_table(self) -> pd.DataFrame:
        """House effects per pollster, expressed in percentage points of share.

        Converts the ALR-space offset into the share change it implies at the current
        state, which is the only form that is interpretable to a reader.
        """
        fit = self._require_fit()
        base = alr_inv(fit.state[-1], self.ref_idx) * 100.0
        rows = []
        for pollster, delta in sorted(fit.house_effects.items()):
            shifted = alr_inv(fit.state[-1] + delta, self.ref_idx) * 100.0
            row: Dict[str, object] = {
                "pollster": pollster,
                "n_polls": fit.pollster_counts.get(pollster, 0),
            }
            for j, cat in enumerate(fit.categories):
                row[cat] = shifted[j] - base[j]
            rows.append(row)
        return pd.DataFrame(rows)


if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    frame = pd.read_parquet("data/raw/polls_real.parquet")
    frame = frame[~frame["is_election"]]

    aggregator = PollAggregator()
    fitted = aggregator.fit(frame)

    print(f"\nSondazy: {fitted.n_polls_used} | dni: {len(fitted.dates)}")
    print(f"Efekt planu proby (mediana): {float(np.median(fitted.design_effect)):.2f}")
    print(f"Log-wiarygodnosc: {fitted.loglik:.1f}")
    for note in fitted.notes:
        print(f"UWAGA: {note}")

    print("\n=== NOWCAST (stan na ostatni dzien) ===")
    now = aggregator.nowcast()
    now["p50"] = now["p50"].round(2)
    print(now[["category", "p10", "p50", "p90"]].round(2).to_string(index=False))
    print(f"\nSuma median: {now['p50'].sum():.2f}%")

    print("\n=== EFEKTY PRACOWNI (pp wzgledem sredniej) ===")
    print(aggregator.house_effects_table().round(2).to_string(index=False))
