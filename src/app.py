"""Local Streamlit inspector for the exported payload.

A review tool, not the product: it shows what the site will publish, plus the two things
a reader of the site never sees - the fitted house effects and the out-of-sample scores.
Use it before shipping a refresh to check the numbers look sane.

    streamlit run src/app.py
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

DATA_PATH = Path("web/public/data/forecasts.json")

st.set_page_config(
    page_title="Puls Wyborczy - inspektor",
    page_icon="chart_with_upwards_trend",
    layout="wide",
)

if not DATA_PATH.exists():
    st.error(
        f"Brak pliku {DATA_PATH}. Uruchom najpierw:\n\n"
        "`python -m src.ingestion.run_sync`"
    )
    st.stop()

data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
meta = data["metadata"]
parties = data["parties_meta"]

st.title("Puls Wyborczy - inspektor payloadu")
st.caption(
    f"{meta['model_name']} | podstawa: {meta['basis_label']} | "
    f"wygenerowano {meta['generated_at'][:19]}"
)

with st.sidebar:
    st.markdown("### Dane")
    st.markdown(f"**Sondaży:** {meta['n_polls']}")
    st.markdown(f"**Pracowni:** {meta['n_pollsters']}")
    st.markdown(f"**Zakres:** {meta['first_poll_date']} → {meta['cutoff_date']}")
    st.markdown(f"**Ostatni:** {meta['cutoff_pollster']}")
    st.markdown(f"**Horyzont:** {meta['target_date']} ({meta['horizon_days']} dni)")
    st.markdown("### Model")
    st.markdown(f"**Design effect:** {meta['design_effect']}")
    st.caption(meta["architecture"])
    for note in meta.get("notes", []):
        st.warning(note)
    st.markdown("---")
    st.caption(meta["attribution"])

# --- Sanity checks a reviewer should see before anything else -------------------
total = round(sum(p["forecast"] for p in parties.values()), 2)
checks = [
    ("Suma prognoz = 100%", abs(total - 100.0) < 0.15, f"{total}%"),
    (
        "Kwantyle uporządkowane",
        all(p["p10"] <= p["forecast"] <= p["p90"] for p in parties.values()),
        "p10 ≤ prognoza ≤ p90",
    ),
    (
        "Wyniki walidacji obecne",
        bool(data.get("validation")),
        "tak" if data.get("validation") else "BRAK",
    ),
]
columns = st.columns(len(checks))
for column, (label, ok, detail) in zip(columns, checks):
    column.metric(label, "OK" if ok else "BŁĄD", detail)

validation = data.get("validation") or {}
if validation:
    st.markdown("### Walidacja out-of-sample")
    cols = st.columns(4)
    cols[0].metric("Pokrycie 80%", f"{validation['coverage_80'] * 100:.1f}%", "cel 80%")
    cols[1].metric("MAE modelu", f"{validation['mae_model']:.3f} pp")
    cols[2].metric("MAE random walk", f"{validation['mae_random_walk']:.3f} pp")
    low, high = validation.get("advantage_ci") or (None, None)
    significant = validation.get("advantage_is_significant")
    cols[3].metric(
        "Przewaga",
        f"{validation['advantage_vs_random_walk']:+.3f} pp",
        "istotna" if significant else "nieistotna",
    )
    if not significant:
        st.warning(
            f"Przewaga nad random walkiem nieistotna (95% CI [{low:+.3f}, {high:+.3f}]). "
            "Nie wolno jej podawać na stronie jako przewagi modelu w trafności punktowej. "
            "Ogłaszać wolno skalibrowaną niepewność i efekty pracowni."
        )
else:
    st.warning("Brak wyników walidacji — uruchom `run_sync.py --validate`.")

tab_chart, tab_parties, tab_house, tab_polls = st.tabs(
    ["Wykres", "Partie", "Efekty pracowni", "Sondaże źródłowe"]
)

with tab_chart:
    st.subheader("Ścieżka poparcia i prognoza (pasmo p10–p90)")
    selected = st.multiselect(
        "Partie",
        list(parties),
        default=[k for k in ("KO", "PiS", "Konfederacja", "KKP") if k in parties],
    )
    figure = go.Figure()
    history = data["history"][-120:]
    for key in selected:
        info = parties[key]
        figure.add_trace(
            go.Scatter(
                x=[h["date"] for h in history],
                y=[h[key] for h in history],
                mode="lines",
                name=f"{key} (historia)",
                line=dict(color=info["color"], width=2),
            )
        )
        forecast = data["forecast_chart"]
        dates = [f["date"] for f in forecast]
        figure.add_trace(
            go.Scatter(
                x=dates + dates[::-1],
                y=[f[f"{key}_p90"] for f in forecast]
                + [f[f"{key}_p10"] for f in forecast][::-1],
                fill="toself",
                fillcolor=info["color"],
                opacity=0.15,
                line=dict(color="rgba(0,0,0,0)"),
                hoverinfo="skip",
                showlegend=False,
            )
        )
        figure.add_trace(
            go.Scatter(
                x=dates,
                y=[f[f"{key}_p50"] for f in forecast],
                mode="lines",
                name=f"{key} (prognoza)",
                line=dict(color=info["color"], width=3, dash="dash"),
            )
        )
    figure.update_layout(
        template="plotly_dark",
        height=560,
        hovermode="x unified",
        yaxis=dict(title="% głosów ważnych"),
        xaxis=dict(title="Data"),
    )
    st.plotly_chart(figure, use_container_width=True)
    st.caption(
        "Prognoza jest niemal płaska z rosnącym pasmem. To poprawna odpowiedź modelu "
        "random walk na pytanie o 30 dni bez nowych sondaży, nie błąd."
    )

with tab_parties:
    undecided = data["undecided"]
    st.info(
        f"Niezdecydowani: **{undecided['mean']}%** "
        f"({undecided['p10']}–{undecided['p90']}) — {undecided['label']}. "
        "Nie są partią i nie wchodzą do podstawy procentowej."
    )
    st.dataframe(
        pd.DataFrame(
            [
                {
                    "partia": info["name"],
                    "lider": info["leader"],
                    "teraz": info["current"],
                    "teraz p10": info.get("current_p10"),
                    "teraz p90": info.get("current_p90"),
                    "prognoza": info["forecast"],
                    "p10": info["p10"],
                    "p90": info["p90"],
                }
                for info in parties.values()
            ]
        ),
        use_container_width=True,
        hide_index=True,
    )

with tab_house:
    st.subheader("Efekty pracowni (pp głosów ważnych, względem średniej)")
    st.caption(
        "Ile dana pracownia systematycznie zawyża lub zaniża poparcie względem "
        "pozostałych. Estymowane z danych, z więzem sumy zero. Pracownie z mniej niż "
        "5 sondażami są pomijane, bo estymata byłaby szumem."
    )
    house = data.get("house_effects", [])
    if house:
        st.dataframe(
            pd.DataFrame(
                [{"pracownia": h["pollster"], "sondaży": h["n_polls"], **h["effects"]} for h in house]
            ),
            use_container_width=True,
            hide_index=True,
        )
    else:
        st.write("Brak danych o efektach pracowni.")

with tab_polls:
    st.subheader("Ostatnie sondaże ze źródłami")
    st.caption("Każda liczba na stronie musi być prześledzalna do publikacji.")
    st.dataframe(
        pd.DataFrame(data.get("recent_polls", [])),
        use_container_width=True,
        hide_index=True,
        column_config={"source_url": st.column_config.LinkColumn("źródło")},
    )
