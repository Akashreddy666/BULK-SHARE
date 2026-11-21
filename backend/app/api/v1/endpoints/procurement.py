from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.procurement import ProcurementOrder
from app.schemas.procurement import (
    ProcurementCreateRequest,
    ProcurementStatusUpdateRequest,
    ProcurementOrderRead,
)
from app.services.procurement import (
    place_procurement_order,
    update_procurement_status,
    get_supplier_procurement_orders,
)

router = APIRouter(tags=["Wholesale Procurement"])


@router.post(
    "/orders/{group_order_id}/procurement/place",
    response_model=ProcurementOrderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Admin places simulated wholesale purchase order with supplier",
)
def admin_place_po(
    group_order_id: str,
    payload: ProcurementCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return place_procurement_order(
        db=db,
        group_order_id=group_order_id,
        admin_user=current_user,
        estimated_delivery_date=payload.estimated_delivery_date,
        notes=payload.notes,
    )


@router.get(
    "/orders/{group_order_id}/procurement",
    response_model=Optional[ProcurementOrderRead],
    summary="Get procurement order for a group purchase",
)
def get_order_procurement(
    group_order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    po = db.execute(
        select(ProcurementOrder).where(ProcurementOrder.group_order_id == group_order_id)
    ).scalar_one_or_none()
    return po


@router.patch(
    "/procurement/{procurement_id}/status",
    response_model=ProcurementOrderRead,
    summary="Supplier or Admin updates wholesale PO status",
)
def update_po_status(
    procurement_id: str,
    payload: ProcurementStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_procurement_status(
        db=db,
        procurement_id=procurement_id,
        actor_user=current_user,
        new_status=payload.status,
        notes=payload.notes,
    )


@router.get(
    "/supplier/procurement-orders",
    response_model=List[ProcurementOrderRead],
    summary="List wholesale POs assigned to current supplier",
)
def list_supplier_pos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_supplier_procurement_orders(db=db, supplier_user=current_user)
