from __future__ import annotations
from typing import Sequence, Tuple
import math

def mape(y_true: Sequence[float], y_pred: Sequence[float]) -> float:
    """
    MAPE = mean(|y - yhat| / max(eps, |y|))
    0の除算を避けるため eps を使用。
    """
    eps = 1e-8
    errs = [abs(a - b) / max(eps, abs(a)) for a, b in zip(y_true, y_pred)]
    return sum(errs) / len(errs) if errs else float("nan")

def smape(y_true: Sequence[float], y_pred: Sequence[float]) -> float:
    """
    sMAPE = mean( |y - yhat| / ((|y| + |yhat|)/2) )
    両者が0に近い場合を考慮して eps を入れる。
    """
    eps = 1e-8
    vals: list[float] = []
    for a, b in zip(y_true, y_pred):
        denom = (abs(a) + abs(b)) / 2.0
        vals.append(abs(a - b) / max(eps, denom))
    return sum(vals) / len(vals) if vals else float("nan")

def aggregate(y_true_pred: Sequence[Tuple[float, float]]) -> Tuple[float, float]:
    y_true = [t for t, _ in y_true_pred]
    y_pred = [p for _, p in y_true_pred]
    return mape(y_true, y_pred), smape(y_true, y_pred)