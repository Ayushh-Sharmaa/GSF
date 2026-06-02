import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()


def _get_database_url() -> str:
    """Build the async-compatible DB URL, raising clearly if not configured."""
    url = os.getenv("DATABASE_URL", "")
    if not url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set. "
            "Copy python-backend/.env.example to python-backend/.env and fill it in."
        )
    # asyncpg requires the postgresql+asyncpg:// scheme
    return url.replace("postgresql://", "postgresql+asyncpg://")


# Lazy engine — only created on first import that uses the DB
_engine = None
_session_factory = None


def _get_engine():
    global _engine, _session_factory
    if _engine is None:
        _engine = create_async_engine(_get_database_url(), echo=False)
        _session_factory = async_sessionmaker(
            _engine, class_=AsyncSession, expire_on_commit=False
        )
    return _engine, _session_factory


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    _, factory = _get_engine()
    async with factory() as session:
        yield session
