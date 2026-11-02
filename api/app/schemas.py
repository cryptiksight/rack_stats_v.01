from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class PlayerBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    team: str = Field(default="Unassigned", min_length=1, max_length=80)
    skill_level: int = Field(default=3, ge=2, le=7, description="APA 8-ball skill level (2-7)")
    apa_number: str | None = Field(default=None, max_length=20)


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    team: str | None = Field(default=None, min_length=1, max_length=80)
    skill_level: int | None = Field(default=None, ge=2, le=7)
    apa_number: str | None = Field(default=None, max_length=20)


class PlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    team: str
    skill_level: int
    apa_number: str | None


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    logo: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=500)


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    logo: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=500)


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    logo: str | None
    description: str | None
    players: int


class MatchCreate(BaseModel):
    player_a_id: int
    player_b_id: int
    player_a_score: int = Field(ge=0, le=7)
    player_b_score: int = Field(ge=0, le=7)
    played_on: date | None = None


class MatchOut(BaseModel):
    id: int
    played_on: date
    player_a_id: int
    player_b_id: int
    player_a_name: str
    player_b_name: str
    player_a_team: str
    player_b_team: str
    player_a_score: int
    player_b_score: int
    player_a_skill: int
    player_b_skill: int
    winner_id: int
