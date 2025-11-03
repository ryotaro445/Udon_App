# backend/app/seed.py
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from app.database import Base, engine
from app.models import Menu, Order

# OrderItem はある前提ではない（あれば使う）
try:
    from app.models import OrderItem  # type: ignore
    HAS_ORDER_ITEM = True
except Exception:
    HAS_ORDER_ITEM = False


def _has_column(model, name: str) -> bool:
    try:
        cols = {c.key for c in inspect(model).mapper.column_attrs}
        return name in cols
    except Exception:
        return False


def reset_and_seed(db: Session) -> None:
    """
    E2E/テスト用の初期化＆最小シード。
    - menus: 3件（390/650/680）
    - orders: 1件（status='placed' があれば設定）
    - order_items: 2明細（menu1:390×2, menu3:680×1）→ 合計 1460
    """
    # 1) 全テーブル再作成
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 2) メニュー
    menus = [
        Menu(name="かけうどん", price=390, stock=50 if _has_column(Menu, "stock") else None),
        Menu(name="肉うどん",   price=650, stock=30 if _has_column(Menu, "stock") else None),
        Menu(name="カレーうどん", price=680, stock=20 if _has_column(Menu, "stock") else None),
    ]
    # None は SQLAlchemy が無視するので OK
    db.add_all(menus)
    db.flush()  # id を確定

    # 3) 注文（ヘッダ）
    order = Order()
    # status カラムがあれば 'placed' にしておく（テストは /orders?status=placed を叩く）
    if _has_column(Order, "status"):
        setattr(order, "status", "placed")
    db.add(order)
    db.flush()

    # 4) 明細（order_items がある場合のみ）
    if HAS_ORDER_ITEM:
        items = [
            OrderItem(order_id=order.id, menu_id=menus[0].id, quantity=2, unit_price=390),
            OrderItem(order_id=order.id, menu_id=menus[2].id, quantity=1, unit_price=680),
        ]
        db.add_all(items)

        # 在庫減算（stock 列がある場合だけ）
        if _has_column(Menu, "stock"):
            try:
                if menus[0].stock is not None:
                    menus[0].stock -= 2
                if menus[2].stock is not None:
                    menus[2].stock -= 1
            except Exception:
                pass

    # 5) 完了
    db.commit()