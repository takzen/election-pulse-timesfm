# 🗳️ Puls Wyborczy (pulswyborczy.pl)

> **Polish election poll aggregator: separating real movement in support from sampling error and pollster bias**

[![Python 3.13+](https://img.shields.io/badge/python-3.13+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Data: CC BY-SA 4.0](https://img.shields.io/badge/data-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)

**Puls Wyborczy** ([pulswyborczy.pl](https://pulswyborczy.pl)) aggregates published opinion
polls on party support in Poland. Instead of drawing a curve through the data points, it
treats a poll as what it is: a **noisy, biased measurement** of an unobserved state.

Built by [TAKZEN DEV](https://takzendev.pl/). The site itself is in Polish.

---

## Why not just another poll average

Three things no other public Polish tracker does:

1. **House effects estimated from the data.** The model works out how much each pollster
   systematically over- or under-states support relative to the rest — and publishes those
   figures. That makes it visible when a "jump" in one firm's latest poll is really just
   that firm's standing habit rather than a change in opinion.
2. **Uncertainty derived, not assumed.** The p10–p90 band comes out of the measurement
   model: sample size, an estimated design effect, and the volatility of support itself.
3. **Accuracy measured and published, including when it is unflattering.** Rolling-origin
   validation on polls the model has never seen, with the comparison against naive
   baselines shown on the site.

---

## How it works

A state-space model on vote shares:

```
state:        theta_t = theta_{t-1} + eps_t,                    eps_t ~ N(0, Q)
observation:  z_i     = theta_{t(i)} + delta_{h(i)} + eta_i,    eta_i ~ N(0, V_i)
```

`theta` is the **additive log-ratio** (ALR) of the true shares against a reference category,
`delta_h` is pollster *h*'s house effect, and `V_i` is poll *i*'s measurement covariance.

Working in ALR space buys three concrete things:

| Property | Why it matters |
| :--- | :--- |
| Shares sum to 100% **by construction** | The inverse transform is a softmax. No quantile can break the constraint, because nothing is divided after the fact. |
| Log-ratios are **invariant** to whether a poll reports undecided voters | Polls quoted "among decided voters" are used directly, with no rescaling heuristic. |
| The observation equation is **linear** in the unknowns | The exact Kalman filter and smoother apply: no MCMC, no sampling error, under a second on CPU. |

Measurement covariance comes from multinomial theory via the delta method:

```
V_kl = (1/n) * (delta_kl / p_k + 1 / p_ref)
```

The formula is **verified numerically** against multinomial draws
(`tests/test_poll_aggregator.py`). It is multiplied by a **design effect estimated from the
data**, because real polls carry more error than simple random sampling implies —
clustering, weighting, nonresponse.

Variances and the design effect are fitted by maximum likelihood; house effects
iteratively, under a sum-to-zero constraint, without which they are not identifiable
against the latent state.

### What the model cannot do

The forecast is a random-walk extrapolation, so it is **nearly flat with a widening band**.
That is not a defect — with no future polls it is the statistically correct answer. The
model does not anticipate campaigns, debates or scandals. Any model drawing a clear trend
there is inventing momentum the data does not contain.

---

## Data

Poll figures are pulled through the **MediaWiki API** from
[*Opinion polling for the next Polish parliamentary election*](https://en.wikipedia.org/wiki/Opinion_polling_for_the_next_Polish_parliamentary_election)
(licensed **CC BY-SA 4.0**) — no HTML scraping and nothing taken from news portals.

Every record carries its provenance: pollster, commissioning outlet, sample size, fieldwork
end date and a **link to the original publication**, which is shown on the site.

Currently **330 polls from 13 pollsters**, from October 2023 onwards.

Missing data stays missing rather than becoming zero: when a pollster does not report a
party separately (for instance quoting Lewica and Razem jointly), the Kalman filter treats
it as a missing observation instead of having a number invented for it.

**The site does not conduct its own polling.** The published house effects are the output
of a statistical estimate, not an allegation of methodological error against any pollster.

---

## How percentages are expressed

Figures are shares of **valid votes** (excluding undecided respondents) — the same basis the
Polish press uses, so the numbers are directly comparable with what readers see elsewhere.
The undecided share is reported separately, because it is a share of people asked rather
than of votes.

This also matters for the **5% threshold**: the statutory threshold applies to valid votes
cast, and undecided respondents cast none. The rebasing happens **on the simulated draws,
before any quantile is taken** — rescaling a finished quantile would give the wrong
interval, because the divisor is itself uncertain.

Seat allocation (D'Hondt, 5% threshold) is a **nationwide approximation**. The real
distribution depends on 41 districts and can differ materially; nationwide counting tends
to overstate the largest party.

---

## Stack

| Layer | Technology |
| :--- | :--- |
| Model | `numpy` + `scipy` — exact Kalman filter, maximum likelihood. No GPU, no model weights, under a second |
| Data | `pandas` + `pyarrow` (Parquet), `requests` (MediaWiki API) |
| Frontend | Next.js 16 + React 19, Recharts 3, Tailwind CSS v4 |
| Hosting | Vercel (static site) |

Four runtime dependencies. The local review dashboard (`streamlit`, `plotly`) is an optional
extra — the production pipeline emits JSON and needs neither.

---

## Running it

```bash
git clone https://github.com/takzen/puls-wyborczy.git
cd puls-wyborczy

uv venv --python 3.13
.venv\Scripts\activate          # Linux/macOS: source .venv/bin/activate
uv pip install -e .

# Fetch polls, fit the model, export the payload — one command
python -m src.ingestion.run_sync

# The same plus out-of-sample validation (slower)
python -m src.ingestion.run_sync --validate
```

Ingestion, fitting and export sit behind a **single** entry point on purpose. Splitting them
once meant a correction landed in the code, nobody re-ran the pipeline, and the site served
pre-fix figures for a week.

```bash
# Local payload inspector (chart, parties, house effects, source polls)
uv pip install -e ".[dashboard]"
streamlit run src/app.py

# Frontend
cd web && pnpm install && pnpm run dev
```

---

## Tests and validation

```bash
pytest -q                                  # unit tests
python -m src.evaluation.validation        # out-of-sample accuracy
```

The tests target bugs that actually occurred, not array shapes. The important one —
`test_recovers_known_state_and_house_effects` — generates data from the model with known
parameters and requires the fit to recover them; that is what guards the estimator.

Validation is **rolling-origin**: at each cut-off the model fits only on earlier polls, then
predicts the next, unseen one. Hyper-parameters are re-estimated on the training window
current at that point, never once at the start. Two things are measured:

- **Coverage** — an 80% interval should contain the actual figure about 80% of the time. Too
  little means the bands lie about certainty; too much means they are uselessly wide.
- **Point accuracy against naive baselines** — the average of the three most recent polls,
  and the single latest poll, with a **paired bootstrap resampled by poll**. Resampling by
  poll rather than by observation matters: the category errors within one poll are
  correlated, and treating them as independent would overstate significance.

Current scores are published in the site footer and in `dev/walidacja_pelna.json`. **If the
advantage over the naive baseline is not statistically significant, the site says so
outright** — in that case the model's contribution is its calibrated uncertainty and house
effect correction, not the point estimate.

---

## Licences

Source code: **MIT**.

Poll data comes from Wikipedia and is licensed **CC BY-SA 4.0** — attribution appears on the
home page, in the poll list and in the legal notice.

> **Historical note.** Earlier versions of this project used Google TimesFM 3.0 weights,
> distributed under `timesfm-non-commercial-license-v1.0`, which prohibits revenue-generating
> and production use. A public, monetised site violated both conditions. The model was
> replaced with a purpose-built aggregator — no external weights, no licence constraints. The
> repository was renamed from `election-pulse-timesfm` to `puls-wyborczy`.

---

## Contact

Advertising, sponsorship, consulting: **takzen.app@gmail.com** · [takzendev.pl](https://takzendev.pl/)
