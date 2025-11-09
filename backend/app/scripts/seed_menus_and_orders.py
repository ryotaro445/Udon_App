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
    """
    2025-07-14〜2025-11-09 の注文データを生成
    - 日曜日は定休日（売上0）
    - 1日あたりの「注文（Order）」件数をランダム生成
    - 1つの注文に 1〜3 品（OrderItem）を紐づける
    - 売上金額は OrderItem.price * quantity で表現
    """
    menus = db.query(Menu).all()
    if not menus:
        print("Menu テーブルにメニューがありません。先にメニューを登録してください。")
        return

    start = date(2025, 7, 14)
    end = date(2025, 11, 9)

    current = start
    created_orders = 0
    created_items = 0

    while current <= end:
        # 日曜日は定休日（weekday() == 6 が日曜）
        if current.weekday() == 6:
            current += timedelta(days=1)
            continue

        # 平日・土曜で来店数に差をつける
        if current.weekday() < 5:
            base_orders = random.randint(35, 55)  # 月〜金
        else:
            base_orders = random.randint(50, 80)  # 土曜

        for _ in range(base_orders):
            # 1回の注文で 1〜3 品頼むイメージ
            ordered_menus = random.sample(menus, k=random.randint(1, 3))

            order_hour = random.choice(range(11, 21))  # 11〜20時
            order_minute = random.choice([0, 10, 20, 30, 40, 50])

            created_at = datetime.combine(
                current,
                time(hour=order_hour, minute=order_minute),
            ).replace(tzinfo=timezone.utc)

            # テーブル番号 1〜10 としておく（使っていなければ無視される）
            table_id = random.randint(1, 10)

            # Order を作成（status は実績として "served" 扱いにしておく）
            order = Order(
                status="served",
                table_id=table_id,
                created_at=created_at,
            )
            db.add(order)
            db.flush()  # order.id を取得

            # OrderItem を紐づける
            for menu in ordered_menus:
                qty = random.choice([1, 1, 1, 2])  # 1個が多め、たまに2個

                item = OrderItem(
                    order_id=order.id,
                    menu_id=menu.id,
                    price=menu.price,  # 注文時の価格スナップショット
                    quantity=qty,
                )
                db.add(item)
                created_items += 1

            created_orders += 1

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