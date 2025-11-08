from __future__ import annotations
import argparse, sqlite3, datetime as dt, random, os, re

def _is_sqlite(url: str) -> bool: return url.startswith("sqlite:///")
def _sqlite_path(url: str) -> str: return re.sub(r"^sqlite:///", "", url)

def ensure_schema(con: sqlite3.Connection):
    con.execute("""
    CREATE TABLE IF NOT EXISTS menus (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        current_price INTEGER NOT NULL
    );
    """)
    con.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY,
        menu_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(menu_id) REFERENCES menus(id)
    );
    """)
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
    con.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_daily_train
      ON menu_daily_train(menu_id, ds);
    """)

def seed_menus(con: sqlite3.Connection):
    n = con.execute("SELECT COUNT(*) FROM menus;").fetchone()[0]
    if n > 0: return
    rows = [
        (1, "かけうどん", "うどん", 380),
        (2, "ぶっかけうどん", "うどん", 450),
        (3, "カレーうどん", "うどん", 520),
        (4, "天ぷらうどん", "うどん", 580),
        (5, "肉うどん", "うどん", 620),
        (6, "ざるうどん", "うどん", 400),
    ]
    con.executemany("INSERT INTO menus(id, name, category, current_price) VALUES(?,?,?,?);", rows)

def seed_orders(con: sqlite3.Connection, weeks: int = 8):
    # 既存件数があれば追加で埋める（重複は気にせず追加）
    max_id = con.execute("SELECT COALESCE(MAX(id),0) FROM orders;").fetchone()[0]
    menu_ids = [r[0] for r in con.execute("SELECT id FROM menus;").fetchall()]
    if not menu_ids: return
    today = dt.date.today()
    start = today - dt.timedelta(weeks=weeks)
    cur_id = max_id
    for i in range((today - start).days + 1):
        d = start + dt.timedelta(days=i)
        weekend_boost = 1.8 if d.weekday() in (5,6) else 1.0
        for mid in menu_ids:
            base = 2.5 + (mid % 3) * 0.7  # メニューごとに微差
            mu = base * weekend_boost
            qty = max(0, int(random.gauss(mu, 1.8)))
            if qty == 0: 
                continue
            cur_id += 1
            price = con.execute("SELECT current_price FROM menus WHERE id=?;", (mid,)).fetchone()[0]
            con.execute(
                "INSERT INTO orders(id, menu_id, quantity, unit_price, created_at) VALUES(?,?,?,?,?)",
                (cur_id, mid, qty, price, f"{d} 12:00:00")
            )

def rebuild_menu_daily_train(con: sqlite3.Connection):
    con.execute("DELETE FROM menu_daily_train;")
    con.execute("""
    INSERT INTO menu_daily_train (menu_id, ds, y, dow, is_month_end)
    SELECT
      o.menu_id,
      DATE(o.created_at) AS ds,
      SUM(o.quantity)    AS y,
      CAST(STRFTIME('%w', DATE(o.created_at)) AS INT) AS dow,
      CASE
        WHEN DATE(o.created_at) = DATE(DATE(o.created_at, 'start of month', '+1 month', '-1 day')) THEN 1
        ELSE 0
      END AS is_month_end
    FROM orders o
    GROUP BY o.menu_id, DATE(o.created_at);
    """)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--database-url", default="sqlite:///udon.db")
    ap.add_argument("--weeks", type=int, default=8, help="過去何週間のダミーを埋めるか")
    args = ap.parse_args()
    if not _is_sqlite(args.database_url):
        raise SystemExit("sqlite:/// のみ対応")
    path = _sqlite_path(args.database_url)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    con = sqlite3.connect(path)
    try:
        con.execute("PRAGMA foreign_keys = ON;")
        ensure_schema(con)
        seed_menus(con)
        seed_orders(con, weeks=args.weeks)
        rebuild_menu_daily_train(con)
        con.commit()
    finally:
        con.close()
    print("Seeded menus/orders and rebuilt menu_daily_train.")

if __name__ == "__main__":
    main()