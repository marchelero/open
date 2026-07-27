# 02 — Python + FastAPI + SQLite

Minimal read-only API used to demo the opencode starter pack. Two endpoints (`/users`, `/users/{id}`) backed by SQLite. The point is **not** the app — it's the pack workflow around it.

## What this demos

| Pack feature | Try it |
|---|---|
| `tdd-guide` (ROJO→VERDE→REFACTOR) | Add a `POST /users` endpoint with TDD |
| `python-reviewer` | Run `/code-review` on a change |
| `database-reviewer` | Run on a SQL change or new migration |
| `security-reviewer` | Run on a new endpoint that takes user input |
| `code-quality-analyzer` (mode: `simplify`) | Run `/simplify` on a change |
| `/quick-prd` | `/quick-prd "add /users POST endpoint with email validation"` |
| `/verify` | After the change, run `/verify` |
| `/flow-bugfix` | Plant a bug, run `/flow-bugfix "users POST accepts invalid email"` |

## Stack

- **Python**: >= 3.11
- **Framework**: FastAPI 0.111
- **Validation**: Pydantic 2
- **DB**: SQLite (stdlib `sqlite3`, sync)
- **Tests**: pytest + FastAPI TestClient
- **Lint**: ruff

## Run it

```bash
# Install (with uv — recommended; or use pip)
uv sync --extra dev
# or: python -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]"

# Lint
uv run ruff check src tests
# or: ruff check src tests

# Tests (4 tests, all green out of the box)
uv run pytest
# or: pytest

# Dev server
uv run uvicorn api.main:app --reload
# → http://localhost:8000/
# → http://localhost:8000/docs (FastAPI auto-generated)
```

## Files

```
02-python-data/
├── README.md           # this file
├── pyproject.toml      # fastapi + pydantic + pytest + ruff
├── .env.example        # DATABASE_URL, HOST, PORT, LOG_LEVEL
├── .gitignore
├── src/
│   └── api/
│       ├── __init__.py
│       ├── main.py      # FastAPI app + lifespan + / + /healthz
│       ├── db.py        # SQLite helpers (sync, stdlib)
│       └── users.py     # GET /users + GET /users/{id}
└── tests/
    └── test_users.py    # 4 integration tests via TestClient
```

## Suggested exercises (5-15 min each)

1. **TDD add a feature**: `/quick-prd "add POST /users that creates a user with name and email"`. Implement with tdd-guide. Verify the new test goes red→green.
2. **Review the change**: `/code-review` on the diff. Should approve.
3. **Add Pydantic validation**: add a `UserCreate` model with `EmailStr` and `min_length=1` name. Use it in the POST body.
4. **Plant a bug**: in `db.py`, change `get_user` to ignore the WHERE clause. Run `/flow-bugfix "GET /users/{id} returns wrong user"`. Watch the bug get reproduced, fixed, verified.
5. **SQL audit**: add a new query (e.g. search by name) using f-string interpolation. Run `database-reviewer`. Should flag SQL injection.
6. **Migrations**: replace the `init_schema()` with proper Alembic migrations. Run `database-reviewer` again.

## Pair with

- `examples/01-node-api` — same pack workflow, Node + TypeScript stack
- `examples/03-react-app` — same pack workflow, React + Vite stack

## Cleanup

After grokking the demo, delete the whole `02-python-data/` dir. The pack itself doesn't need it.
