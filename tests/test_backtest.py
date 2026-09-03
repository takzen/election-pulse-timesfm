"""Unit tests for Phase 7: Evaluation and backtesting metrics.
"""

import numpy as np
import pytest

from src.evaluation.backtest import compute_metrics


def test_compute_metrics_accuracy():
    y_true = np.array([30.0, 31.0, 32.0])
    y_pred = np.array([31.0, 31.0, 33.0])

    mae, rmse, bias = compute_metrics(y_true, y_pred)

    # err = [+1.0, 0.0, +1.0]
    # mae = 2/3 = 0.67
    # rmse = sqrt(2/3) = 0.82
    # bias = 2/3 = +0.67
    assert abs(mae - 0.67) < 0.05
    assert abs(rmse - 0.82) < 0.05
    assert abs(bias - 0.67) < 0.05
