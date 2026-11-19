import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.core.config import settings

logger = logging.getLogger(__name__)

# Normalize DATABASE_URL for standard SQLAlchemy driver
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite+aiosqlite:///"):
    db_url = db_url.replace("sqlite+aiosqlite:///", "sqlite:///")
elif db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

# SQLite specific connect args
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    echo=settings.DEBUG and settings.ENVIRONMENT == "development",
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and safely handles commit/rollback/close."""
    session = SessionLocal()
    try:
        yield session
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


def init_db() -> None:
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)
