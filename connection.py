"""Database Configuration and SQLAlchemy Session Setup for URL Sentinel AI."""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_FILE = os.getenv("SQLITE_DB_PATH", "url_sentinel.db")
DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

# check_same_thread is False for SQLite in FastAPI multi-threaded request handlers
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that yields a database session and safely closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes tables in SQLite database if they don't already exist."""
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
