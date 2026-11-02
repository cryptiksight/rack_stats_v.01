from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Match, Player
from ..schemas import MatchCreate, MatchOut

router = APIRouter(prefix="/api/matches", tags=["matches"])


def match_to_out(match: Match) -> MatchOut:
    winner_id = (
        match.player_a_id
        if match.player_a_score == match.player_a_skill
        else match.player_b_id
    )
    return MatchOut(
        id=match.id,
        played_on=match.played_on,
        player_a_id=match.player_a_id,
        player_b_id=match.player_b_id,
        player_a_name=match.player_a.name,
        player_b_name=match.player_b.name,
        player_a_team=match.player_a.team,
        player_b_team=match.player_b.team,
        player_a_score=match.player_a_score,
        player_b_score=match.player_b_score,
        player_a_skill=match.player_a_skill,
        player_b_skill=match.player_b_skill,
        winner_id=winner_id,
    )


@router.get("", response_model=list[MatchOut])
def list_matches(limit: int = 50, db: Session = Depends(get_db)):
    matches = db.scalars(
        select(Match).order_by(Match.played_on.desc(), Match.id.desc()).limit(limit)
    ).all()
    return [match_to_out(m) for m in matches]


@router.post("", response_model=MatchOut, status_code=201)
def create_match(payload: MatchCreate, db: Session = Depends(get_db)):
    if payload.player_a_id == payload.player_b_id:
        raise HTTPException(status_code=400, detail="A player cannot play themselves")

    player_a = db.get(Player, payload.player_a_id)
    player_b = db.get(Player, payload.player_b_id)
    if player_a is None or player_b is None:
        raise HTTPException(status_code=404, detail="Player not found")

    target_a, target_b = player_a.skill_level, player_b.skill_level
    if payload.player_a_score > target_a or payload.player_b_score > target_b:
        raise HTTPException(
            status_code=400,
            detail="A player cannot score more games than their skill level race",
        )

    a_reached = payload.player_a_score == target_a
    b_reached = payload.player_b_score == target_b
    if a_reached == b_reached:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Exactly one player must reach their race: "
                f"{player_a.name} to {target_a}, {player_b.name} to {target_b}"
            ),
        )

    match = Match(
        played_on=payload.played_on or date.today(),
        player_a_id=player_a.id,
        player_b_id=player_b.id,
        player_a_score=payload.player_a_score,
        player_b_score=payload.player_b_score,
        player_a_skill=target_a,
        player_b_skill=target_b,
    )
    db.add(match)
    db.commit()
    return match_to_out(match)


@router.delete("/{match_id}", status_code=204)
def delete_match(match_id: int, db: Session = Depends(get_db)):
    match = db.get(Match, match_id)
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(match)
    db.commit()
