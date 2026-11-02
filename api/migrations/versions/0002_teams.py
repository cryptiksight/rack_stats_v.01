"""teams as first-class records

Revision ID: 0002_teams
Revises: 0001_initial
Create Date: 2026-11-02

Creates the teams table, moves every distinct player.team label into it, points
players at the new row and drops the free-text column. Existing rosters and match
history are preserved.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_teams"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_teams_name", "teams", ["name"], unique=True)

    op.add_column("players", sa.Column("team_id", sa.Integer(), nullable=True))

    bind = op.get_bind()
    # One team row per distinct label already on the roster.
    bind.execute(
        sa.text(
            """
            INSERT INTO teams (name)
            SELECT DISTINCT BTRIM(team) FROM players
            WHERE team IS NOT NULL AND BTRIM(team) <> ''
            ON CONFLICT (name) DO NOTHING
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE players p SET team_id = t.id
            FROM teams t WHERE t.name = BTRIM(p.team)
            """
        )
    )
    # Only needed when a roster actually has blank/NULL team labels.
    bind.execute(
        sa.text(
            """
            INSERT INTO teams (name)
            SELECT 'Unassigned'
            WHERE EXISTS (SELECT 1 FROM players WHERE team_id IS NULL)
              AND NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Unassigned')
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE players SET team_id = (SELECT id FROM teams WHERE name = 'Unassigned')
            WHERE team_id IS NULL
            """
        )
    )

    op.alter_column("players", "team_id", existing_type=sa.Integer(), nullable=False)
    op.create_index("ix_players_team_id", "players", ["team_id"])
    op.create_foreign_key(
        "fk_players_team_id_teams", "players", "teams", ["team_id"], ["id"]
    )

    op.drop_index("ix_players_team", table_name="players")
    op.drop_column("players", "team")


def downgrade() -> None:
    op.add_column("players", sa.Column("team", sa.String(length=80), nullable=True))
    op.execute(
        """
        UPDATE players p SET team = t.name
        FROM teams t WHERE t.id = p.team_id
        """
    )
    op.execute("UPDATE players SET team = 'Unassigned' WHERE team IS NULL")
    op.alter_column("players", "team", existing_type=sa.String(length=80), nullable=False)
    op.create_index("ix_players_team", "players", ["team"])

    op.drop_constraint("fk_players_team_id_teams", "players", type_="foreignkey")
    op.drop_index("ix_players_team_id", table_name="players")
    op.drop_column("players", "team_id")

    op.drop_index("ix_teams_name", table_name="teams")
    op.drop_table("teams")
