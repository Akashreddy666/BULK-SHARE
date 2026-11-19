from fastapi import APIRouter

from app.api.v1.endpoints import health, neighborhoods, users, groups, catalog, grocery_list

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(neighborhoods.router)
api_router.include_router(users.router)
api_router.include_router(groups.router)
api_router.include_router(catalog.router)
api_router.include_router(grocery_list.router)
