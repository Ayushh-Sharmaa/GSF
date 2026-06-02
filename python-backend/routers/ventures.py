from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user_id
from database import get_db
from models import Venture

router = APIRouter(prefix="/api/ventures", tags=["ventures"])


class VentureUpsert(BaseModel):
    name:             str        = ""
    tagline:          str        = ""
    description:      str        = ""
    stage:            str        = "Ideation"
    sector:           str        = ""
    equity:           str        = "0"
    funding_goal:     str        = "0"
    traction:         str        = ""
    team_size:        int        = 1
    pitch_deck_url:   str | None = None
    team_members:     list[Any]  = []
    traction_metrics: list[Any]  = []


@router.get("/")
async def get_venture(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(select(Venture).where(Venture.clerk_user_id == user_id))
    return result.scalar_one_or_none()


@router.post("/", status_code=201)
async def create_venture(
    body: VentureUpsert,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    venture = Venture(clerk_user_id=user_id, **body.model_dump())
    db.add(venture)
    await db.commit()
    await db.refresh(venture)
    return venture


@router.patch("/")
async def update_venture(
    body: VentureUpsert,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(select(Venture).where(Venture.clerk_user_id == user_id))
    venture = result.scalar_one_or_none()

    if not venture:
        venture = Venture(clerk_user_id=user_id, **body.model_dump())
        db.add(venture)
    else:
        for key, val in body.model_dump(exclude_unset=True).items():
            setattr(venture, key, val)

    await db.commit()
    await db.refresh(venture)
    return venture
