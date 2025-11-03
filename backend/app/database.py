# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool

SQLALCHEMY_DATABASE_URL = "sqlite+pysqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,   # 共有インメモリ
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_tables_created_once() -> None:
    """モデル読み込み後に必ず一度だけテーブルを作成する。"""
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)


def ensure_seeded_once() -> None:
    """最小シードを import 時に一度だけ投入（startup に依存しない）。"""
    from .models import Menu, Order, OrderItem  # 遅延 import で循環回避
    db = SessionLocal()
    try:
        # 既にメニューがあれば何もしない（冪等）
        if db.query(Menu).count() == 0:
            menus = [
                Menu(name="かけうどん",   price=390, stock=50),
                Menu(name="きつねうどん", price=520, stock=30),
                Menu(name="カレーうどん", price=680, stock=20),
            ]
            db.add_all(menus)
            db.commit()

        # placed の検証用注文（合計 1460）も無ければ作る（冪等）
        has_placed = db.query(Order).filter(Order.status == "placed").first()
        if not has_placed:
            m1 = db.query(Menu).filter(Menu.name == "かけうどん").first()
            m3 = db.query(Menu).filter(Menu.name == "カレーうどん").first()
            if m1 and m3:
                o = Order(status="placed")
                db.add(o)
                db.flush()  # o.id を得る
                items = [
                    OrderItem(order_id=o.id, menu_id=m1.id, price=m1.price, quantity=2),
                    OrderItem(order_id=o.id, menu_id=m3.id, price=m3.price, quantity=1),
                ]
                db.add_all(items)
                db.commit()
    finally:
        db.close()


# ★ モジュール import 時に「テーブル作成→シード投入」を必ず一度だけ実行
ensure_tables_created_once()
ensure_seeded_once()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()