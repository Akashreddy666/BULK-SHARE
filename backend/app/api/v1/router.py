from fastapi import APIRouter

from app.api.v1.endpoints import health, neighborhoods, users

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(neighborhoods.router)
api_router.include_router(users.router)
