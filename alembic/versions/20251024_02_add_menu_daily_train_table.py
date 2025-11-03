"""add menu_daily_train table

Revision ID: 20251024_02
Revises: 20251023_menu_views
Create Date: 2025-10-24
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251024_02"
down_revision = "20251023_menu_views"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "menu_daily_train",
        sa.Column("menu_id", sa.Integer, nullable=False),
        sa.Column("ds", sa.Date, nullable=False),
        sa.Column("y", sa.Integer, nullable=False),
        sa.Column("dow", sa.Integer, nullable=False),
        sa.Column("is_month_end", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("menu_id", "ds"),
    )
    # （必要なら外部キー）
    # op.create_foreign_key(
    #     "fk_mdt_menu", "menu_daily_train", "menus",
    #     ["menu_id"], ["id"]
    # )


def downgrade():
    op.drop_table("menu_daily_train")