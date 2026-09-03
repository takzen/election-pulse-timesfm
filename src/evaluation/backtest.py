"""Rolling backtesting and evaluation engine for TimesFM 3.0 vs classical baselines.
Computes MAE, RMSE, and bias across historical Polish electoral horizons.
"""

from __future__ import annotations

import logging
import sys
from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

from src.models.baselines import run_all_baselines
from src.models.timesfm_engine import TimesFM3Engine
from src.pipeline.interpolator import PARTIES
from src.pipeline.tensor_builder import build_inference_payload, load_and_merge_processed_features

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

logger = logging.getLogger(__name__)


@dataclass
class BacktestMetric:
    model: str
    mae: float
    rmse: float
    bias: float


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Tuple[float, float, float]:
    """Computes Mean Absolute Error, Root Mean Squared Error, and Mean Bias."""
    err = y_pred - y_true
    mae = float(np.mean(np.abs(err)))
    rmse = float(np.sqrt(np.mean(err**2)))
    bias = float(np.mean(err))
    return round(mae, 2), round(rmse, 2), round(bias, 2)


def run_rolling_backtest(
    df: pd.DataFrame,
    cutoffs: List[str] = ("2023-10-01", "2024-04-01", "2024-06-01", "2025-01-15"),
    context_len: int = 60,
    horizon_len: int = 14,
) -> Dict[str, BacktestMetric]:
    """Evaluates TimesFM 3.0 against EWMA, ARIMA, and LightGBM across historical cutoffs."""
    models = ["TimesFM 3.0", "LightGBM", "ARIMA", "EWMA"]
    errors_by_model: Dict[str, List[Tuple[float, float, float]]] = {m: [] for m in models}

    engine = TimesFM3Engine()

    for cutoff in cutoffs:
        cutoff_dt = pd.to_datetime(cutoff)
        sub_df = df[df["date"] <= cutoff_dt].copy()
        if len(sub_df) < context_len:
            continue

        # Ground truth future slice
        future_slice = df[(df["date"] > cutoff_dt)].head(horizon_len)
        if len(future_slice) < horizon_len:
            continue

        payload = build_inference_payload(
            df,
            context_len=context_len,
            horizon_len=horizon_len,
            end_date=cutoff,
        )

        # 1. TimesFM 3.0 forecast
        tfm_res = engine.forecast(payload)

        for party in PARTIES:
            y_true = future_slice[party].values[:horizon_len]
            if len(y_true) < horizon_len:
                continue

            # TimesFM 3.0
            tfm_pred = np.array(tfm_res.parties[party].p50[:horizon_len])
            errors_by_model["TimesFM 3.0"].append(compute_metrics(y_true, tfm_pred))

            # Baselines
            hist_party = sub_df[party].tail(context_len).values
            baselines_pred = run_all_baselines(hist_party, horizon=horizon_len)

            for b_name in ["LightGBM", "ARIMA", "EWMA"]:
                pred_arr = baselines_pred[b_name][:horizon_len]
                errors_by_model[b_name].append(compute_metrics(y_true, pred_arr))

    # Aggregate averages
    summary: Dict[str, BacktestMetric] = {}
    for m in models:
        metrics_list = errors_by_model[m]
        if metrics_list:
            avg_mae = round(float(np.mean([m_tuple[0] for m_tuple in metrics_list])), 2)
            avg_rmse = round(float(np.mean([m_tuple[1] for m_tuple in metrics_list])), 2)
            avg_bias = round(float(np.mean([m_tuple[2] for m_tuple in metrics_list])), 2)
            summary[m] = BacktestMetric(model=m, mae=avg_mae, rmse=avg_rmse, bias=avg_bias)

    return summary


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    df_all = load_and_merge_processed_features()
    print("=" * 65)
    print("⚖️ ElectionPulse-TimesFM: Rolling Backtesting Results (14-day Horizon)")
    print("=" * 65)

    results = run_rolling_backtest(df_all)
    print(f"{'Model':<18} | {'MAE (pp)':<10} | {'RMSE (pp)':<10} | {'Bias (pp)':<10}")
    print("-" * 65)
    for model_name, res in sorted(results.items(), key=lambda x: x[1].mae):
        print(f"{model_name:<18} | {res.mae:<10} | {res.rmse:<10} | {res.bias:<+10}")
    print("=" * 65)
