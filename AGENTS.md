# APA Tracker

APA 8-ball scorekeeper and stats tracker. React scorekeeper UI, FastAPI API, Postgres.

## Running it (Base44 sandbox)

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

Preview runs on host port 3000 (Vite dev server, mapped to container 5173). The API is
internal-only on port 8000 and is reached through the Vite dev proxy at `/api`, so the
browser talks to a single origin (no CORS, cookies stay simple).

## Layout

- `web/` — React 19 + Vite + TypeScript, React Router. Pages: standings, scorekeeper, players, match log.
- `api/` — FastAPI + SQLAlchemy 2 + psycopg 3, uvicorn `--reload`.
- `db/` — none; Postgres 16 runs as the `db` compose service with a named volume.

## Non-obvious setup notes

- **Dependencies install on container start**, not in an image: `pip install -r requirements.txt`
  for the API and `npm install` for the web app. Both run against the bind-mounted source.
  This keeps edits live but means the first boot is slower; later boots are cached.
- **No migration tool.** Tables are created by `Base.metadata.create_all` during API startup
  (`api/app/main.py`), which retries for ~30s while Postgres comes up. Adding a column to an
  existing volume requires dropping the volume or a manual `ALTER TABLE`.
- **Seed data** (`api/app/seed.py`) loads only when the `players` table is empty — 9 players on
  3 teams and 8 logged races. Delete a row, restart the API and it will not re-seed unless the
  table is fully empty.
- **APA race rule** is enforced server-side in `api/app/routers/matches.py`: a player's race
  target is their skill level, no score may exceed it, and exactly one player must reach their
  target. The scorekeeper UI mirrors the same rule but the API is the authority.
- **Match stats are computed in Python** (`api/app/routers/stats.py`), not SQL — fine at league
  scale, revisit if the log grows large.
- Deleting a player cascades to their matches (`ON DELETE CASCADE`).

## Verify it works

```bash
curl -s localhost:3000/api/health              # {"status":"ok"}
curl -s localhost:3000/api/stats/summary       # players/teams/matches/points
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/   # 200
```

There is no automated test suite yet. Run Python/Node commands inside the containers:

```bash
docker compose -f docker-compose.base44.yml exec -T api python -c "import app.main"
docker compose -f docker-compose.base44.yml exec -T web npx tsc --noEmit
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | liveness |
| GET/POST | `/api/players` | roster |
| PATCH/DELETE | `/api/players/{id}` | edit skill level / team, remove |
| GET/POST | `/api/matches` | race log, record a race |
| DELETE | `/api/matches/{id}` | remove a race |
| GET | `/api/stats/players` | per-player standings |
| GET | `/api/stats/teams` | team standings |
| GET | `/api/stats/summary` | league totals |
