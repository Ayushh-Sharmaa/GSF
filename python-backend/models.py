import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def _now() -> datetime:
    """Timezone-aware UTC now — replaces deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc)


class Venture(Base):
    __tablename__ = "ventures"

    id:               Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id:    Mapped[str]        = mapped_column(String, nullable=False, unique=True)
    name:             Mapped[str]        = mapped_column(Text, default="")
    tagline:          Mapped[str]        = mapped_column(Text, default="")
    description:      Mapped[str]        = mapped_column(Text, default="")
    stage:            Mapped[str]        = mapped_column(String, default="Ideation")
    sector:           Mapped[str]        = mapped_column(String, default="")
    equity:           Mapped[str]        = mapped_column(String, default="0")
    funding_goal:     Mapped[str]        = mapped_column(String, default="0")
    traction:         Mapped[str]        = mapped_column(Text, default="")
    team_size:        Mapped[int]        = mapped_column(Integer, default=1)
    pitch_deck_url:   Mapped[str | None] = mapped_column(Text, nullable=True)
    team_members:     Mapped[list]       = mapped_column(JSONB, default=list)
    traction_metrics: Mapped[list]       = mapped_column(JSONB, default=list)
    created_at:       Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=_now)
    updated_at:       Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class ExpertProfile(Base):
    __tablename__ = "expert_profiles"

    id:               Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id:    Mapped[str]        = mapped_column(String, nullable=False, unique=True)
    title:            Mapped[str]        = mapped_column(String, default="")
    company:          Mapped[str]        = mapped_column(String, default="")
    location:         Mapped[str]        = mapped_column(String, default="")
    linkedin:         Mapped[str]        = mapped_column(String, default="")
    website:          Mapped[str]        = mapped_column(String, default="")
    experience:       Mapped[str]        = mapped_column(Text, default="")
    specializations:  Mapped[list]       = mapped_column(ARRAY(String), default=list)
    session_rate:     Mapped[int]        = mapped_column(Integer, default=100)
    weekly_slots:     Mapped[int]        = mapped_column(Integer, default=4)
    total_sessions:   Mapped[int]        = mapped_column(Integer, default=0)
    rating:           Mapped[str]        = mapped_column(String, default="0")
    is_verified:      Mapped[bool]       = mapped_column(Boolean, default=False)
    created_at:       Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=_now)
    updated_at:       Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class Session(Base):
    __tablename__ = "sessions"

    id:               Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    founder_clerk_id: Mapped[str]        = mapped_column(String, nullable=False)
    expert_clerk_id:  Mapped[str]        = mapped_column(String, nullable=False)
    founder_name:     Mapped[str]        = mapped_column(String, default="")
    expert_name:      Mapped[str]        = mapped_column(String, default="")
    venture_name:     Mapped[str]        = mapped_column(String, default="")
    scheduled_at:     Mapped[datetime]   = mapped_column(DateTime(timezone=True), nullable=False)
    duration:         Mapped[int]        = mapped_column(Integer, default=30)
    status:           Mapped[str]        = mapped_column(String, default="pending")
    credits_cost:     Mapped[int]        = mapped_column(Integer, default=100)
    credits_earned:   Mapped[int]        = mapped_column(Integer, default=80)
    notes:            Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at:       Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=_now)
    updated_at:       Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id:                 Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id:      Mapped[str]              = mapped_column(String, nullable=False)
    type:               Mapped[str]              = mapped_column(String, nullable=False)
    amount:             Mapped[int]              = mapped_column(Integer, nullable=False)
    reason:             Mapped[str]              = mapped_column(Text, nullable=False)
    balance_before:     Mapped[int]              = mapped_column(Integer, nullable=False)
    balance_after:      Mapped[int]              = mapped_column(Integer, nullable=False)
    related_session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True)
    created_at:         Mapped[datetime]         = mapped_column(DateTime(timezone=True), default=_now)
