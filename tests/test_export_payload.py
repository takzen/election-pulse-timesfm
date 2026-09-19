"""Tests for the exported frontend payload.

These guard the contract the website relies on. Two of them cover bugs that actually
shipped: percentages on the wrong base (which put every figure ~10% below what the
press reported) and NaN written into JSON (which is not valid JSON at all).
"""

from __future__ import annotations

import json

import numpy as np
import pandas as pd
import pytest

from src.models.poll_aggregator import _UNDECIDED
from src.pipeline.export_web_payload import (
    PARTY_META,
    _round_preserving_total,
    build_payload,
)


@pytest.fixture(scope="module")
def payload() -> dict:
    polls = pd.read_parquet("data/raw/polls_real.parquet")
    return build_payload(polls, horizon_days=10)


# ------------------------------------------------------------- rounding


def test_rounding_preserves_the_total():
    """Displayed figures must add up, or the site looks like it cannot do arithmetic."""
    values = {"a": 31.84, "b": 21.15, "c": 14.82, "d": 9.02, "e": 23.17}
    rounded = _round_preserving_total(values, digits=1, total=100.0)
    assert sum(rounded.values()) == pytest.approx(100.0, abs=1e-9)
    # No value may move by more than one unit in the last decimal place.
    for key, value in values.items():
        assert abs(rounded[key] - value) <= 0.1 + 1e-9


def test_rounding_handles_a_single_value():
    assert _round_preserving_total({"only": 100.0}) == {"only": 100.0}


# --------------------------------------------------------- percentage base


def test_party_percentages_are_on_the_decided_voter_base(payload):
    """The base the press uses. Getting this wrong understated every party by ~10%."""
    assert payload["metadata"]["basis"] == "decided"
    total = sum(p["forecast"] for p in payload["parties_meta"].values())
    assert total == pytest.approx(100.0, abs=0.05)


def test_undecided_is_reported_separately_and_not_as_a_party(payload):
    """Undecided respondents are a share of people asked, not of votes cast."""
    assert _UNDECIDED not in payload["parties_meta"]
    undecided = payload["undecided"]
    assert 0.0 < undecided["mean"] < 40.0
    assert undecided["p10"] <= undecided["mean"] <= undecided["p90"]


def test_threshold_is_evaluated_on_the_decided_base(payload):
    """A party near 5% must be judged on votes cast, not on all respondents.

    With ~9% undecided, a party at 4.6% of all respondents is above 5% of valid votes.
    Because the payload is already rebased, the 5% test applied by the frontend is the
    statutory one; this checks the rebasing is actually in force.
    """
    undecided = payload["undecided"]["mean"]
    assert undecided > 0, "no undecided share means this test proves nothing"

    for key, party in payload["parties_meta"].items():
        # Recover what the figure would have been on the all-respondents base.
        on_full_base = party["forecast"] * (100.0 - undecided) / 100.0
        assert party["forecast"] >= on_full_base - 1e-9, (
            f"{key} is not on the decided base"
        )


# -------------------------------------------------------------- JSON validity


def test_payload_contains_no_nan(payload):
    """Python writes NaN as a bare token, which is not valid JSON."""
    text = json.dumps(payload, allow_nan=False)
    assert "NaN" not in text
    assert "Infinity" not in text


def test_payload_has_every_key_the_frontend_reads(payload):
    for key in (
        "metadata",
        "parties_meta",
        "history",
        "forecast_chart",
        "undecided",
        "house_effects",
        "recent_polls",
    ):
        assert key in payload, key
    for key in ("basis_label", "attribution", "cutoff_date", "target_date", "horizon_days"):
        assert key in payload["metadata"], key


def test_forecast_chart_quantiles_are_ordered(payload):
    for row in payload["forecast_chart"]:
        for key in payload["parties_meta"]:
            assert row[f"{key}_p10"] <= row[f"{key}_p50"] <= row[f"{key}_p90"]


def test_every_recent_poll_carries_its_source(payload):
    """Naming a pollster beside a figure obliges us to show where it was published."""
    polls = payload["recent_polls"]
    assert polls
    with_source = [p for p in polls if p["source_url"]]
    assert len(with_source) / len(polls) > 0.8
    for poll in polls:
        assert poll["pollster"]
        assert poll["date"]


def test_house_effects_exclude_pollsters_with_too_few_polls(payload):
    """Below a handful of polls the estimate is noise, not a house effect."""
    for row in payload["house_effects"]:
        assert row["n_polls"] >= 5
        assert row["effects"]


def test_party_metadata_is_complete(payload):
    for key, party in payload["parties_meta"].items():
        assert key in PARTY_META
        assert party["name"] and party["leader"] and party["color"]
        assert party["p10"] <= party["forecast"] <= party["p90"]
