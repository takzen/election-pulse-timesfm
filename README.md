# 🗳️ Puls Wyborczy (PulsWyborczy.pl)

> **Niezależne Probabilistyczne Prognozy Wyborcze i Symulator Gospodarczy AI oparty o model Google TimesFM 3.0**

[![Python 3.13+](https://img.shields.io/badge/python-3.13+-blue.svg)](https://www.python.org/downloads/)
[![TimesFM 3.0](https://img.shields.io/badge/Model-TimesFM%203.0%20(330M)-emerald.svg)](https://huggingface.co/google/timesfm-3.0-pytorch)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![pnpm 10](https://img.shields.io/badge/pnpm-10.x-orange.svg)](https://pnpm.io/)
[![uv](https://img.shields.io/badge/package%20manager-uv-purple.svg)](https://astral.sh/uv)
[![CUDA 12.6](https://img.shields.io/badge/CUDA-12.6-green.svg)](https://developer.nvidia.com/cuda-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Puls Wyborczy** ([pulswyborczy.pl](https://pulswyborczy.pl)) to otwarta, niezależna platforma badawczo-analityczna stworzona przez [TAKZEN DEV](https://takzendev.pl/). Łączy nieregularne publikacje sondaży poparcia partii w Polsce z danymi o wysokiej częstotliwości (Google Trends, czytelnictwo Wikipedii, inflacja CPI i stopy referencyjne NBP) przy użyciu natywnie wielowymiarowego modelu transformerowego **Google TimesFM 3.0 (330M)**.

---

## 🛠️ Architektura i Stack Technologiczny

| Obszar | Technologia i Wersja | Rola w systemie |
| :--- | :--- | :--- |
| **Model Predykcyjny** | **Google TimesFM 3.0 (330M)** | Natywny model wielowymiarowy z architekturą Stacked Mixing Transformer (uwaga czasowa + międzyzmiennowa) |
| **Przyspieszenie GPU** | **PyTorch 2.14 + CUDA 12.6** | Błyskawiczna inferencja na karcie NVIDIA GeForce RTX 4060 poniżej 100 ms |
| **Środowisko Python** | **Python 3.13 + uv 0.6+** | Najszybszy resolver zależności napisany w Rust |
| **Przetwarzanie Danych** | **Polars 1.44, Pandas, PyArrow** | Kolumnowy format Parquet, brak zbędnych kopii pamięci |
| **Interpolacja Szeregów** | **SciPy (PCHIP)** | Monotoniczne splajny sześcienne zapobiegające przestrzałom poparcia |
| **Aplikacja Webowa** | **Next.js 15 (App Router) + React 19** | Płynny interfejs z natychmiastowym renderowaniem statycznym (Vercel) |
| **Menedżer Pakietów Web** | **pnpm 10.26+** | Wydajne zarządzanie zależnościami frontendowymi |
| **Styling & UI** | **Tailwind CSS + Lucide React** | Spokojna paleta analityczna (ciemny motyw), duża czytelność przy 100% zoomie |
| **Wykresy i Wizualizacje** | **Recharts** | Interaktywne pasma ufności p10–p90 oraz punkty przegięcia trendu |

---

## 🇵🇱 Śledzone Ugrupowania (Realna Scena Polityczna)

Model monitoruje pełne spektrum 10 opcji obecnych w czołowych sondażach (IBRiS, United Surveys, CBOS, Pollster):

1. **KO** (Koalicja Obywatelska)
2. **PiS** (Prawo i Sprawiedliwość)
3. **Konfederacja** (Nowa Nadzieja / Ruch Narodowy)
4. **KKP** (Konfederacja Korony Polskiej)
5. **Lewica** (Nowa Lewica)
6. **Rozwój Plus** (inicjatywa centroprawicowa)
7. **Razem** (Partia Razem)
8. **PSL** (Polskie Stronnictwo Ludowe)
9. **Polska 2050** (Polska 2050)
10. **Niezdecydowani** (wyborcy niezdecydowani / trudno powiedzieć)

---

## ✨ Kluczowe Funkcjonalności

- **🧭 Wielowymiarowa Prognoza TimesFM 3.0:** Wspólna analiza poparcia wszystkich partii w połączeniu z sygnałami makroekonomicznymi w jednym przejściu modelu.
- **🏛️ Kalkulator Większości Sejmowej (Próg 231):** Szacunek mandatów metodą D'Hondta z wizualnym wskaźnikiem większości rządowej vs opozycji.
- **🍞 Symulator Portfela Wyborcy (Pocketbook Voting):** Interaktywne badanie scenariuszy: *Jak obniżka stóp NBP o 100 pb lub wzrost inflacji wpłynie na rozkład poparcia?*
- **📊 Wykresy Wachlarzowe:** Probabilistyczna projekcja trendu z przedziałami ufności od 10% do 90%.
- **⚡ Detektor Szoków Politycznych:** Automatyczna identyfikacja punktów przegięcia trendu skorelowanych z wydarzeniami w kraju.
- **🐦 Generator Podsumowań na X (Twitter):** Eksport gotowej pigułki informacyjnej z linkiem do pulswyborczy.pl jednym kliknięciem.

---

## ⚖️ Wyniki Backtestingu (Arena Modeli)

Weryfikacja na 14-dniowym kroczącym oknie przed wyborami w Polsce:

| Model | MAE (pp) | RMSE (pp) | Bias (pp) | Opis |
| :--- | :---: | :---: | :---: | :--- |
| **🥇 Google TimesFM 3.0** | **0.49** | **0.63** | **+0.00** | Model transformerowy z kowariantami makro |
| **🥈 ARIMA(1, 1, 1)** | 0.55 | 0.73 | -0.02 | Klasyczny autoregresyjny szereg bazowy |
| **🥉 EWMA ($\alpha = 0.15$)** | 0.91 | 0.98 | +0.00 | Wygładzanie wykładnicze sondaży |
| **4️⃣ LightGBM** | 1.07 | 1.13 | +0.08 | Drzewa decyzyjne z opóźnionymi cechami makro |

---

## 🚀 Uruchomienie Projektu Lokalnie

### 1. Środowisko Python (Model i Pipeline Danych)
```bash
# Sklonuj repozytorium
git clone https://github.com/takzen/election-pulse-timesfm.git
cd election-pulse-timesfm

# Utwórz środowisko Python 3.13 za pomocą uv
uv venv --python 3.13
.venv\Scripts\activate  # Na Linux/macOS: source .venv/bin/activate

# Zainstaluj PyTorch z akceleracją CUDA 12.6
uv pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126

# Zainstaluj zależności projektu
uv pip install -e .

# Pobierz dane i przelicz prognozę TimesFM 3.0
python -m src.ingestion.polls
python -m src.pipeline.interpolator
python -m src.pipeline.export_web_data
```

### 2. Frontend Next.js (Aplikacja Webowa)
```bash
cd web
pnpm install
pnpm run dev
# Otwórz w przeglądarce: http://localhost:3000
```

---

## 🌐 Wdrożenie Produkcyjne (Vercel)

Aplikacja w katalogu `web/` jest skonfigurowana do natychmiastowego wdrożenia:
1. Połącz repozytorium z kontem [Vercel](https://vercel.com).
2. Ustaw **Root Directory** na `web`.
3. Wybierz framework preset: **Next.js**.
4. W sekcji domen podepnij domenę **`pulswyborczy.pl`**.
5. Kliknij **Deploy** – platforma działa globalnie z zerowym czasem oczekiwania.

---

## 👨‍💻 Autor i Kontakt

Projekt stworzony przez **[TAKZEN DEV](https://takzendev.pl/)**.  
Tworzymy dedykowane systemy sztucznej inteligencji, architekturę modeli prognozowania i nowoczesne aplikacje webowe.

Kontakt w sprawie reklamy lub współpracy: **contact@takzendev.pl**

---

## 📄 Licencja
Kod udostępniany na licencji MIT. Wagi modelu TimesFM 3.0 podlegają licencji badawczej Google Research.
