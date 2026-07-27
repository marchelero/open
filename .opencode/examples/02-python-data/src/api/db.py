"""SQLite helpers. Synchronous sqlite3 for the demo; real apps use async drivers."""

from __future__ import annotations

import os
import sqlite3
from typing import Iterator

DB_PATH = os.environ.get("DATABASE_URL", "demo.db")


def get_conn() -> sqlite3.Connection:
    """Return a new connection. Caller closes it."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_schema() -> None:
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id   TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE
            )
            """
        )
        conn.commit()


def seed_if_empty() -> None:
    with get_conn() as conn:
        cur = conn.execute("SELECT COUNT(*) FROM users")
        (count,) = cur.fetchone()
        if count > 0:
            return
        conn.executemany(
            "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
            [
                ("u_1", "Ada Lovelace", "ada@example.com"),
                ("u_2", "Alan Turing", "alan@example.com"),
            ],
        )
        conn.commit()


def iter_users() -> Iterator[dict[str, str]]:
    with get_conn() as conn:
        for row in conn.execute("SELECT id, name, email FROM users ORDER BY id"):
            yield {"id": row["id"], "name": row["name"], "email": row["email"]}


def get_user(user_id: str) -> dict[str, str] | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, name, email FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        if row is None:
            return None
        return {"id": row["id"], "name": row["name"], "email": row["email"]}
