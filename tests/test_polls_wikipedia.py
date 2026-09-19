"""Tests for the Wikipedia polling loader.

Every case here corresponds to a parsing bug that actually occurred, so these are
regression guards rather than shape checks: hex colours read as vote shares, colspan
cells shifting whole rows, "Poland 2050" read as the value 2050, presidential rounds
leaking into a party series, and one election restated once per year table.

All fixtures are inline - no network access.
"""

from __future__ import annotations

import pandas as pd
import pytest

from src.ingestion.polls_wikipedia import (
    _clean_text,
    _extract_efn_split,
    _normalise_pollster,
    _parse_number,
    parse_poll_tables,
    records_to_dataframe,
)

HEADER = """== Poll results ==
=== 2026 ===
{| class="wikitable"
|-
! rowspan="2" | Polling firm/Link
! rowspan="2" | Fieldwork<br />date
! rowspan="2" | Sample<br />size
! | [[Law and Justice|PiS]]
! | [[Civic Coalition (Poland)|KO]]
! | [[Poland 2050|Polska 2050]]
! | [[Polish People's Party|PSL]]
! | [[The Left (Poland)|Lewica]]
! | [[Left Together|Razem]]
! | [[Confederation|Konfederacja]]
! | [[Confederation of the Polish Crown|KKP]]
! rowspan="2" | Others
! rowspan="2" | Don't know
! rowspan="2" | Lead
|-
! style="height:1px; background:#AAA;" |
"""

FOOTER = "|}\n\n== Seat projection ==\n"


def _wiki(*rows: str) -> str:
    return HEADER + "".join(rows) + FOOTER


def test_hex_background_is_not_read_as_a_vote_share():
    """A highlighted cell must yield its number, not a digit from the colour code."""
    # style="background:#FDDCB8;" previously produced 8.0 for every leading party.
    assert _parse_number("""style="background:#FDDCB8;" | '''30.4'''""") == 30.4
    assert _parse_number("| 25.0") == 25.0


def test_blank_and_dash_cells_are_missing_not_zero():
    for cell in ["", " ", "|", "–", "—", "-"]:
        assert _parse_number(cell) is None, cell


def test_clean_text_strips_html_tags():
    # "Sample<br />size" must match the header label "Sample size".
    assert _clean_text("Sample<br />size") == "Sample size"


def test_efn_split_reads_the_figure_not_the_party_name():
    """'Poland 2050 - 10.3' yields 10.3; the 2050 in the name is not a value."""
    cell = "17.6{{efn|[[Poland 2050]] – 10.3, [[Polish People's Party]] – 7.3}}"
    split = _extract_efn_split(cell)
    assert split == {"Polska_2050": 10.3, "PSL": 7.3}


def test_pollster_aliases_collapse():
    assert _normalise_pollster("Ipsos") == _normalise_pollster("IPSOS") == "IPSOS"


def test_colspan_keeps_columns_aligned():
    """A joint figure must not shift later columns onto the wrong parties."""
    row = """|-
| [https://example.test/a IBRiS / Rz]
| data-sort-value="2026-05-10" | 8–10 May
| 1,100
| 20.0
| 30.0
| colspan="2" | 9.0
| colspan="2" | 8.0
| 12.0
| 6.0
| 2.0
| 13.0
| '''10.0'''
"""
    records = parse_poll_tables(_wiki(row))
    assert len(records) == 1
    rec = records[0]

    # Konfederacja and KKP sit after two colspan cells - they used to shift.
    assert rec.values["Konfederacja"] == 12.0
    assert rec.values["KKP"] == 6.0
    assert rec.values["Niezdecydowani"] == 13.0
    assert rec.values["Inne_partie"] == 2.0

    # Jointly reported lists are recorded as aggregates, never split arbitrarily.
    assert "Polska_2050" not in rec.values
    assert "PSL" not in rec.values
    assert rec.combined == {"Polska_2050+PSL": 9.0, "Lewica+Razem": 8.0}

    assert rec.pollster == "IBRiS"
    assert rec.commissioned_by == "Rz"
    assert rec.sample_size == 1100
    assert rec.source_url == "https://example.test/a"


def test_reported_sum_includes_jointly_reported_lists():
    """Otherwise a different reporting style looks like missing data."""
    row = """|-
| [https://example.test/a IBRiS]
| data-sort-value="2026-05-10" | 10 May
| 1,000
| 20.0
| 30.0
| colspan="2" | 9.0
| colspan="2" | 8.0
| 12.0
| 6.0
| 2.0
| 13.0
| '''10.0'''
"""
    df = records_to_dataframe(parse_poll_tables(_wiki(row)))
    assert df.loc[0, "reported_sum"] == pytest.approx(100.0)


def test_event_rows_are_skipped():
    """In-table annotations span the width and carry no poll."""
    rows = """|-
| style="border-right-style:hidden;" |
| data-sort-value="2026-04-01" | 1 Apr || colspan="11" | '''Government reshuffle'''
|-
| [https://example.test/b CBOS]
| data-sort-value="2026-04-05" | 5 Apr
| 1,000
| 15.0
| 26.0
| 1.0
| 3.0
| 6.0
| 6.0
| 15.0
| 9.0
| 5.0
| 14.0
| '''11.0'''
"""
    records = parse_poll_tables(_wiki(rows))
    assert [r.pollster for r in records] == ["CBOS"]


def test_presidential_rows_are_excluded():
    """Presidential rounds poll candidates, not party lists."""
    rows = """|-
| [[2025 Polish presidential election|Presidential election II round]]
| data-sort-value="2025-06-01" | 1 June
| 20,844,163
| 50.89
| 49.11
| 1.0
| 1.0
| 1.0
| 1.0
| 1.0
| 1.0
| 1.0
| 1.0
| '''1.78'''
"""
    assert parse_poll_tables(_wiki(rows)) == []


def test_parliamentary_election_is_kept_and_flagged():
    rows = """|-
| ''[[2023 Polish parliamentary election|Parliamentary election]]''
| data-sort-value="2023-10-15" | ''15 Oct''
| ''21,596,674''
| ''35.38''
| ''30.70''
| ''7.20''
| ''7.20''
| ''6.11''
| ''2.50''
| ''5.16''
| ''2.00''
| ''3.72''
|
| ''4.68''
"""
    records = parse_poll_tables(_wiki(rows))
    assert len(records) == 1
    rec = records[0]
    assert rec.is_election
    assert rec.pollster == "Wybory 2023"
    assert rec.values["PiS"] == 35.38
    assert rec.values["KO"] == 30.70
    # An election reports votes for other parties, never undecided respondents.
    assert "Niezdecydowani" not in rec.values
    assert rec.values["Inne_partie"] == pytest.approx(3.72)


def test_election_restated_across_year_tables_is_deduplicated():
    """The same election appears at the foot of several tables with fewer columns."""
    sparse = """|-
| ''[[2023 Polish parliamentary election|Parliamentary election]]''
| data-sort-value="2023-10-15" | ''15 Oct''
| ''21,596,674''
| ''35.38''
| ''30.70''
| colspan="2" | ''14.40''
|
|
|
|
|
|
| ''4.68''
"""
    full = """|-
| ''[[2023 Polish parliamentary election|Parliamentary election]]''
| data-sort-value="2023-10-15" | ''15 Oct''
| ''21,596,674''
| ''35.38''
| ''30.70''
| ''7.20''
| ''7.20''
| ''6.11''
| ''2.50''
| ''5.16''
| ''2.00''
| ''3.72''
|
| ''4.68''
"""
    records = parse_poll_tables(_wiki(sparse, full))
    assert len(records) == 1, "the election must survive exactly once"
    # The fullest restatement wins, so the party detail is not lost.
    assert records[0].values["Lewica"] == 6.11


def test_missing_party_stays_nan_rather_than_zero():
    """'Not polled separately' and 'polled at 0%' are different facts."""
    row = """|-
| [https://example.test/c Opinia24]
| data-sort-value="2026-02-02" | 2 Feb
| 1,000
| 18.0
| 30.0
| 1.0
| 3.0
| 7.0
| 4.0
| 13.0
|
| 4.0
| 20.0
| '''12.0'''
"""
    df = records_to_dataframe(parse_poll_tables(_wiki(row)))
    assert pd.isna(df.loc[0, "KKP"])
    assert df.loc[0, "KO"] == 30.0


def test_dataframe_carries_provenance_for_every_row():
    row = """|-
| [https://example.test/d United Surveys / WP.pl]
| data-sort-value="2026-03-03" | 1–3 Mar
| 1,000
| 18.0
| 30.0
| 1.0
| 3.0
| 7.0
| 4.0
| 13.0
| 8.0
| 4.0
| 12.0
| '''12.0'''
"""
    df = records_to_dataframe(parse_poll_tables(_wiki(row)))
    for column in ["date", "pollster", "sample_size", "source_url"]:
        assert df[column].notna().all(), column
    assert df.loc[0, "commissioned_by"] == "WP.pl"
    assert df.loc[0, "date"] == pd.Timestamp("2026-03-03")
