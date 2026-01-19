"""Board states table for CRDT binary storage.

Revision ID: 003
Revises: 002
Create Date: 2026-01-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Board state storage (CRDT binary blobs)
    # Uses raw key-value storage, not ORM - see persistence.py for rationale
    op.create_table('board_states',
        sa.Column('board_id', sa.String(36), sa.ForeignKey('boards.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('state', sa.LargeBinary, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False)
    )


def downgrade() -> None:
    op.drop_table('board_states')
