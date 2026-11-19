from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, create_demo_token
from app.models.neighborhood import Neighborhood
from app.models.user import User, UserRole
from app.schemas.user import (
    UserRead,
    UserUpdate,
    DemoLoginRequest,
    DemoTokenResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    """Retrieve the current authenticated user's profile and neighborhood details."""
    return current_user


@router.patch("/me", response_model=UserRead)
def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Update profile fields (name, phone, neighborhood_id)."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    if payload.phone is not None:
        current_user.phone = payload.phone.strip()
    if payload.neighborhood_id is not None:
        if payload.neighborhood_id:
            stmt = select(Neighborhood).where(Neighborhood.id == payload.neighborhood_id)
            n = db.execute(stmt).scalar_one_or_none()
            if not n:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Specified neighborhood does not exist",
                )
        current_user.neighborhood_id = payload.neighborhood_id or None

    db.commit()
    db.refresh(current_user)

    stmt = (
        select(User)
        .where(User.id == current_user.id)
        .options(joinedload(User.neighborhood))
    )
    return db.execute(stmt).scalar_one()


@router.post("/demo-login", response_model=DemoTokenResponse)
def demo_login(
    payload: DemoLoginRequest,
    db: Session = Depends(get_db),
) -> DemoTokenResponse:
    """
    Evaluation / Demo Mode Endpoint:
    Provides a quick one-click JWT token for evaluator testing as Customer, Organizer, Supplier, or Admin.
    """
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo login is disabled in production environment",
        )

    role_val = payload.role.value if isinstance(payload.role, UserRole) else str(payload.role)

    demo_email_map = {
        UserRole.CUSTOMER.value: "priya.customer@bulkshare.com",
        UserRole.SUPPLIER.value: "kisan.wholesaler@bulkshare.com",
        UserRole.ADMIN.value: "admin@bulkshare.com",
    }
    
    email = payload.email or demo_email_map.get(role_val, "priya.customer@bulkshare.com")
    if "organizer" in str(payload.email).lower():
        email = "rahul.organizer@bulkshare.com"

    stmt = (
        select(User)
        .where(User.email == email)
        .options(joinedload(User.neighborhood))
    )
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        user = User(
            supabase_uid=f"demo-uid-{role_val.lower()}",
            email=email,
            full_name=f"Demo {role_val.title()} User",
            role=role_val,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_demo_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        supabase_uid=user.supabase_uid,
    )

    return DemoTokenResponse(
        access_token=token,
        token_type="bearer",
        user=user,
        demo_mode=True,
    )
