from __future__ import annotations
import sqlite3
from contextlib import contextmanager
from typing import Iterable, List, Tuple, Dict, Any, Optional
import datetime as dt
import re

def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite:///")

def _sqlite_path(url: str) -> str:
    # sqlite:///backend/udon.db -> backend/udon.db
    return re.sub(r"^sqlite:///", "", url)

@contextmanager
def connect(database_url: str):
    """
    現状はSQLite前提（開発用）。
    Postgresにする場合は psycopg 実装を分岐追加。
    """
    if _is_sqlite(database_url):
        path = _sqlite_path(database_url)
        con = sqlite3.connect(path)
        con.execute("PRAGMA foreign_keys = ON;")
        try:
            yield con
        finally:
            con.close()
    else:
        raise NotImplementedError("Only sqlite:/// is supported in this helper for Day 3.")

def ensure_forecast_table(database_url: str):
    from pathlib import Path
    sql_path = Path("backend/app/sql/create_menu_daily_forecast.sql")
    with connect(database_url) as con, open(sql_path, "r", encoding="utf-8") as f:
        con.executescript(f.read())
        con.commit()

def fetch_menu_daily_qty(database_url: str) -> List[Tuple[int, str, int]]:
    """
    優先: menu_daily_train (Day2の確定データ)
    次点: menu_daily_qty (Day1ビュー)
    どちらも0件なら ValueError
    """
    with connect(database_url) as con:
        # 1) menu_daily_train がある＆件数>0？
        try:
            cur = con.execute("SELECT COUNT(*) FROM menu_daily_train;")
            cnt = cur.fetchone()[0]
            if cnt > 0:
                cur = con.execute("SELECT menu_id, ds, y FROM menu_daily_train ORDER BY menu_id, ds;")
                return [(int(m), str(d), int(y)) for (m, d, y) in cur.fetchall()]
        except Exception:
            pass  # テーブル未作成ならスルー

        # 2) menu_daily_qty (ビュー)
        try:
            cur = con.execute("SELECT COUNT(*) FROM menu_daily_qty;")
            cnt = cur.fetchone()[0]
            if cnt > 0:
                cur = con.execute("SELECT menu_id, ds, y FROM menu_daily_qty ORDER BY menu_id, ds;")
                return [(int(m), str(d), int(y)) for (m, d, y) in cur.fetchall()]
        except Exception:
            pass

    raise ValueError(
        "学習データが空です。menu_daily_train にCSVを投入するか、menu_daily_qtyにデータが出るようにしてください。"
    )

def upsert_forecasts(
    database_url: str,
    rows: Iterable[Tuple[int, str, float, float, float, str, str]],
):
    """
    rows: (menu_id, ds, yhat, yhat_lo, yhat_hi, model, trained_at)
    """
    sql = """
    INSERT INTO menu_daily_forecast (menu_id, ds, yhat, yhat_lo, yhat_hi, model, trained_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(menu_id, ds, model) DO UPDATE SET
        yhat=excluded.yhat,
        yhat_lo=excluded.yhat_lo,
        yhat_hi=excluded.yhat_hi,
        trained_at=excluded.trained_at;
    """
    with connect(database_url) as con:
        con.executemany(sql, rows)
        con.commit()