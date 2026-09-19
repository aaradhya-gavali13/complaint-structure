import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

logger = logging.getLogger("grievance_portal.database")

# For SQLite, check_same_thread needs to be False
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG
)

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
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    with engine.connect() as conn:
        # Check complaints table columns
        res = conn.execute(text("PRAGMA table_info(complaints)")).fetchall()
        existing_cols = {row[1] for row in res}

        complaint_columns = {
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

        if "is_active" not in existing_citizen_cols:
            try:
                conn.execute(text("ALTER TABLE citizens ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                logger.info("Added column is_active to citizens table.")
            except Exception as e:
                logger.warning(f"Could not add column is_active: {e}")

        conn.commit()


def init_db():
    from backend.app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _migrate_sqlite_columns()
