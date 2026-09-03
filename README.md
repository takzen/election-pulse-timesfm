# 🗳️ Puls Wyborczy (pulswyborczy.pl)

> **Zero-shot probabilistic election forecasting and economic scenario simulator powered by Google TimesFM 3.0**

[![Python 3.13+](https://img.shields.io/badge/python-3.13+-blue.svg)](https://www.python.org/downloads/)
[![TimesFM 3.0](https://img.shields.io/badge/Model-TimesFM%203.0%20(330M)-emerald.svg)](https://huggingface.co/google/timesfm-3.0-pytorch)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![pnpm 10](https://img.shields.io/badge/pnpm-10.x-orange.svg)](https://pnpm.io/)
[![uv](https://img.shields.io/badge/package%20manager-uv-purple.svg)](https://astral.sh/uv)
[![CUDA 12.6](https://img.shields.io/badge/CUDA-12.6-green.svg)](https://developer.nvidia.com/cuda-toolkit)
[![Release](https://img.shields.io/github/v/release/takzen/election-pulse-timesfm?color=purple)](https://github.com/takzen/election-pulse-timesfm/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Puls Wyborczy** ([pulswyborczy.pl](https://pulswyborczy.pl)) is an independent, non-partisan research and analytics platform engineered by [TAKZEN DEV](https://takzendev.pl/). It unifies irregular polling registers across Poland with high-frequency exogenous signals (Google Trends search velocity, Wikipedia biographical traffic, CPI inflation, and NBP policy interest rates) using Google Research's foundation time-series model **TimesFM 3.0 (330M)**.

---

## 🛠️ Architecture and modern tech stack

| Domain | Technology & version | System role & architecture |
| :--- | :--- | :--- |
| **Foundation model** | **Google TimesFM 3.0 (330M)** | Multivariate Stacked Mixing Transformer (alternating temporal and variate attention) |
| **Hardware acceleration** | **PyTorch 2.14 + CUDA 12.6** | Sub-100ms hardware-accelerated tensor operations on NVIDIA RTX 4060 GPU |
| **Python runtime** | **Python 3.13 + uv 0.6+** | Ultra-fast Rust-based package resolver and virtual environment manager |
| **Data engine & storage** | **Polars 1.44, Pandas, PyArrow** | Columnar Parquet serialization, zero-copy data pipelines |
| **Interpolation & splines** | **SciPy (PCHIP)** | Monotonic cubic spline regularization preventing overshoot on irregular polling series |
| **Web frontend** | **Next.js 15 (App Router) + React 19** | Pre-rendered static dashboard with sub-100ms global latency on Vercel |
| **Package manager (web)** | **pnpm 10.26+** | Fast, disk-efficient, symlinked dependency manager |
| **Design & styling** | **Tailwind CSS + Lucide React** | Calm data-analyst palette (charcoal matte dark theme), large readable typography at 100% zoom |
| **Interactive charts** | **Recharts** | Client-side fan charts with calibrated 10%–90% uncertainty intervals |

---

## 🇵🇱 Tracked political landscape (10 entities)

The platform models the complete spectrum of options present in official Polish pollsters (IBRiS, United Surveys, CBOS, Pollster):

1. **KO** (Civic Coalition)
2. **PiS** (Law and Justice)
3. **Konfederacja** (Confederation)
4. **KKP** (Crown of the Polish King - Braun)
5. **Lewica** (New Left)
6. **Rozwój Plus** (Center-right political initiative)
7. **Razem** (Left Together)
8. **PSL** (Polish People's Party)
9. **Polska 2050** (Poland 2050 - Hołownia)
10. **Niezdecydowani** (Undecided voters)

---

## ✨ Key features

- **🧭 Multivariate foundation forecasting:** TimesFM 3.0 jointly attends to polling trends alongside macroeconomic signals in a single forward pass without task-specific fine-tuning.
- **🏛️ Parliamentary majority tracker (threshold 231):** D'Hondt seat allocation estimator comparing governing coalition vs. parliamentary opposition.
- **🍞 Pocketbook voting simulator:** Interactive what-if engine: *How does a 100 bps central bank rate cut or a sudden CPI inflation spike redistribute vote shares?*
- **📊 Probabilistic fan charts:** Calibrated confidence bands ranging from p10 to p90.
- **⚡ Political shockwave detector:** Automated detection of inflection points correlated with debate spikes and news events.
- **🐦 1-Click share on X:** Generates verified polling summaries linked to pulswyborczy.pl.

---

## ⚖️ Benchmark arena (14-day rolling backtesting)

Evaluated across historical rolling windows prior to Polish parliamentary and presidential elections:

| Model | MAE (pp) | RMSE (pp) | Bias (pp) | Architecture description |
| :--- | :---: | :---: | :---: | :--- |
| **🥇 Google TimesFM 3.0** | **0.49** | **0.63** | **+0.00** | Multivariate foundation transformer conditioned on macro signals |
| **🥈 ARIMA(1, 1, 1)** | 0.55 | 0.73 | -0.02 | Classical autoregressive univariate baseline |
| **🥉 EWMA ($\alpha = 0.15$)** | 0.91 | 0.98 | +0.00 | Exponential weighted moving average poll tracker |
| **4️⃣ LightGBM** | 1.07 | 1.13 | +0.08 | Gradient boosted regression trees with lagged macro features |

---

## 🚀 Local installation and development

### 1. Python environment (models and data pipelines)
```bash
# Clone the repository
git clone https://github.com/takzen/election-pulse-timesfm.git
cd election-pulse-timesfm

# Create Python 3.13 virtual environment using uv
uv venv --python 3.13
.venv\Scripts\activate  # On Linux/macOS: source .venv/bin/activate

# Install PyTorch with CUDA 12.6 acceleration
uv pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126

# Install project dependencies
uv pip install -e .

# Sync raw polls, interpolate daily paths, and run GPU inference export
python -m src.ingestion.polls
python -m src.pipeline.interpolator
python -m src.pipeline.export_web_data
```

### 2. Next.js 15 web application
```bash
cd web
pnpm install
pnpm run dev
# Open http://localhost:3000 in your browser
```

---

## 👨‍💻 Author and commercial inquiries

Engineered by **[TAKZEN DEV](https://takzendev.pl/)**.  
Specialized in custom AI systems, time-series foundation architectures, and modern full-stack web platforms.

For advertising, sponsorship, or consulting inquiries: **takzen.app@gmail.com**

---

## 📄 License
Source code distributed under the MIT License. Google TimesFM 3.0 weights are provided under the Google Research non-commercial research license.
