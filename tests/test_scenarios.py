"""Unit tests for Phase 5: Pocketbook voting scenarios and inflection detection.
"""

import pytest

from src.evaluation.inflection import detect_party_inflections
from src.pipeline.scenario_simulator import PocketbookSimulator
from src.pipeline.tensor_builder import build_inference_payload, load_and_merge_processed_features


def test_pocketbook_scenario_simulation():
    df = load_and_merge_processed_features()
    payload = build_inference_payload(df, context_len=60, horizon_len=14)

    sim = PocketbookSimulator()
    sc = sim.run_scenario(payload, cpi_delta=-1.0, rate_delta=-0.50, scenario_name="Easing")

    assert sc.scenario_name == "Easing"
    assert sc.cpi_delta == -1.0
    assert sc.rate_delta == -0.50
    assert "KO" in sc.final_support
    assert "PiS" in sc.final_support
    assert abs(sc.coalition_total + sc.opposition_total - 100.0) < 1.0


def test_inflection_detection():
    df = load_and_merge_processed_features()
    inflections = detect_party_inflections(df, window_days=14, threshold_z=1.8)

    assert isinstance(inflections, list)
    if inflections:
        first = inflections[0]
        assert hasattr(first, "date")
        assert hasattr(first, "party")
        assert hasattr(first, "shift_magnitude")
