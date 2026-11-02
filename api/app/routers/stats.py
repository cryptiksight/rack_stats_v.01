from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Match, Player

router = APIRouter(prefix="/api/stats", tags=["stats"])


def _blank_row(player: Player) -> dict:
    return {
        "player_id": player.id,
        "name": player.name,
        "team": player.team,
        "skill_level": player.skill_level,
        "matches": 0,
        "wins": 0,
        "losses": 0,
        "points_for": 0,
        "points_against": 0,
        "win_rate": 0.0,
        "avg_points": 0.0,
    }


@router.get("/players")
def player_stats(db: Session = Depends(get_db)):
    players = db.scalars(select(Player).order_by(Player.name)).all()
    rows = {p.id: _blank_row(p) for p in players}

    for match in db.scalars(select(Match)).all():
        a_won = match.player_a_score == match.player_a_skill
        for player_id, scored, allowed, won in (
            (match.player_a_id, match.player_a_score, match.player_b_score, a_won),
            (match.player_b_id, match.player_b_score, match.player_a_score, not a_won),
        ):
            row = rows.get(player_id)
            if row is None:
                continue
            row["matches"] += 1
            row["wins" if won else "losses"] += 1
            row["points_for"] += scored
            row["points_against"] += allowed

    for row in rows.values():
        if row["matches"]:
            row["win_rate"] = round(row["wins"] / row["matches"] * 100, 1)
            row["avg_points"] = round(row["points_for"] / row["matches"], 2)

    return sorted(rows.values(), key=lambda r: (-r["wins"], -r["points_for"], r["name"]))


@router.get("/teams")
def team_stats(db: Session = Depends(get_db)):
    players = db.scalars(select(Player)).all()
    teams: dict[str, dict] = {}
    for player in players:
        teams.setdefault(
            player.team,
            {
                "team": player.team,
                "players": 0,
                "matches": 0,
                "wins": 0,
                "points_for": 0,
                "points_against": 0,
                "win_rate": 0.0,
            },
        )["players"] += 1

    team_of = {p.id: p.team for p in players}
    for match in db.scalars(select(Match)).all():
        a_won = match.player_a_score == match.player_a_skill
        for player_id, scored, allowed, won in (
            (match.player_a_id, match.player_a_score, match.player_b_score, a_won),
            (match.player_b_id, match.player_b_score, match.player_a_score, not a_won),
        ):
            team = teams.get(team_of.get(player_id))
            if team is None:
                continue
            team["matches"] += 1
            team["points_for"] += scored
            team["points_against"] += allowed
            if won:
                team["wins"] += 1

    for team in teams.values():
        if team["matches"]:
            team["win_rate"] = round(team["wins"] / team["matches"] * 100, 1)

    return sorted(teams.values(), key=lambda t: (-t["points_for"], t["team"]))


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    players = db.scalars(select(Player)).all()
    matches = db.scalars(select(Match)).all()
    points = sum(m.player_a_score + m.player_b_score for m in matches)
    teams = {p.team for p in players}
    return {
        "players": len(players),
        "teams": len(teams),
        "matches": len(matches),
        "points": points,
        "avg_points_per_match": round(points / len(matches), 1) if matches else 0.0,
    }
