"""default is_active false

Revision ID: b7e4c9a2f013
Revises: a3f2c1d4e5b6
Create Date: 2026-04-14

"""

from alembic import op

revision = "b7e4c9a2f013"
down_revision = "a3f2c1d4e5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "is_active", server_default="false")


def downgrade() -> None:
    op.alter_column("users", "is_active", server_default="true")
