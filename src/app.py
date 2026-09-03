"""Streamlit Local Analytics Dashboard for ElectionPulse-TimesFM.
Provides local research tools, GPU-accelerated interactive fan charts,
and counterfactual scenario exploration powered by Google TimesFM 3.0.
"""

import json
from pathlib import Path
import plotly.graph_objects as go
import streamlit as st
import torch

from src.pipeline.export_web_data import export_complete_web_payload

st.set_page_config(
    page_title="ElectionPulse-TimesFM | AI Election Forecasts",
    page_icon="🗳️",
    layout="wide",
    initial_sidebar_state="expanded",
)

DATA_PATH = Path("web/public/data/forecasts.json")

# Ensure dataset exists
if not DATA_PATH.exists():
    export_complete_web_payload()

with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

meta = data["metadata"]
parties_meta = data["parties_meta"]

# Header
st.title("🗳️ ElectionPulse-TimesFM")
st.caption(f"Zero-Shot Native Multivariate Election Forecasting | Powered by **{meta['model_name']}**")

# Top Metrics Row
gpu_label = "✅ NVIDIA RTX 4060 (CUDA)" if torch.cuda.is_available() else "⚠️ CPU Fallback"
st.sidebar.markdown(f"**Hardware:** {gpu_label}")
st.sidebar.markdown(f"**Architecture:** {meta['architecture']}")
st.sidebar.markdown(f"**Cutoff Date:** `{meta['cutoff_date']}`")
st.sidebar.markdown(f"**Forecast Horizon:** `{meta['target_date']}` ({meta['horizon_days']} dni)")

cols = st.columns(5)
for idx, (p_code, p_info) in enumerate(parties_meta.items()):
    with cols[idx]:
        diff = round(p_info["forecast"] - p_info["current"], 1)
        st.metric(
            label=p_info["name"].split()[0],
            value=f"{p_info['forecast']:.1f}%",
            delta=f"{diff:+.1f} pp",
        )
        st.caption(f"Przedział p10–p90: {p_info['p10']:.1f}% – {p_info['p90']:.1f}%")

st.markdown("---")

tab1, tab2, tab3, tab4 = st.tabs([
    "📈 Wykresy Wachlarzowe (Fan Charts)",
    "🍞 Symulator Portfela Wyborcy",
    "⚖️ Arena Modeli (TimesFM vs Tradycja)",
    "⚡ Punkty Przegięcia (Szoki Polityczne)",
])

# Tab 1: Fan Charts
with tab1:
    st.subheader("Probabilistyczna Ścieżka Poparcia (Wachlarz Niepewności 10% - 90%)")
    fig = go.Figure()

    # Historical section (last 60 days)
    hist_tail = data["history"][-60:]
    hist_dates = [h["date"] for h in hist_tail]

    for p_code, p_info in parties_meta.items():
        color = p_info["color"]
        hist_vals = [h[p_code] for h in hist_tail]
        fig.add_trace(go.Scatter(
            x=hist_dates,
            y=hist_vals,
            mode="lines",
            name=f"{p_code} (Historia)",
            line=dict(color=color, width=2),
        ))

        # Forecast median and quantile bands
        f_dates = [fc["date"] for fc in data["forecast_chart"]]
        p50 = [fc[f"{p_code}_p50"] for fc in data["forecast_chart"]]
        p10 = [fc[f"{p_code}_p10"] for fc in data["forecast_chart"]]
        p90 = [fc[f"{p_code}_p90"] for fc in data["forecast_chart"]]

        # Shaded quantile band
        fig.add_trace(go.Scatter(
            x=f_dates + f_dates[::-1],
            y=p90 + p10[::-1],
            fill="toself",
            fillcolor=color,
            opacity=0.15,
            line=dict(color="rgba(255,255,255,0)"),
            hoverinfo="skip",
            showlegend=False,
        ))

        # Median forecast line
        fig.add_trace(go.Scatter(
            x=f_dates,
            y=p50,
            mode="lines+markers",
            name=f"{p_code} (TimesFM 3.0)",
            line=dict(color=color, width=3, dash="dash"),
        ))

    fig.update_layout(
        template="plotly_dark",
        height=550,
        hovermode="x unified",
        margin=dict(l=20, r=20, t=30, b=20),
        yaxis=dict(title="Poparcie (%)", range=[0, 45]),
        xaxis=dict(title="Data"),
    )
    st.plotly_chart(fig, use_container_width=True)

# Tab 2: Pocketbook Simulator
with tab2:
    st.subheader("🍞 Symulator Portfela Wyborcy (Pocketbook Voting)")
    st.markdown("Zbadaj, jak zmiany stóp procentowych RPP oraz spadek/wzrost inflacji wpływają na układ sił na polskiej scenie.")

    c1, c2 = st.columns(2)
    with c1:
        cpi_slider = st.select_slider(
            "Zmiana inflacji CPI r/r (punkty procentowe):",
            options=[-1.5, -0.75, 0.0, 0.75, 1.5],
            value=0.0,
            format_func=lambda x: f"{x:+.2f} pp",
        )
    with c2:
        rate_slider = st.select_slider(
            "Zmiana stóp procentowych NBP (punkty procentowe):",
            options=[-1.0, -0.5, 0.0, 0.5, 1.0],
            value=0.0,
            format_func=lambda x: f"{x:+.2f} pp",
        )

    # Find matching scenario in precomputed grid
    matched = None
    for sc in data["scenarios_grid"]:
        if abs(sc["cpi_delta"] - cpi_slider) < 0.01 and abs(sc["rate_delta"] - rate_slider) < 0.01:
            matched = sc
            break

    if matched:
        sc_cols = st.columns(2)
        with sc_cols[0]:
            st.metric(
                label="Koalicja Rządowa (KO + TD + Lewica)",
                value=f"{matched['coalition_total']:.1f}%",
                delta=f"{matched['coalition_total'] - 49.3:+.1f} pp",
            )
        with sc_cols[1]:
            st.metric(
                label="Opozycja (PiS + Konfederacja)",
                value=f"{matched['opposition_total']:.1f}%",
                delta=f"{matched['opposition_total'] - 50.7:+.1f} pp",
            )

        st.markdown("#### Wyniki poszczególnych partii w tym scenariuszu:")
        for p, val in matched["final_support"].items():
            delta_val = matched["delta_from_baseline"].get(p, 0.0)
            st.write(f"- **{p}:** `{val:.1f}%` ({delta_val:+.2f} pp względem bazowego)")

# Tab 3: Model Arena
with tab3:
    st.subheader("⚖️ Arena Modeli: Google TimesFM 3.0 vs Klasyczne Baselines")
    comp = data["baselines_comparison"]
    df_comp = []
    for p, vals in comp.items():
        row = {"Partia": p}
        row.update(vals)
        df_comp.append(row)
    st.dataframe(df_comp, use_container_width=True)

# Tab 4: Inflections
with tab4:
    st.subheader("⚡ Wykryte Punkty Przegięcia (Szoki Poparcia)")
    st.table(data["inflections"][:10])

# Sidebar actions
st.sidebar.markdown("---")
if st.sidebar.button("🔄 Przelicz i zsynchronizuj dane dla Vercel"):
    with st.spinner("Przeliczanie modelu TimesFM 3.0 na GPU..."):
        p_out = export_complete_web_payload()
        st.sidebar.success(f"Zaktualizowano {p_out}!")
