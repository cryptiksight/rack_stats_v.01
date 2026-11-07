"""baseline: players and matches

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-02

Captures the schema the app created before Alembic existed, so databases that were
built with create_all can be stamped at this revision instead of rebuilt.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "players",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("team", sa.String(length=80), nullable=False),
        sa.Column("skill_level", sa.Integer(), nullable=False),
        sa.Column("apa_number", sa.String(length=20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_players_name", "players", ["name"], unique=True)
    op.create_index("ix_players_team", "players", ["team"])

    op.create_table(
        "matches",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("played_on", sa.Date(), nullable=False),
        sa.Column(
            "player_a_id",
            sa.Integer(),
            sa.ForeignKey("players.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "player_b_id",
            sa.Integer(),
            sa.ForeignKey("players.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("player_a_score", sa.Integer(), nullable=False),
        sa.Column("player_b_score", sa.Integer(), nullable=False),
        sa.Column("player_a_skill", sa.Integer(), nullable=False),
        sa.Column("player_b_skill", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("matches")
    op.drop_index("ix_players_team", table_name="players")
    op.drop_index("ix_players_name", table_name="players")
    op.drop_table("players")
