"""init schema

Revision ID: 0001_init
Revises: 
Create Date: 2025-08-31

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- tables ---
    op.create_table(
        "tables",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(50), unique=True, nullable=False),
    )

    # --- menus ---
    op.create_table(
        "menus",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("price", sa.Integer, nullable=False),
        sa.Column("stock", sa.Integer, nullable=False, server_default="0"),  # 在庫
    )

    # --- orders ---
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("table_id", sa.Integer, sa.ForeignKey("tables.id")),
        sa.Column("status", sa.String(50), nullable=False, server_default="placed"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),  # 注文日時
    )

    # --- posts ---
    op.create_table(
        "posts",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    # --- replies ---
    op.create_table(
        "replies",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("post_id", sa.Integer, sa.ForeignKey("posts.id"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("replies")
    op.drop_table("posts")
    op.drop_table("orders")
    op.drop_table("menus")
    op.drop_table("tables")