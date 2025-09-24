from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base, Menu, Order, OrderItem

DATABASE_URL = "sqlite:///./udon.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db(seed: bool = True):
    # 再作成
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    if not seed:
        return

    db = SessionLocal()
    try:
        # メニュー3品
        m1 = Menu(name="かけうどん", price=390, stock=50)
        m2 = Menu(name="きつねうどん", price=480, stock=30)
        m3 = Menu(name="肉うどん", price=680, stock=20)
        db.add_all([m1, m2, m3])
        db.flush()

        # /orders?status=placed 用の初期注文
        order = Order(status="placed", table_id=1)
        db.add(order)
        db.flush()

        # 事前シード: menu1(390) x2, menu3(680) x1 → 合計 1460
        oi1 = OrderItem(order_id=order.id, menu_id=m1.id, price=m1.price, quantity=2)
        oi2 = OrderItem(order_id=order.id, menu_id=m3.id, price=m3.price, quantity=1)
        db.add_all([oi1, oi2])

        db.commit()
    finally:
        db.close()