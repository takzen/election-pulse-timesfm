# 🗳️ Puls Wyborczy (pulswyborczy.pl)

> **Agregator sondaży wyborczych: oddziela realną zmianę poparcia od błędu próby i od odchyleń pracowni**

[![Python 3.13+](https://img.shields.io/badge/python-3.13+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Dane: CC BY-SA 4.0](https://img.shields.io/badge/dane-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)

**Puls Wyborczy** ([pulswyborczy.pl](https://pulswyborczy.pl)) agreguje opublikowane sondaże
poparcia partii w Polsce. Zamiast rysować krzywą przez punkty, traktuje sondaż jako to, czym
jest: **zaszumiony i obciążony pomiar** nieobserwowalnego stanu.

Projekt [TAKZEN DEV](https://takzendev.pl/).

---

## Dlaczego nie „kolejna średnia sondaży"

Trzy rzeczy, których nie robi żaden inny publiczny polski tracker:

1. **Efekty pracowni estymowane z danych.** Model wylicza, o ile każda pracownia systematycznie
   zawyża lub zaniża poparcie względem pozostałych — i publikuje te liczby. Dzięki temu widać,
   że „skok" w kolejnym sondażu danej pracowni to często jej stała cecha, nie zmiana nastrojów.
2. **Niepewność wyliczona, nie przyjęta.** Pasmo p10–p90 wynika z modelu błędu pomiaru:
   z liczebności próby, z estymowanego efektu planu próby i ze zmienności poparcia.
3. **Sprawdzona trafność, także gdy wypada niekorzystnie.** Walidacja krocząca na sondażach,
   których model nie widział, a wyniki — w tym porównanie z metodami naiwnymi — są publikowane
   na stronie.

---

## Jak to działa

Model przestrzeni stanów na udziałach poparcia:

```
stan:        theta_t = theta_{t-1} + eps_t,                    eps_t ~ N(0, Q)
obserwacja:  z_i     = theta_{t(i)} + delta_{h(i)} + eta_i,    eta_i ~ N(0, V_i)
```

`theta` to **additive log-ratio** (ALR) prawdziwych udziałów względem kategorii odniesienia,
`delta_h` to efekt pracowni *h*, a `V_i` to kowariancja pomiaru sondażu *i*.

Praca w przestrzeni ALR daje trzy konkretne rzeczy:

| Własność | Dlaczego to ma znaczenie |
| :--- | :--- |
| Udziały sumują się do 100% **z konstrukcji** | Transformata odwrotna to softmax. Żaden kwantyl nie może złamać więzu, bo nic nie jest dzielone po fakcie. |
| Log-ratio **nie zależy** od tego, czy sondaż podaje niezdecydowanych | Sondaże „wśród zdecydowanych" używane wprost, bez heurystyki przeskalowania. |
| Obserwacja jest **liniowa** w nieznanych | Stosuje się dokładny filtr i wygładzanie Kalmana: bez MCMC, bez błędu próbkowania, poniżej sekundy na CPU. |

Kowariancja pomiaru pochodzi z teorii wielomianowej (metoda delty):

```
V_kl = (1/n) * (delta_kl / p_k + 1 / p_ref)
```

Wzór jest **zweryfikowany numerycznie** na losowaniach wielomianowych (`tests/test_poll_aggregator.py`).
Mnożymy go przez **efekt planu próby estymowany z danych**, bo realne sondaże mają większy błąd,
niż wynika z prostego losowania — klastrowanie, ważenie, brak odpowiedzi.

Wariancje i efekt planu próby dopasowywane są metodą największej wiarygodności; efekty pracowni
iteracyjnie, z więzem sumy zero — bez tego nie są identyfikowalne względem stanu ukrytego.

### Czego model nie potrafi

Prognoza to ekstrapolacja błądzeniem losowym, więc **jest niemal płaska, z rosnącym pasmem**.
To nie usterka — przy braku przyszłych sondaży to statystycznie poprawna odpowiedź. Model nie
przewiduje kampanii, debat ani skandali. Każdy model rysujący tam wyraźny trend dorysowuje
momentum, którego w danych nie ma.

---

## Dane

Zestawienie sondaży pobieramy przez **MediaWiki API** z artykułu
[*Opinion polling for the next Polish parliamentary election*](https://en.wikipedia.org/wiki/Opinion_polling_for_the_next_Polish_parliamentary_election)
(licencja **CC BY-SA 4.0**) — bez scrapingu HTML i bez pobierania z portali informacyjnych.

Każdy rekord ma zapisaną proweniencję: pracownię, zleceniodawcę, liczebność próby, datę końca
badania i **odnośnik do publikacji źródłowej**, pokazywany na stronie.

Obecnie: **330 sondaży, 13 pracowni**, od października 2023 r.

Braki danych są traktowane jako braki, nie jako zera: gdy pracownia nie podaje partii osobno
(np. raportuje Lewicę i Razem łącznie), filtr Kalmana obsługuje to jako brakującą obserwację —
nie wstawiamy zmyślonej liczby.

**Serwis nie prowadzi własnych badań opinii.** Publikowane „efekty pracowni" to wynik estymacji
statystycznej, a nie zarzut błędu metodologicznego wobec którejkolwiek pracowni.

---

## Prezentacja procentów

Procenty podajemy jako **odsetek głosów ważnych** (bez niezdecydowanych) — tak jak media, więc
liczby są porównywalne z prasą. Udział niezdecydowanych podajemy osobno, bo dotyczy odsetka
ankietowanych, a nie głosów.

Ma to znaczenie także dla **progu 5%**: ustawowy próg liczy się od głosów ważnych, a osoby
niezdecydowane żadnego głosu nie oddają. Przeliczenie na tę bazę odbywa się **na losowaniach
przed wyznaczeniem kwantyli** — przeskalowanie gotowego kwantyla dałoby zły przedział, bo
dzielnik też jest niepewny.

Podział mandatów (D'Hondt, próg 5%) to **uproszczenie ogólnokrajowe**. Realny podział zależy od
41 okręgów i może się istotnie różnić — liczenie ogólnokrajowe zwykle zawyża największą partię.

---

## Stack

| Warstwa | Technologia |
| :--- | :--- |
| Model | `numpy` + `scipy` — dokładny filtr Kalmana, MLE. Bez GPU, bez wag modeli, poniżej sekundy |
| Dane | `pandas` + `pyarrow` (Parquet), `requests` (MediaWiki API) |
| Frontend | Next.js 16 + React 19, Recharts 3, Tailwind CSS v4 |
| Hosting | Vercel (strona statyczna) |

Cztery zależności runtime. Dashboard lokalny (`streamlit`, `plotly`) to opcjonalne extra —
pipeline produkcyjny wypluwa JSON i nie potrzebuje żadnego z nich.

---

## Uruchomienie

```bash
git clone https://github.com/takzen/puls-wyborczy.git
cd puls-wyborczy

uv venv --python 3.13
.venv\Scripts\activate          # Linux/macOS: source .venv/bin/activate
uv pip install -e .

# Pobierz sondaże, dopasuj model, wyeksportuj payload — jedna komenda
python -m src.ingestion.run_sync

# To samo plus walidacja out-of-sample (wolniejsze)
python -m src.ingestion.run_sync --validate
```

Ingest, dopasowanie i eksport są celowo za **jednym** wejściem. Rozdzielenie ich raz
doprowadziło do tego, że poprawka trafiła do kodu, nikt nie przeliczył pipeline'u, a strona
tygodniami podawała liczby sprzed poprawki.

```bash
# Lokalny inspektor payloadu (wykres, partie, efekty pracowni, sondaże źródłowe)
uv pip install -e ".[dashboard]"
streamlit run src/app.py

# Frontend
cd web && pnpm install && pnpm run dev
```

---

## Testy i walidacja

```bash
pytest -q                                  # testy jednostkowe
python -m src.evaluation.validation        # trafność out-of-sample
```

Testy celują w błędy, które faktycznie wystąpiły, nie w kształty tablic. Najważniejszy —
`test_recovers_known_state_and_house_effects` — generuje dane z modelu o znanych parametrach
i wymaga ich odtworzenia; to on pilnuje poprawności estymatora.

Walidacja jest **krocząca**: przy każdym punkcie model dopasowuje się wyłącznie do wcześniejszych
sondaży, potem przewiduje kolejny, nieznany. Hiperparametry przeliczane są na bieżącym oknie
treningowym, nigdy raz na starcie. Mierzymy dwie rzeczy:

- **Pokrycie** — przedział 80% powinien obejmować rzeczywisty wynik w ~80% przypadków. Zbyt małe
  pokrycie oznacza, że pasma kłamią o pewności; zbyt duże, że są bezużytecznie szerokie.
- **Trafność punktową względem metod naiwnych** — średniej z trzech ostatnich sondaży i ostatniego
  sondażu, z **parowanym bootstrapem po sondażach**. Losowanie po sondażach, nie po obserwacjach,
  bo błędy kategorii w jednym sondażu są skorelowane; traktowanie ich jako niezależnych zawyżałoby
  istotność.

Aktualne wyniki są publikowane w stopce strony i w `dev/walidacja_pelna.json`. **Jeśli przewaga
nad metodą naiwną nie jest istotna statystycznie, strona to wprost pisze** — przewagą modelu jest
wtedy skalibrowana niepewność i korekta efektów pracowni, nie sam punktowy wynik.

---

## Licencje

Kod źródłowy: **MIT**.

Dane sondażowe pochodzą z Wikipedii i objęte są licencją **CC BY-SA 4.0** — atrybucja znajduje się
na stronie głównej, w liście sondaży i w nocie prawnej.

> **Nota historyczna.** Wcześniejsze wersje tego projektu korzystały z wag Google TimesFM 3.0,
> udostępnianych na `timesfm-non-commercial-license-v1.0`, która zabrania użycia zarobkowego
> i produkcyjnego. Publiczna, monetyzowana strona naruszała oba warunki. Model został zastąpiony
> własnym agregatorem — bez zewnętrznych wag i bez ograniczeń licencyjnych. Repozytorium zostało przemianowane
> z `election-pulse-timesfm` na `puls-wyborczy`.

---

## Kontakt

Reklama, sponsoring, konsultacje: **takzen.app@gmail.com** · [takzendev.pl](https://takzendev.pl/)
