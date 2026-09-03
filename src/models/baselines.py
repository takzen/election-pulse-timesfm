"""Classical polling baselines (EWMA, ARIMA, LightGBM)

for comparative benchmarking against TimesFM 3.0.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional

import lightgbm as lgb
import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

logger = logging.getLogger(__name__)


class EWMABaseline:
    """Exponential Weighted Moving Average (classical poll-tracking baseline)."""

    def __init__(self, alpha: float = 0.15):
        self.alpha = alpha

    def forecast(self, history: np.ndarray, horizon: int) -> np.ndarray:
        s = pd.Series(history)
        ewma_val = float(s.ewm(alpha=self.alpha, adjust=False).mean().iloc[-1])
        return np.full(horizon, ewma_val, dtype=np.float32)


class ARIMABaseline:
    """ARIMA(1, 1, 1) baseline for single-series polling persistence."""

    def __init__(self, order=(1, 1, 1)):
        self.order = order

    def forecast(self, history: np.ndarray, horizon: int) -> np.ndarray:
        try:
            model = ARIMA(history, order=self.order)
            res = model.fit()
            pred = res.forecast(steps=horizon)
            return np.clip(np.array(pred, dtype=np.float32), 1.0, 70.0)
        except Exception:
            # Fallback to last value if convergence fails
            return np.full(horizon, float(history[-1]), dtype=np.float32)


class LightGBMBaseline:
    """LightGBM autoregressive forecaster using lags and exogenous covariates."""

    def __init__(self, lags: List[int] = (1, 7, 14)):
        self.lags = list(lags)
        self.model = lgb.LGBMRegressor(
            n_estimators=50,
            learning_rate=0.08,
            max_depth=4,
            num_leaves=15,
            verbose=-1,
            random_state=42,
        )

    def forecast(
        self,
        history: np.ndarray,
        horizon: int,
        exog_past: Optional[np.ndarray] = None,
    ) -> np.ndarray:
        """Trains on rolling historical windows and recursively rolls forward."""
        n = len(history)
        max_lag = max(self.lags)
        if n <= max_lag + 10:
            return np.full(horizon, float(history[-1]), dtype=np.float32)

        # Build feature matrix
        X_rows, y_rows = [], []
        for t in range(max_lag, n):
            feat = [history[t - lag] for lag in self.lags]
            if exog_past is not None and exog_past.shape[1] == n:
                feat.extend(exog_past[:, t].tolist())
            X_rows.append(feat)
            y_rows.append(history[t])

        X = np.array(X_rows)
        y = np.array(y_rows)
        self.model.fit(X, y)

        # Recursive multi-step rollout
        curr_hist = list(history)
        preds = []
        for step in range(horizon):
            feat = [curr_hist[-lag] for lag in self.lags]
            if exog_past is not None:
                # Use last known exog values
                feat.extend(exog_past[:, -1].tolist())
            next_val = float(self.model.predict(np.array([feat]))[0])
            preds.append(next_val)
            curr_hist.append(next_val)

        return np.clip(np.array(preds, dtype=np.float32), 1.0, 70.0)


def run_all_baselines(
    history: np.ndarray,
    horizon: int,
    exog_past: Optional[np.ndarray] = None,
) -> Dict[str, np.ndarray]:
    """Generates comparative forecasts from EWMA, ARIMA, and LightGBM."""
    ewma = EWMABaseline()
    arima = ARIMABaseline()
    lgbm = LightGBMBaseline()

    return {
        "EWMA": ewma.forecast(history, horizon),
        "ARIMA": arima.forecast(history, horizon),
        "LightGBM": lgbm.forecast(history, horizon, exog_past=exog_past),
    }


if __name__ == "__main__":
    synthetic_series = np.array([30.0 + 0.1 * i + np.random.normal(0, 0.5) for i in range(90)])
    preds = run_all_baselines(synthetic_series, horizon=14)
    print("Baseline Forecasts (14 days ahead):")
    for name, arr in preds.items():
        print(f" - {name:10}: start {arr[0]:.2f}% -> end {arr[-1]:.2f}%")
