"""FastAPI app factory + module-level singleton for uvicorn."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from . import db
from .users import router as users_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Init + teardown the SQLite database."""
    db.init_schema()
    db.seed_if_empty()
    yield


def build_app() -> FastAPI:
    app = FastAPI(
        title="python-data-demo",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.include_router(users_router)

    @app.get("/")
    def root() -> dict[str, str]:
        return {"service": "python-data-demo", "status": "ok"}

    @app.get("/healthz")
    def healthz() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = build_app()
