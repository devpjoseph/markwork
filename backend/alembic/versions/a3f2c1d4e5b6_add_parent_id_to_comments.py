"""add parent_id to comments

Revision ID: a3f2c1d4e5b6
Revises: 1818d9d6f6b5
Create Date: 2026-03-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'a3f2c1d4e5b6'
down_revision = '1818d9d6f6b5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'comments',
        sa.Column(
            'parent_id',
            UUID(as_uuid=True),
            sa.ForeignKey('comments.id', ondelete='CASCADE'),
            nullable=True,
        ),
    )
    op.create_index('ix_comments_parent_id', 'comments', ['parent_id'])


def downgrade() -> None:
    op.drop_index('ix_comments_parent_id', table_name='comments')
    op.drop_column('comments', 'parent_id')
