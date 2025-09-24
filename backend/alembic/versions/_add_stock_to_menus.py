from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20250911_add_stock_to_menus"
down_revision = "<直前のリビジョンID>"  # 既存の最新に差し替え
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(
        "menus",
        sa.Column("stock", sa.Integer(), nullable=False, server_default="0")
    )
    # 既存メニューの初期在庫（任意。例：10）
    op.execute("UPDATE menus SET stock = 10 WHERE stock = 0")
    op.alter_column("menus", "stock", server_default=None)

def downgrade():
    op.drop_column("menus", "stock")