from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Match, Player

PLAYERS = [
    ("Maria Alvarez", "Break & Run", 5, "APA-10421"),
    ("Dee Whitfield", "Break & Run", 4, "APA-10422"),
    ("Sam Okafor", "Break & Run", 3, "APA-10423"),
    ("Tommy Lee", "Rail Runners", 6, "APA-10511"),
    ("Priya Raman", "Rail Runners", 3, "APA-10512"),
    ("Hank Morales", "Rail Runners", 2, "APA-10513"),
    ("Jess Nakamura", "Chalk Dust", 4, "APA-10622"),
    ("Cal Brennan", "Chalk Dust", 5, "APA-10623"),
    ("Ruth Delgado", "Chalk Dust", 2, "APA-10624"),
]

# (player_a, player_b, a_score, b_score) with skill levels from PLAYERS above.
RESULTS = [
    ("Maria Alvarez", "Tommy Lee", 5, 3),
    ("Dee Whitfield", "Priya Raman", 4, 2),
    ("Sam Okafor", "Hank Morales", 3, 1),
    ("Jess Nakamura", "Tommy Lee", 2, 6),
    ("Cal Brennan", "Maria Alvarez", 3, 5),
    ("Ruth Delgado", "Dee Whitfield", 1, 4),
    ("Priya Raman", "Sam Okafor", 3, 2),
    ("Hank Morales", "Ruth Delgado", 2, 1),
]


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(Player.id).limit(1)) is not None:
        return

    players = {}
    for name, team, skill, apa_number in PLAYERS:
        player = Player(name=name, team=team, skill_level=skill, apa_number=apa_number)
        db.add(player)
        players[name] = player
    db.flush()

    today = date.today()
    for index, (name_a, name_b, score_a, score_b) in enumerate(RESULTS):
        player_a, player_b = players[name_a], players[name_b]
        db.add(
            Match(
                played_on=today - timedelta(days=len(RESULTS) - index),
                player_a_id=player_a.id,
                player_b_id=player_b.id,
                player_a_score=score_a,
                player_b_score=score_b,
                player_a_skill=player_a.skill_level,
                player_b_skill=player_b.skill_level,
            )
        )
    db.commit()
