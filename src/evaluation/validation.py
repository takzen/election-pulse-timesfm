"""Out-of-sample validation of the poll aggregator.

Two things are measured, both on polls the model has never seen:

1. **Coverage.** An 80% predictive interval must contain the next poll's reported
   figures about 80% of the time. Too low means the bands lie about certainty; too
   high means they are padded and useless. This is the check that decides whether the
   published uncertainty means anything.

2. **Point accuracy against a random walk.** For party support a random walk is a
   genuinely strong baseline, and any model that cannot beat it has earned no claim.
   The comparison is against real published polls, never against a smoothed curve
   fitted to those same polls - that would only measure self-consistency.

Evaluation is rolling-origin: at each cut-off the model refits on strictly earlier
polls, then predicts the next poll. No information from the future leaks in.
"""

from __future__ import annotations

import logging
import sys
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence

import numpy as np
import pandas as pd

from src.models.poll_aggregator import (
    CATEGORIES,
    PollAggregator,
    REFERENCE,
    _DEFAULT_N,
    alr,
    alr_inv,
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Aggregate out-of-sample scores."""

    n_evaluations: int
    coverage_80: float
    coverage_by_category: Dict[str, float]
    mae_model: float
    mae_random_walk: float
    mae_last_poll: float
    mae_by_category: Dict[str, float]
    horizon_days: Dict[int, float]
    details: pd.DataFrame
    # Paired bootstrap on the model-minus-baseline error difference.
    advantage_vs_random_walk: float = 0.0
    advantage_ci: Tuple[float, float] = (0.0, 0.0)
    advantage_is_significant: bool = False

    def summary(self) -> str:
        lo, hi = self.advantage_ci
        verdict = "istotna" if self.advantage_is_significant else "NIEISTOTNA (moze byc szum)"
        lines = [
            f"Ocen out-of-sample: {self.n_evaluations}",
            f"Pokrycie przedzialu 80%: {self.coverage_80 * 100:.1f}%  (cel: 80%)",
            f"MAE agregator     : {self.mae_model:.3f} pp",
            f"MAE random walk   : {self.mae_random_walk:.3f} pp",
            f"MAE ostatni sondaz: {self.mae_last_poll:.3f} pp",
            f"Przewaga nad random walk: {self.advantage_vs_random_walk:+.3f} pp "
            f"(95% CI {lo:+.3f} .. {hi:+.3f}) -> {verdict}",
        ]
        return "\n".join(lines)


def _paired_bootstrap(
    diff: np.ndarray,
    groups: np.ndarray,
    n_boot: int = 4000,
    seed: int = 11,
) -> Tuple[float, Tuple[float, float], bool]:
    """Bootstrap CI for a mean paired error difference, resampling whole polls.

    Resampling is by poll rather than by observation: the category errors within one
    poll are correlated (they share a sample and a fieldwork date), so treating them as
    independent would understate the interval and manufacture significance.
    """
    rng = np.random.default_rng(seed)
    unique = np.unique(groups)
    by_group = {g: diff[groups == g] for g in unique}

    observed = float(np.mean(diff))
    means = np.empty(n_boot)
    for b in range(n_boot):
        picks = rng.choice(unique, size=len(unique), replace=True)
        means[b] = float(np.mean(np.concatenate([by_group[g] for g in picks])))

    lo, hi = np.percentile(means, [2.5, 97.5])
    return observed, (float(lo), float(hi)), bool(lo > 0.0)


def _shares_from_row(
    row: pd.Series, categories: Sequence[str], require_all: bool = False
) -> Optional[Dict[str, float]]:
    """Reported categories for one poll, renormalised over what it actually reported.

    With `require_all`, the row must report every requested category or nothing is
    returned. Baselines use that so they are scored on exactly the same percentage
    base as the target poll - otherwise a naive tracker would be charged for a
    difference in reporting convention rather than for being wrong.
    """
    reported = {c: float(row[c]) for c in categories if c in row and pd.notna(row[c])}
    if REFERENCE not in reported or len(reported) < 3:
        return None
    if require_all and len(reported) != len(list(categories)):
        return None
    total = sum(reported.values())
    if total <= 0:
        return None
    return {c: v / total * 100.0 for c, v in reported.items()}


def rolling_validation(
    polls: pd.DataFrame,
    categories: Sequence[str] = tuple(CATEGORIES),
    min_train_polls: int = 60,
    max_evaluations: int = 80,
    level: float = 0.80,
    refit_every: int = 10,
) -> ValidationResult:
    """Refits at each cut-off and scores the next unseen poll.

    `max_evaluations` caps the number of refits: each one is a full MLE, so scoring
    every poll would take a long time for no extra insight. Cut-offs are spread evenly
    over the eligible range rather than clustered at the end.
    """
    polls = polls.copy()
    polls["date"] = pd.to_datetime(polls["date"]).dt.normalize()
    polls = polls[~polls.get("is_election", pd.Series(False, index=polls.index)).fillna(False)]
    polls = polls.sort_values("date").reset_index(drop=True)

    eligible = list(range(min_train_polls, len(polls)))
    if not eligible:
        raise ValueError("not enough polls to validate")
    if len(eligible) > max_evaluations:
        picks = np.linspace(0, len(eligible) - 1, max_evaluations).round().astype(int)
        eligible = [eligible[i] for i in dict.fromkeys(picks)]

    dim_names = [c for c in categories if c != REFERENCE]
    ref_idx = list(categories).index(REFERENCE)

    # Hyper-parameters are estimated once, on the earliest training window only. That
    # window precedes every evaluation point, so nothing from the future leaks in, and
    # each cut-off then costs one filter pass rather than a full MLE.
    # Re-estimated every `refit_every` cut-offs on the training window current at that
    # point, never on the whole series. A single warm-up window is not enough: parties
    # that appear later (KKP from 2025, Rozwoj Plus from 2026) are absent from it, so
    # their parameters would be fitted on no data and then reused for years.
    shared_hyperparams: Optional[tuple] = None

    records: List[Dict[str, object]] = []
    evaluated = 0

    for target_idx in eligible:
        target = polls.iloc[target_idx]
        train = polls.iloc[:target_idx]
        # Only polls strictly before the target's fieldwork end date.
        train = train[train["date"] < target["date"]]
        if len(train) < min_train_polls:
            continue

        truth = _shares_from_row(target, categories)
        if truth is None:
            continue

        if shared_hyperparams is None or (evaluated % refit_every == 0):
            try:
                seed_fit = PollAggregator(categories=categories).fit(
                    train, end_date=train["date"].max()
                )
                shared_hyperparams = (seed_fit.rw_sigma, seed_fit.design_effect)
                logger.info(
                    "re-estimated hyper-parameters at %s: median design=%.2f",
                    train["date"].max().date(),
                    float(np.median(seed_fit.design_effect)),
                )
            except Exception as exc:  # pragma: no cover
                logger.warning("hyper-parameter refit failed: %s", exc)

        try:
            aggregator = PollAggregator(categories=categories, house_effect_iters=2)
            fit = aggregator.fit(
                train, end_date=train["date"].max(), hyperparams=shared_hyperparams
            )
        except Exception as exc:  # pragma: no cover - guard against degenerate windows
            logger.warning("fit failed at index %d: %s", target_idx, exc)
            continue

        evaluated += 1
        horizon = int((target["date"] - fit.dates[-1]).days)
        n = target.get("sample_size")
        n = float(n) if pd.notna(n) and float(n) > 0 else float(_DEFAULT_N)

        # Model prediction: state carried forward to the target date, plus that
        # pollster's house effect and its own measurement error.
        state = fit.state[-1]
        state_cov = fit.state_cov[-1] + np.diag(fit.rw_sigma ** 2) * max(horizon, 0)
        pollster = str(target.get("pollster", "unknown"))
        house = fit.house_effects.get(pollster, np.zeros(len(dim_names)))

        from src.models.poll_aggregator import sampling_covariance_alr

        base_shares = alr_inv(state, ref_idx)
        meas = sampling_covariance_alr(base_shares, n, ref_idx) * fit.design_effect
        total_cov = state_cov + meas
        # Symmetrise and clip eigenvalues: accumulated floating-point drift in the
        # smoother can leave the covariance a hair short of positive semi-definite,
        # which makes the sampler emit warnings and return degenerate draws.
        total_cov = 0.5 * (total_cov + total_cov.T)
        eigvals, eigvecs = np.linalg.eigh(total_cov)
        total_cov = (eigvecs * np.clip(eigvals, 1e-12, None)) @ eigvecs.T

        rng = np.random.default_rng(7 + target_idx)
        draws = rng.multivariate_normal(state + house, total_cov, size=4000, method="svd")
        pred_full = alr_inv(draws, ref_idx) * 100.0

        # Put prediction and truth on the same percentage base. The model's shares sum
        # to 100 over all categories, while a poll's reported figures sum to 100 over
        # only the categories it published. Comparing them directly would score a
        # difference in reporting convention as forecast error - for a poll that omits
        # the undecided group that alone is several points on every party.
        reported_cats = list(truth.keys())
        cols = [list(categories).index(c) for c in reported_cats]
        sub = pred_full[:, cols]
        sub = sub / sub.sum(axis=1, keepdims=True) * 100.0

        lo = np.percentile(sub, (1 - level) / 2 * 100, axis=0)
        hi = np.percentile(sub, (1 + level) / 2 * 100, axis=0)
        point = sub.mean(axis=0)

        # Baselines are rebased over the same category set, for the same reason.
        recent_rows = [train.iloc[-k] for k in range(1, min(3, len(train)) + 1)]
        recent = [_shares_from_row(r, reported_cats, require_all=True) for r in recent_rows]
        recent = [r for r in recent if r is not None]
        last_poll = _shares_from_row(train.iloc[-1], reported_cats, require_all=True)

        for position, cat in enumerate(reported_cats):
            actual = truth[cat]
            values = [r[cat] for r in recent if cat in r]
            records.append(
                {
                    "date": target["date"],
                    "pollster": pollster,
                    "category": cat,
                    "actual": actual,
                    "model": point[position],
                    "random_walk": float(np.mean(values)) if values else np.nan,
                    "last_poll": last_poll.get(cat, np.nan) if last_poll else np.nan,
                    "lo": lo[position],
                    "hi": hi[position],
                    "covered": bool(lo[position] <= actual <= hi[position]),
                    "horizon": horizon,
                }
            )

    details = pd.DataFrame(records)
    if details.empty:
        raise ValueError("no evaluations produced")

    details["err_model"] = (details["model"] - details["actual"]).abs()
    details["err_rw"] = (details["random_walk"] - details["actual"]).abs()
    details["err_last"] = (details["last_poll"] - details["actual"]).abs()

    horizon_bucket = details.groupby(details["horizon"].clip(0, 30))["err_model"].mean()

    # Positive difference = the aggregator made the smaller error.
    paired = details.dropna(subset=["err_rw"]).copy()
    paired["poll_id"] = (
        paired["date"].astype(str) + "|" + paired["pollster"].astype(str)
    )
    advantage, ci, significant = _paired_bootstrap(
        (paired["err_rw"] - paired["err_model"]).to_numpy(dtype=float),
        paired["poll_id"].to_numpy(),
    )

    return ValidationResult(
        n_evaluations=int(details[["date", "pollster"]].drop_duplicates().shape[0]),
        coverage_80=float(details["covered"].mean()),
        coverage_by_category=details.groupby("category")["covered"].mean().to_dict(),
        mae_model=float(details["err_model"].mean()),
        mae_random_walk=float(details["err_rw"].mean(skipna=True)),
        mae_last_poll=float(details["err_last"].mean(skipna=True)),
        mae_by_category=details.groupby("category")["err_model"].mean().to_dict(),
        horizon_days={int(k): float(v) for k, v in horizon_bucket.items()},
        details=details,
        advantage_vs_random_walk=advantage,
        advantage_ci=ci,
        advantage_is_significant=significant,
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(message)s")

    frame = pd.read_parquet("data/raw/polls_real.parquet")
    result = rolling_validation(frame, max_evaluations=60)

    print("=" * 66)
    print("WALIDACJA OUT-OF-SAMPLE (rolling origin, bez wycieku z przyszlosci)")
    print("=" * 66)
    print(result.summary())

    print("\n--- Pokrycie per kategoria (cel 80%) ---")
    for cat, cov in sorted(result.coverage_by_category.items(), key=lambda kv: -kv[1]):
        flag = "OK" if 0.70 <= cov <= 0.90 else "!!"
        print(f"  {flag} {cat:16} {cov * 100:5.1f}%")

    print("\n--- MAE per kategoria (pp) ---")
    for cat, mae in sorted(result.mae_by_category.items(), key=lambda kv: kv[1]):
        print(f"     {cat:16} {mae:5.2f}")

    lo, hi = result.advantage_ci
    print(
        f"\nPrzewaga nad random walk: {result.advantage_vs_random_walk:+.3f} pp"
        f"   95% CI [{lo:+.3f}, {hi:+.3f}]"
    )
    if result.advantage_is_significant:
        print("=> Przewaga istotna: bootstrap parowany po sondazach, CI nie obejmuje zera.")
    else:
        print(
            "=> Przewaga NIEISTOTNA statystycznie. Nie wolno jej oglaszac jako przewagi\n"
            "   modelu - na tej probie jest nieodrozninalna od szumu."
        )
