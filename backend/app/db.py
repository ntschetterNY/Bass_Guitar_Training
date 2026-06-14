"""Database engine, session, and one-time seeding."""
from __future__ import annotations

from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine, select

from .config import settings
from .models import Instrument, Profile

# check_same_thread=False is required because FastAPI may use the connection
# across threads. SQLite file lives on a bind-mounted dataset (see compose.yaml).
engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    """Create tables and seed the two default profiles if the DB is empty."""
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        existing = session.exec(select(Profile)).first()
        if existing is None:
            session.add_all(
                [
                    Profile(name="Bass", instrument=Instrument.bass),
                    Profile(name="Guitar", instrument=Instrument.guitar),
                ]
            )
            session.commit()


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
