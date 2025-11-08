from __future__ import annotations
import argparse, csv, re, sqlite3
from contextlib import contextmanager

def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite:///")

def _sqlite_path(url: str) -> str:
    return re.sub(r"^sqlite:///", "", url)

@contextmanager
def connect(database_url: str):
    if not _is_sqlite(database_url):
        raise NotImplementedError("Day3 loader supports sqlite:/// only")
    path = _sqlite_path(database_url)
    con = sqlite3.connect(path)
    try:
        yield con
    finally:
        con.close()

def ensure_table(con: sqlite3.Connection):
    con.execute("""
    CREATE TABLE IF NOT EXISTS menu_daily_train (
        menu_id INTEGER NOT NULL,
        ds DATE NOT NULL,
        y INTEGER NOT NULL,
        dow INTEGER NOT NULL,
        is_month_end INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY(menu_id, ds)
    );
    """)

def load_csv(con: sqlite3.Connection, csv_path: str):
    with open(csv_path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        rows = []
        for row in r:
            # 必須: menu_id, ds, y, dow, is_month_end
            rows.append((
                int(row["menu_id"]),
                row["ds"],
                int(float(row["y"])),  # yがfloatで来ても丸める
                int(row.get("dow", 0)),
                int(row.get("is_month_end", 0)),
            ))
    con.executemany("""
        INSERT INTO menu_daily_train (menu_id, ds, y, dow, is_month_end)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(menu_id, ds) DO UPDATE SET
            y=excluded.y, dow=excluded.dow, is_month_end=excluded.is_month_end;
    """, rows)
    con.commit()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--database-url", required=True)
    ap.add_argument("--csv", required=True)
    args = ap.parse_args()
    with connect(args.database_url) as con:
        ensure_table(con)
        load_csv(con, args.csv)
    print("Loaded CSV into menu_daily_train.")

if __name__ == "__main__":
    main()