# rack_stats_v.01
APA scorekeeper and stats tracker.

## What's in it

- **Standings** — league totals plus per-player and per-team standings (races, W-L, win %, points).
- **Scorekeeper** — pick two players, each races to their APA skill level; tap games as they're
  won, the first to their number takes the race, then save it to the log.
- **Players** — roster with team, APA number and adjustable skill level (2–7).
- **Match log** — every race, newest first, with delete.

## Stack

React 19 + Vite (TypeScript) · FastAPI + SQLAlchemy · PostgreSQL 16

## Run locally

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

Open http://localhost:3000. The frontend proxies `/api` to the API service, so one origin serves
both. First boot installs dependencies (a minute or two); later boots are fast, and code edits
hot-reload on both sides.

See `AGENTS.md` for setup details and verification commands.
