# app/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# .env を読み込む
load_dotenv()

# PostgreSQL 用 DATABASE_URL を環境変数から取得
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://udon_user:udon_pass@localhost:5432/udon_db"
)

# エンジン作成（StaticPoolなどSQLite専用設定を削除）
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # 接続チェックを自動で行う（PostgreSQL向け）
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ✅ Alembicで管理するため、テーブル作成＆シード投入は削除・停止
# Base.metadata.create_all(bind=engine)
# ensure_seeded_once() などの自動実行も削除

def get_db():
    """FastAPIの依存関係でDBセッションを提供"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()