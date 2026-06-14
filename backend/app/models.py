"""Database models (SQLModel)."""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Instrument(str, Enum):
    bass = "bass"
    guitar = "guitar"


class LessonStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class Profile(SQLModel, table=True):
    """A local user profile. No login — selected from the home screen.

    Phase 0 seeds two: one bass (you) and one guitar (your wife).
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    instrument: Instrument
    created_at: datetime = Field(default_factory=_utcnow)


class LessonProgress(SQLModel, table=True):
    """Per-profile progress for a single lesson (lessons land in Phase 2)."""

    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: int = Field(foreign_key="profile.id", index=True)
    lesson_id: str = Field(index=True)
    status: LessonStatus = Field(default=LessonStatus.not_started)
    score: int = Field(default=0)  # 0-100, best score achieved
    updated_at: datetime = Field(default_factory=_utcnow)
