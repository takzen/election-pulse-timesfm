"""Unit tests for Phase 3: Pipeline (interpolator and tensor_builder).
"""

import numpy as np
import pandas as pd
import pytest

from src.pipeline.interpolator import PARTIES, build_daily_regularized_polls, interpolate_party_series_pchip
from src.pipeline.tensor_builder import load_and_merge_processed_features, build_inference_payload


def test_pchip_interpolation_monotonicity_and_bounds():
    dates = pd.to_datetime(["2024-01-01", "2024-01-10", "2024-01-20"]).values
    values = np.array([30.0, 32.0, 31.0])
    target_dates = pd.date_range("2024-01-01", "2024-01-20", freq="D").values

    interp = interpolate_party_series_pchip(dates, values, target_dates, smoothing_window=3)
    assert len(interp) == 20
    assert (interp >= 0.0).all() and (interp <= 100.0).all()
    # Check start and end proximity
    assert abs(interp[0] - 30.0) < 1.0


def test_build_inference_payload_shapes():
    df_features = load_and_merge_processed_features()
    context_len = 60
    horizon_len = 30
    payload = build_inference_payload(
        df_features,
        context_len=context_len,
        horizon_len=horizon_len,
        macro_scenario_deltas={"nbp_reference_rate": -0.50},
    )

    # All tracked entities
    assert payload.targets_context.shape == (len(PARTIES), context_len)
    # Past covariates have length == context_len
    assert payload.past_covariates.shape[1] == context_len
    # Dynamic covariates have length == context_len + horizon_len
    assert payload.dynamic_covariates.shape[1] == context_len + horizon_len
    # Date counts match
    assert len(payload.context_dates) == context_len
    assert len(payload.forecast_dates) == horizon_len
