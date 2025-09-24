from alembic import op
import sqlalchemy as sa

revision = "20250903_add_moderation_logs"
down_revision = "<直前のリビジョンID>"  # 既存の最新に差し替え

def upgrade():
    op.create_table(
        "moderation_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("menu_id", sa.Integer, sa.ForeignKey("menus.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user", sa.String(100), nullable=True),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("blocked", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("category", sa.String(100)),
        sa.Column("flags", sa.String(200)),
        sa.Column("score", sa.String(50)),
        sa.Column("model", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )

def downgrade():
    op.drop_table("moderation_logs")