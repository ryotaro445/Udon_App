"""add table_id to orders

Revision ID: add_table_id_to_orders
Revises: <前のリビジョンID>
Create Date: 2025-08-30

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "add_table_id_to_orders"
down_revision = "<前のリビジョンID>"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("orders", sa.Column("table_id", sa.Integer(), nullable=True))
    op.create_index("ix_orders_table_id", "orders", ["table_id"])
    op.create_foreign_key(
        "fk_orders_table_id_tables",
        "orders", "tables",
        ["table_id"], ["id"],
        ondelete="SET NULL"
    )

def downgrade() -> None:
    op.drop_constraint("fk_orders_table_id_tables", "orders", type_="foreignkey")
    op.drop_index("ix_orders_table_id", table_name="orders")
    op.drop_column("orders", "table_id")