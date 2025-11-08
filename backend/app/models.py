# app/models.py
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from app.database import Base   # ← ここだけから Base を輸入。declarative_base() は絶対に呼ばない。


class Menu(Base):
    __tablename__ = "menus"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    price = Column(Integer, nullable=False)
    stock = Column(Integer, nullable=True)

    


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, autoincrement=True)
    status = Column(String(32), nullable=False, default="placed")  # placed, cooking, served
    table_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    menu_id = Column(Integer, ForeignKey("menus.id"), nullable=False, index=True)
    price = Column(Integer, nullable=False)   # 注文時の価格スナップショット
    quantity = Column(Integer, nullable=False, default=1)

    order = relationship("Order", back_populates="items")