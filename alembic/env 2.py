from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# -----------------------------------------------------
# 0. パス設定：backend を sys.path に追加
# -----------------------------------------------------
# このファイル: Udon_App/alembic/env.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Udon_App
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

# -----------------------------------------------------
# 1. .env 読み込み & config 読み込み
# -----------------------------------------------------
load_dotenv()  # Udon_App か backend の .env を自動検出

config = context.config

# .env の DATABASE_URL を Alembic に反映
db_url = os.getenv("DATABASE_URL")
if db_url:
    config.set_main_option("sqlalchemy.url", db_url)

# -----------------------------------------------------
# 2. ログ設定
# -----------------------------------------------------
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# -----------------------------------------------------
# 3. モデルの MetaData を取得
# -----------------------------------------------------
from app.database import Base  # ← backend/app/database.py
import app.models             # ← モデル定義を import して metadata を反映

target_metadata = Base.metadata

# -----------------------------------------------------
# 4. オフラインモード
# -----------------------------------------------------
def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

# -----------------------------------------------------
# 5. オンラインモード
# -----------------------------------------------------
def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

# -----------------------------------------------------
# 6. 実行分岐
# -----------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()