import os
import logging
from pathlib import Path
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

logger = logging.getLogger("grievance_portal.database")

# Normalize DATABASE_URL for SQLAlchemy 2.0 (Render provides postgres:// which must be postgresql://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Ensure relative SQLite path always resolves to the absolute canonical project root grievances.db.
# This prevents different execution working directories from creating divergent/lost database files.
if db_url.startswith("sqlite"):
    if "./" in db_url or not (":/" in db_url or ":\\" in db_url or db_url.startswith("sqlite:////")):
        root_db = (Path(__file__).resolve().parent.parent.parent / "grievances.db").resolve()
        db_url = f"sqlite:///{root_db.as_posix()}"
        logger.info("Canonical SQLite database path: %s", db_url)

connect_args = {}
engine_kwargs = {"echo": settings.DEBUG}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 30}
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL / MySQL production resilience
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(db_url, **engine_kwargs)

# Enable SQLite Write-Ahead Logging (WAL) for atomic writes and multi-concurrency
if db_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _migrate_sqlite_columns():
    """Dynamically adds missing columns to existing SQLite tables without data loss."""
    if not db_url.startswith("sqlite"):
        return

    with engine.connect() as conn:
        # Check complaints table columns
        res = conn.execute(text("PRAGMA table_info(complaints)")).fetchall()
        existing_cols = {row[1] for row in res}

        complaint_columns = {
            "citizen_user_id": "VARCHAR(64)",
            "attachment_url": "VARCHAR(256)",
            "resolution_attachment_url": "VARCHAR(256)",
            "ward": "VARCHAR(64) DEFAULT 'Ward 1 - Central'",
            "pincode": "VARCHAR(16) DEFAULT ''",
            "assigned_officer_name": "VARCHAR(128)",
            "assigned_officer_phone": "VARCHAR(32)",
            "sla_due_date": "DATETIME",
            "feedback_rating": "INTEGER",
            "feedback_comment": "TEXT",
            "feedback_created_at": "DATETIME",
        }

        for col_name, col_type in complaint_columns.items():
            if col_name not in existing_cols:
                try:
                    conn.execute(text(f"ALTER TABLE complaints ADD COLUMN {col_name} {col_type}"))
                    logger.info(f"Added column {col_name} to complaints table.")
                except Exception as e:
                    logger.warning(f"Could not add column {col_name}: {e}")

        # Check citizens table columns
        res_citizens = conn.execute(text("PRAGMA table_info(citizens)")).fetchall()
        existing_citizen_cols = {row[1] for row in res_citizens}

        citizen_columns = {
            "password_display": "VARCHAR(128) DEFAULT ''",
            "is_active": "BOOLEAN DEFAULT 1",
        }

        for col_name, col_type in citizen_columns.items():
            if col_name not in existing_citizen_cols:
                try:
                    conn.execute(text(f"ALTER TABLE citizens ADD COLUMN {col_name} {col_type}"))
                    logger.info(f"Added column {col_name} to citizens table.")
                except Exception as e:
                    logger.warning(f"Could not add column {col_name}: {e}")

        conn.commit()


def init_db():
    from backend.app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _migrate_sqlite_columns()

