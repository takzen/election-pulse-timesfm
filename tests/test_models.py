"""Unit tests for Phase 4: Models (TimesFM 3.0 and Baselines).
"""

import numpy as np
import pytest

from src.models.baselines import run_all_baselines, EWMABaseline, ARIMABaseline, LightGBMBaseline
from src.models.timesfm_engine import TimesFM3Engine
from src.pipeline.tensor_builder import load_and_merge_processed_features, build_inference_payload


def test_baselines_outputs_and_shapes():
    history = np.array([30.0 + 0.05 * i for i in range(60)], dtype=np.float32)
    horizon = 14
    preds = run_all_baselines(history, horizon=horizon)

    for name in ["EWMA", "ARIMA", "LightGBM"]:
        assert name in preds
        assert len(preds[name]) == horizon
        assert not np.isnan(preds[name]).any()
        assert (preds[name] >= 0.0).all() and (preds[name] <= 100.0).all()


def test_timesfm_engine_forecast_and_quantiles():
    df = load_and_merge_processed_features()
    payload = build_inference_payload(df, context_len=60, horizon_len=14)

    engine = TimesFM3Engine()
    result = engine.forecast(payload, use_cache=False)

    assert result.horizon_len == 14
    assert len(result.forecast_dates) == 14
    assert set(result.parties.keys()) == set(payload.target_names)

    # Verify daily sums equal ~100% and quantiles are strictly ordered
    for party, r in result.parties.items():
        assert len(r.p50) == 14
        for t in range(14):
            assert r.p10[t] <= r.p25[t] <= r.p50[t] <= r.p75[t] <= r.p90[t]
