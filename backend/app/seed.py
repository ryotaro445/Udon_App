# app/seed.py
from __future__ import annotations
from sqlalchemy.orm import Session
from app.database import engine
from app.models import Base, Menu  # 他に必要なモデルがあれば追記

def reset_and_seed(db: Session) -> None:
    """E2E用: DBを初期化して最小データを投入"""
    # 1) 全テーブル削除→作成
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 2) 最小シード（UIで必ず見えるメニューを数点）
    menus = [
        Menu(name="かけうどん", price=400, stock=50),
        Menu(name="肉うどん", price=650, stock=30),
        Menu(name="ちくわ天", price=150, stock=100),
    ]
    db.add_all(menus)
    db.commit()