"""
2〜4週間分のダミー注文データを投入（SQLite/SQLAlchemy）
- menus: 既存がなければ3品作成
- orders: 過去28日分、日ごと・時間帯ごとに数量をランダム投入（JST 10:00-21:00中心）
前提:
  - orders(id PK, menu_id FK, quantity INT, unit_price INT, created_at TIMESTAMP[UTC])
  - menus(id PK, name TEXT, category TEXT, current_price INT)
実行:
  python scripts/seed_dummy_orders.py
"""

import os
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, text

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")  # ←プロジェクトの接続に合わせて
engine = create_engine(DB_URL, future=True)

JPY_PRICES = [450, 550, 650]
MENU_SEEDS = [
    ("かけうどん", "うどん", 450),
    ("ぶっかけうどん", "うどん", 550),
    ("肉うどん", "うどん", 650),
]

def ensure_menus(conn):
    existing = conn.execute(text("SELECT COUNT(*) FROM menus")).scalar_one()
    if existing == 0:
        for name, cat, price in MENU_SEEDS:
            conn.execute(
                text(
                    "INSERT INTO menus(name, category, current_price) VALUES (:n, :c, :p)"
                ),
                {"n": name, "c": cat, "p": price},
            )

def seed_orders(conn, days=28):
    # JST 営業時間 10:00–21:00 を中心に発生させる（UTC保存）
    jst = timezone(timedelta(hours=9))
    now_utc = datetime.now(timezone.utc)
    start_utc = now_utc - timedelta(days=days)

    menu_ids = [row[0] for row in conn.execute(text("SELECT id FROM menus")).all()]
    if not menu_ids:
        return

    for d in range(days):
        jst_day = (start_utc + timedelta(days=d)).astimezone(jst)
        dow = jst_day.weekday()  # 0=月 ... 6=日 （需要強弱のバイアスに利用）

        for menu_id in menu_ids:
            # 曜日バイアス（例：土日強め）
            base = 3
            if dow >= 5:  # 土日
                base = 6

            # 10:00–21:00で1〜3時間おきに来店を想定
            hour_slots = list(range(10, 22, random.choice([1, 2, 3])))
            for h in hour_slots:
                # 平日: 小さめ / 休日: 大きめ
                qty = max(0, int(random.gauss(mu=base, sigma=2)))
                if qty == 0:
                    continue

                # JST時刻を作ってからUTCへ変換
                jst_dt = jst_day.replace(hour=h, minute=random.randint(0, 59), second=0, microsecond=0)
                utc_dt = jst_dt.astimezone(timezone.utc)

                # 単価は menus.current_price に揃える
                unit_price = conn.execute(
                    text("SELECT current_price FROM menus WHERE id=:id"), {"id": menu_id}
                ).scalar_one()

                conn.execute(
                    text(
                        """
                        INSERT INTO orders(menu_id, quantity, unit_price, created_at)
                        VALUES (:menu_id, :qty, :unit_price, :created_at)
                        """
                    ),
                    {
                        "menu_id": menu_id,
                        "qty": qty,
                        "unit_price": unit_price,
                        "created_at": utc_dt.isoformat(),
                    },
                )

def main():
    with engine.begin() as conn:
        ensure_menus(conn)
        seed_orders(conn, days=28)

if __name__ == "__main__":
    main()