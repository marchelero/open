"""User routes. Read-only for the demo (GET /users, GET /users/{id})."""

from fastapi import APIRouter, HTTPException

from . import db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def list_users() -> dict[str, list[dict[str, str]]]:
    return {"users": list(db.iter_users())}


@router.get("/{user_id}")
def get_user(user_id: str) -> dict[str, str]:
    user = db.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail={"error": "user_not_found", "id": user_id})
    return user
