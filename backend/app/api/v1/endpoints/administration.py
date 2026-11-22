from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, StringConstraints
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import Annotated

from app.core.database import get_db
from app.core.security import require_role
from app.models.wholesale import SupplierProfile
from app.models.user import User, UserRole
from app.schemas.wholesale import SupplierProfileRead
from app.services.audit import log_audit_event

router = APIRouter(prefix="/admin", tags=["Administration"])
admin_only = require_role(UserRole.ADMIN)

ReviewReason = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class AccountSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: str
    role: UserRole
    is_active: bool


class AccountStatusChange(BaseModel):
    is_active: bool
    reason: ReviewReason


class SupplierReview(BaseModel):
    is_verified: bool
    reason: ReviewReason


@router.get("/users", response_model=list[AccountSummary])
def list_users(
    _: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    return db.scalars(select(User).order_by(User.full_name, User.id)).all()


@router.patch("/users/{user_id}/status", response_model=AccountSummary)
def change_account_status(
    user_id: str,
    change: AccountStatusChange,
    admin: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    account = db.get(User, user_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.role == UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Administrator accounts must be managed outside this dashboard")
    if account.is_active != change.is_active:
        old_status = account.is_active
        account.is_active = change.is_active
        log_audit_event(
            entity_type="USER",
            entity_id=account.id,
            action="ACCOUNT_STATUS_CHANGED",
            db=db,
            actor_user_id=admin.id,
            actor_role=admin.role,
            details={"from": old_status, "to": change.is_active, "reason": change.reason},
        )
    return account


@router.post("/suppliers/{supplier_id}/review", response_model=SupplierProfileRead)
def review_supplier(
    supplier_id: str,
    review: SupplierReview,
    admin: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    supplier = db.get(SupplierProfile, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier profile not found")
    old_status = supplier.is_verified
    supplier.is_verified = review.is_verified
    log_audit_event(
        entity_type="SUPPLIER",
        entity_id=supplier.id,
        action="SUPPLIER_VERIFICATION_REVIEWED",
        db=db,
        actor_user_id=admin.id,
        actor_role=admin.role,
        details={"from": old_status, "to": review.is_verified, "reason": review.reason},
    )
    return supplier
