from datetime import datetime, timedelta, timezone
from typing import List, Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole

# HTTP Bearer scheme
security_scheme = HTTPBearer(auto_error=False)


def create_demo_token(
    user_id: str,
    email: str,
    role: str,
    supabase_uid: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT token for demo/evaluation purposes."""
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))
    payload = {
        "sub": supabase_uid,
        "user_id": user_id,
        "email": email,
        "role": role,
        "iss": "bulk-share-demo",
        "exp": expire,
    }
    return jwt.encode(payload, settings.DEMO_JWT_SECRET, algorithm="HS256")


def decode_token_payload(token: str) -> dict:
    """
    Decode and validate a JWT token.
    Supports Supabase JWT when configured and demo signed tokens in development/demo mode.
    """
    # 1. Try Supabase JWT Secret if configured
    if settings.SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        except jwt.PyJWTError:
            pass

    # 2. Try Demo JWT Secret (for offline/demo evaluation)
    if settings.DEMO_MODE:
        try:
            return jwt.decode(
                token,
                settings.DEMO_JWT_SECRET,
                algorithms=["HS256"],
                issuer="bulk-share-demo",
            )
        except jwt.PyJWTError:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that extracts and validates the Bearer token and returns the current User.
    If the user authenticated via Supabase for the first time, auto-provisions a local profile.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token_payload(credentials.credentials)
    supabase_uid: str = payload.get("sub")
    email: Optional[str] = payload.get("email")

    if not supabase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Query local user by supabase_uid
    stmt = (
        select(User)
        .where(User.supabase_uid == supabase_uid)
        .options(joinedload(User.neighborhood))
    )
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        # If user does not exist yet (e.g. freshly registered on Supabase), auto-provision
        if not email:
            email = f"user_{supabase_uid[:8]}@example.com"
        
        full_name = payload.get("name") or payload.get("user_metadata", {}).get("full_name") or email.split("@")[0].title()
        role = payload.get("role") or UserRole.CUSTOMER.value
        
        # Guard: Regular registration cannot self-assign ADMIN
        if role == UserRole.ADMIN.value and not settings.DEMO_MODE:
            role = UserRole.CUSTOMER.value

        user = User(
            supabase_uid=supabase_uid,
            email=email,
            full_name=full_name,
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user


def require_role(*allowed_roles: UserRole):
    """Factory dependency for role-based access control."""
    allowed_values = {r.value if isinstance(r, UserRole) else r for r in allowed_roles}

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: requires one of {list(allowed_values)} roles",
            )
        return current_user

    return role_checker
