from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "xxxx_add_likes_comments"
down_revision = None  
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "likes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("menu_id", sa.Integer, nullable=False, index=True),
        sa.Column("user_token", sa.String, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_unique_constraint("uq_like_menu_user", "likes", ["menu_id", "user_token"])

    op.create_table(
        "comments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("menu_id", sa.Integer, nullable=False, index=True),
        sa.Column("user", sa.String, nullable=True),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

def downgrade():
    op.drop_table("comments")
    op.drop_constraint("uq_like_menu_user", "likes", type_="unique")
    op.drop_table("likes")