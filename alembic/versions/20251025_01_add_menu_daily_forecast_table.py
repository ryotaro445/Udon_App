"""add menu_daily_forecast table

Revision ID: 20251025_01
Revises: 20251024_02
Create Date: 2025-10-25
"""
from alembic import op
import sqlalchemy as sa

revision = "20251025_01"
down_revision = "20251024_02"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "menu_daily_forecast",
        sa.Column("menu_id", sa.Integer, nullable=False),
        sa.Column("ds", sa.Date, nullable=False),
        sa.Column("yhat", sa.Float, nullable=False),
        sa.Column("yhat_lo", sa.Float, nullable=False),
        sa.Column("yhat_hi", sa.Float, nullable=False),
        sa.Column("model", sa.String(length=64), nullable=False),
        sa.Column("trained_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("menu_id", "ds", "model"),
    )
    # （必要なら外部キー）
    # op.create_foreign_key(
    #     "fk_mdf_menu", "menu_daily_forecast", "menus",
    #     ["menu_id"], ["id"]
    # )


def downgrade():
    op.drop_table("menu_daily_forecast")