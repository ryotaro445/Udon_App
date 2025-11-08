# backend/app/ml/train_forecast.py
import argparse
import sys
import warnings
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sklearn.linear_model import Ridge, Lasso
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error

warnings.filterwarnings("ignore", category=FutureWarning)

_HAS_PROPHET = False
try:
    from prophet import Prophet
    _HAS_PROPHET = True
except Exception:
    pass


def _make_holiday_flag(dates: pd.Series) -> pd.Series:
    try:
        import holidays  # type: ignore
        jp_holidays = holidays.country_holidays("JP")
        return dates.apply(lambda d: 1 if pd.Timestamp(d).date() in jp_holidays else 0)
    except Exception:
        return pd.Series([0] * len(dates), index=dates.index)


# -------- Baselines --------
def baseline_naive_tminus7(train_df: pd.DataFrame, test_dates: pd.DatetimeIndex) -> pd.Series:
    hist = train_df.set_index("ds")["y"]
    return pd.Series([hist.get(d - pd.Timedelta(days=7), np.nan) for d in test_dates], index=test_dates)


def baseline_seasonal_ma(train_df: pd.DataFrame, test_dates: pd.DatetimeIndex, k: int = 2) -> pd.Series:
    hist = train_df.set_index("ds")["y"]
    out = []
    for d in test_dates:
        vals = []
        for i in range(1, k + 1):
            v = hist.get(d - pd.Timedelta(days=7 * i), np.nan)
            if pd.notna(v): vals.append(v)
        out.append(np.mean(vals) if vals else np.nan)
    return pd.Series(out, index=test_dates)


def compute_baseline(name: str, train_df: pd.DataFrame, test_dates: pd.DatetimeIndex) -> pd.Series:
    if name == "naive_tminus7":
        return baseline_naive_tminus7(train_df, test_dates)
    if name == "seasonal_ma_k2":
        return baseline_seasonal_ma(train_df, test_dates, k=2)
    if name == "seasonal_ma_k4":
        return baseline_seasonal_ma(train_df, test_dates, k=4)
    raise ValueError(name)


# -------- ML (Prophet / sklearn) --------
def fit_predict_prophet(train_df: pd.DataFrame, predict_dates: pd.DatetimeIndex) -> pd.DataFrame:
    if not _HAS_PROPHET:
        raise RuntimeError("Prophet が未インストールです。pip install prophet")

    df = train_df[["ds", "y"]].rename(columns={"ds": "ds", "y": "y"}).copy()
    m = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False, seasonality_mode="additive")
    try:
        m.add_country_holidays(country_name="JP")
    except Exception:
        pass

    m.fit(df)
    future = pd.DataFrame({"ds": predict_dates})
    fc = m.predict(future)
    # → PIを含めて返却
    out = pd.DataFrame({
        "ds": pd.to_datetime(fc["ds"].values),
        "yhat": fc["yhat"].values,
        "yhat_lo": fc.get("yhat_lower", fc["yhat"]).values,
        "yhat_hi": fc.get("yhat_upper", fc["yhat"]).values,
    })
    return out.set_index("ds").reindex(predict_dates).reset_index().rename(columns={"index": "ds"})


def _build_sklearn_pipeline(model_name: str) -> Pipeline:
    num_feats = [f"lag{i}" for i in range(1, 8)] + ["is_month_end", "holiday"]
    cat_feats = ["dow"]
    if model_name == "ridge":
        base = Ridge(alpha=1.0, random_state=0)
    elif model_name == "lasso":
        base = Lasso(alpha=0.0005, random_state=0, max_iter=10000)
    else:
        raise ValueError(model_name)
    pre = ColumnTransformer([("num", "passthrough", num_feats), ("cat", OneHotEncoder(handle_unknown="ignore"), cat_feats)])
    return Pipeline([("pre", pre), ("model", base)])


def make_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.sort_values("ds").copy()
    for i in range(1, 8):
        out[f"lag{i}"] = out["y"].shift(i)
    out["holiday"] = _make_holiday_flag(out["ds"])
    if "is_month_end" not in out.columns:
        out["is_month_end"] = out["ds"].dt.is_month_end.astype(int)
    if "dow" not in out.columns:
        out["dow"] = out["ds"].dt.dayofweek.astype(int)
    return out


def fit_predict_sklearn(train_df: pd.DataFrame, predict_dates: pd.DatetimeIndex, model_name: str) -> pd.DataFrame:
    pipe = _build_sklearn_pipeline(model_name)
    feat = make_lag_features(train_df).dropna().copy()
    if len(feat) < 14:
        yhat = pd.Series([np.nan] * len(predict_dates), index=predict_dates)
        return pd.DataFrame({"ds": predict_dates, "yhat": yhat.values, "yhat_lo": yhat.values, "yhat_hi": yhat.values})

    X = feat[[f"lag{i}" for i in range(1, 8)] + ["is_month_end", "holiday", "dow"]]
    y = feat["y"].values
    pipe.fit(X, y)

    hist = train_df.set_index("ds")[["y"]].copy()
    hist["is_month_end"] = hist.index.is_month_end.astype(int)
    hist["dow"] = hist.index.dayofweek.astype(int)
    hist["holiday"] = _make_holiday_flag(pd.Series(hist.index))

    preds = []
    rolling = hist.copy()
    for d in predict_dates:
        last7 = [rolling.iloc[-i]["y"] if len(rolling) >= i else np.nan for i in range(1, 8)]
        row = {**{f"lag{i}": last7[i - 1] for i in range(1, 8)},
               "is_month_end": int(pd.Timestamp(d).is_month_end),
               "holiday": int(_make_holiday_flag(pd.Series([d])).iloc[0]),
               "dow": int(pd.Timestamp(d).dayofweek)}
        yhat = float(pipe.predict(pd.DataFrame([row]))[0])
        preds.append(yhat)
        rolling.loc[pd.Timestamp(d), ["y", "is_month_end", "dow", "holiday"]] = [yhat, row["is_month_end"], row["dow"], row["holiday"]]

    yhat = pd.Series(preds, index=predict_dates)
    return pd.DataFrame({"ds": predict_dates, "yhat": yhat.values, "yhat_lo": yhat.values, "yhat_hi": yhat.values})


# -------- Backtest --------
def single_split_backtest(model_kind: str, baseline_name: str, df_one: pd.DataFrame, horizon: int) -> dict:
    if len(df_one) < horizon + 14:
        return {"mae_ml": np.inf, "mae_base": np.inf, "win": False}
    df_one = df_one.sort_values("ds")
    cutoff = df_one["ds"].max() - pd.Timedelta(days=horizon)
    train = df_one[df_one["ds"] <= cutoff].copy()
    test = df_one[(df_one["ds"] > cutoff) & (df_one["ds"] <= cutoff + pd.Timedelta(days=horizon))].copy()
    test_dates = pd.DatetimeIndex(test["ds"])

    yhat_base = compute_baseline(baseline_name, train, test_dates)
    mae_base = mean_absolute_error(test["y"].values, yhat_base.values)

    if model_kind == "prophet":
        yhat_ml_df = fit_predict_prophet(train, test_dates)
        yhat_ml = yhat_ml_df["yhat"]
    else:
        yhat_ml_df = fit_predict_sklearn(train, test_dates, model_kind)
        yhat_ml = yhat_ml_df["yhat"]

    mae_ml = mean_absolute_error(test["y"].values, yhat_ml.values)
    return {"mae_ml": mae_ml, "mae_base": mae_base, "win": bool(mae_ml <= mae_base)}


# -------- Save (schema-aware) --------
def _table_columns(conn, table: str) -> list[str]:
    rows = conn.execute(text(f"PRAGMA table_info({table})")).mappings().all()
    return [r["name"] for r in rows]


def save_forecast(engine, table_forecast: str, menu_id: int, df_fcst: pd.DataFrame, model_name: str):
    """df_fcst columns: ds, yhat, yhat_lo, yhat_hi（lo/hiは存在しない場合もあり得るが、この関数で吸収）"""
    if df_fcst.empty:
        return
    # 万一 lo/hi が無い場合は yhat で埋める
    for c in ("yhat_lo", "yhat_hi"):
        if c not in df_fcst.columns:
            df_fcst[c] = df_fcst["yhat"]

    with engine.begin() as conn:
        cols = _table_columns(conn, table_forecast)
        has_lo = "yhat_lo" in cols
        has_hi = "yhat_hi" in cols

        # 既存削除（同 menu_id × ds × model）
        placeholders = ",".join([f":ds{i}" for i in range(len(df_fcst))])
        del_params = {"menu_id": menu_id, "model": model_name}
        del_params.update({f"ds{i}": pd.Timestamp(d).date() for i, d in enumerate(df_fcst["ds"])})
        conn.execute(text(f"""
            DELETE FROM {table_forecast}
             WHERE menu_id = :menu_id
               AND model   = :model
               AND ds IN ({placeholders})
        """), del_params)

        # 挿入カラムをスキーマに合わせて構築
        base_cols = ["menu_id", "ds", "yhat", "model"]
        insert_cols = base_cols + (["yhat_lo"] if has_lo else []) + (["yhat_hi"] if has_hi else [])
        values_clause = "(" + ", ".join([f":{c}" for c in insert_cols]) + ")"

        rows = []
        for r in df_fcst.itertuples(index=False):
            row = {
                "menu_id": menu_id,
                "ds": pd.Timestamp(r.ds).date(),
                "yhat": float(r.yhat) if pd.notna(r.yhat) else None,
                "model": model_name,
            }
            if has_lo: row["yhat_lo"] = float(r.yhat_lo) if pd.notna(r.yhat_lo) else float(r.yhat) if pd.notna(r.yhat) else None
            if has_hi: row["yhat_hi"] = float(r.yhat_hi) if pd.notna(r.yhat_hi) else float(r.yhat) if pd.notna(r.yhat) else None
            rows.append(row)

        conn.execute(text(
            f"INSERT INTO {table_forecast} ({', '.join(insert_cols)}) VALUES {values_clause}"
        ), rows)


# -------- Main --------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--database-url", type=str, required=True)
    ap.add_argument("--table-train", dest="table_train", type=str, default="menu_daily_train")
    ap.add_argument("--table-forecast", dest="table_forecast", type=str, default="menu_daily_forecast")
    ap.add_argument("--model", type=str, choices=["prophet", "ridge", "lasso"], required=True)
    ap.add_argument("--baseline", type=str, choices=["naive_tminus7", "seasonal_ma_k2", "seasonal_ma_k4"], default="seasonal_ma_k4")
    ap.add_argument("--horizon", type=int, default=7)
    ap.add_argument("--min-history", dest="min_history", type=int, default=35)
    ap.add_argument("--only-menu-id", dest="only_menu_id", type=int, default=None)
    args = ap.parse_args()

    if args.model == "prophet" and not _HAS_PROPHET:
        print("ERROR: prophet が未インストールです。pip install prophet", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(args.database_url)
    df = pd.read_sql(f"SELECT menu_id, ds, y, dow, is_month_end FROM {args.table_train}", engine, parse_dates=["ds"])
    if df.empty:
        print("menu_daily_train が空です。処理を終了します。", file=sys.stderr)
        sys.exit(0)

    global_max_ds = df["ds"].max()
    predict_dates = pd.date_range(global_max_ds + pd.Timedelta(days=1), periods=args.horizon, freq="D")

    menu_ids = sorted(df["menu_id"].unique().tolist())
    if args.only_menu_id is not None:
        menu_ids = [m for m in menu_ids if m == args.only_menu_id]

    results = []
    saved = skipped_short = skipped_ml_lost = 0

    for mid in menu_ids:
        df_one = df[df["menu_id"] == mid].sort_values("ds").reset_index(drop=True)
        if len(df_one) < args.min_history:
            skipped_short += 1
            print(f"[skip-short] menu_id={mid} history={len(df_one)} < {args.min_history}")
            continue

        bt = single_split_backtest(args.model, args.baseline, df_one, args.horizon)
        results.append({"menu_id": mid, **bt})
        print(f"[bt] menu_id={mid} mae_ml={bt['mae_ml']:.3f} mae_base={bt['mae_base']:.3f} win={bt['win']}")

        train_all = df_one.copy()
        if bt["win"]:
            if args.model == "prophet":
                fc = fit_predict_prophet(train_all, predict_dates)
            else:
                fc = fit_predict_sklearn(train_all, predict_dates, args.model)
            model_name = args.model
        else:
            yhat = compute_baseline(args.baseline, train_all, predict_dates)
            fc = pd.DataFrame({"ds": predict_dates, "yhat": yhat.values})
            fc["yhat_lo"] = fc["yhat_hi"] = fc["yhat"]  # ベースラインは lo=hi=yhat
            model_name = args.baseline
            skipped_ml_lost += 1

        if fc["yhat"].isna().sum() > 0:
            print(f"[warn] menu_id={mid} 予測に欠損が含まれるためスキップ", file=sys.stderr)
            continue

        save_forecast(engine, args.table_forecast, mid, fc, model_name)
        saved += 1
        print(f"[save] menu_id={mid} -> {args.table_forecast} (model={model_name})")

    win_rate = (pd.DataFrame(results)["win"].mean() * 100) if results else 0.0
    print("\n=== Summary ===")
    print(f"Menus processed     : {len(menu_ids)}")
    print(f"Saved forecasts     : {saved}")
    print(f"Skipped (short hist): {skipped_short}")
    print(f"ML lost -> baseline : {skipped_ml_lost}")
    print(f"ML win rate         : {win_rate:.1f}% (by MAE)")


if __name__ == "__main__":
    from sqlalchemy import create_engine
    main()