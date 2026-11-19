from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """System health check endpoint verifying service status and environment mode."""
    return HealthResponse(
        status="healthy",
        project=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        version="1.0.0-mvp",
        demo_mode=settings.DEMO_MODE,
    )
