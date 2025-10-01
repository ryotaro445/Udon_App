from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()

class Menu(Base):
    __tablename__ = "menus"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    price = Column(Integer, nullable=False)
    stock = Column(Integer, nullable=True)

    comments = relationship("Comment", back_populates="menu", cascade="all, delete-orphan")
    likes = relationship("MenuLike", back_populates="menu", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    menu_id = Column(Integer, ForeignKey("menus.id"), nullable=False, index=True)
    user = Column(String(255), nullable=True)
    text = Column(String(2000), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    menu = relationship("Menu", back_populates="comments")


class MenuLike(Base):
    __tablename__ = "menu_likes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    menu_id = Column(Integer, ForeignKey("menus.id"), nullable=False, index=True)
    user_token = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    menu = relationship("Menu", back_populates="likes")
    __table_args__ = (
        UniqueConstraint("menu_id", "user_token", name="uq_menu_like"),
    )


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
    price = Column(Integer, nullable=False)  # 注文時の価格を保存（NOT NULL）
    quantity = Column(Integer, nullable=False, default=1)

    order = relationship("Order", back_populates="items")