"""
menu_daily_qty / menu_dow_hour_qty のスナップショットを CSV 出力
実行:
  python scripts/export_snapshots.py
"""
import os
import pandas as pd
from sqlalchemy import create_engine

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
OUT_DIR = os.getenv("SNAPSHOT_DIR", "snapshots")

QUERIES = {
    "menu_daily_qty.csv": """
        SELECT menu_id, ds, y
        FROM menu_daily_qty
        ORDER BY ds DESC, menu_id;
    """,
    "menu_dow_hour_qty.csv": """
        SELECT menu_id, dow, hour, y
        FROM menu_dow_hour_qty
        ORDER BY menu_id, dow, hour;
    """,
}

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    engine = create_engine(DB_URL, future=True)

    with engine.begin() as conn:
        for fname, sql in QUERIES.items():
            df = pd.read_sql(sql, conn.connection)
            df.to_csv(os.path.join(OUT_DIR, fname), index=False, encoding="utf-8")

if __name__ == "__main__":
    main()