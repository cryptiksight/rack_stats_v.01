import time
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from sqlalchemy import inspect
from sqlalchemy.exc import OperationalError

from .db import SessionLocal, engine
from .routers import matches, players, stats, teams
from .seed import seed_if_empty

API_ROOT = Path(__file__).resolve().parent.parent
BASELINE_REVISION = "0001_initial"


def wait_for_database(attempts: int = 30) -> None:
    for attempt in range(attempts):
        try:
            with engine.connect():
                return
        except OperationalError:
            if attempt == attempts - 1:
                raise
            time.sleep(1)


def migrate() -> None:
    config = Config(str(API_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(API_ROOT / "migrations"))

    tables = set(inspect(engine).get_table_names())
    # Databases built by the old create_all path already match the baseline schema.
    if "players" in tables and "alembic_version" not in tables:
        command.stamp(config, BASELINE_REVISION)
    command.upgrade(config, "head")


@asynccontextmanager
async def lifespan(_: FastAPI):
    wait_for_database()
    migrate()
    with SessionLocal() as db:
        seed_if_empty(db)
    yield


app = FastAPI(title="APA Tracker API", version="0.1.0", lifespan=lifespan)
app.include_router(players.router)
app.include_router(matches.router)
app.include_router(stats.router)
app.include_router(teams.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
