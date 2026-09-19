import datetime
from sqlalchemy.orm import Session
from backend.app.models import Complaint


def generate_complaint_id(db: Session) -> str:
    """
    Generates a unique complaint ID in format:
    GRV-YYYYMMDD-XXXXX (e.g. GRV-20260918-00001)
    """
    today_str = datetime.datetime.utcnow().strftime("%Y%m%d")
    prefix = f"GRV-{today_str}-"

    # Find the latest complaint created today
    latest = (
        db.query(Complaint.complaint_id)
        .filter(Complaint.complaint_id.like(f"{prefix}%"))
        .order_by(Complaint.id.desc())
        .first()
    )

    if latest and latest[0]:
        try:
            last_seq = int(latest[0].split("-")[-1])
            new_seq = last_seq + 1
        except (ValueError, IndexError):
            new_seq = 1
    else:
        new_seq = 1

    return f"{prefix}{new_seq:05d}"
