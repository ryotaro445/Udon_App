import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Render / ローカル共通の DB URL
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # postgres:// の場合（将来別サービスに変えても対応できるように）
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    # postgresql:// の場合は psycopg2 を明示
    elif DATABASE_URL.startswith("postgresql://") and "+psycopg2" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    connect_args = {}
else:
    # 環境変数がないときはローカル用 SQLite
    SQLALCHEMY_DATABASE_URL = "sqlite:///./udon_app.db"
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()