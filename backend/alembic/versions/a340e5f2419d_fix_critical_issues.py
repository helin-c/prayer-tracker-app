"""Fix critical issues

Revision ID: a340e5f2419d
Revises: 6784da3fe120
Create Date: 2025-12-26 20:43:35.034890
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a340e5f2419d"
down_revision: Union[str, Sequence[str], None] = "6784da3fe120"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Give the FK a stable name so downgrade is safe
FK_REQUESTER_ID = "fk_friendships_requester_id_users"

# Default notification preferences: all enabled (true)
DEFAULT_PREFS_JSONB_SQL = r"""
'{
  "prayerReminders": true,
  "completionReminders": true,
  "dailyVerse": true,
  "streakReminder": true,
  "jumuahReminder": true,

  "socialNotifications": true,
  "friendRequests": true,
  "friendPrayers": true,
  "friendStreaks": true
}'::jsonb
"""


def upgrade() -> None:
    """Upgrade schema."""
    # Indexes for friendships listing
    op.create_index(
        "idx_friend_status_created",
        "friendships",
        ["friend_id", "status", "created_at"],
        unique=False,
    )
    op.create_index(
        "idx_user_status_created",
        "friendships",
        ["user_id", "status", "created_at"],
        unique=False,
    )

    # Recreate requester_id FK with ON DELETE CASCADE (stable named constraint)
    op.drop_constraint(op.f("friendships_requester_id_fkey"), "friendships", type_="foreignkey")
    op.create_foreign_key(
        FK_REQUESTER_ID,
        "friendships",
        "users",
        ["requester_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Index for streak calculation queries
    op.create_index(
        "idx_streak_calc",
        "prayer_logs",
        ["user_id", "completed", "prayer_date"],
        unique=False,
    )

    # Push token for notifications (nullable is correct)
    op.add_column("users", sa.Column("push_token", sa.String(length=255), nullable=True))

    # notification_preferences: add safely for existing rows
    # 1) Add nullable
    op.add_column(
        "users",
        sa.Column("notification_preferences", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )

    # 2) Backfill existing users with defaults (all true)
    op.execute(
        f"""
        UPDATE users
        SET notification_preferences = {DEFAULT_PREFS_JSONB_SQL}
        WHERE notification_preferences IS NULL
        """
    )

    # 3) Enforce NOT NULL
    op.alter_column("users", "notification_preferences", nullable=False)

    # Optional: index push_token (helps lookup / cleanup)
    op.create_index(op.f("ix_users_push_token"), "users", ["push_token"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_users_push_token"), table_name="users")
    op.drop_column("users", "notification_preferences")
    op.drop_column("users", "push_token")

    op.drop_index("idx_streak_calc", table_name="prayer_logs")

    op.drop_constraint(FK_REQUESTER_ID, "friendships", type_="foreignkey")
    op.create_foreign_key(
        op.f("friendships_requester_id_fkey"),
        "friendships",
        "users",
        ["requester_id"],
        ["id"],
    )

    op.drop_index("idx_user_status_created", table_name="friendships")
    op.drop_index("idx_friend_status_created", table_name="friendships")
