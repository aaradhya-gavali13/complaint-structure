import re
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


# ==========================================
# Citizen Facing & Auth Schemas
# ==========================================

class CitizenRegisterRequest(BaseModel):
    user_id: str = Field(..., min_length=3, max_length=64, description="Citizen unique User ID / Username")
    password: str = Field(..., min_length=6, max_length=128, description="Account password")
    full_name: str = Field(..., min_length=2, max_length=128, description="Legal full name")
    phone: str = Field(..., min_length=7, max_length=20, description="Contact phone number")

    @field_validator("user_id")
    @classmethod
    def validate_user_id(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_\-\.@]+$", v):
            raise ValueError("User ID can only contain letters, numbers, hyphens, underscores, dots, or @.")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full Name must contain at least 2 characters.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?[0-9]{7,15}$", cleaned):
            raise ValueError("Please provide a valid contact phone number (7 to 15 digits).")
        return v


class CitizenLoginRequest(BaseModel):
    user_id: str = Field(..., description="Citizen User ID or Username")
    password: str = Field(..., description="Password")


class CitizenForgotPasswordRequest(BaseModel):
    user_id: str = Field(..., description="Citizen User ID, Username, or registered Phone")
    phone: str = Field(..., description="Registered contact phone number")
    new_password: str = Field(..., min_length=6, max_length=128, description="New account password")


class CitizenResponse(BaseModel):
    id: Optional[int] = None
    user_id: str
    full_name: str
    phone: str
    is_active: bool = True
    created_at: Optional[datetime] = None


class CitizenTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CitizenResponse


class ComplaintCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128, description="Citizen full name")
    phone: str = Field(..., min_length=7, max_length=20, description="Contact phone number")
    address: str = Field(..., min_length=5, max_length=500, description="Residential or incident address")
    ward: Optional[str] = Field(None, max_length=64, description="Municipal administrative ward")
    pincode: Optional[str] = Field("", max_length=16, description="Postal pincode")
    complaint: str = Field(..., min_length=5, max_length=5000, description="Detailed grievance description")
    attachment_url: Optional[str] = Field(None, max_length=256, description="Uploaded evidence photo URL")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full Name cannot be empty.")
        if len(v) < 2:
            raise ValueError("Full Name must contain at least 2 characters.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?[0-9]{7,15}$", cleaned):
            raise ValueError("Please provide a valid contact phone number (7 to 15 digits).")
        return v

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Address cannot be empty.")
        if len(v) < 5:
            raise ValueError("Address must be at least 5 characters.")
        return v

    @field_validator("complaint")
    @classmethod
    def validate_complaint(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Complaint description cannot be empty.")
        if len(v) < 5:
            raise ValueError("Complaint description must be at least 5 characters.")
        return v


class ComplaintCreateResponse(BaseModel):
    complaint_id: str
    status: str = "Submitted"
    message: str = "Complaint submitted successfully"
    created_at: datetime


class StatusHistoryItemResponse(BaseModel):
    id: int
    complaint_id: str
    old_status: str
    new_status: str
    admin_note: Optional[str] = ""
    changed_by: str
    created_at: datetime


class FeedbackSubmitRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Citizen satisfaction star rating (1 to 5)")
    comment: Optional[str] = Field("", max_length=1000, description="Optional feedback remarks")


class ComplaintTrackResponse(BaseModel):
    complaint_id: str
    status: str
    department: str
    priority: str = "MEDIUM"
    ward: Optional[str] = ""
    pincode: Optional[str] = ""
    address: Optional[str] = ""
    attachment_url: Optional[str] = None
    resolution_attachment_url: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    sla_due_date: Optional[datetime] = None
    feedback_rating: Optional[int] = None
    feedback_comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    complaint_text: Optional[str] = ""
    citizen_name: Optional[str] = ""
    admin_message: Optional[str] = ""
    admin_message_updated_at: Optional[datetime] = None
    history: List[StatusHistoryItemResponse] = []


# Preserving existing /classify schema compatibility
class ClassifyRequest(BaseModel):
    complaint: str = Field(..., min_length=5)


class ClassifyResponse(BaseModel):
    issue: str
    department: str
    priority: str
    confidence: float
    needs_human_review: bool
    reason: str


# ==========================================
# Admin Schemas
# ==========================================

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    full_name: str
    role: str


class AdminUserResponse(BaseModel):
    username: str
    full_name: str
    email: str
    role: str


class AdminComplaintItemResponse(BaseModel):
    id: int
    complaint_id: str
    citizen_user_id: Optional[str] = None
    created_at: datetime
    citizen_name: str = ""
    name: str = ""
    issue: str = ""
    department: str
    priority: str
    ward: Optional[str] = ""
    attachment_url: Optional[str] = None
    resolution_attachment_url: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    sla_due_date: Optional[datetime] = None
    feedback_rating: Optional[int] = None
    confidence: float
    ai_confidence: float = 0.0
    needs_human_review: bool
    status: str


class AdminComplaintDetailResponse(BaseModel):
    id: int
    complaint_id: str
    citizen_user_id: Optional[str] = None
    # Citizen Information (Admin Protected)
    citizen_name: str = ""
    name: str = ""
    citizen_phone: str = ""
    phone: str = ""
    citizen_address: str = ""
    address: str = ""
    ward: Optional[str] = ""
    pincode: Optional[str] = ""
    # Complaint narrative & attachments
    complaint_text: str
    attachment_url: Optional[str] = None
    resolution_attachment_url: Optional[str] = None
    # Departmental Officer & SLA
    assigned_officer_name: Optional[str] = None
    assigned_officer_phone: Optional[str] = None
    sla_due_date: Optional[datetime] = None
    # Feedback
    feedback_rating: Optional[int] = None
    feedback_comment: Optional[str] = None
    status: str
    # AI Classification
    issue: str = ""
    department: str
    priority: str
    confidence: float = 0.0
    ai_confidence: float = 0.0
    needs_human_review: bool
    reason: str = ""
    ai_reason: str = ""
    created_at: datetime
    updated_at: datetime
    history: List[StatusHistoryItemResponse] = []
    status_history: List[StatusHistoryItemResponse] = []


class AdminStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Submitted, Under Review, Assigned, In Progress, Resolved, Rejected")
    admin_note: Optional[str] = Field("", max_length=1000)
    resolution_attachment_url: Optional[str] = Field(None, max_length=256, description="Proof of resolution photo URL")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"Submitted", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected"}
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(sorted(allowed))}")
        return v


class OfficerAssignRequest(BaseModel):
    officer_name: str = Field(..., min_length=2, max_length=128)
    officer_phone: Optional[str] = Field("", max_length=32)
    sla_hours: Optional[int] = Field(48, ge=1, le=720, description="Hours until SLA breach")
    send_sms: Optional[bool] = Field(True, description="Whether to dispatch direct SMS/notification to officer")
    custom_message: Optional[str] = Field(None, description="Optional directive or note for the officer")


class OfficerDirectMessageRequest(BaseModel):
    officer_phone: Optional[str] = Field(None, max_length=32)
    custom_message: Optional[str] = Field(None, max_length=1000)



class BulkStatusUpdateRequest(BaseModel):
    complaint_ids: List[str] = Field(..., min_length=1)
    status: str = Field(..., description="Target status")
    admin_note: Optional[str] = Field("", max_length=1000)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"Submitted", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected"}
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(sorted(allowed))}")
        return v


class AdminPasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=6, max_length=128)


class AdminToggleStatusRequest(BaseModel):
    is_active: bool


class AdminStatisticsResponse(BaseModel):
    total: int
    critical: int
    high: int
    medium: int
    low: int
    human_review: int
    human_review_required: int = 0
    pending: int
    resolved: int
    citizens_count: int = 0
    by_department: Dict[str, int]
    by_priority: Dict[str, int]
    by_status: Dict[str, int]
    by_timeline: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]] = []


class AnalyticsResponse(BaseModel):
    total_complaints: int
    resolved_complaints: int
    sla_compliance_rate: float
    sla_breached_count: int
    average_resolution_hours: float
    department_resolution_times: Dict[str, float]
    ward_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    average_citizen_rating: float
    total_ratings_count: int
    rating_distribution: Dict[str, int]


class PaginatedComplaintsResponse(BaseModel):
    items: List[AdminComplaintItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class AdminCitizenItemResponse(BaseModel):
    id: int
    user_id: str
    full_name: str
    phone: str
    phone_number: str = ""
    password: str
    is_active: bool = True
    created_at: datetime
    complaints_count: int = 0


class AdminCitizensListResponse(BaseModel):
    items: List[AdminCitizenItemResponse]
    total: int
