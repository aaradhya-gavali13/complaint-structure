import os
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.database import get_db

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "grievance-portal-admin-secret-2026-auth-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days for convenience

security = HTTPBearer(auto_error=False)

# Password hashing with PBKDF2-HMAC-SHA256
def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations=100000
    ).hex()
    return f"{salt}${hashed}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        salt, expected_hash = stored_hash.split("$")
        check_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations=100000
        ).hex()
        return hmac.compare_digest(expected_hash, check_hash)
    except Exception:
        return False


# In-memory configured admin credentials
DEFAULT_ADMIN_USER = os.getenv("ADMIN_USERNAME", "admin")
DEFAULT_ADMIN_PASS = os.getenv("ADMIN_PASSWORD", "Admin@Grievance2026")

ADMIN_STORE: Dict[str, dict] = {
    DEFAULT_ADMIN_USER: {
        "username": DEFAULT_ADMIN_USER,
        "full_name": "Chief Administrative Officer",
        "email": "admin@grievance.gov.in",
        "role": "Senior Grievance Officer",
        "password_hash": hash_password(DEFAULT_ADMIN_PASS)
    }
}


def authenticate_admin(username: str, password: str) -> Optional[dict]:
    admin = ADMIN_STORE.get(username.strip())
    if not admin:
        return None
    if not verify_password(password, admin["password_hash"]):
        return None
    return admin


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_admin(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role", "")
        if username is None or role == "citizen":
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    admin = ADMIN_STORE.get(username)
    if admin is None:
        raise credentials_exception

    return {
        "username": admin["username"],
        "full_name": admin["full_name"],
        "email": admin["email"],
        "role": admin["role"]
    }


def get_current_citizen(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    from backend.app.models import CitizenUser

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in or sign up with your User ID and password to submit a complaint.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    auth_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired session. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise auth_exception
    except jwt.PyJWTError:
        raise auth_exception

    citizen = db.query(CitizenUser).filter(CitizenUser.user_id == user_id).first()
    if not citizen:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Citizen account not found. Please register or log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return citizen


def get_optional_citizen(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    from backend.app.models import CitizenUser

    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        return db.query(CitizenUser).filter(CitizenUser.user_id == user_id).first()
    except Exception:
        return None
