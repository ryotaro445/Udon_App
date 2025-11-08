import os
import sys
import argparse
from datetime import date
from typing import Optional, Tuple

import pandas as pd
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--database-url",
        default=os.environ.get("DATABASE_URL", "sqlite:///backend/app.db"),
        help="DB接続URL (例: sqlite:///backend/app.db / postgresql+psycopg2://user:pass@host:5432/db)",
    )
    parser.add_argument(
        "--csv",
        default="backend/data/processed/menu_daily_train.csv",
        help="出力CSVパス",
    )
    parser.add_argument(
        "--start",
        default=None,
        help="日付範囲の開始 (YYYY-MM-DD)。未指定時は orders の最小日に合わせる",
    )
    parser.add_argument(
        "--end",
        default=None,
        help="日付範囲の終了 (YYYY-MM-DD)。未指定時は orders の最大日に合わせる",
    )
    parser.add_argument(
        "--include-month-end",
        action="store_true",
        help="is_month_end(0/1) を付与して出力",
    )
    parser.add_argument(
        "--holiday-csv",
        default=None,
        help="祝日一覧CSV（1列または 'ds' 列に YYYY-MM-DD）。与えた場合は is_holiday(0/1) 付与",
    )
    return parser.parse_args()


def get_engine(db_url: str) -> Engine:
    return create_engine(db_url, future=True)


def fetch_menu_ids(engine: Engine) -> pd.Series:
    with engine.begin() as conn:
        df = pd.read_sql(text("SELECT id AS menu_id FROM menus"), conn)
    if df.empty:
        raise RuntimeError("menus テーブルが空です。少なくとも1件のメニューを登録してください。")
    return df["menu_id"]


def fetch_order_daily_agg(engine: Engine) -> pd.DataFrame:
    """
    orders × order_items を想定して menu_id / created_at / quantity を取得。
    - 現在のスキーマ（menu_id/quantityは order_items 側）なら JOIN。
    - 互換用に、order_items が無ければ orders 直読み（旧スキーマ互換）。
    """
    tables = set(inspect(engine).get_table_names())
    use_join = ("order_items" in tables) and ("orders" in tables)

    with engine.begin() as conn:
        if use_join:
            sql = text("""
                SELECT
                  oi.menu_id   AS menu_id,
                  o.created_at AS created_at,
                  oi.quantity  AS quantity
                FROM order_items AS oi
                JOIN orders AS o ON oi.order_id = o.id
            """)
        else:
            sql = text("""
                SELECT
                  menu_id,
                  created_at,
                  quantity
                FROM orders
            """)
        df = pd.read_sql(sql, conn)

    if df.empty:
        return pd.DataFrame(columns=["menu_id", "ds", "y"])

    # created_at → 日付
    df["ds"] = pd.to_datetime(df["created_at"]).dt.date

    # quantity を安全に数値化し、負値は0で丸め
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0)
    df.loc[df["quantity"] < 0, "quantity"] = 0

    # 日次合計
    g = df.groupby(["menu_id", "ds"], as_index=False)["quantity"].sum()
    g = g.rename(columns={"quantity": "y"})
    g["ds"] = pd.to_datetime(g["ds"]).dt.date
    return g[["menu_id", "ds", "y"]]


def resolve_date_range(agg: pd.DataFrame, start: Optional[str], end: Optional[str]) -> Tuple[date, date]:
    if start:
        start_date = pd.to_datetime(start).date()
    else:
        start_date = pd.to_datetime(agg["ds"].min()).date() if not agg.empty else date.today()

    if end:
        end_date = pd.to_datetime(end).date()
    else:
        end_date = pd.to_datetime(agg["ds"].max()).date() if not agg.empty else date.today()

    if start_date > end_date:
        raise ValueError(f"日付範囲が不正です: start={start_date}, end={end_date}")
    return start_date, end_date


def build_date_spine(start_date: date, end_date: date) -> pd.DataFrame:
    dates = pd.date_range(start=start_date, end=end_date, freq="D")
    return pd.DataFrame({"ds": dates.date})


def add_basic_features(df: pd.DataFrame, include_month_end: bool, holiday_csv: Optional[str]) -> pd.DataFrame:
    s = pd.to_datetime(df["ds"])

    # 曜日: 月曜=0, …, 日曜=6
    df["dow"] = s.dt.weekday

    if include_month_end:
        df["is_month_end"] = s.dt.is_month_end.astype(int)

    if holiday_csv:
        hol = pd.read_csv(holiday_csv)
        if "ds" in hol.columns:
            hol_dates = pd.to_datetime(hol["ds"]).dt.date
        else:
            hol_dates = pd.to_datetime(hol.iloc[:, 0]).dt.date
        hol_set = set(hol_dates.tolist())
        df["is_holiday"] = df["ds"].apply(lambda d: 1 if d in hol_set else 0)

    return df


def write_table(engine: Engine, df: pd.DataFrame):
    cols = ["menu_id", "ds", "y", "dow"]
    if "is_month_end" in df.columns:
        cols.append("is_month_end")
    if "is_holiday" in df.columns:
        cols.append("is_holiday")

    out = df[cols].copy()
    with engine.begin() as conn:
        out.to_sql("menu_daily_train", conn, if_exists="replace", index=False)
    return out


def acceptance_check(df: pd.DataFrame) -> None:
    neg = (df["y"] < 0).sum()
    holes_total = 0
    for _, g in df.groupby("menu_id"):
        s = pd.to_datetime(g["ds"]).sort_values().reset_index(drop=True)
        delta = s.diff().dropna().dt.days
        holes_total += int((delta > 1).sum())

    print("=== Acceptance Check ===")
    print(f"y < 0 件数: {neg}")
    print(f"連続日付の穴発生 menu_id 数: {holes_total}")
    if neg == 0 and holes_total == 0:
        print("OK: 任意の menu_id で 連続日付（穴なし） & y≥0 を満たしています。")
    else:
        print("NG: 条件を満たしていません。前処理/元データを確認してください。")


def main():
    args = parse_args()
    engine = get_engine(args.database_url)

    print(f"[INFO] DB: {args.database_url}")
    print(f"[INFO] 出力CSV: {args.csv}")

    menu_ids = fetch_menu_ids(engine)
    agg = fetch_order_daily_agg(engine)
    start_date, end_date = resolve_date_range(agg, args.start, args.end)
    calendar = build_date_spine(start_date, end_date)

    # menu_id × 連続日付 の全組合せ
    all_pairs = (
        pd.MultiIndex.from_product(
            [menu_ids.tolist(), calendar["ds"].tolist()],
            names=["menu_id", "ds"]
        ).to_frame(index=False)
    )

    # 左結合し欠損は 0（FutureWarning を回避して堅く数値化）
    merged = all_pairs.merge(agg, on=["menu_id", "ds"], how="left")
    merged["y"] = pd.to_numeric(merged["y"], errors="coerce").fillna(0)
    merged.loc[merged["y"] < 0, "y"] = 0
    merged["y"] = merged["y"].astype("int64")

    # 特徴量
    merged = add_basic_features(
        merged,
        include_month_end=args.include_month_end,
        holiday_csv=args.holiday_csv,
    )

    # 保存（DB & CSV）
    out = write_table(engine, merged)
    os.makedirs(os.path.dirname(args.csv), exist_ok=True)
    out.to_csv(args.csv, index=False)

    # 受け入れチェック & サマリ
    acceptance_check(out)
    print("\n=== Summary ===")
    print(out.head(8).to_string(index=False))
    print(f"\n[DONE] menu_daily_train {len(out):,} 行を作成・保存しました。")


if __name__ == "__main__":
    sys.exit(main())