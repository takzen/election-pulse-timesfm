"""Builds the JSON payload the Next.js frontend consumes, from the poll aggregator.

What this replaces, and why:

* The previous pipeline ran a foundation model whose weights forbid commercial and
  production use, and stamped its output with that model's name even when a hand-written
  heuristic had silently produced the numbers.
* It published a macro "scenario grid" driven by hand-entered elasticities that were
  never estimated from anything, and "inflection points" whose causal attribution to
  Google Trends was a hard-coded string.
* It expressed every share as a percentage of all respondents including the undecided,
  so its headline figures sat about 10% below every other Polish tracker.

None of those survive here. Percentages are on the decided-voter base, exactly as the
press and the Sejm threshold express them; uncertainty comes from the fitted measurement
model; and the payload carries the out-of-sample validation numbers plus per-pollster
house effects, so a reader can check the claims rather than take them on trust.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from src.ingestion.polls_wikipedia import ATTRIBUTION
from src.models.poll_aggregator import (
    PollAggregator,
    _UNDECIDED,
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

logger = logging.getLogger(__name__)

MODEL_NAME = "Agregator sondaży (model przestrzeni stanów)"
MODEL_SHORT = "Agregator sondaży"

# Parties shown on the site, with the metadata the cards need. Leaders are people, so
# this list is the one thing here that needs a human to keep it current.
PARTY_META: Dict[str, Dict[str, str]] = {
    "KO": {"name": "Koalicja Obywatelska", "leader": "Donald Tusk", "color": "#f97316"},
    "PiS": {"name": "Prawo i Sprawiedliwość", "leader": "Jarosław Kaczyński", "color": "#2563eb"},
    "Konfederacja": {
        "name": "Konfederacja",
        "leader": "Sławomir Mentzen / Krzysztof Bosak",
        "color": "#0d9488",
    },
    "KKP": {
        "name": "Konfederacja Korony Polskiej",
        "leader": "Grzegorz Braun",
        "color": "#b45309",
    },
    "Lewica": {"name": "Nowa Lewica", "leader": "Włodzimierz Czarzasty", "color": "#e11d48"},
    "Rozwoj_Plus": {"name": "Rozwój Plus", "leader": "Mateusz Morawiecki", "color": "#6366f1"},
    "Razem": {"name": "Razem", "leader": "Adrian Zandberg", "color": "#a855f7"},
    "PSL": {
        "name": "Polskie Stronnictwo Ludowe",
        "leader": "Władysław Kosiniak-Kamysz",
        "color": "#16a34a",
    },
    "Polska_2050": {"name": "Polska 2050", "leader": "Szymon Hołownia", "color": "#eab308"},
    "Inne_partie": {"name": "Pozostałe partie", "leader": "—", "color": "#64748b"},
}


def _round(value: float, digits: int = 2) -> float:
    return float(np.round(float(value), digits))


def _round_preserving_total(
    values: Dict[str, float], digits: int = 1, total: float = 100.0
) -> Dict[str, float]:
    """Rounds shares so the displayed figures still add up to `total`.

    Rounding each share independently leaves the visible sum at 99.9 or 100.1, which
    reads as sloppy arithmetic even though the underlying numbers sum exactly. The
    largest-remainder method distributes the rounding error to the shares that were
    closest to rounding up, so no single figure moves by more than one unit in the
    last decimal place.
    """
    if not values:
        return {}
    scale = 10**digits
    scaled = {key: value * scale for key, value in values.items()}
    floored = {key: int(np.floor(value)) for key, value in scaled.items()}
    remainder = int(round(total * scale)) - sum(floored.values())

    if remainder > 0:
        order = sorted(values, key=lambda k: scaled[k] - floored[k], reverse=True)
        for key in order[:remainder]:
            floored[key] += 1
    elif remainder < 0:
        order = sorted(values, key=lambda k: scaled[k] - floored[k])
        for key in order[: -remainder]:
            floored[key] -= 1

    return {key: value / scale for key, value in floored.items()}


def _text_or_none(value: object) -> Optional[str]:
    """Normalises a possibly-missing cell to a string or None."""
    if value is None or (not isinstance(value, str) and not pd.notna(value)):
        return None
    text = str(value).strip()
    return text or None


def build_payload(
    polls: pd.DataFrame,
    horizon_days: int = 30,
    history_days: int = 180,
    validation: Optional[dict] = None,
) -> dict:
    """Fits the aggregator and assembles the full frontend payload."""
    polls = polls.copy()
    polls["date"] = pd.to_datetime(polls["date"])
    fit_frame = polls[~polls.get("is_election", pd.Series(False, index=polls.index)).fillna(False)]

    aggregator = PollAggregator()
    fit = aggregator.fit(fit_frame)

    # Shares of decided voters: the base the press and the 5% threshold both use.
    nowcast = aggregator.nowcast(basis="decided").set_index("category")
    forecast = aggregator.forecast(horizon=horizon_days, basis="decided")
    path = aggregator.shares_path(basis="decided")

    # The undecided group is reported separately, as context rather than as a party -
    # it is a share of respondents, not of votes, so it does not belong on the same axis.
    undecided = aggregator.nowcast(basis="all").set_index("category").loc[_UNDECIDED]

    parties = [p for p in PARTY_META if p in nowcast.index]

    # Displayed headline figures are rounded together so the visible column adds to 100.
    final = forecast.iloc[-1]
    current_display = _round_preserving_total(
        {key: float(nowcast.loc[key, "mean"]) for key in parties}
    )
    forecast_display = _round_preserving_total(
        {key: float(final[f"{key}_mean"]) for key in parties}
    )

    parties_meta: Dict[str, dict] = {}
    for key in parties:
        row = nowcast.loc[key]
        parties_meta[key] = {
            **PARTY_META[key],
            "current": current_display[key],
            "forecast": forecast_display[key],
            "p10": _round(final[f"{key}_p10"], 1),
            "p90": _round(final[f"{key}_p90"], 1),
            "current_p10": _round(row["p10"], 1),
            "current_p90": _round(row["p90"], 1),
        }

    tail = path.tail(history_days)
    history: List[dict] = []
    for _, row in tail.iterrows():
        record = {"date": row["date"].strftime("%Y-%m-%d")}
        for key in parties:
            record[key] = _round(row[f"{key}_mean"], 2)
        history.append(record)

    forecast_chart: List[dict] = []
    for _, row in forecast.iterrows():
        record = {"date": row["date"].strftime("%Y-%m-%d")}
        for key in parties:
            record[f"{key}_p50"] = _round(row[f"{key}_mean"], 2)
            record[f"{key}_p10"] = _round(row[f"{key}_p10"], 2)
            record[f"{key}_p90"] = _round(row[f"{key}_p90"], 2)
        forecast_chart.append(record)

    # House effects, in points of decided-voter share. This is the figure that lets a
    # reader see how much of a "jump" between two polls is the pollster rather than the
    # electorate - and no other Polish tracker publishes it.
    house_table = aggregator.house_effects_table()
    house_effects: List[dict] = []
    for _, row in house_table.iterrows():
        if int(row["n_polls"]) < 5:
            # Below a handful of polls the estimate is dominated by noise.
            continue
        house_effects.append(
            {
                "pollster": row["pollster"],
                "n_polls": int(row["n_polls"]),
                "effects": {k: _round(row[k], 2) for k in parties + [_UNDECIDED] if k in row},
            }
        )

    # Recent polls with their provenance, so every number on the site is traceable.
    recent = polls.sort_values("date").tail(20)
    poll_list: List[dict] = []
    for _, row in recent.iterrows():
        # `or None` is not enough here: a pandas NaN is truthy, so it would survive and
        # be serialised as the bare token NaN, which is not valid JSON and makes the
        # frontend's typed import fail.
        entry = {
            "date": row["date"].strftime("%Y-%m-%d"),
            "pollster": _text_or_none(row.get("pollster")),
            "commissioned_by": _text_or_none(row.get("commissioned_by")),
            "sample_size": int(row["sample_size"]) if pd.notna(row.get("sample_size")) else None,
            "source_url": _text_or_none(row.get("source_url")),
            "is_election": bool(row.get("is_election", False)),
        }
        for key in parties + [_UNDECIDED]:
            value = row.get(key)
            entry[key] = _round(value, 2) if pd.notna(value) else None
        poll_list.append(entry)

    last_poll = polls.sort_values("date").iloc[-1]

    payload = {
        "metadata": {
            "generated_at": pd.Timestamp.now().isoformat(),
            "model_name": MODEL_NAME,
            "model_short": MODEL_SHORT,
            "architecture": "Additive log-ratio + filtr Kalmana, efekty pracowni estymowane z danych",
            "basis": "decided",
            "basis_label": "% głosów ważnych (bez niezdecydowanych)",
            "horizon_days": horizon_days,
            "cutoff_date": last_poll["date"].strftime("%Y-%m-%d"),
            "cutoff_pollster": str(last_poll.get("pollster", "")),
            "target_date": forecast.iloc[-1]["date"].strftime("%Y-%m-%d"),
            "n_polls": int(fit.n_polls_used),
            "n_pollsters": int(len(fit.pollster_counts)),
            "first_poll_date": polls["date"].min().strftime("%Y-%m-%d"),
            "design_effect": _round(float(np.median(fit.design_effect)), 2),
            "attribution": ATTRIBUTION,
            "notes": fit.notes,
        },
        "undecided": {
            "mean": _round(undecided["mean"], 1),
            "p10": _round(undecided["p10"], 1),
            "p90": _round(undecided["p90"], 1),
            "label": "% ankietowanych bez zdecydowanego wyboru",
        },
        "parties_meta": parties_meta,
        "history": history,
        "forecast_chart": forecast_chart,
        "house_effects": house_effects,
        "recent_polls": poll_list,
        "validation": validation or {},
    }
    return payload


def export_web_payload(
    polls_parquet: Path | str = "data/raw/polls_real.parquet",
    output_web_json: Path | str = "web/public/data/forecasts.json",
    output_backup_json: Path | str = "data/processed/forecasts.json",
    validation_json: Path | str = "dev/walidacja_pelna.json",
    horizon_days: int = 30,
) -> Path:
    """Writes the payload to the web app and to a local backup copy."""
    polls = pd.read_parquet(polls_parquet)

    validation: Optional[dict] = None
    validation_path = Path(validation_json)
    if validation_path.exists():
        try:
            raw = json.loads(validation_path.read_text(encoding="utf-8"))
            validation = {
                "n_evaluations": raw.get("n_evaluations"),
                "coverage_80": raw.get("coverage_80"),
                "mae_model": raw.get("mae_model"),
                "mae_random_walk": raw.get("mae_rw"),
                "advantage_vs_random_walk": raw.get("advantage"),
                "advantage_ci": [raw.get("ci_lo"), raw.get("ci_hi")],
                "advantage_is_significant": raw.get("significant"),
            }
        except Exception as exc:
            logger.warning("could not read validation results: %s", exc)
    else:
        logger.warning(
            "No validation results at %s - the payload will claim no accuracy figures.",
            validation_path,
        )

    payload = build_payload(polls, horizon_days=horizon_days, validation=validation)

    for target in (output_web_json, output_backup_json):
        path = Path(target)
        path.parent.mkdir(parents=True, exist_ok=True)
        # allow_nan=False makes NaN or Infinity raise instead of being written as a
        # bare token. Python emits `NaN`, which is not valid JSON: the frontend's typed
        # import of this file fails to compile, and a plain JSON.parse would throw.
        path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False),
            encoding="utf-8",
        )
        logger.info("wrote %s (%.1f KB)", path, path.stat().st_size / 1024)

    return Path(output_web_json)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    written = export_web_payload()
    data = json.loads(Path(written).read_text(encoding="utf-8"))

    meta = data["metadata"]
    print(f"\nZapisano: {written}")
    print(f"Model    : {meta['model_name']}")
    print(f"Podstawa : {meta['basis_label']}")
    print(
        f"Sondaze  : {meta['n_polls']} od {meta['n_pollsters']} pracowni "
        f"({meta['first_poll_date']} -> {meta['cutoff_date']})"
    )
    print(f"Ostatni  : {meta['cutoff_pollster']} z {meta['cutoff_date']}")
    print(f"Design effect: {meta['design_effect']}")

    print("\n=== PROGNOZA NA {} ===".format(meta["target_date"]))
    total = 0.0
    for key, party in data["parties_meta"].items():
        total += party["forecast"]
        print(
            f"  {party['name'][:28]:30} {party['current']:5.1f}%  ->  "
            f"{party['forecast']:5.1f}%   (p10-p90: {party['p10']:.1f}-{party['p90']:.1f})"
        )
    print(f"  {'SUMA':30} {total:5.1f}%")
    u = data["undecided"]
    print(f"\nNiezdecydowani: {u['mean']}% ({u['p10']}-{u['p90']}) - {u['label']}")
    print(f"Efekty pracowni opublikowane dla {len(data['house_effects'])} pracowni")
