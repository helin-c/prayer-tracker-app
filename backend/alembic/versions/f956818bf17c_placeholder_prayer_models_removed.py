"""Placeholder revision to replace removed prayer models migration.

Revision ID: f956818bf17c
Revises: 7dd33479bde8
Create Date: 2025-11-30
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "f956818bf17c"
down_revision: Union[str, Sequence[str], None] = "9ba7a9b1fbb3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op placeholder: original prayer tables migration was removed."""
    pass


def downgrade() -> None:
    """No-op rollback."""
    pass
