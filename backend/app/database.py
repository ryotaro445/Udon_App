import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# -------------------------
# DB URL を環境変数から取得
# -------------------------
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render の Postgres など、postgres:// 形式にも対応
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace(
            "postgres://",
            "postgresql+psycopg2://",
            1,
        )
    elif DATABASE_URL.startswith("postgresql://") and "+psycopg2" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace(
            "postgresql://",
            "postgresql+psycopg2://",
            1,
        )

    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    connect_args = {}
else:
    # ローカル開発用の SQLite フォールバック
    SQLALCHEMY_DATABASE_URL = "sqlite:///./udon_app.db"
    connect_args = {"check_same_thread": False}

# -------------------------
# SQLAlchemy セットアップ
# -------------------------
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# -------------------------
# FastAPI から使う DB 依存性
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()