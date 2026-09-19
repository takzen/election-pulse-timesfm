"""Ingestion of real Polish parliamentary polling data from Wikipedia.

Source: "Opinion polling for the next Polish parliamentary election" (en.wikipedia.org),
fetched through the MediaWiki API (action=parse&prop=wikitext) - no HTML scraping.

Wikipedia text is licensed CC BY-SA 4.0. Attribution is required wherever this data is
republished; see `ATTRIBUTION` below and the site footer.

Every emitted record carries its provenance: pollster, commissioning outlet, fieldwork
end date, sample size and the source URL published in the article.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
import requests

logger = logging.getLogger(__name__)

WIKI_PAGE = "Opinion polling for the next Polish parliamentary election"
WIKI_LANG = "en"
# Cached wikitext keyed by revision id, so repeated runs do not re-download an
# unchanged 200 KB article from a service provided free of charge.
CACHE_DIR = Path("data/cache")

ATTRIBUTION = (
    "Dane sondazowe: Wikipedia, "
    '"Opinion polling for the next Polish parliamentary election", '
    "licencja CC BY-SA 4.0."
)

# Wikipedia column label -> internal series name.
# Composite columns (lists that later split) are kept under their own name and
# resolved separately, so we never silently invent a split.
COLUMN_MAP: Dict[str, str] = {
    "PiS": "PiS",
    "KO": "KO",
    "Polska 2050": "Polska_2050",
    "PSL": "PSL",
    "Lewica": "Lewica",
    "Razem": "Razem",
    "Konfederacja": "Konfederacja",
    "KKP": "KKP",
    "R+": "Rozwoj_Plus",
    "TD": "Trzecia_Droga",  # composite: PSL + Polska 2050 (2023-2024)
    "PJJ": "PJJ",           # Polska Jest Jedna -> folded into Inne_partie
    "BS": "BS",             # Bezpartyjni Samorzadowcy -> folded into Inne_partie
    "Others": "Inne_partie",
    "Don't know": "Niezdecydowani",
}

# Series the downstream model consumes.
TARGET_PARTIES: List[str] = [
    "KO", "PiS", "Konfederacja", "KKP", "Lewica",
    "Rozwoj_Plus", "Razem", "PSL", "Polska_2050",
]
# Non-party residual categories, tracked separately because they mean different things.
RESIDUAL_COLUMNS: List[str] = ["Inne_partie", "Niezdecydowani"]

# Columns that are other parties' votes, not undecided respondents.
_FOLD_INTO_OTHERS = ["PJJ", "BS"]

# Party names as they appear inside {{efn}} split footnotes.
_EFN_PARTY_PATTERNS = [
    (r"Poland 2050|Polska 2050", "Polska_2050"),
    (r"Polish People's Party|Polskie Stronnictwo Ludowe|PSL", "PSL"),
]


@dataclass
class PollRecord:
    """One published poll (or one election result) with full provenance."""

    date: date                      # fieldwork end date
    pollster: str
    commissioned_by: Optional[str]
    sample_size: Optional[int]
    source_url: Optional[str]
    is_election: bool = False
    values: Dict[str, float] = field(default_factory=dict)
    # Figures the pollster reported for several lists jointly, keyed "A+B".
    combined: Dict[str, float] = field(default_factory=dict)
    split_note: Optional[str] = None


# --------------------------------------------------------------------------- fetch


def fetch_wikitext(
    page: str = WIKI_PAGE,
    lang: str = WIKI_LANG,
    timeout: int = 30,
    cache_dir: Path | str = CACHE_DIR,
    use_cache: bool = True,
) -> str:
    """Downloads raw wikitext for `page` via the MediaWiki API.

    Caches the last response alongside the article's revision id and only re-downloads
    when the article has actually changed. The pipeline is meant to be run often - on a
    schedule, and by hand before publishing - and re-pulling 200 KB of unchanged
    wikitext each time is needless load on a free service we depend on.
    """
    base = f"https://{lang}.wikipedia.org/w/api.php"
    headers = {
        "User-Agent": "PulsWyborczy/1.0 (https://pulswyborczy.pl; takzen.app@gmail.com)"
    }
    cache_path = Path(cache_dir) / f"{lang}-{page.replace(' ', '_')[:80]}.json"
    cached: Optional[dict] = None
    if use_cache and cache_path.exists():
        try:
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
        except Exception:
            cached = None

    # One cheap query for the current revision id, before pulling the whole article.
    if cached:
        try:
            probe = requests.get(
                base,
                params={
                    "action": "query",
                    "prop": "revisions",
                    "titles": page,
                    "rvprop": "ids",
                    "formatversion": "2",
                    "format": "json",
                },
                headers=headers,
                timeout=timeout,
            )
            probe.raise_for_status()
            pages = probe.json().get("query", {}).get("pages", [])
            current = pages[0]["revisions"][0]["revid"] if pages else None
            if current is not None and current == cached.get("revid"):
                logger.info(
                    "Article unchanged (revision %s); using cached wikitext.", current
                )
                return cached["wikitext"]
        except Exception as exc:
            logger.debug("revision probe failed, fetching in full: %s", exc)

    resp = requests.get(
        base,
        params={
            "action": "parse",
            "page": page,
            "prop": "wikitext|revid",
            "formatversion": "2",
            "format": "json",
        },
        headers=headers,
        timeout=timeout,
    )
    resp.raise_for_status()
    payload = resp.json()

    if "error" in payload:
        raise RuntimeError(f"MediaWiki API error: {payload['error']}")
    parsed = payload["parse"]
    text = parsed["wikitext"]
    logger.info("Fetched %d chars of wikitext from %s.wikipedia: %s", len(text), lang, page)

    if use_cache:
        try:
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            cache_path.write_text(
                json.dumps({"revid": parsed.get("revid"), "wikitext": text}),
                encoding="utf-8",
            )
        except Exception as exc:
            logger.debug("could not write cache: %s", exc)
    return text


# ------------------------------------------------------------------- wikitext utils

_ATTR_PREFIX = re.compile(r'^\s*(?:[A-Za-z-]+\s*=\s*"[^"]*"\s*)+\|(?!\|)')
_REF_TAG = re.compile(r"<ref[^>]*?/>|<ref[^>]*>.*?</ref>", re.S)
_COMMENT = re.compile(r"<!--.*?-->", re.S)
_EFN = re.compile(r"\{\{efn[^{}]*(?:\{\{[^{}]*\}\}[^{}]*)*\}\}", re.S)
_TEMPLATE = re.compile(r"\{\{[^{}]*\}\}")
_WIKILINK_PIPED = re.compile(r"\[\[[^\]|]*\|([^\]]*)\]\]")
_WIKILINK_PLAIN = re.compile(r"\[\[([^\]]*)\]\]")
_EXTLINK = re.compile(r"\[(https?://\S+)\s+([^\]]*)\]")
_SORT_VALUE = re.compile(r'data-sort-value\s*=\s*"(\d{4}-\d{2}-\d{2})"')
_COLSPAN = re.compile(r'colspan\s*=\s*"?(\d+)"?')
_HTML_TAG = re.compile(r"<[^>]+>")
_BARE_PIPE = re.compile(r"^\s*\|(?!\|)")


def _strip_attrs(cell: str) -> str:
    """Removes a leading `name="value" ... |` attribute block from a wiki cell.

    Falls back to stripping a bare `|` separator, because `! | Label` is valid
    wikitext too - the parser must not depend on editors keeping the style attributes.
    """
    stripped = _ATTR_PREFIX.sub("", cell, count=1)
    if stripped == cell:
        stripped = _BARE_PIPE.sub("", cell, count=1)
    return stripped


def _clean_text(s: str) -> str:
    """Reduces wiki markup in a cell to plain text."""
    s = _COMMENT.sub("", s)
    s = _REF_TAG.sub("", s)
    s = _EFN.sub("", s)
    s = _TEMPLATE.sub("", s)
    s = _EXTLINK.sub(r"\2", s)
    s = _WIKILINK_PIPED.sub(r"\1", s)
    s = _WIKILINK_PLAIN.sub(r"\1", s)
    s = s.replace("'''", "").replace("''", "")
    s = _HTML_TAG.sub(" ", s)
    return " ".join(s.split())


def _parse_number(cell: str) -> Optional[float]:
    """Parses a percentage cell; returns None for blank / dash / unparseable."""
    txt = _clean_text(_strip_attrs(cell)).replace(",", "").replace("%", "").strip()
    if not txt or txt in {"-", "–", "—", "?", "N/A", "�"}:
        return None
    m = re.search(r"-?\d+(?:\.\d+)?", txt)
    return float(m.group(0)) if m else None


def _parse_sample_size(cell: str) -> Optional[int]:
    val = _parse_number(cell)
    if val is None or val <= 0:
        return None
    return int(round(val))


def _split_pollster(cell: str) -> tuple[str, Optional[str], Optional[str]]:
    """Returns (pollster, commissioned_by, source_url) from the first table column."""
    url_match = _EXTLINK.search(_COMMENT.sub("", cell))
    url = url_match.group(1) if url_match else None

    label = _clean_text(_strip_attrs(cell))
    label = label.strip().strip("“”\"'")
    # "IBRiS / Rz" -> pollster IBRiS, commissioned by Rz
    if "/" in label:
        pollster, _, outlet = label.partition("/")
        pollster = pollster.strip()
        outlet = outlet.strip().strip("“”\"'�").strip() or None
    else:
        pollster, outlet = label.strip(), None
    return pollster, outlet, url


def _extract_efn_split(cell: str) -> Dict[str, float]:
    """Reads an explicit list breakdown out of a {{efn}} footnote.

    Example: `17.6{{efn|[[Poland 2050]] - 10.3, [[Polish People's Party]] - 7.3}}`
    yields {"Polska_2050": 10.3, "PSL": 7.3}.
    """
    out: Dict[str, float] = {}
    for efn in _EFN.findall(cell):
        for part in re.split(r"[,;]", efn):
            matched = next(
                (name for pattern, name in _EFN_PARTY_PATTERNS if re.search(pattern, part)),
                None,
            )
            if matched is None:
                continue
            # Take the figure that follows the party name, so "[[Poland 2050]] - 10.3"
            # yields 10.3 and never 2050 from the link text itself.
            tail = _clean_text(part)
            for pattern, name in _EFN_PARTY_PATTERNS:
                if name == matched:
                    tail = re.split(pattern, tail, maxsplit=1)[-1]
                    break
            num = re.search(r"(\d+(?:\.\d+)?)", tail)
            if num:
                out[matched] = float(num.group(1))
    return out


# Pollster labels that differ only by casing / punctuation across the article.
_POLLSTER_ALIASES = {
    "ipsos": "IPSOS",
    "cbos": "CBOS",
    "ibris": "IBRiS",
    "ogb": "OGB",
    "united surveys": "United Surveys",
    "social changes": "Social Changes",
    "research partner": "Research Partner",
    "pollster": "Pollster",
    "opinia24": "Opinia24",
}


def _normalise_pollster(name: str) -> str:
    """Collapses casing variants so 'Ipsos' and 'IPSOS' are one pollster."""
    return _POLLSTER_ALIASES.get(name.strip().lower(), name.strip())


def _split_cells(row_block: str) -> List[tuple[str, int]]:
    """Splits one wiki table row into `(raw_cell, colspan)` pairs.

    Colspan matters: several pollsters report two lists as one figure (e.g.
    `colspan="2" | 17.17` covering Konfederacja and KKP together). Without tracking
    the span, every column after such a cell shifts and silently misaligns.
    """
    cells: List[tuple[str, int]] = []
    for line in row_block.split("\n"):
        line = line.rstrip()
        if not line.startswith("|") or line.startswith("|-") or line.startswith("|}"):
            continue
        body = line[1:]
        # `|| ` separates inline cells on a single line
        for part in body.split("||"):
            span_match = _COLSPAN.search(part)
            span = int(span_match.group(1)) if span_match else 1
            cells.append((part, max(1, span)))
    return cells


# ------------------------------------------------------------------- table parsing


def _parse_header(table: str) -> List[str]:
    """Returns internal column names in table order, `''` for unmapped columns."""
    columns: List[str] = []
    for line in table.split("\n"):
        line = line.strip()
        if line.startswith("|-") and columns:
            # header block ends once we already collected columns
            if len(columns) >= 4:
                break
            continue
        if not line.startswith("!"):
            continue
        for raw in line[1:].split("!!"):
            label = _clean_text(_strip_attrs(raw))
            if not label:
                continue
            if label in ("Polling firm/Link", "Fieldwork date", "Sample size", "Lead"):
                columns.append({"Polling firm/Link": "_pollster",
                                 "Fieldwork date": "_date",
                                 "Sample size": "_n",
                                 "Lead": "_lead"}[label])
            else:
                columns.append(COLUMN_MAP.get(label, ""))
    return columns


def _parse_table(table: str, year: str) -> List[PollRecord]:
    """Parses one year's poll table into records."""
    columns = _parse_header(table)
    data_cols = [c for c in columns if c and not c.startswith("_")]
    if not data_cols:
        logger.warning("Year %s: no recognised party columns, skipping table.", year)
        return []
    logger.debug("Year %s columns: %s", year, columns)

    records: List[PollRecord] = []
    # Row blocks are delimited by lines starting with `|-`
    blocks = re.split(r"\n\|-[^\n]*", table)
    for block in blocks[1:]:
        block = block.split("\n|}")[0]
        raw_cells = _split_cells(block)
        if len(raw_cells) < 4:
            continue
        # Skip separator and in-table event rows (they span most of the width)
        if any(span >= 5 for _, span in raw_cells):
            continue

        first = raw_cells[0][0]
        pollster, outlet, url = _split_pollster(first)
        if not pollster:
            continue

        first_label = _clean_text(first)
        is_election = bool(re.search(r"\belection\b", first_label, re.I))
        # Presidential rounds poll candidates, not party lists - not comparable.
        if is_election and not re.search(r"parliamentary", first_label, re.I):
            continue

        # Fieldwork end date comes from data-sort-value on the date cell
        iso = None
        for cell, _ in raw_cells[:3]:
            m = _SORT_VALUE.search(cell)
            if m:
                iso = m.group(1)
                break
        if iso is None:
            continue

        # Lay cells out over the column grid, honouring colspan
        aligned: List[Optional[str]] = [None] * len(columns)
        combined: Dict[str, float] = {}
        pos = 0
        for cell, span in raw_cells:
            if pos >= len(columns):
                break
            if span == 1:
                aligned[pos] = cell
            else:
                # One figure covering several lists: record the aggregate and leave the
                # individual columns missing rather than inventing a split.
                names = [c for c in columns[pos : pos + span] if c and not c.startswith("_")]
                agg = _parse_number(cell)
                if agg is not None and names:
                    combined["+".join(names)] = agg
            pos += span

        values: Dict[str, float] = {}
        splits: Dict[str, float] = {}
        sample_size = None
        for name, cell in zip(columns, aligned):
            if cell is None:
                continue
            if name == "_n":
                sample_size = _parse_sample_size(cell)
            elif name and not name.startswith("_"):
                val = _parse_number(cell)
                if val is not None:
                    values[name] = val
                if name == "Trzecia_Droga":
                    splits.update(_extract_efn_split(cell))

        if not values:
            continue

        # An election row reports votes for other parties, never "don't know"
        if is_election and "Niezdecydowani" in values:
            values["Inne_partie"] = values.pop("Niezdecydowani") + values.get("Inne_partie", 0.0)

        # Fold minor-party columns into the residual bucket
        for col in _FOLD_INTO_OTHERS:
            if col in values:
                values["Inne_partie"] = values.get("Inne_partie", 0.0) + values.pop(col)

        note = None
        if splits:
            values.update(splits)
            values.pop("Trzecia_Droga", None)
            note = "TD split from source footnote"

        records.append(
            PollRecord(
                date=pd.Timestamp(iso).date(),
                pollster=_normalise_pollster(pollster),
                commissioned_by=outlet,
                sample_size=sample_size,
                source_url=url,
                is_election=is_election,
                values=values,
                combined=combined,
                split_note=note,
            )
        )
    return records


def parse_poll_tables(wikitext: str) -> List[PollRecord]:
    """Extracts every poll row from the article's per-year 'Poll results' tables.

    The 'Alternative scenarios' subsection is excluded: those rows poll hypothetical
    blocs, not individual parties, and are not comparable with the rest.
    """
    start = wikitext.find("== Poll results ==")
    if start < 0:
        raise RuntimeError("Could not locate the 'Poll results' section.")
    end = wikitext.find("== Seat projection ==", start)
    body = wikitext[start : end if end > 0 else len(wikitext)]

    # Cut off alternative-scenario tables
    alt = body.find("=== Alternative scenarios ===")
    if alt > 0:
        body = body[:alt]

    records: List[PollRecord] = []
    year_sections = list(re.finditer(r"^===\s*(\d{4})\s*===\s*$", body, re.M))
    for idx, match in enumerate(year_sections):
        year = match.group(1)
        seg_end = year_sections[idx + 1].start() if idx + 1 < len(year_sections) else len(body)
        segment = body[match.end() : seg_end]
        # <ref>...</ref> blocks span lines and contain `|`, which would corrupt cell
        # splitting (the 2023 election row otherwise breaks into four bogus rows).
        segment = _REF_TAG.sub("", segment)
        segment = _COMMENT.sub("", segment)
        found = _parse_table(segment, year)
        logger.info("Year %s: parsed %d rows.", year, len(found))
        records.extend(found)

    records = _dedupe_election_rows(records)
    records.sort(key=lambda r: r.date)
    return records


def _dedupe_election_rows(records: List[PollRecord]) -> List[PollRecord]:
    """Keeps one copy of each election result, the most completely reported one.

    The article restates a past election as a reference row at the foot of every
    year's table, but each table has a different column layout, so the same event
    parses into several rows of differing completeness. Only the fullest is real.
    """
    elections: Dict[date, PollRecord] = {}
    others: List[PollRecord] = []
    for rec in records:
        if not rec.is_election:
            others.append(rec)
            continue
        best = elections.get(rec.date)
        if best is None or len(rec.values) > len(best.values):
            elections[rec.date] = rec

    for rec in elections.values():
        rec.pollster = f"Wybory {rec.date.year}"
        rec.commissioned_by = None
    return others + list(elections.values())


# ------------------------------------------------------------------------- assembly


def records_to_dataframe(records: List[PollRecord]) -> pd.DataFrame:
    """Builds a tidy frame: one row per poll, provenance columns plus party shares.

    Values are left as published. Missing parties stay NaN rather than zero, because
    "not polled separately" and "polled at 0%" are different facts - the state-space
    model treats NaN as a missing observation.
    """
    all_cols = TARGET_PARTIES + RESIDUAL_COLUMNS + ["Trzecia_Droga"]
    rows = []
    for rec in records:
        row = {
            "date": pd.Timestamp(rec.date),
            "pollster": rec.pollster,
            "commissioned_by": rec.commissioned_by,
            "sample_size": rec.sample_size,
            "source_url": rec.source_url,
            "is_election": rec.is_election,
            "split_note": rec.split_note,
            "combined_reported": json.dumps(rec.combined, sort_keys=True) if rec.combined else None,
        }
        for col in all_cols:
            row[col] = rec.values.get(col, np.nan)
        rows.append(row)

    df = pd.DataFrame(rows)
    if df.empty:
        return df

    # Total reported mass: individual columns plus any figures the pollster gave for
    # several lists jointly. Without the joint figures this understates the sum and
    # looks like missing data rather than a different reporting style.
    individual = df[TARGET_PARTIES + RESIDUAL_COLUMNS + ["Trzecia_Droga"]].sum(
        axis=1, skipna=True
    )
    joint = pd.Series(
        [sum(rec.combined.values()) for rec in records],
        index=df.index,
        dtype=float,
    )
    df["reported_sum"] = (individual + joint).round(2)
    df = df.sort_values(["date", "pollster"]).reset_index(drop=True)
    return df


def fetch_and_save_real_polls(
    output_dir: Path | str = "data/raw",
    page: str = WIKI_PAGE,
    lang: str = WIKI_LANG,
) -> Path:
    """Fetches, parses and stores the real polling series with provenance."""
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    wikitext = fetch_wikitext(page=page, lang=lang)
    records = parse_poll_tables(wikitext)
    df = records_to_dataframe(records)

    parquet_path = out_dir / "polls_real.parquet"
    df.to_parquet(parquet_path, index=False)
    df.to_csv(out_dir / "polls_real.csv", index=False, encoding="utf-8")
    logger.info(
        "Saved %d real polls (%s to %s) to %s",
        len(df),
        df["date"].min().date(),
        df["date"].max().date(),
        parquet_path,
    )
    return parquet_path


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    import sys

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    path = fetch_and_save_real_polls()
    frame = pd.read_parquet(path)
    print(f"\n{ATTRIBUTION}\n")
    print(f"Rekordow: {len(frame)}  |  zakres: {frame['date'].min().date()} - {frame['date'].max().date()}")
    print(f"Wyniki wyborcze w zbiorze: {int(frame['is_election'].sum())}")
    print(f"Pracownie: {frame['pollster'].nunique()}")
    print("\nOstatnie 8 sondazy:")
    cols = ["date", "pollster", "sample_size", "KO", "PiS", "Konfederacja", "Niezdecydowani"]
    print(frame[cols].tail(8).to_string(index=False))
