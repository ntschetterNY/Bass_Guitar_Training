"""Profile endpoints — list/read/update the two local profiles."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import Profile

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("", response_model=list[Profile])
def list_profiles(session: Session = Depends(get_session)) -> list[Profile]:
    return list(session.exec(select(Profile)).all())


@router.get("/{profile_id}", response_model=Profile)
def get_profile(profile_id: int, session: Session = Depends(get_session)) -> Profile:
    profile = session.get(Profile, profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch("/{profile_id}", response_model=Profile)
def rename_profile(
    profile_id: int, name: str, session: Session = Depends(get_session)
) -> Profile:
    """Rename a profile (e.g. set your and your wife's names)."""
    profile = session.get(Profile, profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.name = name
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile
