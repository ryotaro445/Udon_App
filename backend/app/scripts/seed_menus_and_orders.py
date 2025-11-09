# backend/app/scripts/seed_menus_and_orders.py

import random
from datetime import date, datetime, time, timedelta, timezone

from app.database import SessionLocal
from app.models import Menu, Order, OrderItem


# ① 追加したいメニュー定義
NEW_MENUS = [
    {"name": "釜揚げうどん", "price": 480},
    {"name": "カレーうどん", "price": 650},
    {"name": "唐揚げ",     "price": 380},
    {"name": "カキフライ", "price": 450},
    {"name": "天ぷらうどん", "price": 700},
]


def ensure_menus(db):
    """
    既存の Menu に 5品を追加（同名があればスキップ）
    """
    existing = {m.name: m for m in db.query(Menu).all()}

    for cfg in NEW_MENUS:
        if cfg["name"] in existing:
            continue
        m = Menu(
            name=cfg["name"],
            price=cfg["price"],
            stock=None,  # 在庫は特に管理しないので None のまま
        )
        db.add(m)

    db.commit()
    print("✅ 新メニューの登録が完了しました。")


def generate_orders(db):
    from app import models
    from datetime import date, datetime, time, timedelta
    import random

    menus = db.query(models.Menu).all()
    if not menus:
        print("Menu テーブルにメニューがありません。先にメニューを登録してください。")
        return

    start = date(2025, 7, 14)
    end = date(2025, 11, 9)
    current = start
    created_orders = 0
    created_items = 0
    batch_size = 2000  # 2000件ごとにcommit

    while current <= end:
        # 日曜日は定休日
        if current.weekday() == 6:
            current += timedelta(days=1)
            continue

        # 平日 / 土曜で件数を分ける
        base_orders = random.randint(35, 55) if current.weekday() < 5 else random.randint(50, 80)

        for _ in range(base_orders):
            order = models.Order(
                status="served",
                table_id=random.randint(1, 10),
                created_at=datetime.combine(
                    current,
                    time(hour=random.choice(range(11, 21)), minute=random.choice([0, 10, 20, 30, 40, 50]))
                ),
            )
            db.add(order)
            db.flush()  # order.id を確定

            ordered_menus = random.sample(menus, k=random.randint(1, 3))
            for menu in ordered_menus:
                qty = random.choice([1, 1, 1, 2])
                item = models.OrderItem(order_id=order.id, menu_id=menu.id, price=menu.price, quantity=qty)
                db.add(item)
                created_items += 1

            created_orders += 1

            # 一定件数ごとにコミット
            if created_orders % batch_size == 0:
                db.commit()
                print(f"Committed {created_orders} orders so far...")

        current += timedelta(days=1)

    db.commit()
    print(f"✅ 注文データ {created_orders} 件、注文明細 {created_items} 件を作成しました。")

def main():
    db = SessionLocal()
    try:
        ensure_menus(db)
        generate_orders(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()