from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Player, Team
from ..schemas import PlayerCreate, PlayerOut, PlayerUpdate

router = APIRouter(prefix="/api/players", tags=["players"])


def player_out(player: Player) -> PlayerOut:
    return PlayerOut(
        id=player.id,
        name=player.name,
        team=player.team.name,
        skill_level=player.skill_level,
        apa_number=player.apa_number,
    )


def resolve_team(db: Session, name: str) -> Team:
    """Look a team up by name, creating it when the roster introduces a new one."""
    name = name.strip() or "Unassigned"
    team = db.scalar(select(Team).where(Team.name == name))
    if team is None:
        team = Team(name=name)
        db.add(team)
        db.flush()
    return team


@router.get("", response_model=list[PlayerOut])
def list_players(db: Session = Depends(get_db)):
    players = db.scalars(
        select(Player).join(Player.team).order_by(Team.name, Player.name)
    ).all()
    return [player_out(player) for player in players]


@router.get("/{player_id}", response_model=PlayerOut)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return player_out(player)


@router.post("", response_model=PlayerOut, status_code=201)
def create_player(payload: PlayerCreate, db: Session = Depends(get_db)):
    player = Player(
        name=payload.name.strip(),
        team=resolve_team(db, payload.team),
        skill_level=payload.skill_level,
        apa_number=payload.apa_number,
    )
    db.add(player)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A player with that name already exists")
    return player_out(player)


@router.patch("/{player_id}", response_model=PlayerOut)
def update_player(player_id: int, payload: PlayerUpdate, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    changes = payload.model_dump(exclude_unset=True)
    if changes.get("team") is not None:
        player.team = resolve_team(db, changes.pop("team"))
    else:
        changes.pop("team", None)

    for field, value in changes.items():
        setattr(player, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A player with that name already exists")
    return player_out(player)


@router.delete("/{player_id}", status_code=204)
def delete_player(player_id: int, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(player)
    db.commit()
