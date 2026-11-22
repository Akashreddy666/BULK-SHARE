import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.db.seed import seed_data
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("bulkshare")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown lifecycle handler."""
    if settings.ENVIRONMENT != "testing":
        logger.info("Initializing database models...")
        init_db()

        # Seed demo data if database is empty or in demo mode
        try:
            with SessionLocal() as session:
                seed_data(session)
        except Exception as e:
            logger.warning(f"Database seed step skipped or encountered note: {e}")

        logger.info(f"{settings.PROJECT_NAME} Backend Started Successfully on {settings.ENVIRONMENT} mode.")
    yield
    logger.info(f"{settings.PROJECT_NAME} Backend Shutting Down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Community-Based Group Grocery Purchasing Platform — Backend API",
    version="1.0.0-mvp",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add defensive security headers to all HTTP responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Exception handler for cleaner API error responses
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again later."},
    )


# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "message": "Welcome to BULK SHARE API. Visit /docs for interactive OpenAPI specification.",
        "version": "1.0.0-mvp",
        "demo_mode": settings.DEMO_MODE,
    }
