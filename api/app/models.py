from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    logo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    players: Mapped[list["Player"]] = relationship(back_populates="team")


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    team_id: Mapped[int] = mapped_column(
        ForeignKey("teams.id", name="fk_players_team_id_teams"), index=True
    )
    skill_level: Mapped[int] = mapped_column(Integer, default=3)
    apa_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    team: Mapped[Team] = relationship(back_populates="players", lazy="joined")


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True)
    played_on: Mapped[date] = mapped_column(Date, default=date.today)
    player_a_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE")
    )
    player_b_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE")
    )
    player_a_score: Mapped[int] = mapped_column(Integer)
    player_b_score: Mapped[int] = mapped_column(Integer)
    player_a_skill: Mapped[int] = mapped_column(Integer)
    player_b_skill: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    player_a: Mapped[Player] = relationship(foreign_keys=[player_a_id], lazy="joined")
    player_b: Mapped[Player] = relationship(foreign_keys=[player_b_id], lazy="joined")
