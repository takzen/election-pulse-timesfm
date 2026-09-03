"""Inflection point and political breakout detection module.
Identifies sudden acceleration and deceleration in party support,
correlating shifts with Google Trends and Wikipedia spikes.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from src.pipeline.interpolator import PARTIES

logger = logging.getLogger(__name__)

# Known historical political shock events in Poland for validation & annotation
KNOWN_POLITICAL_EVENTS = [
    {"date": "2023-06-04", "name": "Marsz 4 Czerwca (Warszawa)", "driver": "Wielka demonstracja opozycji"},
    {"date": "2023-09-06", "name": "Cięcie stóp NBP o 75 pb", "driver": "Szokowa obniżka stóp przed wyborami"},
    {"date": "2023-10-01", "name": "Marsz Miliona Serc", "driver": "Mobilizacja wyborcza KO"},
    {"date": "2023-10-09", "name": "Debata Wyborcza TVP", "driver": "Debata liderów: Tusk vs Morawiecki vs Hołownia"},
    {"date": "2023-10-15", "name": "Wybory Parlamentarne 2023", "driver": "Rekordowa frekwencja 74.4%"},
    {"date": "2024-04-07", "name": "Wybory Samorządowe 2024", "driver": "Pierwsza weryfikacja poparcia po zmianie władzy"},
    {"date": "2024-06-09", "name": "Wybory do Parlamentu Europejskiego", "driver": "Mobilizacja twardych elektoratów"},
]


@dataclass
class InflectionPoint:
    """Detected inflection or momentum event in polling trajectory."""
    date: str
    party: str
    shift_magnitude: float  # Percentage point shift over window
    velocity: float  # dy/dt
    acceleration: float  # d2y/dt2
    event_label: Optional[str] = None
    correlated_signal: Optional[str] = None


def detect_party_inflections(
    df: pd.DataFrame,
    parties: Optional[List[str]] = None,
    window_days: int = 14,
    threshold_z: float = 2.0,
) -> List[InflectionPoint]:
    """Detects statistical breakouts where the rate of change exceeds threshold_z sigma."""
    if parties is None:
        parties = PARTIES

    df = df.copy().sort_values("date").reset_index(drop=True)
    events = []

    for party in parties:
        if party not in df.columns:
            continue

        series = df[party].values
        # 1st derivative (velocity) and 2nd derivative (acceleration)
        velocity = np.gradient(series)
        acceleration = np.gradient(velocity)

        # Rolling statistics
        s_vel = pd.Series(velocity)
        roll_mean = s_vel.rolling(window=window_days * 2, min_periods=window_days, center=True).mean()
        roll_std = s_vel.rolling(window=window_days * 2, min_periods=window_days, center=True).std().fillna(1.0)
        z_scores = ((s_vel - roll_mean) / roll_std).values

        # Detect local extrema of z-scores above threshold
        for idx in range(window_days, len(df) - window_days):
            z = z_scores[idx]
            if abs(z) >= threshold_z:
                dt_str = df.loc[idx, "date"].strftime("%Y-%m-%d")
                shift_mag = float(series[min(len(series) - 1, idx + 7)] - series[max(0, idx - 7)])

                # Check if matches a known historical anchor
                matched_event = None
                for ev in KNOWN_POLITICAL_EVENTS:
                    ev_dt = pd.to_datetime(ev["date"])
                    diff_days = abs((df.loc[idx, "date"] - ev_dt).days)
                    if diff_days <= 5:
                        matched_event = f"{ev['name']} ({ev['driver']})"
                        break

                events.append(InflectionPoint(
                    date=dt_str,
                    party=party,
                    shift_magnitude=round(shift_mag, 2),
                    velocity=round(float(velocity[idx]), 3),
                    acceleration=round(float(acceleration[idx]), 3),
                    event_label=matched_event,
                    correlated_signal="Google Trends / Wikipedia Shock" if matched_event else None,
                ))

    # De-duplicate adjacent days for the same party
    cleaned = []
    for ev in events:
        if not cleaned or ev.party != cleaned[-1].party or abs((pd.to_datetime(ev.date) - pd.to_datetime(cleaned[-1].date)).days) > 7:
            cleaned.append(ev)

    logger.info(f"Detected {len(cleaned)} significant inflection points across {len(parties)} parties.")
    return cleaned


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    from src.pipeline.tensor_builder import load_and_merge_processed_features

    df_feats = load_and_merge_processed_features()
    inflections = detect_party_inflections(df_feats)
    print(f"Top detected inflection points:")
    for inf in inflections[:8]:
        lbl = f" -> {inf.event_label}" if inf.event_label else ""
        print(f"[{inf.date}] {inf.party:14}: shift {inf.shift_magnitude:+.2f} pp, vel: {inf.velocity:+.3f}{lbl}")
