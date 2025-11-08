from __future__ import annotations
import argparse
import csv
import datetime as dt
from collections import defaultdict, deque
from pathlib import Path
from typing import Dict, List, Tuple

from .db_io import ensure_forecast_table, fetch_menu_daily_qty, upsert_forecasts
from .metrics import aggregate, mape, smape

# ========== ユーティリティ ==========

def parse_date(s: str) -> dt.date:
    return dt.date.fromisoformat(s)

def format_date(d: dt.date) -> str:
    return d.isoformat()

def daterange(start: dt.date, end: dt.date) -> List[dt.date]:
    # [start, end) 半開区間
    days: List[dt.date] = []
    cur = start
    while cur < end:
        days.append(cur)
        cur += dt.timedelta(days=1)
    return days

# ========== ベースライン ==========

def baseline_naive_last_week(history: Dict[str, int], horizon_dates: List[dt.date]) -> Dict[str, float]:
    """
    直近同曜日（t-7）をそのまま予測。
    history: { 'YYYY-MM-DD': y }
    """
    yhat: Dict[str, float] = {}
    for d in horizon_dates:
        prev = d - dt.timedelta(days=7)
        yhat[format_date(d)] = float(history.get(format_date(prev), 0.0))
    return yhat

def baseline_seasonal_moving_average(history: Dict[str, int], horizon_dates: List[dt.date], k_weeks: int = 4) -> Dict[str, float]:
    """
    同曜日の過去 k 週平均。データが足りない場合は、利用可能な分で平均。
    なければ 0.
    """
    yhat: Dict[str, float] = {}
    for d in horizon_dates:
        vals: List[float] = []
        for w in range(1, k_weeks + 1):
            prev = d - dt.timedelta(days=7 * w)
            v = history.get(format_date(prev))
            if v is not None:
                vals.append(float(v))
        yhat[format_date(d)] = sum(vals) / len(vals) if vals else 0.0
    return yhat

# ========== バックテスト ==========

def backtest_single_menu(
    series: List[Tuple[str, int]],
    eval_weeks: int,
    k_weeks: int,
) -> Dict[str, float]:
    """
    直近 eval_weeks * 7 日を検証区間として、ローリング1週先予測の誤差を測定。
    """
    if not series:
        return {"mape_naive": float("nan"), "smape_naive": float("nan"),
                "mape_seasonal": float("nan"), "smape_seasonal": float("nan")}

    # 系列を dict + ソート済みに
    series_sorted = sorted(series, key=lambda x: x[0])
    history = {ds: y for ds, y in series_sorted}

    # 検証終了日はデータの最終日
    last_ds = parse_date(series_sorted[-1][0])
    eval_days = eval_weeks * 7
    eval_start = last_ds - dt.timedelta(days=eval_days) + dt.timedelta(days=1)  # 含む
    eval_end = last_ds + dt.timedelta(days=1)  # 半開区間

    # 1日ごとに「翌週同曜日」を予測したと仮定して評価
    naive_pairs: List[Tuple[float, float]] = []
    seasonal_pairs: List[Tuple[float, float]] = []

    for cur in daterange(eval_start, eval_end):
        # 翌週同曜日
        target = cur + dt.timedelta(days=7)
        target_str = format_date(target)
        if target_str not in history:
            # 未来データ未収集なら評価スキップ
            continue

        # 現時点で使える履歴
        hist_until_cur = {k: v for k, v in history.items() if parse_date(k) <= cur}

        # 予測
        naive_hat = baseline_naive_last_week(hist_until_cur, [target])[target_str]
        seasonal_hat = baseline_seasonal_moving_average(hist_until_cur, [target], k_weeks=k_weeks)[target_str]

        # 実績
        y_true = float(history[target_str])
        naive_pairs.append((y_true, naive_hat))
        seasonal_pairs.append((y_true, seasonal_hat))

    m_naive, s_naive = aggregate(naive_pairs) if naive_pairs else (float("nan"), float("nan"))
    m_seasonal, s_seasonal = aggregate(seasonal_pairs) if seasonal_pairs else (float("nan"), float("nan"))

    return {
        "mape_naive": m_naive,
        "smape_naive": s_naive,
        "mape_seasonal": m_seasonal,
        "smape_seasonal": s_seasonal,
    }

# ========== 予測実行（7日先を保存） ==========

def forecast_and_save(
    database_url: str,
    horizon_days: int,
    k_weeks: int,
    trained_at: str,
    csv_out: Path | None = None,
):
    ensure_forecast_table(database_url)
    rows = fetch_menu_daily_qty(database_url)  # (menu_id, ds, y)

    # menu_id ごとに系列を分割
    by_menu: Dict[int, List[Tuple[str, int]]] = defaultdict(list)
    for mid, ds, y in rows:
        by_menu[mid].append((ds, y))

    today = max(parse_date(ds) for _, ds, _ in rows)  # 最新日を「基準日」とする
    horizon = [today + dt.timedelta(days=i) for i in range(1, horizon_days + 1)]

    all_out_rows = []  # CSV用

    for mid, series in by_menu.items():
        series_sorted = sorted(series, key=lambda x: x[0])
        history = {ds: y for ds, y in series_sorted}

        # ① Naive（t-7）
        yhat_naive = baseline_naive_last_week(history, horizon)
        # ② Seasonal MA（同曜日の過去k週平均）
        yhat_seasonal = baseline_seasonal_moving_average(history, horizon, k_weeks=k_weeks)

        # 保存（区間はダミー的に yhat±0、必要なら将来分散推定に差し替え）
        upsert_rows_naive = [
            (mid, ds, float(v), float(v), float(v), f"naive_tminus7", trained_at)
            for ds, v in yhat_naive.items()
        ]
        upsert_rows_seasonal = [
            (mid, ds, float(v), float(v), float(v), f"seasonal_ma_k{k_weeks}", trained_at)
            for ds, v in yhat_seasonal.items()
        ]
        upsert_forecasts(database_url, upsert_rows_naive + upsert_rows_seasonal)

        # CSV出力用にまとめる
        for ds, v in yhat_naive.items():
            all_out_rows.append([mid, ds, v, v, v, "naive_tminus7", trained_at])
        for ds, v in yhat_seasonal.items():
            all_out_rows.append([mid, ds, v, v, v, f"seasonal_ma_k{k_weeks}", trained_at])

    if csv_out:
        csv_out.parent.mkdir(parents=True, exist_ok=True)
        with csv_out.open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["menu_id", "ds", "yhat", "yhat_lo", "yhat_hi", "model", "trained_at"])
            w.writerows(all_out_rows)

# ========== CLI ==========

def main():
    parser = argparse.ArgumentParser(description="Day3 Baseline Forecast + Backtest")
    parser.add_argument("--database-url", type=str, default="sqlite:///backend/udon.db")
    parser.add_argument("--horizon", type=int, default=7, help="予測ホライズン（日）")
    parser.add_argument("--k-weeks", type=int, default=4, help="季節性移動平均の過去週数")
    parser.add_argument("--eval-weeks", type=int, default=2, help="バックテスト対象の直近週数")
    parser.add_argument("--save-csv", type=str, default="backend/data/processed/menu_daily_forecast.csv")
    parser.add_argument("--metrics-csv", type=str, default="backend/data/metrics/day3_eval.csv")
    parser.add_argument("--metrics-md", type=str, default="backend/data/metrics/README_day3.md")
    args = parser.parse_args()

    trained_at = dt.datetime.now().isoformat(timespec="seconds")

    # 予測生成 & 保存（DB/CSV）
    forecast_and_save(
        database_url=args.database_url,
        horizon_days=args.horizon,
        k_weeks=args.k_weeks,
        trained_at=trained_at,
        csv_out=Path(args.save_csv),
    )

    # バックテスト
    rows = fetch_menu_daily_qty(args.database_url)
    by_menu: Dict[int, List[Tuple[str, int]]] = defaultdict(list)
    for mid, ds, y in rows:
        by_menu[mid].append((ds, y))

    metrics_out = Path(args.metrics_csv)
    metrics_out.parent.mkdir(parents=True, exist_ok=True)

    agg_pairs = {
        "naive": [],
        "seasonal": [],
    }

    with metrics_out.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["menu_id", "mape_naive", "smape_naive", "mape_seasonal", "smape_seasonal"])
        for mid, series in by_menu.items():
            res = backtest_single_menu(series, eval_weeks=args.eval_weeks, k_weeks=args.k_weeks)
            w.writerow([mid, res["mape_naive"], res["smape_naive"], res["mape_seasonal"], res["smape_seasonal"]])

    # 集計 & 受け入れ基準チェック用のMD
    # 集計は metrics CSV 再読込でもよいが、簡便にもう一度計測
    # -> 単純平均（menu_id同ウェイト）
    import math
    import statistics as stats

    per_menu_scores = []
    for mid, series in by_menu.items():
        res = backtest_single_menu(series, eval_weeks=args.eval_weeks, k_weeks=args.k_weeks)
        per_menu_scores.append(res)

    def _mean(key: str) -> float:
        vals = [r[key] for r in per_menu_scores if not (r[key] is None or math.isnan(r[key]))]
        return sum(vals) / len(vals) if vals else float("nan")

    m_naive = _mean("smape_naive")
    m_seasonal = _mean("smape_seasonal")

    md = Path(args.metrics_md)
    md.parent.mkdir(parents=True, exist_ok=True)
    with md.open("w", encoding="utf-8") as f:
        f.write("# Day 3 評価レポート\n\n")
        f.write(f"- 訓練タイムスタンプ: `{trained_at}`\n")
        f.write(f"- 直近バックテスト週数: **{args.eval_weeks}週**\n")
        f.write(f"- 季節性移動平均のk: **{args.k_weeks}**\n")
        f.write("\n## 指標（平均：menu_id同ウェイト）\n\n")
        f.write(f"- sMAPE（Naive）: **{m_naive:.4f}**\n")
        f.write(f"- sMAPE（季節性MA）: **{m_seasonal:.4f}**\n")
        f.write("\n## 受け入れ基準チェック\n\n")
        if (not math.isnan(m_seasonal)) and (not math.isnan(m_naive)) and (m_seasonal <= m_naive + 1e-12):
            f.write("- ✅ **合格**: sMAPE が Naive より悪化していません。\n")
        else:
            f.write("- ❌ **不合格**: sMAPE が Naive より悪化しています。（要調整）\n")

    # 終了コードは落とさず、レポートで判定を明示（CIに載せる場合は exit code でもOK）
    print("Done. Forecast saved to DB and CSV. Metrics written to CSV/MD.")
    print(f"- Forecast CSV: {args.save_csv}")
    print(f"- Metrics CSV : {args.metrics_csv}")
    print(f"- Report MD   : {args.metrics_md}")


if __name__ == "__main__":
    main()