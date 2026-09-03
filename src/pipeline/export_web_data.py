"""Precomputation and JSON export pipeline for the Next.js Vercel frontend.
Generates an optimized JSON containing baseline forecasts, quantile bands,
macro scenario simulation grid, historical trajectories, and inflection points.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Dict, List

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import pandas as pd

from src.evaluation.inflection import detect_party_inflections
from src.models.baselines import run_all_baselines
from src.models.timesfm_engine import TimesFM3Engine
from src.pipeline.interpolator import PARTIES
from src.pipeline.scenario_simulator import PocketbookSimulator
from src.pipeline.tensor_builder import build_inference_payload, load_and_merge_processed_features

logger = logging.getLogger(__name__)


def export_complete_web_payload(
    output_web_json: Path | str = "web/public/data/forecasts.json",
    output_backup_json: Path | str = "data/processed/forecasts.json",
    context_len: int = 90,
    horizon_len: int = 30,
) -> Path:
    """Computes all forecasts, scenarios, and historical series, then exports to JSON."""
    logger.info("Building complete data payload for Next.js Vercel frontend...")

    df_features = load_and_merge_processed_features()
    payload = build_inference_payload(df_features, context_len=context_len, horizon_len=horizon_len)

    # 1. Main TimesFM 3.0 forecast
    engine = TimesFM3Engine()
    tfm_output = engine.forecast(payload)

    # 2. Historical regularized polls (last 180 days)
    df_hist = df_features.tail(180).copy()
    history_records = []
    for _, row in df_hist.iterrows():
        rec = {"date": row["date"].strftime("%Y-%m-%d")}
        for party in PARTIES:
            rec[party] = float(row[party])
        history_records.append(rec)

    # 3. Baseline models comparison for the latest point in horizon
    baselines_comp = {}
    for party in PARTIES:
        hist_vals = df_features[party].tail(context_len).values
        base_preds = run_all_baselines(hist_vals, horizon=horizon_len)
        baselines_comp[party] = {
            "EWMA": round(float(base_preds["EWMA"][-1]), 2),
            "ARIMA": round(float(base_preds["ARIMA"][-1]), 2),
            "LightGBM": round(float(base_preds["LightGBM"][-1]), 2),
            "TimesFM_3": round(float(tfm_output.parties[party].p50[-1]), 2),
        }

    # 4. Scenario simulation grid for instant frontend slider reactivity
    simulator = PocketbookSimulator(engine=engine)
    scenario_grid = simulator.generate_scenario_grid(payload)

    # 5. Detected political inflection points
    inflection_objects = detect_party_inflections(df_features)
    inflections_data = [
        {
            "date": inf.date,
            "party": inf.party,
            "shift_magnitude": inf.shift_magnitude,
            "velocity": inf.velocity,
            "event_label": inf.event_label,
        }
        for inf in inflection_objects
    ]

    # 6. Party metadata & branding colors (for modern dark UI)
    party_meta = {
        "KO": {
            "name": "Koalicja Obywatelska",
            "leader": "Donald Tusk",
            "color": "#f97316",  # Orange
            "current": round(float(df_features["KO"].iloc[-1]), 1),
            "forecast": tfm_output.parties["KO"].p50[-1],
            "p10": tfm_output.parties["KO"].p10[-1],
            "p90": tfm_output.parties["KO"].p90[-1],
        },
        "PiS": {
            "name": "Prawo i Sprawiedliwość",
            "leader": "Jarosław Kaczyński",
            "color": "#2563eb",  # Blue
            "current": round(float(df_features["PiS"].iloc[-1]), 1),
            "forecast": tfm_output.parties["PiS"].p50[-1],
            "p10": tfm_output.parties["PiS"].p10[-1],
            "p90": tfm_output.parties["PiS"].p90[-1],
        },
        "Konfederacja": {
            "name": "Konfederacja (NN + RN)",
            "leader": "Sławomir Mentzen / Krzysztof Bosak",
            "color": "#0d9488",  # Teal
            "current": round(float(df_features["Konfederacja"].iloc[-1]), 1),
            "forecast": tfm_output.parties["Konfederacja"].p50[-1],
            "p10": tfm_output.parties["Konfederacja"].p10[-1],
            "p90": tfm_output.parties["Konfederacja"].p90[-1],
        },
        "KKP": {
            "name": "Konfederacja Korony Polskiej",
            "leader": "Grzegorz Braun",
            "color": "#b45309",  # Amber / Dark Gold
            "current": round(float(df_features["KKP"].iloc[-1]), 1),
            "forecast": tfm_output.parties["KKP"].p50[-1],
            "p10": tfm_output.parties["KKP"].p10[-1],
            "p90": tfm_output.parties["KKP"].p90[-1],
        },
        "Lewica": {
            "name": "Nowa Lewica",
            "leader": "Włodzimierz Czarzasty / Robert Biedroń",
            "color": "#e11d48",  # Rose Red
            "current": round(float(df_features["Lewica"].iloc[-1]), 1),
            "forecast": tfm_output.parties["Lewica"].p50[-1],
            "p10": tfm_output.parties["Lewica"].p10[-1],
            "p90": tfm_output.parties["Lewica"].p90[-1],
        },
        "Rozwoj_Plus": {
            "name": "Rozwój Plus",
            "leader": "Mateusz Morawiecki",
            "color": "#6366f1",  # Indigo
            "current": round(float(df_features["Rozwoj_Plus"].iloc[-1]), 1),
            "forecast": tfm_output.parties["Rozwoj_Plus"].p50[-1],
            "p10": tfm_output.parties["Rozwoj_Plus"].p10[-1],
            "p90": tfm_output.parties["Rozwoj_Plus"].p90[-1],
        },
        "Razem": {
            "name": "Partia Razem",
            "leader": "Adrian Zandberg / Magdalena Biejat",
            "color": "#a855f7",  # Purple
            "current": round(float(df_features["Razem"].iloc[-1]), 1),
            "forecast": tfm_output.parties["Razem"].p50[-1],
            "p10": tfm_output.parties["Razem"].p10[-1],
            "p90": tfm_output.parties["Razem"].p90[-1],
        },
        "PSL": {
            "name": "Polskie Stronnictwo Ludowe",
            "leader": "Władysław Kosiniak-Kamysz",
            "color": "#16a34a",  # Green
            "current": round(float(df_features["PSL"].iloc[-1]), 1),
            "forecast": tfm_output.parties["PSL"].p50[-1],
            "p10": tfm_output.parties["PSL"].p10[-1],
            "p90": tfm_output.parties["PSL"].p90[-1],
        },
        "Polska_2050": {
            "name": "Polska 2050",
            "leader": "Szymon Hołownia",
            "color": "#eab308",  # Yellow
            "current": round(float(df_features["Polska_2050"].iloc[-1]), 1),
            "forecast": tfm_output.parties["Polska_2050"].p50[-1],
            "p10": tfm_output.parties["Polska_2050"].p10[-1],
            "p90": tfm_output.parties["Polska_2050"].p90[-1],
        },
        "Niezdecydowani": {
            "name": "Niezdecydowani",
            "leader": "Trudno powiedzieć",
            "color": "#64748b",  # Slate Gray
            "current": round(float(df_features["Niezdecydowani"].iloc[-1]), 1),
            "forecast": tfm_output.parties["Niezdecydowani"].p50[-1],
            "p10": tfm_output.parties["Niezdecydowani"].p10[-1],
            "p90": tfm_output.parties["Niezdecydowani"].p90[-1],
        },
    }

    # 7. Formatted forecast time series for Recharts
    forecast_chart_data = []
    for t_idx, d_str in enumerate(tfm_output.forecast_dates):
        item = {"date": d_str}
        for party in PARTIES:
            p_res = tfm_output.parties[party]
            item[f"{party}_p50"] = p_res.p50[t_idx]
            item[f"{party}_p10"] = p_res.p10[t_idx]
            item[f"{party}_p90"] = p_res.p90[t_idx]
        forecast_chart_data.append(item)

    # 8. Assemble full export payload
    export_data = {
        "metadata": {
            "generated_at": pd.Timestamp.now().isoformat(),
            "model_name": "Google TimesFM 3.0 (330M)",
            "architecture": "Stacked Mixing Transformer (Temporal & Variate Attention)",
            "context_days": context_len,
            "horizon_days": horizon_len,
            "cutoff_date": payload.context_dates[-1],
            "target_date": payload.forecast_dates[-1],
        },
        "parties_meta": party_meta,
        "history": history_records,
        "forecast_chart": forecast_chart_data,
        "baselines_comparison": baselines_comp,
        "scenarios_grid": scenario_grid,
        "inflections": inflections_data[:15],
    }

    # Save to both target locations
    for target_path_str in [output_web_json, output_backup_json]:
        p = Path(target_path_str)
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved web data bundle to {p} ({p.stat().st_size / 1024:.1f} KB)")

    return Path(output_web_json)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    p = export_complete_web_payload()
    print(f"✅ Web payload exported successfully to {p}")
