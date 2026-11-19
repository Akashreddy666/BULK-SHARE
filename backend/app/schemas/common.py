from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class HealthResponse(BaseModel):
    status: str = "healthy"
    project: str = "BULK SHARE"
    environment: str = "development"
    version: str = "1.0.0-mvp"
    demo_mode: bool = True
    timestamp: datetime = Field(default_factory=get_utc_now)


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
