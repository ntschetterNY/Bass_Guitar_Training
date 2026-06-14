"""Health check endpoint — used by the frontend status indicator and CI smoke test."""
from __future__ import annotations

from fastapi import APIRouter

from ..config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "app": settings.app_name}
