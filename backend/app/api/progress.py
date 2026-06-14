"""Lesson progress endpoints.

The lesson engine arrives in Phase 2; these endpoints already provide the
per-profile storage it will use (upsert by profile_id + lesson_id).
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..db import get_session
from ..models import LessonProgress, LessonStatus, Profile

router = APIRouter(prefix="/progress", tags=["progress"])


class ProgressUpsert(BaseModel):
    lesson_id: str
    status: LessonStatus
    score: int = 0


@router.get("/{profile_id}", response_model=list[LessonProgress])
def list_progress(
    profile_id: int, session: Session = Depends(get_session)
) -> list[LessonProgress]:
    if session.get(Profile, profile_id) is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return list(
        session.exec(
            select(LessonProgress).where(LessonProgress.profile_id == profile_id)
        ).all()
    )


@router.put("/{profile_id}", response_model=LessonProgress)
def upsert_progress(
    profile_id: int,
    payload: ProgressUpsert,
    session: Session = Depends(get_session),
) -> LessonProgress:
    if session.get(Profile, profile_id) is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    row = session.exec(
        select(LessonProgress)
        .where(LessonProgress.profile_id == profile_id)
        .where(LessonProgress.lesson_id == payload.lesson_id)
    ).first()

    if row is None:
        row = LessonProgress(profile_id=profile_id, lesson_id=payload.lesson_id)

    row.status = payload.status
    row.score = max(row.score, payload.score)  # keep best score
    row.updated_at = datetime.now(timezone.utc)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row
