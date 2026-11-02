import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.exc import OperationalError

from .db import Base, SessionLocal, engine
from .routers import matches, players, stats
from .seed import seed_if_empty


def init_database(attempts: int = 30) -> None:
    for attempt in range(attempts):
        try:
            Base.metadata.create_all(engine)
            break
        except OperationalError:
            if attempt == attempts - 1:
                raise
            time.sleep(1)

    with SessionLocal() as db:
        seed_if_empty(db)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_database()
    yield


app = FastAPI(title="APA Tracker API", version="0.1.0", lifespan=lifespan)
app.include_router(players.router)
app.include_router(matches.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
