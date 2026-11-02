from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..db import get_db
from ..models import Team
from ..schemas import TeamCreate, TeamOut, TeamUpdate

router = APIRouter(prefix="/api/teams", tags=["teams"])


def team_out(team: Team) -> TeamOut:
    return TeamOut(
        id=team.id,
        name=team.name,
        logo=team.logo,
        description=team.description,
        players=len(team.players),
    )


def _clean_name(name: str) -> str:
    cleaned = name.strip()
    if not cleaned:
        raise HTTPException(status_code=422, detail="Team name is required")
    return cleaned


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


@router.get("", response_model=list[TeamOut])
def list_teams(db: Session = Depends(get_db)):
    teams = db.scalars(
        select(Team).options(selectinload(Team.players)).order_by(Team.name)
    ).all()
    return [team_out(team) for team in teams]


@router.post("", response_model=TeamOut, status_code=201)
def create_team(payload: TeamCreate, db: Session = Depends(get_db)):
    team = Team(
        name=_clean_name(payload.name),
        logo=_clean_optional(payload.logo),
        description=_clean_optional(payload.description),
    )
    db.add(team)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A team with that name already exists")
    return team_out(team)


@router.patch("/{team_id}", response_model=TeamOut)
def update_team(team_id: int, payload: TeamUpdate, db: Session = Depends(get_db)):
    team = db.get(Team, team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")

    changes = payload.model_dump(exclude_unset=True)
    if "name" in changes:
        team.name = _clean_name(changes["name"])
    if "logo" in changes:
        team.logo = _clean_optional(changes["logo"])
    if "description" in changes:
        team.description = _clean_optional(changes["description"])

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A team with that name already exists")
    return team_out(team)


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: int, db: Session = Depends(get_db)):
    team = db.get(Team, team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.players:
        raise HTTPException(
            status_code=409,
            detail="This team still has players. Move them to another team first.",
        )
    db.delete(team)
    db.commit()
