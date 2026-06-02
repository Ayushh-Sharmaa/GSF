from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user_id
from database import get_db
from models import Session

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class SessionCreate(BaseModel):
    expert_clerk_id: str
    founder_name:    str = ""
    expert_name:     str = ""
    venture_name:    str = ""
    scheduled_at:    datetime
    duration:        int = 30
    credits_cost:    int = 100
    credits_earned:  int = 80


@router.get("/")
async def get_sessions(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Session)
        .where(or_(Session.founder_clerk_id == user_id, Session.expert_clerk_id == user_id))
        .order_by(Session.scheduled_at.desc())
    )
    return result.scalars().all()


@router.post("/", status_code=201)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    session = Session(
        founder_clerk_id=user_id,
        expert_clerk_id=body.expert_clerk_id,
        founder_name=body.founder_name,
        expert_name=body.expert_name,
        venture_name=body.venture_name,
        scheduled_at=body.scheduled_at,
        duration=body.duration,
        credits_cost=body.credits_cost,
        credits_earned=body.credits_earned,
        status="pending",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/{session_id}")
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.founder_clerk_id != user_id and session.expert_clerk_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return session
