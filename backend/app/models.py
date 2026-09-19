import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class CitizenUser(Base):
    __tablename__ = "citizens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(64), unique=True, index=True, nullable=False)
    full_name = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=False)
    password_hash = Column(String(256), nullable=False)
    password_display = Column(String(128), nullable=True, default="")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    complaints = relationship("Complaint", back_populates="citizen_user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "full_name": self.full_name,
            "phone": self.phone,
            "password": self.password_display or "••••••••",
            "is_active": self.is_active if self.is_active is not None else True,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }



class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String(32), unique=True, index=True, nullable=False)

    # Citizen account link
    citizen_user_id = Column(String(64), ForeignKey("citizens.user_id"), nullable=True, index=True)

    # Citizen information
    name = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=False)
    address = Column(Text, nullable=False)

    # Locality & Ward tags
    ward = Column(String(64), nullable=True, default="Ward 1 - Central")
    pincode = Column(String(16), nullable=True, default="")

    # Grievance details & attachments
    complaint_text = Column(Text, nullable=False)
    attachment_url = Column(String(256), nullable=True)  # Citizen "Before" evidence
    resolution_attachment_url = Column(String(256), nullable=True)  # Admin "After" proof
    status = Column(String(32), default="Submitted", nullable=False)

    # Departmental Officer Assignment & SLA
    assigned_officer_name = Column(String(128), nullable=True)
    assigned_officer_phone = Column(String(32), nullable=True)
    sla_due_date = Column(DateTime, nullable=True)

    # Citizen Post-Resolution Feedback & Star Rating
    feedback_rating = Column(Integer, nullable=True)  # 1 to 5 stars
    feedback_comment = Column(Text, nullable=True)
    feedback_created_at = Column(DateTime, nullable=True)

    # AI Classification Results
    issue = Column(String(255), nullable=True, default="Pending review")
    department = Column(String(128), nullable=True, default="Other / Human Review")
    priority = Column(String(32), nullable=True, default="MEDIUM")
    confidence = Column(Float, nullable=True, default=0.0)
    needs_human_review = Column(Boolean, nullable=False, default=True)
    reason = Column(Text, nullable=True, default="")

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False
    )

    # Relationships
    citizen_user = relationship("CitizenUser", back_populates="complaints")
    history = relationship(
        "StatusHistory",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="desc(StatusHistory.created_at)"
    )

    def to_public_dict(self):
        """Safe citizen tracking representation: strictly hides internal AI confidence while providing full lifecycle details."""
        return {
            "complaint_id": self.complaint_id,
            "status": self.status,
            "department": self.department or "Under Department Assignment",
            "priority": self.priority or "NORMAL",
            "ward": self.ward or "",
            "pincode": self.pincode or "",
            "attachment_url": self.attachment_url,
            "resolution_attachment_url": self.resolution_attachment_url,
            "assigned_officer_name": self.assigned_officer_name,
            "sla_due_date": self.sla_due_date.isoformat() if self.sla_due_date else None,
            "feedback_rating": self.feedback_rating,
            "feedback_comment": self.feedback_comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String(32), ForeignKey("complaints.complaint_id"), index=True, nullable=False)

    old_status = Column(String(32), nullable=False)
    new_status = Column(String(32), nullable=False)
    admin_note = Column(Text, nullable=True, default="")
    changed_by = Column(String(64), nullable=False, default="admin")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="history")
