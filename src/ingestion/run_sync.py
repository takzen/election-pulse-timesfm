"""Master ingestion pipeline runner.
Synchronizes Polish election polls, Google Trends, Wikipedia traffic,
NBP foreign exchange & rates, and GUS macroeconomic indicators.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
import pandas as pd

from src.ingestion.polls import fetch_and_save_polls
from src.ingestion.trends import fetch_and_save_interest_data
from src.ingestion.macro import fetch_and_save_macro_data

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("run_sync")


def run_full_ingestion_sync(output_dir: str = "data/raw") -> dict[str, Path]:
    """Runs end-to-end synchronization across all raw data sources."""
    print("=" * 70)
    print("📡 ElectionPulse-TimesFM: Synchronizing External Data Feeds")
    print("=" * 70)

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    results = {}

    # 1. Polling data
    print("\n[1/3] 🗳️ Ingesting Polling Registers (CBOS, IBRiS, United Surveys, Pollster)...")
    polls_p = fetch_and_save_polls(out_path)
    df_polls = pd.read_parquet(polls_p)
    results["polls"] = polls_p
    print(f"      -> Processed {len(df_polls)} polls from {df_polls['date'].min().date()} to {df_polls['date'].max().date()}")

    # 2. Public interest (Google Trends + Wikipedia)
    print("\n[2/3] 🔍 Ingesting Public Interest (Google Trends & Wikimedia Pageviews)...")
    interest_paths = fetch_and_save_interest_data(out_path)
    results.update(interest_paths)
    df_wiki = pd.read_parquet(interest_paths["wiki"])
    df_trends = pd.read_parquet(interest_paths["trends"])
    print(f"      -> Wikipedia pageviews: {len(df_wiki)} days for {df_wiki.shape[1]-1} leaders")
    print(f"      -> Google Trends index: {len(df_trends)} data points for {df_trends.shape[1]-1} queries")

    # 3. Macroeconomic indicators (NBP & GUS)
    print("\n[3/3] 📈 Ingesting Macroeconomics (NBP FX, NBP Rates, GUS CPI, BWUK)...")
    macro_p = fetch_and_save_macro_data(out_path)
    df_macro = pd.read_parquet(macro_p)
    results["macro"] = macro_p
    print(f"      -> Macroeconomic series: {len(df_macro)} days from {df_macro['date'].min().date()} to {df_macro['date'].max().date()}")

    print("\n" + "=" * 70)
    print("✅ All data feeds synchronized successfully to data/raw/!")
    print("=" * 70)
    return results


if __name__ == "__main__":
    run_full_ingestion_sync()
