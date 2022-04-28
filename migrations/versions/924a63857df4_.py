"""empty message

Revision ID: 924a63857df4
Revises: 8a6419f289aa
Create Date: 2022-04-28 13:32:15.595148

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "924a63857df4"
down_revision = "8a6419f289aa"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "users",
        sa.Column("projects_comments_notifications", sa.Boolean(), nullable=True),
    )
    op.add_column(
        "users", sa.Column("tasks_comments_notifications", sa.Boolean(), nullable=True)
    )
    op.drop_column("users", "comments_notifications")
    op.execute("UPDATE users SET projects_comments_notifications = false")
    op.alter_column("users", "projects_comments_notifications", nullable=False)
    op.execute("UPDATE users SET tasks_comments_notifications = false")
    op.alter_column("users", "tasks_comments_notifications", nullable=False)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "users",
        sa.Column(
            "comments_notifications",
            sa.BOOLEAN(),
            server_default=sa.text("false"),
            autoincrement=False,
            nullable=False,
        ),
    )
    op.drop_column("users", "tasks_comments_notifications")
    op.drop_column("users", "projects_comments_notifications")
    # ### end Alembic commands ###
