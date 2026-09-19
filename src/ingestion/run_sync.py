"""One command to refresh the site: fetch polls, fit the model, export the payload.

Running the steps separately is what let a fix ship without the data behind it: a
correction landed in the ingestion code in September 2026, nobody re-ran the pipeline,
and the published figures stayed on the pre-fix numbers for a week. So ingestion and
export live behind a single entry point, and the export refuses to run on stale data.

    python -m src.ingestion.run_sync              # refresh and export
    python -m src.ingestion.run_sync --validate   # also re-run out-of-sample validation
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Optional

import pandas as pd

from src.ingestion.polls_wikipedia import ATTRIBUTION, fetch_and_save_real_polls
from src.models.poll_aggregator import PollAggregator
from src.pipeline.export_web_payload import export_web_payload

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("run_sync")

VALIDATION_PATH = Path("dev/walidacja_pelna.json")


def run_validation(polls: pd.DataFrame, max_evaluations: int = 60) -> dict:
    """Re-runs rolling-origin validation and stores the scores."""
    from src.evaluation.validation import rolling_validation

    result = rolling_validation(polls, max_evaluations=max_evaluations)
    low, high = result.advantage_ci
    payload = {
        "n_evaluations": result.n_evaluations,
        "coverage_80": round(result.coverage_80, 4),
        "mae_model": round(result.mae_model, 4),
        "mae_rw": round(result.mae_random_walk, 4),
        "mae_last": round(result.mae_last_poll, 4),
        "advantage": round(result.advantage_vs_random_walk, 4),
        "ci_lo": round(low, 4),
        "ci_hi": round(high, 4),
        "significant": bool(result.advantage_is_significant),
        "coverage_by_cat": {k: round(v, 4) for k, v in result.coverage_by_category.items()},
        "mae_by_cat": {k: round(v, 4) for k, v in result.mae_by_category.items()},
    }
    VALIDATION_PATH.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION_PATH.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return payload


def run_full_sync(validate: bool = False, horizon_days: int = 30) -> Path:
    """Fetches the current polls, fits the aggregator and writes the web payload."""
    print("=" * 72)
    print("Puls Wyborczy: odswiezanie danych i eksport")
    print("=" * 72)

    print("\n[1/3] Pobieranie sondazy (MediaWiki API)...")
    parquet = fetch_and_save_real_polls()
    polls = pd.read_parquet(parquet)
    fit_frame = polls[~polls["is_election"]]
    print(
        f"      -> {len(polls)} rekordow, {polls['pollster'].nunique()} pracowni, "
        f"{polls['date'].min().date()} -> {polls['date'].max().date()}"
    )
    print(f"      -> {ATTRIBUTION}")

    print("\n[2/3] Dopasowanie modelu...")
    aggregator = PollAggregator()
    fit = aggregator.fit(fit_frame)
    print(
        f"      -> {fit.n_polls_used} sondazy, {len(fit.dates)} dni, "
        f"design effect (mediana) {float(pd.Series(fit.design_effect).median()):.2f}"
    )
    for note in fit.notes:
        print(f"      UWAGA: {note}")

    validation: Optional[dict] = None
    if validate:
        print("\n[2b] Walidacja out-of-sample (to potrwa)...")
        validation = run_validation(polls)
        verdict = (
            "istotna" if validation["significant"] else "NIEISTOTNA - nie oglaszac przewagi"
        )
        print(
            f"      -> pokrycie {validation['coverage_80'] * 100:.1f}% "
            f"| MAE {validation['mae_model']:.3f} vs random walk {validation['mae_rw']:.3f} "
            f"| przewaga {verdict}"
        )

    print("\n[3/3] Eksport payloadu...")
    written = export_web_payload(polls_parquet=parquet, horizon_days=horizon_days)
    print(f"      -> {written}")

    if not VALIDATION_PATH.exists():
        print(
            "\n      UWAGA: brak wynikow walidacji. Strona nie poda zadnych liczb\n"
            "      o trafnosci. Uruchom z --validate, zeby je policzyc."
        )

    print("\n" + "=" * 72)
    print("Gotowe. Payload zapisany, dane i model z tego samego przebiegu.")
    print("=" * 72)
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh polls, fit model, export payload.")
    parser.add_argument(
        "--validate",
        action="store_true",
        help="re-run rolling-origin validation and refresh the published scores",
    )
    parser.add_argument("--horizon", type=int, default=30, help="forecast horizon in days")
    args = parser.parse_args()
    run_full_sync(validate=args.validate, horizon_days=args.horizon)


if __name__ == "__main__":
    main()
