# 🗳️ ElectionPulse-TimesFM

> **Zero-Shot Native Multivariate Election Forecasting & Political Scenario Simulator with Google TimesFM 3.0**

[![Python 3.13+](https://img.shields.io/badge/python-3.13+-blue.svg)](https://www.python.org/downloads/)
[![TimesFM 3.0](https://img.shields.io/badge/Model-TimesFM%203.0%20(330M)-orange.svg)](https://huggingface.co/google/timesfm-3.0-pytorch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**ElectionPulse-TimesFM** is an open-source, non-partisan platform for probabilistic electoral forecasting and economic scenario simulation. By leveraging Google's **TimesFM 3.0** foundation model, it unifies irregular polling registers with high-frequency exogenous signals (Google Trends, Wikipedia traffic, macroeconomics, inflation, and interest rates) via native multivariate attention to forecast electoral trajectories and inflection points without task-specific retraining.

---

## ✨ Key Features

- **🧭 Native Multivariate Foundation Forecasting:** Leverages TimesFM 3.0's Stacked Mixing Transformer to jointly model candidate polling alongside real-time search volume and economic indicators in a single forward pass.
- **⚡ Momentum & Inflection Point Detection:** Automatically flags sudden breakouts or declines in candidate support post-debates and major political events.
- **🍞 "Pocketbook Voting" Scenario Simulator:** Interactive what-if engine: _How would a 50 bps interest rate cut or a 1% inflation drop shift incumbent vs. opposition support?_
- **📊 Quantile Fan Charts:** Uncertainty-aware probabilistic forecasts showing 10th to 90th percentile trajectories up to Election Day.
- **⚖️ Benchmark Arena:** Rolling backtesting comparing TimesFM 3.0 against classical baselines (**LightGBM**, **Prophet**, **ARIMA**, **EWMA**).

---

## 📊 Data Sources

| Domain              | Signal / Metric                    | Source API / Package                                    | Frequency          |
| :------------------ | :--------------------------------- | :------------------------------------------------------ | :----------------- |
| **Polling**         | Party & Candidate Support %        | Aggregated Poll Registers (CBOS, IBRiS, United Surveys) | Irregular / Weekly |
| **Public Interest** | Keyword Search Index               | `pytrends` (Google Trends API)                          | Daily              |
| **Pageviews**       | Wikipedia Biographical Reads       | Wikimedia REST API                                      | Daily              |
| **Macroeconomics**  | CPI Inflation, FX Rates, NBP Rates | National Bank of Poland (NBP API) & GUS                 | Monthly / Daily    |
| **Sentiment**       | Consumer Confidence Index (BWUK)   | Statistics Poland (GUS Open Data)                       | Monthly            |

---

## 🏗️ System Architecture

```text
election-pulse-timesfm/
├── data/
│   ├── raw/                  # Cached API payloads & poll logs
│   └── processed/            # Cleaned parquet series & tensors
├── src/
│   ├── ingestion/            # Data fetchers
│   │   ├── polls.py          # Scraper & regularizer for polling data
│   │   ├── trends.py         # Google Trends & Wikipedia pageviews pipeline
│   │   └── macro.py          # NBP & GUS macroeconomic API connector
│   ├── pipeline/
│   │   ├── interpolator.py   # Daily alignment & spline interpolation
│   │   └── tensor_builder.py # Context & dynamic covariate formatting
│   ├── models/
│   │   ├── timesfm_engine.py # Google TimesFM 3.0 multivariate inference wrapper
│   │   └── baselines.py      # LightGBM, Prophet, and ARIMA implementations
│   ├── evaluation/
│   │   └── backtest.py       # Rolling-window evaluation (MAE, RMSE, CRPS)
│   ├── viz/
│   │   └── fan_charts.py     # Plotly probabilistic chart builders
│   └── app.py                # Streamlit UI application
├── tests/                    # Pytest test suite
├── pyproject.toml            # Project dependencies & tool configs
├── AGENTS.md                 # Autonomous coding agent instructions
└── README.md
```

---

## 🚀 Quickstart

### 1. Prerequisites
- Python 3.13 or higher
- CUDA-compatible GPU recommended (NVIDIA RTX with CUDA 12+, CPU supported)

### 2. Installation
Clone the repository and install dependencies using `uv` (recommended) or `pip`:

```bash
# Clone the repository
git clone https://github.com/takzen/election-pulse-timesfm.git
cd election-pulse-timesfm

# Create virtual environment with Python 3.13
uv venv --python 3.13
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install PyTorch with CUDA acceleration (for NVIDIA GPUs)
uv pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126

# Install project dependencies
uv pip install -e .
```

### 3. Fetch Data & Run Ingestion
```bash
# Ingest latest polling data, Google trends, and economic indices
python -m src.ingestion.run_sync
```

### 4. Run Forecasting Dashboard
```bash
streamlit run src/app.py
```

---

## 🔬 Methodology

### Data Alignment & Conditioning
- **Regularization:** Polling data is interpolated to daily intervals using monotonic cubic splines to bridge irregular poll releases.
- **Covariate Scaling:** Google Trends indices and macro variables are standard-scaled over a 90-day rolling context window.

### Inference Setup
- **Model:** `google/timesfm-3.0-pytorch` (330M parameters, decoder-only Stacked Mixing Transformer).
- **Context Window:** 60–180 days of historical multi-signal records.
- **Horizon:** 30–90 days ahead (up to Election Day).
- **Quantiles:** Predicted across `[0.1, 0.5, 0.9]` (or full 9 deciles) to generate confidence bands.

```python
from timesfm3 import TimesFM3Forecaster

# Initialize TimesFM 3.0 PyTorch Checkpoint (330M)
forecaster = TimesFM3Forecaster.from_pretrained(
    "google/timesfm-3.0-pytorch"
)

# Run zero-shot native multivariate forecast with exogenous dynamic covariates
forecast, quantiles = forecaster.forecast(
    inputs=poll_time_series,
    dynamic_numerical_covariates=trends_and_macro_matrix,
    horizon_len=30,
)
```

---

## ⚖️ Disclaimer
This project is an independent, non-partisan open-source research initiative. The forecasts generated by TimesFM 3.0 are statistical representations based on public data and do not constitute political endorsements or infallible predictions of electoral outcomes. Note that model weights are provided under the `timesfm-non-commercial-license-v1.0`.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
