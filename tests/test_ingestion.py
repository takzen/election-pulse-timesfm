"""Unit tests for Phase 2: Ingestion modules (polls, trends, macro).
"""

import pandas as pd
import pytest

from src.ingestion.polls import PARTIES, generate_dense_poll_series, standardize_polls
from src.ingestion.trends import _generate_fallback_wiki, _generate_fallback_trends
from src.ingestion.macro import build_macro_dataframe


def test_polls_structure_and_normalization():
    df_raw = generate_dense_poll_series()
    df_std = standardize_polls(df_raw)

    assert not df_std.empty
    assert "date" in df_std.columns
    assert "pollster" in df_std.columns

    for party in PARTIES:
        assert party in df_std.columns
        assert f"{party}_norm" in df_std.columns

    # Verify that normalized sums equal approximately 100%
    norm_cols = [f"{p}_norm" for p in PARTIES]
    sums = df_std[norm_cols].sum(axis=1)
    for s in sums:
        assert abs(s - 100.0) < 0.2

    # Verify datetime order
    assert df_std["date"].is_monotonic_increasing


def test_trends_and_wiki_proxies():
    df_wiki = _generate_fallback_wiki("Donald_Tusk", "20240101", "20240131")
    assert not df_wiki.empty
    assert "date" in df_wiki.columns
    assert "wiki_Donald_Tusk" in df_wiki.columns
    assert (df_wiki["wiki_Donald_Tusk"] >= 0).all()

    df_trends = _generate_fallback_trends(["Koalicja Obywatelska", "PiS"], "2024-01-01", "2024-01-31")
    assert not df_trends.empty
    assert "date" in df_trends.columns
    assert "trend_Koalicja_Obywatelska" in df_trends.columns
    assert "trend_PiS" in df_trends.columns


def test_macro_structure():
    # Build short macro slice
    df_macro = build_macro_dataframe(start_date="2024-01-01", end_date="2024-03-31")
    assert not df_macro.empty
    assert "date" in df_macro.columns
    assert "fx_usd_pln" in df_macro.columns
    assert "nbp_reference_rate" in df_macro.columns
    assert "cpi_inflation_yoy" in df_macro.columns
    assert "bwuk_consumer_confidence" in df_macro.columns

    # Ensure no NaNs remain after forward-fill and interpolation
    assert not df_macro.isnull().any().any()
    assert (df_macro["nbp_reference_rate"] > 0).all()
