"""create views: menu_daily_qty / menu_dow_hour_qty (SQLite版; JST集計; JOIN対応)

Revision ID: 20251023_menu_views
Revises: <PUT_PREV_REVISION_ID_HERE>
Create Date: 2025-10-23 22:00:00 JST
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "20251023_menu_views"
down_revision = "base_0001"  # ← 直前のrevision_idに置換（例：base_0001）
branch_labels = None
depends_on = None


def upgrade():
    # 既存を落としてから作る（冪等）
    op.execute("DROP VIEW IF EXISTS menu_dow_hour_qty;")
    op.execute("DROP VIEW IF EXISTS menu_daily_qty;")

    # 日次×メニュー別 数量（qty）
    op.execute(
        """
        CREATE VIEW menu_daily_qty AS
        SELECT
            oi.menu_id AS menu_id,
            DATE(datetime(o.created_at, '+09:00')) AS ds,
            SUM(oi.quantity) AS y
        FROM order_items AS oi
        JOIN orders AS o ON oi.order_id = o.id
        GROUP BY
            oi.menu_id,
            DATE(datetime(o.created_at, '+09:00'));
        """
    )

    # 曜日×時間帯の分布
    op.execute(
        """
        CREATE VIEW menu_dow_hour_qty AS
        WITH ts AS (
          SELECT
            oi.menu_id,
            datetime(o.created_at, '+09:00') AS jst_ts,
            oi.quantity
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
        )
        SELECT
          menu_id,
          CAST(strftime('%w', jst_ts) AS INT) AS dow,
          CAST(strftime('%H', jst_ts) AS INT) AS hour,
          SUM(quantity) AS y
        FROM ts
        GROUP BY
          menu_id, dow, hour;
        """
    )


def downgrade():
    op.execute("DROP VIEW IF EXISTS menu_dow_hour_qty;")
    op.execute("DROP VIEW IF EXISTS menu_daily_qty;")