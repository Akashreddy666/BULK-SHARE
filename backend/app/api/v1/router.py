from fastapi import APIRouter

from app.api.v1.endpoints import (
    health,
    neighborhoods,
    users,
    groups,
    catalog,
    grocery_list,
    aggregation,
    suppliers,
    quotations,
    confirmations,
    audit,
    payments,
    procurement,
    fulfillment,
    notifications,
    disputes,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(neighborhoods.router)
api_router.include_router(users.router)
api_router.include_router(groups.router)
api_router.include_router(catalog.router)
api_router.include_router(grocery_list.router)
api_router.include_router(aggregation.router)
api_router.include_router(suppliers.router)
api_router.include_router(quotations.router)
api_router.include_router(confirmations.router)
api_router.include_router(audit.router)
api_router.include_router(payments.router)
api_router.include_router(procurement.router)
api_router.include_router(fulfillment.router)
api_router.include_router(notifications.router)
api_router.include_router(disputes.router)
