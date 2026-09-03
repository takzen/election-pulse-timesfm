"""Scenario simulator for 'Pocketbook Voting' dynamics.
Simulates electoral shifts under counterfactual macroeconomic trajectories
(e.g., NBP interest rate cuts/hikes, inflation shocks, purchasing power changes).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from src.models.timesfm_engine import MultivariateForecastOutput, TimesFM3Engine
from src.pipeline.tensor_builder import MultivariateInferencePayload, build_inference_payload

logger = logging.getLogger(__name__)


@dataclass
class ScenarioResult:
    """Summary of party shift under a specific macroeconomic scenario."""
    scenario_name: str
    cpi_delta: float
    rate_delta: float
    end_date: str
    final_support: Dict[str, float]  # Party -> final median support %
    delta_from_baseline: Dict[str, float]  # Party -> diff from baseline in percentage points
    coalition_total: float  # KO + TD + Lewica
    opposition_total: float  # PiS + Konfederacja


class PocketbookSimulator:
    """Runs counterfactual economic scenarios through TimesFM 3.0."""

    def __init__(self, engine: Optional[TimesFM3Engine] = None):
        self.engine = engine or TimesFM3Engine()

    def run_scenario(
        self,
        base_payload: MultivariateInferencePayload,
        cpi_delta: float = 0.0,
        rate_delta: float = 0.0,
        scenario_name: str = "Custom Scenario",
    ) -> ScenarioResult:
        """Executes a scenario with custom CPI and NBP rate adjustments."""
        deltas = {
            "cpi_inflation_yoy": float(cpi_delta),
            "nbp_reference_rate": float(rate_delta),
        }

        forecast_out = self.engine.forecast(base_payload, macro_scenario_deltas=deltas)

        # Compare against baseline (delta 0)
        base_out = self.engine.forecast(base_payload, macro_scenario_deltas=None)

        final_support = {}
        diff_from_base = {}

        for party, res in forecast_out.parties.items():
            final_val = res.p50[-1]
            base_val = base_out.parties[party].p50[-1]
            final_support[party] = round(final_val, 2)
            diff_from_base[party] = round(final_val - base_val, 2)

        coalition = round(
            final_support.get("KO", 0.0)
            + final_support.get("PSL", 0.0)
            + final_support.get("Polska_2050", 0.0)
            + final_support.get("Lewica", 0.0),
            2,
        )
        opposition = round(
            final_support.get("PiS", 0.0)
            + final_support.get("Konfederacja", 0.0)
            + final_support.get("KKP", 0.0)
            + final_support.get("Rozwoj_Plus", 0.0)
            + final_support.get("Razem", 0.0),
            2,
        )

        return ScenarioResult(
            scenario_name=scenario_name,
            cpi_delta=cpi_delta,
            rate_delta=rate_delta,
            end_date=forecast_out.forecast_dates[-1],
            final_support=final_support,
            delta_from_baseline=diff_from_base,
            coalition_total=coalition,
            opposition_total=opposition,
        )

    def generate_scenario_grid(
        self,
        base_payload: MultivariateInferencePayload,
        cpi_steps: Tuple[float, ...] = (-1.5, -0.75, 0.0, 0.75, 1.5),
        rate_steps: Tuple[float, ...] = (-1.0, -0.5, 0.0, 0.5, 1.0),
    ) -> List[Dict]:
        """Generates a dense grid of macroeconomic scenarios for instant frontend exploration."""
        grid = []
        for r in rate_steps:
            for c in cpi_steps:
                name = f"NBP {r:+.2f}% | CPI {c:+.2f}%"
                sc = self.run_scenario(base_payload, cpi_delta=c, rate_delta=r, scenario_name=name)
                grid.append({
                    "name": sc.scenario_name,
                    "cpi_delta": sc.cpi_delta,
                    "rate_delta": sc.rate_delta,
                    "final_support": sc.final_support,
                    "delta_from_baseline": sc.delta_from_baseline,
                    "coalition_total": sc.coalition_total,
                    "opposition_total": sc.opposition_total,
                })
        return grid


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    from src.pipeline.tensor_builder import load_and_merge_processed_features

    df = load_and_merge_processed_features()
    payload = build_inference_payload(df, context_len=90, horizon_len=30)
    sim = PocketbookSimulator()

    sc1 = sim.run_scenario(payload, cpi_delta=-1.0, rate_delta=-0.50, scenario_name="Easing & Disinflation")
    print(f"\nScenario: {sc1.scenario_name}")
    print(f"Coalition Total: {sc1.coalition_total}% | Opposition Total: {sc1.opposition_total}%")
    for party, diff in sc1.delta_from_baseline.items():
        print(f" - {party:14}: {sc1.final_support[party]}% ({diff:+.2f} pp vs baseline)")
