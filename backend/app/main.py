import csv
import io
import os
import shutil
import uuid
import logging
import math
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, Query, Response, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.config import settings
from backend.app.database import get_db, init_db
from backend.app.models import Complaint, StatusHistory, CitizenUser
from backend.app.schemas import (
    CitizenRegisterRequest,
    CitizenLoginRequest,
    CitizenForgotPasswordRequest,
    CitizenResponse,
    CitizenTokenResponse,
    ComplaintCreateRequest,
    ComplaintCreateResponse,
    ComplaintTrackResponse,
    StatusHistoryItemResponse,
    FeedbackSubmitRequest,
    ClassifyRequest,
    ClassifyResponse,
    AdminLoginRequest,
    TokenResponse,
    AdminUserResponse,
    AdminComplaintItemResponse,
    AdminComplaintDetailResponse,
    AdminStatusUpdateRequest,
    OfficerAssignRequest,
    BulkStatusUpdateRequest,
    AdminPasswordResetRequest,
    AdminToggleStatusRequest,
    AdminStatisticsResponse,
    AnalyticsResponse,
    PaginatedComplaintsResponse,
    AdminCitizenItemResponse,
    AdminCitizensListResponse,
)

from backend.app.id_generator import generate_complaint_id
from backend.app.classifier import classify_complaint, ALLOWED_DEPARTMENTS, ALLOWED_PRIORITIES
from backend.app.auth import (
    authenticate_admin,
    create_access_token,
    get_current_admin,
    get_current_citizen,
    get_optional_citizen,
    hash_password,
    verify_password,
    DEFAULT_ADMIN_PASS,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grievance_portal")

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schemas & dynamic columns...")
    init_db()
    logger.info("Database ready. Connected to %s", settings.DATABASE_URL.split("@")[-1])
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Official Citizen Grievance Submission and Administrative Management API",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware for citizen and admin frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount uploads directory for static image/document serving
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ==============================================================================
# Public Info & Health & File Upload
# ==============================================================================

@app.get("/")
def home():
    return {
        "portal": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "Operational",
        "ai_model": settings.OLLAMA_MODEL,
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/complaints/upload", summary="Upload evidence image attachment")
async def upload_attachment(file: UploadFile = File(...)):
    """Uploads an evidence image or document and returns a static public URL."""
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Allowed file formats: JPG, PNG, WEBP, GIF, PDF"
        )

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "url": f"/uploads/{unique_filename}",
        "attachment_url": f"/uploads/{unique_filename}",
        "filename": unique_filename,
        "original_name": file.filename
    }


# ==============================================================================
# Citizen Authentication & Profile Endpoints
# ==============================================================================

@app.post(
    "/citizen/register",
    response_model=CitizenTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen account"
)
def citizen_register(
    payload: CitizenRegisterRequest,
    db: Session = Depends(get_db)
):
    clean_user_id = payload.user_id.strip().lower()

    # Check if user_id already exists (case-insensitive)
    existing_user = db.query(CitizenUser).filter(func.lower(CitizenUser.user_id) == clean_user_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User ID '{clean_user_id}' is already registered. Please choose another or log in."
        )

    clean_password = payload.password.strip()

    # Enforce strict password uniqueness across all accounts (including admin)
    if clean_password == DEFAULT_ADMIN_PASS or clean_password == "Admin@Grievance2026":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password is reserved or already registered. For security and privacy, every account must have a completely unique password."
        )

    # Enforce strict password uniqueness across all citizen accounts
    existing_pass = db.query(CitizenUser).filter(CitizenUser.password_display == clean_password).first()
    if existing_pass:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password is already registered by another citizen. For security and privacy, every citizen account must have a completely unique User ID and unique Password. Please choose a different password."
        )

    pw_hash = hash_password(clean_password)
    citizen = CitizenUser(
        user_id=clean_user_id,
        full_name=payload.full_name.strip(),
        phone=payload.phone.strip(),
        password_hash=pw_hash,
        password_display=clean_password,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(citizen)

    db.commit()
    db.refresh(citizen)

    token = create_access_token(data={"sub": citizen.user_id, "role": "citizen"})
    logger.info("New citizen registered: %s (%s)", citizen.user_id, citizen.full_name)

    return CitizenTokenResponse(
        access_token=token,
        token_type="bearer",
        user=CitizenResponse(
            id=citizen.id,
            user_id=citizen.user_id,
            full_name=citizen.full_name,
            phone=citizen.phone,
            is_active=citizen.is_active,
            created_at=citizen.created_at
        )
    )


@app.post(
    "/citizen/login",
    response_model=CitizenTokenResponse,
    summary="Citizen Login with User ID and Password"
)
def citizen_login(
    payload: CitizenLoginRequest,
    db: Session = Depends(get_db)
):
    clean_user_id = payload.user_id.strip().lower()
    citizen = db.query(CitizenUser).filter(CitizenUser.user_id == clean_user_id).first()
    if not citizen or not verify_password(payload.password, citizen.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Citizen User ID or Password. Please check your credentials."
        )

    if not citizen.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your citizen account has been suspended by administration. Please contact support."
        )

    token = create_access_token(data={"sub": citizen.user_id, "role": "citizen"})
    return CitizenTokenResponse(
        access_token=token,
        token_type="bearer",
        user=CitizenResponse(
            id=citizen.id,
            user_id=citizen.user_id,
            full_name=citizen.full_name,
            phone=citizen.phone,
            is_active=citizen.is_active,
            created_at=citizen.created_at
        )
    )


@app.post(
    "/citizen/forgot-password",
    summary="Reset citizen password with User ID and registered phone number verification"
)
def citizen_forgot_password(
    payload: CitizenForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    clean_user_id = payload.user_id.strip().lower()
    clean_phone = payload.phone.strip()
    clean_new_password = payload.new_password.strip()

    if len(clean_new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    # Enforce reserved password check
    if clean_new_password == DEFAULT_ADMIN_PASS or clean_new_password == "Admin@Grievance2026":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password is reserved. Please choose a different password."
        )

    # Locate citizen by user_id or registered phone number
    citizen = db.query(CitizenUser).filter(
        or_(
            CitizenUser.user_id == clean_user_id,
            CitizenUser.phone == clean_phone,
            CitizenUser.phone == clean_user_id
        )
    ).first()

    if not citizen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Citizen account not found. Please verify your User ID or Mobile Phone number."
        )

    # Verify phone number match (clean digits)
    input_digits = "".join(filter(str.isdigit, clean_phone))
    stored_digits = "".join(filter(str.isdigit, citizen.phone))

    if input_digits and stored_digits:
        # Match if either is a substring of the other (e.g. 9876543210 vs +919876543210)
        if input_digits not in stored_digits and stored_digits not in input_digits:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The provided mobile number does not match the registered number for this Citizen User ID."
            )
    else:
        if clean_phone.lower() != citizen.phone.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The provided mobile number does not match the registered record."
            )

    # Check password uniqueness across other citizen accounts
    existing_pass = db.query(CitizenUser).filter(
        CitizenUser.password_display == clean_new_password,
        CitizenUser.id != citizen.id
    ).first()
    if existing_pass:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password is used by another account. Please choose a unique password."
        )

    citizen.password_hash = hash_password(clean_new_password)
    citizen.password_display = clean_new_password
    db.commit()
    db.refresh(citizen)

    logger.info("Password successfully reset for citizen %s", citizen.user_id)
    return {
        "success": True,
        "message": f"Password reset successfully for User ID '{citizen.user_id}'. You can now log in.",
        "user_id": citizen.user_id
    }


@app.get(
    "/citizen/me",
    response_model=CitizenResponse,
    summary="Get current logged-in citizen profile"
)
def citizen_me(current_citizen: CitizenUser = Depends(get_current_citizen)):
    return CitizenResponse(
        id=current_citizen.id,
        user_id=current_citizen.user_id,
        full_name=current_citizen.full_name,
        phone=current_citizen.phone,
        is_active=current_citizen.is_active,
        created_at=current_citizen.created_at
    )


@app.get(
    "/citizen/my-complaints",
    response_model=List[ComplaintTrackResponse],
    summary="List all complaints submitted by the authenticated citizen"
)
def citizen_my_complaints(
    current_citizen: CitizenUser = Depends(get_current_citizen),
    db: Session = Depends(get_db)
):
    complaints = (
        db.query(Complaint)
        .filter(Complaint.citizen_user_id == current_citizen.user_id)
        .order_by(Complaint.id.desc())
        .all()
    )

    results = []
    for c in complaints:
        history_items = [
            StatusHistoryItemResponse(
                id=h.id,
                complaint_id=h.complaint_id,
                old_status=h.old_status,
                new_status=h.new_status,
                admin_note=h.admin_note or "",
                changed_by=h.changed_by,
                created_at=h.created_at
            )
            for h in c.history
        ]
        # Find latest admin message/note
        latest_msg = ""
        latest_msg_time = None
        for h in c.history:
            if h.admin_note and h.admin_note.strip():
                latest_msg = h.admin_note.strip()
                latest_msg_time = h.created_at
                break

        results.append(
            ComplaintTrackResponse(
                complaint_id=c.complaint_id,
                status=c.status,
                department=c.department or "Under Department Assignment",
                priority=c.priority or "MEDIUM",
                ward=c.ward or "",
                pincode=c.pincode or "",
                address=c.address or "",
                attachment_url=c.attachment_url,
                resolution_attachment_url=c.resolution_attachment_url,
                assigned_officer_name=c.assigned_officer_name,
                sla_due_date=c.sla_due_date,
                feedback_rating=c.feedback_rating,
                feedback_comment=c.feedback_comment,
                created_at=c.created_at,
                updated_at=c.updated_at,
                complaint_text=c.complaint_text,
                citizen_name=c.name,
                admin_message=latest_msg,
                admin_message_updated_at=latest_msg_time,
                history=history_items
            )
        )
    return results


# ==============================================================================
# Grievance Intake & Tracking Endpoints
# ==============================================================================

@app.post(
    "/complaints",
    response_model=ComplaintCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a citizen grievance (Authenticated Citizen Only)"
)
def submit_complaint(
    payload: ComplaintCreateRequest,
    db: Session = Depends(get_db),
    current_citizen: CitizenUser = Depends(get_current_citizen)
):
    complaint_id = generate_complaint_id(db)
    classification = classify_complaint(payload.complaint)

    priority = classification.get("priority", "MEDIUM").upper()
    priority_sla_hours = {
        "CRITICAL": 24,
        "HIGH": 48,
        "MEDIUM": 72,
        "LOW": 120,
    }
    hours = priority_sla_hours.get(priority, 72)
    initial_sla = datetime.utcnow() + timedelta(hours=hours)

    new_complaint = Complaint(
        complaint_id=complaint_id,
        citizen_user_id=current_citizen.user_id,
        name=payload.name.strip(),
        phone=payload.phone.strip(),
        address=payload.address.strip(),
        ward=payload.ward.strip() if payload.ward else "Ward 1 - Central",
        pincode=payload.pincode.strip() if payload.pincode else "",
        complaint_text=payload.complaint.strip(),
        attachment_url=payload.attachment_url,
        status="Submitted",
        issue=classification.get("issue", "Citizen Grievance"),
        department=classification.get("department", "Other / Human Review"),
        priority=priority,
        confidence=classification.get("confidence", 0.0),
        needs_human_review=classification.get("needs_human_review", True),
        reason=classification.get("reason", "Awaiting triage"),
        sla_due_date=initial_sla,
    )

    db.add(new_complaint)
    db.flush()

    # Create initial status history entry
    initial_history = StatusHistory(
        complaint_id=complaint_id,
        old_status="None",
        new_status="Submitted",
        admin_note=f"Grievance registered. Automatic SLA estimated at {hours} hours.",
        changed_by=f"Citizen ({current_citizen.user_id})"
    )
    db.add(initial_history)
    db.commit()
    db.refresh(new_complaint)

    logger.info(
        "New grievance logged: %s by %s | Dept: %s | Priority: %s",
        complaint_id, current_citizen.user_id, new_complaint.department, new_complaint.priority
    )

    return ComplaintCreateResponse(
        complaint_id=new_complaint.complaint_id,
        status=new_complaint.status,
        message="Complaint submitted successfully",
        created_at=new_complaint.created_at
    )

@app.get(
    "/complaints/lookup/by-contact",
    summary="Find Grievance Registration Numbers by Mobile Number or Citizen User ID"
)
def lookup_complaints_by_contact(
    query: str = Query(..., description="Mobile number or Citizen User ID"),
    db: Session = Depends(get_db)
):
    clean_query = query.strip()
    if len(clean_query) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least 3 characters or digits to search."
        )

    # Clean digits for flexible mobile phone match
    cleaned_digits = "".join(filter(str.isdigit, clean_query))

    filter_conditions = [
        Complaint.phone.ilike(f"%{clean_query}%"),
        Complaint.citizen_user_id.ilike(f"%{clean_query}%"),
        Complaint.name.ilike(f"%{clean_query}%"),
    ]
    if cleaned_digits and len(cleaned_digits) >= 4:
        filter_conditions.append(Complaint.phone.ilike(f"%{cleaned_digits}%"))

    matches = (
        db.query(Complaint)
        .filter(or_(*filter_conditions))
        .order_by(Complaint.id.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "complaint_id": c.complaint_id,
            "status": c.status,
            "department": c.department or "Under Department Assignment",
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "citizen_name": c.name,
            "issue": c.issue or (c.complaint_text[:60] + "..." if len(c.complaint_text) > 60 else c.complaint_text),
            "phone_masked": f"{c.phone[:2]}******{c.phone[-2:]}" if len(c.phone) >= 6 else c.phone
        }
        for c in matches
    ]


@app.get(
    "/complaints/{complaint_id}",
    response_model=ComplaintTrackResponse,
    summary="Track a citizen grievance by ID with live administrative updates"
)
def track_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_citizen: Optional[CitizenUser] = Depends(get_optional_citizen)
):
    clean_id = complaint_id.strip().upper()
    complaint = db.query(Complaint).filter(Complaint.complaint_id == clean_id).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grievance ID '{complaint_id}' was not found in our central registry. Please verify the ticket format."
        )

    # If logged in as citizen, ensure citizen cannot view someone else's complaint
    if current_citizen and complaint.citizen_user_id and complaint.citizen_user_id != current_citizen.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. You do not have permission to view this complaint."
        )

    history_items = [
        StatusHistoryItemResponse(
            id=h.id,
            complaint_id=h.complaint_id,
            old_status=h.old_status,
            new_status=h.new_status,
            admin_note=h.admin_note or "",
            changed_by=h.changed_by,
            created_at=h.created_at
        )
        for h in complaint.history
    ]

    # Find latest admin message/note
    latest_msg = ""
    latest_msg_time = None
    for h in complaint.history:
        if h.admin_note and h.admin_note.strip():
            latest_msg = h.admin_note.strip()
            latest_msg_time = h.created_at
            break

    return ComplaintTrackResponse(
        complaint_id=complaint.complaint_id,
        status=complaint.status,
        department=complaint.department or "Under Department Assignment",
        priority=complaint.priority or "MEDIUM",
        ward=complaint.ward or "",
        pincode=complaint.pincode or "",
        address=complaint.address or "",
        attachment_url=complaint.attachment_url,
        resolution_attachment_url=complaint.resolution_attachment_url,
        assigned_officer_name=complaint.assigned_officer_name,
        sla_due_date=complaint.sla_due_date,
        feedback_rating=complaint.feedback_rating,
        feedback_comment=complaint.feedback_comment,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        complaint_text=complaint.complaint_text,
        citizen_name=complaint.name,
        admin_message=latest_msg,
        admin_message_updated_at=latest_msg_time,
        history=history_items
    )


@app.post(
    "/citizen/complaints/{complaint_id}/feedback",
    summary="Submit citizen resolution feedback and star rating"
)
def submit_citizen_feedback(
    complaint_id: str,
    payload: FeedbackSubmitRequest,
    db: Session = Depends(get_db),
    current_citizen: CitizenUser = Depends(get_current_citizen)
):
    clean_id = complaint_id.strip().upper()
    complaint = db.query(Complaint).filter(Complaint.complaint_id == clean_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if complaint.citizen_user_id != current_citizen.user_id:
        raise HTTPException(status_code=403, detail="You can only submit feedback for your own grievances.")

    if complaint.status != "Resolved":
        raise HTTPException(status_code=400, detail="Feedback can only be provided once a grievance is marked as Resolved.")

    complaint.feedback_rating = payload.rating
    complaint.feedback_comment = payload.comment.strip() if payload.comment else ""
    complaint.feedback_created_at = datetime.utcnow()

    # Record in history
    db.add(StatusHistory(
        complaint_id=clean_id,
        old_status=complaint.status,
        new_status=complaint.status,
        admin_note=f"Citizen rated resolution {payload.rating}/5 stars. Comment: '{complaint.feedback_comment}'",
        changed_by=f"Citizen (@{current_citizen.user_id})"
    ))
    db.commit()
    return {
        "status": "ok",
        "feedback_rating": complaint.feedback_rating,
        "feedback_comment": complaint.feedback_comment,
        "message": "Thank you! Your feedback has been recorded."
    }


# ==============================================================================
# Legacy AI Classifier Passthrough
# ==============================================================================

@app.post("/classify", response_model=ClassifyResponse, summary="Direct AI classification query")
def classify_text_endpoint(payload: ClassifyRequest):
    return classify_complaint(payload.complaint)


# ==============================================================================
# Administrator Portal Endpoints
# ==============================================================================

@app.post("/admin/login", response_model=TokenResponse, summary="Admin Authentication")
def admin_login(payload: AdminLoginRequest):
    admin = authenticate_admin(payload.username, payload.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator username or password."
        )

    token = create_access_token(data={"sub": admin["username"], "role": "admin"})
    return TokenResponse(
        access_token=token,
        username=admin["username"],
        full_name=admin["full_name"],
        role=admin["role"]
    )


@app.get("/admin/me", response_model=AdminUserResponse, summary="Get current logged in admin")
def get_admin_profile(current_admin: dict = Depends(get_current_admin)):
    return AdminUserResponse(
        username=current_admin["username"],
        full_name=current_admin["full_name"],
        email=current_admin["email"],
        role=current_admin["role"]
    )


@app.get("/admin/statistics", response_model=AdminStatisticsResponse, summary="Get grievance dashboard metrics")
def get_admin_statistics(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    total = db.query(Complaint).count()
    critical = db.query(Complaint).filter(Complaint.priority == "CRITICAL").count()
    high = db.query(Complaint).filter(Complaint.priority == "HIGH").count()
    medium = db.query(Complaint).filter(Complaint.priority == "MEDIUM").count()
    low = db.query(Complaint).filter(Complaint.priority == "LOW").count()
    human_review = db.query(Complaint).filter(
        or_(Complaint.needs_human_review == True, Complaint.confidence < 0.70)
    ).count()
    resolved = db.query(Complaint).filter(Complaint.status == "Resolved").count()
    pending = total - resolved

    # Department breakdown
    dept_rows = db.query(Complaint.department, func.count(Complaint.id)).group_by(Complaint.department).all()
    by_department = {row[0] or "Other / Human Review": row[1] for row in dept_rows}

    # Priority breakdown
    prio_rows = db.query(Complaint.priority, func.count(Complaint.id)).group_by(Complaint.priority).all()
    by_priority = {row[0] or "MEDIUM": row[1] for row in prio_rows}

    # Status breakdown
    status_rows = db.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status).all()
    by_status = {}
    for st in ["Submitted", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected"]:
        by_status[st] = 0
    for st, count in status_rows:
        by_status[st] = count

    # Timeline breakdown (recent activity)
    timeline_rows = (
        db.query(func.date(Complaint.created_at).label("dt"), func.count(Complaint.id))
        .group_by(func.date(Complaint.created_at))
        .order_by(func.date(Complaint.created_at).desc())
        .limit(7)
        .all()
    )
    timeline = [{"date": str(dt), "count": count} for dt, count in reversed(timeline_rows)]
    if not timeline:
        timeline = [{"date": datetime.utcnow().strftime("%Y-%m-%d"), "count": total}]

    citizens_count = db.query(CitizenUser).count()

    return AdminStatisticsResponse(
        total=total,
        critical=critical,
        high=high,
        medium=medium,
        low=low,
        human_review=human_review,
        human_review_required=human_review,
        pending=pending,
        resolved=resolved,
        citizens_count=citizens_count,
        by_department=by_department,
        by_priority=by_priority,
        by_status=by_status,
        by_timeline=timeline,
        timeline=timeline,
    )


@app.get(
    "/admin/complaints",
    response_model=PaginatedComplaintsResponse,
    summary="Filtered & paginated complaints registry"
)
def get_admin_complaints(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    human_review: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    query = db.query(Complaint)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.complaint_id.ilike(s),
                Complaint.name.ilike(s),
                Complaint.issue.ilike(s),
                Complaint.complaint_text.ilike(s),
                Complaint.department.ilike(s),
                Complaint.citizen_user_id.ilike(s),
                Complaint.ward.ilike(s),
            )
        )

    if priority and priority != "ALL":
        query = query.filter(Complaint.priority == priority.upper())

    if department and department != "ALL":
        query = query.filter(Complaint.department == department)

    if status and status != "ALL":
        query = query.filter(Complaint.status == status)

    if human_review is not None:
        hr_val = str(human_review).strip().lower()
        if hr_val in ("true", "1", "yes"):
            query = query.filter(or_(Complaint.needs_human_review == True, Complaint.confidence < 0.70))
        elif hr_val in ("false", "0", "no"):
            query = query.filter(Complaint.needs_human_review == False, Complaint.confidence >= 0.70)

    total = query.count()
    total_pages = max(1, math.ceil(total / limit))

    offset = (page - 1) * limit
    items = query.order_by(Complaint.id.desc()).offset(offset).limit(limit).all()

    response_items = [
        AdminComplaintItemResponse(
            id=c.id,
            complaint_id=c.complaint_id,
            citizen_user_id=c.citizen_user_id,
            created_at=c.created_at,
            citizen_name=c.name or "Citizen",
            name=c.name or "Citizen",
            issue=c.issue or "Grievance",
            department=c.department or "Other / Human Review",
            priority=c.priority or "MEDIUM",
            ward=c.ward or "",
            attachment_url=c.attachment_url,
            resolution_attachment_url=c.resolution_attachment_url,
            assigned_officer_name=c.assigned_officer_name,
            sla_due_date=c.sla_due_date,
            feedback_rating=c.feedback_rating,
            confidence=c.confidence or 0.0,
            ai_confidence=c.confidence or 0.0,
            needs_human_review=bool(c.needs_human_review or (c.confidence is not None and c.confidence < 0.70)),
            status=c.status,
        )
        for c in items
    ]

    return PaginatedComplaintsResponse(
        items=response_items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@app.get(
    "/admin/complaints/{complaint_id}",
    response_model=AdminComplaintDetailResponse,
    summary="Get full complaint detail (Admin Only)"
)
def get_admin_complaint_detail(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    clean_id = complaint_id.strip().upper()
    complaint = db.query(Complaint).filter(Complaint.complaint_id == clean_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found."
        )

    history_items = [
        {
            "id": h.id,
            "complaint_id": h.complaint_id,
            "old_status": h.old_status,
            "new_status": h.new_status,
            "admin_note": h.admin_note or "",
            "changed_by": h.changed_by,
            "created_at": h.created_at
        }
        for h in complaint.history
    ]

    return AdminComplaintDetailResponse(
        id=complaint.id,
        complaint_id=complaint.complaint_id,
        citizen_user_id=complaint.citizen_user_id,
        citizen_name=complaint.name,
        name=complaint.name,
        citizen_phone=complaint.phone,
        phone=complaint.phone,
        citizen_address=complaint.address,
        address=complaint.address,
        ward=complaint.ward or "",
        pincode=complaint.pincode or "",
        complaint_text=complaint.complaint_text,
        attachment_url=complaint.attachment_url,
        resolution_attachment_url=complaint.resolution_attachment_url,
        assigned_officer_name=complaint.assigned_officer_name,
        assigned_officer_phone=complaint.assigned_officer_phone,
        sla_due_date=complaint.sla_due_date,
        feedback_rating=complaint.feedback_rating,
        feedback_comment=complaint.feedback_comment,
        status=complaint.status,
        issue=complaint.issue or "Grievance",
        department=complaint.department or "Other / Human Review",
        priority=complaint.priority or "MEDIUM",
        confidence=complaint.confidence or 0.0,
        ai_confidence=complaint.confidence or 0.0,
        needs_human_review=bool(complaint.needs_human_review or (complaint.confidence is not None and complaint.confidence < 0.70)),
        reason=complaint.reason or "No AI explanation available.",
        ai_reason=complaint.reason or "No AI explanation available.",
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        history=history_items,
        status_history=history_items,
    )


@app.patch(
    "/admin/complaints/{complaint_id}/status",
    response_model=AdminComplaintDetailResponse,
    summary="Update complaint status & record audit history"
)
def update_admin_complaint_status(
    complaint_id: str,
    payload: AdminStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    clean_id = complaint_id.strip().upper()
    complaint = db.query(Complaint).filter(Complaint.complaint_id == clean_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    old_status = complaint.status
    new_status = payload.status

    complaint.status = new_status
    if payload.resolution_attachment_url:
        complaint.resolution_attachment_url = payload.resolution_attachment_url
    complaint.updated_at = datetime.utcnow()

    # Record in StatusHistory table
    history_entry = StatusHistory(
        complaint_id=clean_id,
        old_status=old_status,
        new_status=new_status,
        admin_note=payload.admin_note or "",
        changed_by=current_admin.get("full_name") or current_admin.get("username", "admin"),
        created_at=datetime.utcnow()
    )

    db.add(history_entry)
    db.commit()
    db.refresh(complaint)

    logger.info("Complaint %s status updated: %s -> %s by %s", clean_id, old_status, new_status, current_admin["username"])

    history_items = [
        {
            "id": h.id,
            "complaint_id": h.complaint_id,
            "old_status": h.old_status,
            "new_status": h.new_status,
            "admin_note": h.admin_note or "",
            "changed_by": h.changed_by,
            "created_at": h.created_at
        }
        for h in complaint.history
    ]

    return AdminComplaintDetailResponse(
        id=complaint.id,
        complaint_id=complaint.complaint_id,
        citizen_user_id=complaint.citizen_user_id,
        citizen_name=complaint.name,
        name=complaint.name,
        citizen_phone=complaint.phone,
        phone=complaint.phone,
        citizen_address=complaint.address,
        address=complaint.address,
        ward=complaint.ward or "",
        pincode=complaint.pincode or "",
        complaint_text=complaint.complaint_text,
        attachment_url=complaint.attachment_url,
        resolution_attachment_url=complaint.resolution_attachment_url,
        assigned_officer_name=complaint.assigned_officer_name,
        assigned_officer_phone=complaint.assigned_officer_phone,
        sla_due_date=complaint.sla_due_date,
        feedback_rating=complaint.feedback_rating,
        feedback_comment=complaint.feedback_comment,
        status=complaint.status,
        issue=complaint.issue or "Grievance",
        department=complaint.department or "Other / Human Review",
        priority=complaint.priority or "MEDIUM",
        confidence=complaint.confidence or 0.0,
        ai_confidence=complaint.confidence or 0.0,
        needs_human_review=bool(complaint.needs_human_review or (complaint.confidence is not None and complaint.confidence < 0.70)),
        reason=complaint.reason or "",
        ai_reason=complaint.reason or "",
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        history=history_items,
        status_history=history_items,
    )


@app.post(
    "/admin/complaints/{complaint_id}/assign-officer",
    summary="Assign departmental field officer and SLA due date"
)
def assign_complaint_officer(
    complaint_id: str,
    payload: OfficerAssignRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    clean_id = complaint_id.strip().upper()
    complaint = db.query(Complaint).filter(Complaint.complaint_id == clean_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    complaint.assigned_officer_name = payload.officer_name.strip()
    complaint.assigned_officer_phone = payload.officer_phone.strip() if payload.officer_phone else ""
    hours = payload.sla_hours or 48
    complaint.sla_due_date = datetime.utcnow() + timedelta(hours=hours)

    old_status = complaint.status
    if complaint.status == "Submitted":
        complaint.status = "Assigned"

    admin_name = current_admin.get("full_name") or current_admin.get("username", "admin")
    db.add(StatusHistory(
        complaint_id=clean_id,
        old_status=old_status,
        new_status=complaint.status,
        admin_note=f"Assigned field officer: {complaint.assigned_officer_name} (Phone: {complaint.assigned_officer_phone or 'N/A'}). SLA deadline set to {hours} hours.",
        changed_by=admin_name
    ))

    db.commit()
    db.refresh(complaint)

    return {
        "status": "ok",
        "assigned_officer_name": complaint.assigned_officer_name,
        "assigned_officer_phone": complaint.assigned_officer_phone,
        "sla_due_date": complaint.sla_due_date.isoformat() if complaint.sla_due_date else None,
        "message": f"Successfully assigned to {complaint.assigned_officer_name}"
    }


@app.post(
    "/admin/complaints/bulk-status",
    summary="Bulk update status of multiple complaints"
)
def bulk_update_complaints_status(
    payload: BulkStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    complaints = db.query(Complaint).filter(Complaint.complaint_id.in_(payload.complaint_ids)).all()
    if not complaints:
        raise HTTPException(status_code=404, detail="No matching complaints found.")

    admin_name = current_admin.get("full_name") or current_admin.get("username", "admin")
    now = datetime.utcnow()
    count = 0
    for c in complaints:
        old_status = c.status
        c.status = payload.status
        c.updated_at = now
        db.add(StatusHistory(
            complaint_id=c.complaint_id,
            old_status=old_status,
            new_status=payload.status,
            admin_note=payload.admin_note or f"Bulk status update to {payload.status}.",
            changed_by=admin_name,
            created_at=now
        ))
        count += 1

    db.commit()
    return {
        "status": "ok",
        "updated_count": count,
        "message": f"Successfully updated {count} complaints to {payload.status}."
    }


@app.get(
    "/admin/analytics",
    response_model=AnalyticsResponse,
    summary="Get high-level analytics, SLA metrics, and ratings"
)
def get_analytics(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    total_complaints = db.query(Complaint).count()
    resolved_complaints = db.query(Complaint).filter(Complaint.status == "Resolved").count()

    breached_count = 0
    sla_applicable_count = 0
    sla_compliant_count = 0
    now = datetime.utcnow()

    all_complaints = db.query(Complaint).all()
    dept_resolution_times = {}
    dept_resolution_counts = {}
    ward_dist = {}
    priority_dist = {}
    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    total_stars = 0
    rated_count = 0
    total_resolution_seconds = 0
    resolved_with_time_count = 0

    for c in all_complaints:
        # Priority distribution
        p = c.priority or "MEDIUM"
        priority_dist[p] = priority_dist.get(p, 0) + 1

        # Ward distribution
        w = c.ward or "Ward 1 - Central"
        ward_dist[w] = ward_dist.get(w, 0) + 1

        # Rating distribution
        if c.feedback_rating:
            rating_dist[c.feedback_rating] = rating_dist.get(c.feedback_rating, 0) + 1
            total_stars += c.feedback_rating
            rated_count += 1

        # SLA compliance
        if c.sla_due_date:
            sla_applicable_count += 1
            if c.status == "Resolved":
                if c.updated_at <= c.sla_due_date:
                    sla_compliant_count += 1
                else:
                    breached_count += 1
            else:
                if now > c.sla_due_date:
                    breached_count += 1
                else:
                    sla_compliant_count += 1

        # Resolution duration
        if c.status == "Resolved" and c.created_at and c.updated_at:
            duration_hours = max(0.1, (c.updated_at - c.created_at).total_seconds() / 3600.0)
            total_resolution_seconds += duration_hours
            resolved_with_time_count += 1
            dept = c.department or "Other / Human Review"
            dept_resolution_times[dept] = dept_resolution_times.get(dept, 0.0) + duration_hours
            dept_resolution_counts[dept] = dept_resolution_counts.get(dept, 0) + 1

    avg_resolution_hours = round(total_resolution_seconds / max(1, resolved_with_time_count), 1)
    sla_rate = round((sla_compliant_count / max(1, sla_applicable_count)) * 100.0, 1) if sla_applicable_count > 0 else 100.0
    avg_rating = round(total_stars / max(1, rated_count), 2) if rated_count > 0 else 0.0

    final_dept_averages = {
        d: round(dept_resolution_times[d] / dept_resolution_counts[d], 1)
        for d in dept_resolution_times
    }

    return AnalyticsResponse(
        total_complaints=total_complaints,
        resolved_complaints=resolved_complaints,
        sla_compliance_rate=sla_rate,
        sla_breached_count=breached_count,
        average_resolution_hours=avg_resolution_hours,
        department_resolution_times=final_dept_averages,
        ward_distribution=ward_dist,
        priority_distribution=priority_dist,
        average_citizen_rating=avg_rating,
        total_ratings_count=rated_count,
        rating_distribution={str(k): v for k, v in rating_dist.items()}
    )


@app.post(
    "/admin/citizens/{user_id}/reset-password",
    summary="Reset a citizen's password with uniqueness check (Admin Only)"
)
def admin_reset_citizen_password(
    user_id: str,
    payload: AdminPasswordResetRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    clean_user_id = user_id.strip().lower()
    citizen = db.query(CitizenUser).filter(func.lower(CitizenUser.user_id) == clean_user_id).first()
    if not citizen:
        raise HTTPException(status_code=404, detail=f"Citizen '@{user_id}' not found.")

    clean_new_pass = payload.new_password.strip()

    # Check password uniqueness against reserved admin passwords
    if clean_new_pass == DEFAULT_ADMIN_PASS or clean_new_pass == "Admin@Grievance2026":
        raise HTTPException(
            status_code=400,
            detail="This password is reserved or already registered. For security and privacy, every account must have a completely unique password."
        )

    # Check password uniqueness across all citizen accounts
    dup_pass = db.query(CitizenUser).filter(
        CitizenUser.password_display == clean_new_pass,
        CitizenUser.id != citizen.id
    ).first()
    if dup_pass:
        raise HTTPException(
            status_code=400,
            detail="This password is already registered by another citizen. For security and privacy, every citizen account must have a completely unique password."
        )

    citizen.password_display = clean_new_pass
    citizen.password_hash = hash_password(clean_new_pass)
    db.commit()

    logger.info("Admin %s reset password for citizen @%s", current_admin["username"], citizen.user_id)
    return {"status": "ok", "message": f"Password for citizen @{citizen.user_id} was reset successfully."}


@app.post(
    "/admin/citizens/{user_id}/toggle-status",
    summary="Suspend or activate citizen account (Admin Only)"
)
def admin_toggle_citizen_status(
    user_id: str,
    payload: AdminToggleStatusRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    clean_user_id = user_id.strip().lower()
    citizen = db.query(CitizenUser).filter(func.lower(CitizenUser.user_id) == clean_user_id).first()
    if not citizen:
        raise HTTPException(status_code=404, detail=f"Citizen '@{user_id}' not found.")

    citizen.is_active = payload.is_active
    db.commit()

    action = "activated" if payload.is_active else "suspended"
    logger.info("Admin %s %s citizen account @%s", current_admin["username"], action, citizen.user_id)
    return {
        "status": "ok",
        "is_active": citizen.is_active,
        "message": f"Citizen account @{citizen.user_id} has been {action}."
    }


@app.post(
    "/admin/reset-database",
    summary="Wipe all complaints and audit records (Admin Only)"
)
def reset_database(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    db.query(StatusHistory).delete()
    db.query(Complaint).delete()
    db.commit()
    logger.info("Database reset: All complaints wiped by admin %s", current_admin["username"])
    return {"status": "ok", "message": "All complaints and status histories have been cleared successfully."}


@app.get(
    "/admin/departments",
    summary="Get all allowed departments"
)
def get_departments(current_admin: dict = Depends(get_current_admin)):
    return sorted(list(ALLOWED_DEPARTMENTS))


@app.get(
    "/admin/priorities",
    summary="Get all priority levels"
)
def get_priorities(current_admin: dict = Depends(get_current_admin)):
    return ["CRITICAL", "HIGH", "MEDIUM", "LOW"]


@app.get(
    "/admin/review-required",
    response_model=PaginatedComplaintsResponse,
    summary="Direct segment of complaints requiring human review"
)
def get_review_required_complaints(
    page: int = 1,
    limit: int = 25,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    query = db.query(Complaint).filter(
        or_(Complaint.needs_human_review == True, Complaint.confidence < 0.70)
    )
    total = query.count()
    total_pages = max(1, math.ceil(total / limit))
    offset = (page - 1) * limit
    items = query.order_by(Complaint.id.desc()).offset(offset).limit(limit).all()

    return PaginatedComplaintsResponse(
        items=[
            AdminComplaintItemResponse(
                id=c.id,
                complaint_id=c.complaint_id,
                citizen_user_id=c.citizen_user_id,
                created_at=c.created_at,
                issue=c.issue or "Grievance",
                department=c.department or "Other / Human Review",
                priority=c.priority or "MEDIUM",
                ward=c.ward or "",
                attachment_url=c.attachment_url,
                resolution_attachment_url=c.resolution_attachment_url,
                assigned_officer_name=c.assigned_officer_name,
                sla_due_date=c.sla_due_date,
                feedback_rating=c.feedback_rating,
                confidence=c.confidence or 0.0,
                needs_human_review=True,
                status=c.status,
            )
            for c in items
        ],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@app.get(
    "/admin/citizens",
    response_model=AdminCitizensListResponse,
    summary="Get all registered citizens with their credentials and stats (Admin Only)"
)
def get_admin_citizens(
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    query = db.query(CitizenUser)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                CitizenUser.user_id.ilike(s),
                CitizenUser.full_name.ilike(s),
                CitizenUser.phone.ilike(s)
            )
        )
    total = query.count()
    offset = (page - 1) * limit
    citizens = query.order_by(CitizenUser.id.desc()).offset(offset).limit(limit).all()

    # Get complaint counts per user_id
    counts_rows = (
        db.query(Complaint.citizen_user_id, func.count(Complaint.id))
        .group_by(Complaint.citizen_user_id)
        .all()
    )
    complaints_map = {row[0]: row[1] for row in counts_rows if row[0]}

    items = [
        AdminCitizenItemResponse(
            id=c.id,
            user_id=c.user_id,
            full_name=c.full_name,
            phone=c.phone,
            phone_number=c.phone,
            password=c.password_display or "Pass@Grievance2026",
            is_active=c.is_active if c.is_active is not None else True,
            created_at=c.created_at,
            complaints_count=complaints_map.get(c.user_id, 0)
        )
        for c in citizens
    ]

    return AdminCitizensListResponse(items=items, total=total)


@app.get(
    "/admin/citizens/export-csv",
    summary="Download complete customer accounts directory as CSV (Admin Only)"
)
def export_citizens_csv(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    output = io.StringIO()
    writer = csv.writer(output)

    # Standard Header
    writer.writerow([
        "Customer ID",
        "Citizen User ID",
        "Full Name",
        "Phone Number",
        "Password",
        "Account Status",
        "Lifetime Grievances Count",
        "Registration Date (UTC)"
    ])

    citizens = db.query(CitizenUser).order_by(CitizenUser.id.asc()).all()

    counts_rows = (
        db.query(Complaint.citizen_user_id, func.count(Complaint.id))
        .filter(Complaint.citizen_user_id.isnot(None))
        .group_by(Complaint.citizen_user_id)
        .all()
    )
    complaints_map = {row[0]: row[1] for row in counts_rows if row[0]}

    for c in citizens:
        status_label = "Active" if (c.is_active if c.is_active is not None else True) else "Suspended"
        writer.writerow([
            c.id,
            c.user_id,
            c.full_name,
            c.phone,
            c.password_display or "",
            status_label,
            complaints_map.get(c.user_id, 0),
            c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else ""
        ])

    csv_data = output.getvalue()
    filename = f"customers_directory_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
