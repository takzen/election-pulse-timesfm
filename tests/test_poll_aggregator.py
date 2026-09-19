"""Tests for the state-space poll aggregator.

The important one is `test_recovers_known_state_and_house_effects`: data is simulated
from the model with known parameters, and the fit has to recover them. Shape checks
cannot tell a working estimator from a broken one, so that test is what actually
guards correctness.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from src.models.poll_aggregator import (
    PollAggregator,
    alr,
    alr_inv,
    build_observations,
    sampling_covariance_alr,
)

SMALL_CATEGORIES = ["KO", "PiS", "Konfederacja", "Niezdecydowani"]


# ---------------------------------------------------------------- transforms


def test_alr_inverse_round_trip():
    shares = np.array([0.32, 0.20, 0.13, 0.35])
    z = alr(shares, ref_idx=0)
    back = alr_inv(z, ref_idx=0)
    assert np.allclose(back, shares)


def test_alr_inv_sums_to_one_exactly():
    """The sum-to-100 constraint must hold by construction, not by rescaling."""
    rng = np.random.default_rng(0)
    draws = rng.normal(0, 3.0, size=(500, 9))
    shares = alr_inv(draws, ref_idx=0)
    assert np.allclose(shares.sum(axis=1), 1.0, atol=1e-12)
    assert (shares > 0).all()


def test_alr_inv_handles_extreme_values_without_overflow():
    z = np.array([800.0, -800.0, 0.0])
    shares = alr_inv(z, ref_idx=0)
    assert np.isfinite(shares).all()
    assert shares.sum() == pytest.approx(1.0)


def test_sampling_covariance_matches_multinomial_theory():
    """V_kl = (1/n)(delta_kl/p_k + 1/p_ref), checked against simulated draws."""
    p = np.array([0.32, 0.20, 0.13, 0.35])
    n = 2000
    cov = sampling_covariance_alr(p, n, ref_idx=0)

    rng = np.random.default_rng(1)
    draws = rng.multinomial(n, p, size=120000) / n
    z = np.log(draws[:, 1:] + 1e-12) - np.log(draws[:, [0]] + 1e-12)
    empirical = np.cov(z.T)

    assert np.allclose(np.diag(cov), np.diag(empirical), rtol=0.06)
    assert cov[0, 1] == pytest.approx(empirical[0, 1], rel=0.10)


def test_sampling_covariance_is_positive_definite():
    p = np.array([0.30, 0.25, 0.001, 0.449])
    cov = sampling_covariance_alr(p, 1000, ref_idx=0)
    assert np.all(np.linalg.eigvalsh(cov) > 0)


def test_variance_shrinks_with_sample_size():
    p = np.array([0.30, 0.25, 0.10, 0.35])
    small = sampling_covariance_alr(p, 500, ref_idx=0)
    large = sampling_covariance_alr(p, 4000, ref_idx=0)
    assert np.all(np.diag(large) < np.diag(small))


# --------------------------------------------------------------- observations


def _poll_row(date, pollster, values, n=1000):
    row = {"date": pd.Timestamp(date), "pollster": pollster, "sample_size": n}
    row.update(values)
    return row


def test_polls_without_undecided_give_the_same_party_log_ratios():
    """A poll quoted among decided voters needs no rescaling heuristic.

    This is the property that lets the model consume both reporting styles: log-ratios
    between parties are invariant to whether the undecided category is included.
    """
    dates = pd.date_range("2026-01-01", periods=1, freq="D")
    with_undecided = pd.DataFrame(
        [_poll_row("2026-01-01", "A", {"KO": 27.0, "PiS": 18.0, "Konfederacja": 9.0,
                                       "Niezdecydowani": 46.0})]
    )
    # Same underlying support, renormalised to exclude the undecided group.
    decided_only = pd.DataFrame(
        [_poll_row("2026-01-01", "A", {"KO": 50.0, "PiS": 100.0 / 3, "Konfederacja": 100.0 / 6})]
    )

    obs_a, _ = build_observations(with_undecided, dates, SMALL_CATEGORIES)
    obs_b, _ = build_observations(decided_only, dates, SMALL_CATEGORIES)

    # Compare only the dimensions both polls inform (the two parties).
    shared = [i for i in obs_a[0].dim_idx if i in set(obs_b[0].dim_idx)]
    za = {d: v for d, v in zip(obs_a[0].dim_idx, obs_a[0].z)}
    zb = {d: v for d, v in zip(obs_b[0].dim_idx, obs_b[0].z)}
    for d in shared:
        assert za[d] == pytest.approx(zb[d], abs=1e-9)


def test_missing_category_is_omitted_not_imputed():
    dates = pd.date_range("2026-01-01", periods=1, freq="D")
    polls = pd.DataFrame(
        [_poll_row("2026-01-01", "A", {"KO": 30.0, "PiS": 20.0, "Niezdecydowani": 50.0})]
    )
    observations, _ = build_observations(polls, dates, SMALL_CATEGORIES)
    dims = [SMALL_CATEGORIES[1:][i] for i in observations[0].dim_idx]
    assert "Konfederacja" not in dims
    assert set(dims) == {"PiS", "Niezdecydowani"}


def test_poll_without_reference_category_is_dropped():
    dates = pd.date_range("2026-01-01", periods=1, freq="D")
    polls = pd.DataFrame([_poll_row("2026-01-01", "A", {"PiS": 20.0, "Konfederacja": 10.0})])
    observations, dropped = build_observations(polls, dates, SMALL_CATEGORIES)
    assert observations == []
    assert dropped == 1


def test_poll_outside_the_date_grid_is_dropped():
    dates = pd.date_range("2026-01-01", periods=5, freq="D")
    polls = pd.DataFrame(
        [_poll_row("2025-06-01", "A", {"KO": 30.0, "PiS": 20.0, "Niezdecydowani": 50.0})]
    )
    observations, dropped = build_observations(polls, dates, SMALL_CATEGORIES)
    assert observations == []
    assert dropped == 1


# -------------------------------------------------------------------- fitting


def _simulate(
    n_days: int = 260,
    sigma: float = 0.012,
    house: dict | None = None,
    seed: int = 3,
    n_sample: int = 1200,
):
    """Generates polls from the model itself, so the truth is known exactly."""
    rng = np.random.default_rng(seed)
    house = house or {"HighPiS": np.array([0.30, 0.0, 0.0]), "Neutral": np.array([0.0, 0.0, 0.0])}
    n_dim = len(SMALL_CATEGORIES) - 1

    theta = np.zeros((n_days, n_dim))
    theta[0] = alr(np.array([0.30, 0.20, 0.12, 0.38]), ref_idx=0)
    for t in range(1, n_days):
        theta[t] = theta[t - 1] + rng.normal(0, sigma, n_dim)

    rows = []
    names = list(house)
    for step, t in enumerate(range(0, n_days, 4)):
        # Alternate by poll index, not by day: `t % len(names)` would always pick the
        # same pollster here because t advances in steps of 4, and with one pollster
        # house effects are unidentifiable by construction.
        pollster = names[step % len(names)]
        p = alr_inv(theta[t] + house[pollster], ref_idx=0)
        counts = rng.multinomial(n_sample, p) / n_sample * 100.0
        rows.append(
            _poll_row(
                pd.Timestamp("2025-01-01") + pd.Timedelta(days=t),
                pollster,
                dict(zip(SMALL_CATEGORIES, counts)),
                n=n_sample,
            )
        )
    return pd.DataFrame(rows), theta


def test_recovers_known_state_and_house_effects():
    """Fit simulated data and check the latent path and house effects come back.

    Tolerances are loose enough for sampling noise but tight enough that a sign error,
    a misaligned index or a broken smoother would fail.
    """
    polls, theta_true = _simulate()
    aggregator = PollAggregator(categories=SMALL_CATEGORIES, house_effect_iters=3)
    fit = aggregator.fit(polls)

    offset = (pd.Timestamp("2025-01-01") - fit.dates[0]).days
    idx = [t for t in range(0, len(theta_true), 4) if 0 <= t + offset < len(fit.dates)]
    recovered = np.array([fit.state[t + offset] for t in idx])
    truth = np.array([theta_true[t] for t in idx])

    # The level is identifiable only up to the house-effect centring convention: a
    # constant can move between the state and every pollster's offset. What the data
    # pins down is the *shape* of the path, so score it after removing that constant.
    error = recovered - truth
    rmse_shape = float(np.sqrt(np.mean((error - error.mean(axis=0)) ** 2)))
    assert rmse_shape < 0.08, f"latent path shape not recovered (rmse={rmse_shape:.3f})"
    # And the absorbed constant must be small once house effects are actually fitted.
    assert np.abs(error.mean(axis=0)).max() < 0.25

    # The known house-effect contrast must show up. Effects are centred, so compare
    # the difference between pollsters rather than absolute levels.
    contrast = fit.house_effects["HighPiS"][0] - fit.house_effects["Neutral"][0]
    assert contrast == pytest.approx(0.30, abs=0.12), f"house effect contrast={contrast:.3f}"

    # Random-walk sd should land in the right order of magnitude (truth 0.012).
    assert 0.003 < float(np.mean(fit.rw_sigma)) < 0.05


def test_house_effects_are_centred():
    """Without centring, house effects and the latent level are not identifiable."""
    polls, _ = _simulate()
    aggregator = PollAggregator(categories=SMALL_CATEGORIES, house_effect_iters=3)
    fit = aggregator.fit(polls)

    total = sum(fit.pollster_counts.values())
    weighted = sum(
        fit.house_effects[name] * (fit.pollster_counts[name] / total)
        for name in fit.house_effects
    )
    assert np.allclose(weighted, 0.0, atol=1e-8)


def test_nowcast_mean_sums_to_one_hundred():
    """The mean is the point estimate precisely because it preserves the constraint."""
    polls, _ = _simulate()
    aggregator = PollAggregator(categories=SMALL_CATEGORIES, house_effect_iters=2)
    aggregator.fit(polls)
    now = aggregator.nowcast(n_draws=8000)
    assert now["mean"].sum() == pytest.approx(100.0, abs=1e-6)
    assert (now["p10"] <= now["p50"]).all()
    assert (now["p50"] <= now["p90"]).all()


def test_forecast_bands_widen_with_horizon():
    """Uncertainty must grow without new polls - a flat band would be a lie."""
    polls, _ = _simulate()
    aggregator = PollAggregator(categories=SMALL_CATEGORIES, house_effect_iters=2)
    aggregator.fit(polls)
    fc = aggregator.forecast(horizon=30, n_draws=6000)

    width_first = fc.iloc[0]["PiS_p90"] - fc.iloc[0]["PiS_p10"]
    width_last = fc.iloc[-1]["PiS_p90"] - fc.iloc[-1]["PiS_p10"]
    assert width_last > width_first * 1.2, "bands did not widen over the horizon"

    # Every step keeps the composition consistent.
    for _, row in fc.iterrows():
        total = sum(row[f"{c}_mean"] for c in SMALL_CATEGORIES)
        assert total == pytest.approx(100.0, abs=1e-6)


def test_outlier_poll_does_not_dominate_the_path():
    """One badly-fielded poll must not drag the latent state to itself."""
    polls, _ = _simulate()
    clean = PollAggregator(categories=SMALL_CATEGORIES, house_effect_iters=2)
    clean_fit = clean.fit(polls)
    clean_now = clean.nowcast(n_draws=4000).set_index("category")["mean"]

    spoiled = polls.copy()
    last = spoiled.index[-1]
    spoiled.loc[last, "KO"] = 5.0
    spoiled.loc[last, "PiS"] = 70.0

    robust = PollAggregator(categories=SMALL_CATEGORIES, house_effect_iters=2)
    robust.fit(spoiled)
    robust_now = robust.nowcast(n_draws=4000).set_index("category")["mean"]

    shift = abs(robust_now["PiS"] - clean_now["PiS"])
    assert shift < 12.0, f"a single absurd poll moved PiS by {shift:.1f} pp"


def test_fit_rejects_empty_input():
    with pytest.raises(ValueError):
        PollAggregator(categories=SMALL_CATEGORIES).fit(pd.DataFrame({"date": [], "pollster": []}))


def test_reference_must_be_a_known_category():
    with pytest.raises(ValueError):
        PollAggregator(categories=SMALL_CATEGORIES, reference="NieIstnieje")


def test_compressed_grid_likelihood_matches_full_grid():
    """The fast likelihood path must be exact, not approximate.

    `_kalman_loglik` skips days without polls and adds `Q * gap` instead. For a random
    walk that is algebraically identical, so any divergence here means the optimisation
    silently changed the fitted model rather than just speeding it up.
    """
    from src.models.poll_aggregator import _kalman, _kalman_loglik, build_observations

    polls, _ = _simulate(n_days=200)
    dates = pd.date_range(polls["date"].min(), polls["date"].max(), freq="D")
    observations, _ = build_observations(polls, dates, SMALL_CATEGORIES)

    n_dim = len(SMALL_CATEGORIES) - 1
    rw_var = np.full(n_dim, 0.015**2)
    design = np.full(n_dim, 1.7)
    x0 = np.zeros(n_dim)

    *_, full = _kalman(
        observations, len(dates), n_dim, rw_var, design, {}, x0, robust_threshold=9.0
    )
    fast = _kalman_loglik(
        observations, len(dates), n_dim, rw_var, design, {}, x0, robust_threshold=9.0
    )
    assert fast == pytest.approx(full, rel=1e-9, abs=1e-8)


def test_compressed_grid_matches_with_house_effects_and_gaps():
    """Same equivalence when house effects are non-zero and gaps are uneven."""
    from src.models.poll_aggregator import _kalman, _kalman_loglik, build_observations

    polls, _ = _simulate(n_days=300)
    # Drop a stretch of polls to create a long gap the compressed path must jump over.
    polls = polls[(polls["date"] < "2025-03-01") | (polls["date"] > "2025-06-01")]
    dates = pd.date_range(polls["date"].min(), polls["date"].max(), freq="D")
    observations, _ = build_observations(polls, dates, SMALL_CATEGORIES)

    n_dim = len(SMALL_CATEGORIES) - 1
    house = {"HighPiS": np.array([0.2, -0.1, 0.05]), "Neutral": np.array([-0.2, 0.1, -0.05])}
    rw_var = np.full(n_dim, 0.02**2)
    design = np.array([1.5, 2.0, 2.5])
    x0 = np.zeros(n_dim)

    *_, full = _kalman(
        observations, len(dates), n_dim, rw_var, design, house, x0, robust_threshold=9.0
    )
    fast = _kalman_loglik(
        observations, len(dates), n_dim, rw_var, design, house, x0, robust_threshold=9.0
    )
    assert fast == pytest.approx(full, rel=1e-9, abs=1e-8)
