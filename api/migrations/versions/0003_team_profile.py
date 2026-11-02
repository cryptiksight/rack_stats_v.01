"""team logo and description

Revision ID: 0003_team_profile
Revises: 0002_teams
Create Date: 2026-11-02

Gives every team an optional logo (an image URL or short badge text) and a
description, so team records can be presented on the teams page.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_team_profile"
down_revision: Union[str, None] = "0002_teams"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("teams", sa.Column("logo", sa.String(length=500), nullable=True))
    op.add_column("teams", sa.Column("description", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("teams", "description")
    op.drop_column("teams", "logo")
