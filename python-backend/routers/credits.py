from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import CreditTransaction
from auth import get_current_user_id

router = APIRouter(prefix="/api/credits", tags=["credits"])


@router.get("/")
async def get_credits(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.clerk_user_id == user_id)
        .order_by(CreditTransaction.created_at.desc())
        .limit(50)
    )
    log = result.scalars().all()
    # Default balance of 600 when no transactions exist yet (matches Clerk metadata default)
    balance = log[0].balance_after if log else 600
    return {"balance": balance, "log": log}
