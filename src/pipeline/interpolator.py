"""Daily alignment and monotonic spline interpolation for irregular polling series.
Uses Piecewise Cubic Hermite Interpolating Polynomial (PCHIP) from scipy
to guarantee smooth, non-overshooting, monotonic-preserving daily trajectories.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy.interpolate import PchipInterpolator

logger = logging.getLogger(__name__)

PARTIES = ["KO", "PiS", "Trzecia_Droga", "Lewica", "Konfederacja"]


def interpolate_party_series_pchip(
    dates: np.ndarray,
    values: np.ndarray,
    target_dates: np.ndarray,
    smoothing_window: int = 7,
) -> np.ndarray:
    """Interpolates an irregular time series using PCHIP and applies a centered

    rolling Gaussian filter to eliminate high-frequency survey noise.
    """
    # Convert dates to numeric days from reference
    ref_date = dates[0]
    x_in = (dates - ref_date).astype("timedelta64[D]").astype(float)
    x_out = (target_dates - ref_date).astype("timedelta64[D]").astype(float)

    # Monotonic Cubic Hermite Spline
    pchip = PchipInterpolator(x_in, values, extrapolate=True)
    interpolated = pchip(x_out)

    # Mild smoothing with exponential/Gaussian rolling window
    if smoothing_window > 1:
        s = pd.Series(interpolated)
        smoothed = s.rolling(window=smoothing_window, min_periods=1, center=True, win_type="gaussian").mean(std=2.0).values
        return np.clip(smoothed, 0.0, 100.0)

    return np.clip(interpolated, 0.0, 100.0)


def build_daily_regularized_polls(
    polls_df: pd.DataFrame,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    parties: Optional[List[str]] = None,
    smoothing_window: int = 7,
) -> pd.DataFrame:
    """Transforms raw irregular polls into a complete daily time series

    for all tracked political parties with sum re-normalization.
    """
    if parties is None:
        parties = PARTIES

    polls_df = polls_df.copy()
    polls_df["date"] = pd.to_datetime(polls_df["date"])
    polls_df = polls_df.sort_values("date").drop_duplicates(subset=["date"], keep="last")

    min_date = pd.to_datetime(start_date) if start_date else polls_df["date"].min()
    max_date = pd.to_datetime(end_date) if end_date else polls_df["date"].max()

    daily_dates = pd.date_range(min_date, max_date, freq="D")
    df_daily = pd.DataFrame({"date": daily_dates})

    # Fit PCHIP for each party on the normalized support percentage
    for party in parties:
        col = f"{party}_norm" if f"{party}_norm" in polls_df.columns else party
        valid_mask = ~polls_df[col].isna()
        sub_dates = polls_df.loc[valid_mask, "date"].values
        sub_vals = polls_df.loc[valid_mask, col].values

        daily_vals = interpolate_party_series_pchip(
            dates=sub_dates,
            values=sub_vals,
            target_dates=daily_dates.values,
            smoothing_window=smoothing_window,
        )
        df_daily[party] = np.round(daily_vals, 2)

    # Renormalize daily totals to exactly 100.0%
    totals = df_daily[parties].sum(axis=1)
    for party in parties:
        df_daily[party] = np.round((df_daily[party] / totals) * 100.0, 2)

    return df_daily


def process_and_save_daily_polls(
    input_parquet: Path | str = "data/raw/polls.parquet",
    output_parquet: Path | str = "data/processed/daily_polls.parquet",
) -> Path:
    """Reads raw polls and writes regularized daily series to processed storage."""
    in_p = Path(input_parquet)
    out_p = Path(output_parquet)
    out_p.parent.mkdir(parents=True, exist_ok=True)

    if not in_p.exists():
        from src.ingestion.polls import fetch_and_save_polls
        in_p = fetch_and_save_polls(in_p.parent)

    df_raw = pd.read_parquet(in_p)
    df_daily = build_daily_regularized_polls(df_raw)
    df_daily.to_parquet(out_p, index=False)
    logger.info(f"Saved {len(df_daily)} regularized daily records to {out_p}")
    return out_p


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    out = process_and_save_daily_polls()
    df = pd.read_parquet(out)
    print(f"Interpolated daily polls: {len(df)} days ({df['date'].min().date()} to {df['date'].max().date()})")
    print(df.head(3))
    print(df.tail(3))
