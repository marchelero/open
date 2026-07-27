"""Integration tests for the users API. Uses FastAPI TestClient."""

from __future__ import annotations

import os
import tempfile

# Use a temp DB for tests BEFORE importing the app.
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DATABASE_URL"] = _tmp.name

from fastapi.testclient import TestClient  # noqa: E402

from api.main import app  # noqa: E402

client = TestClient(app)


def teardown_module(_module) -> None:
    try:
        os.unlink(_tmp.name)
    except FileNotFoundError:
        pass


def test_root_returns_service_info() -> None:
    res = client.get("/")
    assert res.status_code == 200
    body = res.json()
    assert body["service"] == "python-data-demo"
    assert body["status"] == "ok"


def test_list_users_returns_seeded_users() -> None:
    res = client.get("/users")
    assert res.status_code == 200
    body = res.json()
    names = [u["name"] for u in body["users"]]
    assert "Ada Lovelace" in names
    assert "Alan Turing" in names


def test_get_user_returns_user_when_found() -> None:
    res = client.get("/users/u_1")
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Ada Lovelace"
    assert body["email"] == "ada@example.com"


def test_get_user_returns_404_when_missing() -> None:
    res = client.get("/users/does_not_exist")
    assert res.status_code == 404
    body = res.json()
    assert body["detail"]["error"] == "user_not_found"
