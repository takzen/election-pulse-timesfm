"""Multivariate tensor and covariate formatting pipeline for TimesFM 3.0.
Aligns target series (poll trajectories) with past covariates (Google Trends,
Wikipedia reads) and dynamic future covariates (interest rates, inflation scenarios).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import torch

from src.pipeline.interpolator import PARTIES, process_and_save_daily_polls

logger = logging.getLogger(__name__)


@dataclass
class MultivariateInferencePayload:
    """Standardized multi-signal payload for TimesFM 3.0 inference."""
    target_names: List[str]
    context_dates: List[str]
    forecast_dates: List[str]
    # Arrays shaped (num_targets, context_len) or (batch, context_len, num_targets)
    targets_context: np.ndarray
    # Past covariates (num_covariates, context_len)
    past_covariates: np.ndarray
    past_covariate_names: List[str]
    # Dynamic covariates spanning past + future (num_dynamic, context_len + horizon_len)
    dynamic_covariates: np.ndarray
    dynamic_covariate_names: List[str]
    # Metadata for inverse transform
    scaler_params: Dict[str, Tuple[float, float]]


def load_and_merge_processed_features(
    data_dir: Path | str = "data",
) -> pd.DataFrame:
    """Merges regularized polls, Google Trends, Wikipedia pageviews, and Macro indicators

    onto a unified daily timeline.
    """
    root = Path(data_dir)
    polls_path = root / "processed" / "daily_polls.parquet"
    if not polls_path.exists():
        process_and_save_daily_polls(root / "raw" / "polls.parquet", polls_path)

    df_polls = pd.read_parquet(polls_path)
    df_polls["date"] = pd.to_datetime(df_polls["date"])

    df_macro = pd.read_parquet(root / "raw" / "macro.parquet")
    df_macro["date"] = pd.to_datetime(df_macro["date"])

    df_wiki = pd.read_parquet(root / "raw" / "wiki_pageviews.parquet")
    df_wiki["date"] = pd.to_datetime(df_wiki["date"])

    df_trends = pd.read_parquet(root / "raw" / "trends.parquet")
    df_trends["date"] = pd.to_datetime(df_trends["date"])

    # Inner join on date to ensure aligned timelines
    merged = pd.merge(df_polls, df_macro, on="date", how="inner")
    merged = pd.merge(merged, df_wiki, on="date", how="left")
    merged = pd.merge(merged, df_trends, on="date", how="left")

    # Forward-fill any weekly trend gaps and fill wiki NaNs with median
    wiki_cols = [c for c in merged.columns if c.startswith("wiki_")]
    trend_cols = [c for c in merged.columns if c.startswith("trend_")]

    for col in wiki_cols:
        merged[col] = merged[col].fillna(merged[col].median()).clip(lower=0)

    for col in trend_cols:
        merged[col] = merged[col].interpolate(method="linear").bfill().ffill()

    merged = merged.sort_values("date").reset_index(drop=True)
    out_file = root / "processed" / "aligned_features.parquet"
    out_file.parent.mkdir(parents=True, exist_ok=True)
    merged.to_parquet(out_file, index=False)
    logger.info(f"Created unified feature table at {out_file}: {merged.shape}")
    return merged


def build_inference_payload(
    df: pd.DataFrame,
    context_len: int = 120,
    horizon_len: int = 30,
    end_date: Optional[str] = None,
    macro_scenario_deltas: Optional[Dict[str, float]] = None,
) -> MultivariateInferencePayload:
    """Constructs a calibrated TimesFM 3.0 inference payload.

    Args:
        df: Aligned features DataFrame.
        context_len: Number of historical days to use as context (60-180 days).
        horizon_len: Number of forecast days into the future (up to Election Day).
        end_date: Anchor cutoff date for historical context (defaults to latest available).
        macro_scenario_deltas: What-if adjustments for dynamic covariates over horizon:
                               e.g. {"nbp_reference_rate": -0.50, "cpi_inflation_yoy": -1.0}
    """
    df = df.sort_values("date").reset_index(drop=True)
    if end_date:
        cutoff = pd.to_datetime(end_date)
        df_context = df[df["date"] <= cutoff].tail(context_len).copy()
    else:
        df_context = df.tail(context_len).copy()

    context_dates = df_context["date"].dt.strftime("%Y-%m-%d").tolist()
    last_dt = pd.to_datetime(context_dates[-1])
    forecast_dates = [
        (last_dt + pd.Timedelta(days=i + 1)).strftime("%Y-%m-%d")
        for i in range(horizon_len)
    ]

    # Target series (e.g. 5 parties)
    target_names = PARTIES
    # Shape: (num_targets, context_len)
    targets_matrix = np.array([df_context[p].values for p in target_names], dtype=np.float32)

    # Past covariates (Wikipedia views and Google Trends)
    past_cov_names = [c for c in df_context.columns if c.startswith("wiki_") or c.startswith("trend_")]
    past_cov_raw = df_context[past_cov_names].values.T.astype(np.float32)

    # Dynamic covariates (NBP rates, CPI, BWUK, FX rates) spanning past context + horizon
    dyn_cov_names = ["nbp_reference_rate", "cpi_inflation_yoy", "bwuk_consumer_confidence", "fx_usd_pln", "fx_eur_pln"]
    past_dyn_values = df_context[dyn_cov_names].values  # (context_len, num_dyn)

    # Generate future horizon values with optional scenario adjustments
    last_dyn = past_dyn_values[-1].copy()
    future_dyn_rows = []
    deltas = macro_scenario_deltas or {}

    for i in range(horizon_len):
        step_row = last_dyn.copy()
        # Apply smooth linear transition for scenario deltas over horizon
        alpha = (i + 1) / horizon_len
        for col_idx, col_name in enumerate(dyn_cov_names):
            if col_name in deltas:
                step_row[col_idx] += alpha * deltas[col_name]
        future_dyn_rows.append(step_row)

    future_dyn_values = np.array(future_dyn_rows)
    # Combined dynamic covariates: (num_dynamic, context_len + horizon_len)
    all_dyn = np.vstack([past_dyn_values, future_dyn_values]).T.astype(np.float32)

    # Calculate standard scaling parameters over context window to avoid lookahead bias
    scaler_params = {}
    for i, col in enumerate(past_cov_names):
        mean = float(np.mean(past_cov_raw[i]))
        std = float(np.std(past_cov_raw[i])) or 1.0
        scaler_params[col] = (mean, std)
        past_cov_raw[i] = (past_cov_raw[i] - mean) / std

    for i, col in enumerate(dyn_cov_names):
        mean = float(np.mean(all_dyn[i, :context_len]))
        std = float(np.std(all_dyn[i, :context_len])) or 1.0
        scaler_params[col] = (mean, std)
        all_dyn[i] = (all_dyn[i] - mean) / std

    return MultivariateInferencePayload(
        target_names=target_names,
        context_dates=context_dates,
        forecast_dates=forecast_dates,
        targets_context=targets_matrix,
        past_covariates=past_cov_raw,
        past_covariate_names=past_cov_names,
        dynamic_covariates=all_dyn,
        dynamic_covariate_names=dyn_cov_names,
        scaler_params=scaler_params,
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    df_merged = load_and_merge_processed_features()
    payload = build_inference_payload(df_merged, context_len=90, horizon_len=30)
    print(f"Inference Payload Ready:")
    print(f" - Targets: {payload.target_names} -> shape {payload.targets_context.shape}")
    print(f" - Past Covariates: {len(payload.past_covariate_names)} -> shape {payload.past_covariates.shape}")
    print(f" - Dynamic Covariates: {len(payload.dynamic_covariate_names)} -> shape {payload.dynamic_covariates.shape}")
    print(f" - Context dates: {payload.context_dates[0]} to {payload.context_dates[-1]}")
    print(f" - Forecast horizon: {payload.forecast_dates[0]} to {payload.forecast_dates[-1]}")
