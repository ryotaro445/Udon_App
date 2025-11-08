"""create views: menu_daily_qty / menu_dow_hour_qty (PostgreSQL版; JST集計; JOIN対応)

Revision ID: 20251023_menu_views
Revises: base_0001
Create Date: 2025-10-23 22:00:00 JST
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "20251023_menu_views"
down_revision = "base_0001"  # 直前のrevision
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 既存 VIEW を落としてから作成（冪等）
    op.execute("DROP VIEW IF EXISTS menu_dow_hour_qty;")
    op.execute("DROP VIEW IF EXISTS menu_daily_qty;")

    # 日次 × メニュー別 数量（qty）
    # created_at を JST に直した上で date に落とす
    op.execute(
        """
        CREATE VIEW menu_daily_qty AS
        SELECT
            oi.menu_id AS menu_id,
            (o.created_at AT TIME ZONE 'Asia/Tokyo')::date AS ds,
            SUM(oi.quantity) AS y
        FROM order_items AS oi
        JOIN orders AS o ON oi.order_id = o.id
        GROUP BY
            oi.menu_id,
            (o.created_at AT TIME ZONE 'Asia/Tokyo')::date;
        """
    )

    # 曜日 × 時間帯の分布
    op.execute(
        """
        CREATE VIEW menu_dow_hour_qty AS
        WITH ts AS (
          SELECT
            oi.menu_id,
            (o.created_at AT TIME ZONE 'Asia/Tokyo') AS jst_ts,
            oi.quantity
          FROM order_items AS oi
          JOIN orders AS o ON oi.order_id = o.id
        )
        SELECT
          menu_id,
          EXTRACT(DOW  FROM jst_ts)::int   AS dow,
          EXTRACT(HOUR FROM jst_ts)::int   AS hour,
          SUM(quantity) AS y
        FROM ts
        GROUP BY
          menu_id,
          EXTRACT(DOW  FROM jst_ts)::int,
          EXTRACT(HOUR FROM jst_ts)::int;
        """
    )


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS menu_dow_hour_qty;")
    op.execute("DROP VIEW IF EXISTS menu_daily_qty;")