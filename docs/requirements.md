# APA Stats Tracker — Requirements

Version 0.1 · Scope: APA 8-ball league scorekeeping and statistics.

## 1. Purpose

Give a league operator a single place to record APA 8-ball races and see, without spreadsheets,
who is winning, how teams are doing, and what happened on any given night.

Success looks like: a scorekeeper can enter a full night of races in under a minute each, and any
player can open the standings and see an accurate win rate derived from those races.

## 2. Users

| Persona | Needs |
| --- | --- |
| League operator | Enter results, fix mistakes, manage rosters and teams, see league-wide totals |
| Team captain | Team standings, roster skill levels, individual player records |
| Player | Own win rate, points, and recent match history |

No authentication in this version: one trusted operator per installation. Multi-user accounts and
roles are out of scope (see §9).

## 3. Domain rules (APA 8-ball)

These rules drive the math everywhere in the app.

1. **Skill level (SL)** is an integer 2–7 per player and may change over time.
2. **Race target** for a player in a match is their SL at the time of the match: an SL4 races to 4
   games, an SL3 to 3.
3. **Points** for a player = games they won in the race. Points are capped at their SL.
4. **Winner** = the player who reaches their race target first. Exactly one player can win a race;
   the loser's score must be below their own target.
5. **Team points** for a night = sum of the points won by that team's players.
6. Skill levels are **snapshotted** onto each match, so changing a player's SL later does not
   rewrite history.

## 4. Data model

```
Team     (id, name, created_at)
  └─ 0..* Player (id, team_id, name, apa_number, skill_level 2-7, created_at)

Match    (id, played_on, player_a_id, player_b_id,
          player_a_score, player_b_score,
          player_a_skill, player_b_skill, created_at)
```

Derived, never stored: winner, win rate, points totals, team standings.

## 5. Functional requirements

Priorities: **M** = must have for v0.1, **S** = should have, **C** = could have.

### FR-1 Player management (CRUD) — M

| ID | Requirement |
| --- | --- |
| FR-1.1 | Create a player with name (required, ≤80 chars), team, APA number (optional), skill level (2–7, default 3). |
| FR-1.2 | Player names are unique across the league; a duplicate is rejected with a clear message. |
| FR-1.3 | List all players, grouped or sortable by team, showing name, team, APA # and skill level. |
| FR-1.4 | View one player's profile: identity, current SL, career record (races, W-L, win rate, points). |
| FR-1.5 | Update any player field, including skill level; a change applies to future matches only. |
| FR-1.6 | Delete a player, with confirmation that names the player and warns that their matches are deleted too. |
| FR-1.7 | Changing a team name or moving a player between teams must not alter past match results. |

### FR-2 Team management (CRUD) — M

| ID | Requirement |
| --- | --- |
| FR-2.1 | Create a team with a unique name. |
| FR-2.2 | List teams with roster size and standings (points for, points against, race wins, win %). |
| FR-2.3 | View a team's roster and its players' skill levels. |
| FR-2.4 | Rename a team; every player on it follows, history is untouched. |
| FR-2.5 | Assign a player to a team, or move a player between teams, without losing their match history. |
| FR-2.6 | Delete a team only when it has no players; otherwise prompt to move or remove its players first. Deletion must never orphan matches. |
| FR-2.7 | A player belongs to exactly one team; an unassigned player is shown as "Unassigned". |

### FR-3 Match entry — M

| ID | Requirement |
| --- | --- |
| FR-3.1 | Pick two different players; each player's race target is shown from their current SL. |
| FR-3.2 | Record the games each player won; the scorekeeper can increment/decrement without typing. |
| FR-3.3 | Scores cannot exceed the player's race target, and decrementing below zero is impossible. |
| FR-3.4 | The "save" action is available only when a valid result exists: exactly one player has reached their target and the other has not. |
| FR-3.5 | Saving snapshots both players' SLs and derives the winner; the result appears in the match log immediately. |
| FR-3.6 | The same two players cannot play themselves in one race. |
| FR-3.7 | A match date is recorded, defaulting to today, and can be back-dated when entering an old race. |
| FR-3.8 | After saving, the form resets for the next race and confirms what was saved (players and score). |
| FR-3.9 | Editing an existing result (correcting a mis-entered score) is supported, and the standings reflect the correction. — S |

### FR-4 Player win rate and statistics — M

| ID | Requirement |
| --- | --- |
| FR-4.1 | Per player: races played, wins, losses, win rate, points for, points against, average points per race. |
| FR-4.2 | Win rate = wins ÷ races played × 100, shown to one decimal (e.g. `66.7%`). |
| FR-4.3 | A player with no races shows `—` rather than `0%`, so "unplayed" and "lost everything" are distinguishable. |
| FR-4.4 | Win rate counts a race once for each player; the winner is derived from the score, never stored twice. |
| FR-4.5 | Standings sort by wins, then points, then name so the order is stable. |
| FR-4.6 | Team standings aggregate members' races into points for/against and race win %. |
| FR-4.7 | League summary: number of players, teams, races played, total points, average points per race. |
| FR-4.8 | Deleting a match removes its effect from every statistic immediately. — M |
| FR-4.9 | Filter player statistics by team and by date range. — S |
| FR-4.10 | Trend data: a player's win rate over time or last-5 form. — C |

### FR-5 Match history — M

| ID | Requirement |
| --- | --- |
| FR-5.1 | Show every race, newest first, with date, both players, both teams, the score and the winner. |
| FR-5.2 | Scores display consistently and readably (e.g. `5–3`) and identify which side won. |
| FR-5.3 | The log identifies the winner by name, not only by a highlighted score. |
| FR-5.4 | Delete a race with confirmation; the row disappears and statistics recalculate. |
| FR-5.5 | Long histories are bounded (paged or limited) so the page stays fast; the default view is the most recent 50 races. |
| FR-5.6 | Filter history by player, by team, or by date range. — S |
| FR-5.7 | Show a player's full race history from their profile. — S |

### FR-6 Data integrity — M

| ID | Requirement |
| --- | --- |
| FR-6.1 | The server enforces every rule in §3, not just the UI: invalid scores, self-matches and double winners are rejected with a 400 and a readable message. |
| FR-6.2 | Referential integrity: a match always references two existing players; deleting a player cascades to their matches (explicitly confirmed in the UI). |
| FR-6.3 | Statistics are computed from stored matches on read, so they can never drift from the log. |
| FR-6.4 | Duplicate names (players, teams) return a conflict error the UI surfaces inline. |

### FR-7 Later / optional — C

- Handicap-adjusted points or "9-ball" scoring (20-point ball count) as a second mode.
- Seasons or sessions, with standings reset per season.
- CSV/PDF export of standings and match sheets.
- Authentication with operator vs. player roles.
- Player self-service: view own record, claim profile.

## 6. Non-functional requirements

- **Responsive**: usable on a phone beside the table (scorekeeper buttons are thumb-sized) and on a
  desktop for standings. No horizontal scrolling at 375px.
- **Speed**: standings and history respond in well under a second for a league-scale dataset
  (hundreds of players, thousands of races).
- **Persistence**: data survives container restarts (durable Postgres volume).
- **Clarity**: every rejected action explains why in plain language; empty states tell the user the
  next step.
- **Accessibility**: form controls labelled, score buttons have accessible names, colour never the
  only signal for win/loss.

## 7. Acceptance criteria

1. Adding a player with SL4 and then scoring a race for them shows "Race to 4"; the save button stays
   disabled until exactly one player reaches their target.
2. After saving a 4–2 race, the winner's win rate moves from `—` to `100%` and races played becomes 1.
3. Scoring a second race that the player loses turns their win rate into `50%`.
4. Entering 5 games for an SL4 player is impossible in the UI and rejected by the API.
5. Renaming a team updates it for its players without changing any logged score.
6. Deleting a team that still has players is refused with an explanation.
7. The match log lists the newest race first with date, matchup, score and winner, and deleting it
   immediately removes its effect from the standings.

## 8. Implementation status (v0.1)

| Area | Status | Notes |
| --- | --- | --- |
| Player create / list / update / delete | Built | Name uniqueness enforced; delete cascades to matches |
| Player profile with career record | Not built | Record is visible only in the standings table |
| Match entry with race rule | Built | Server + UI enforce §3; date defaults to today, no back-dating in UI |
| Match editing | Not built | Delete and re-enter is the current workaround |
| Match history list + delete | Built | Newest first, limited to 100 |
| History filters / pagination | Not built | Fixed limit only |
| Win rate & standings | Built | Player + team tables, 0-race players show `—` |
| League summary | Built | Players, teams, races, points, avg points/race |
| Teams as first-class records | Built | `teams` table with logo + description (`0002_teams`, `0003_team_profile`), `/api/teams` create / rename / delete, Teams page with logo, description and league record |
| Auth / roles | Out of scope | Single trusted operator |

Team management (FR-2) is built: the Teams page creates, renames and deletes teams, and a rename
follows to every player without touching logged results. The remaining gap in FR-2 is FR-2.3 — the
team card shows roster size and record, but there is no per-team roster view yet (use the Players
page, which lists each player's team and skill level).

## 9. Out of scope for v0.1

Scheduling, dues/payments, league handicapping review, messaging, mobile app, and multi-league
tenancy. Nothing here blocks those later.
