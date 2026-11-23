import json
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BULK SHARE"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"

    # CORS configuration
    # The string alternative lets settings load comma-separated environment values.
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://bulk-share.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, value: Union[str, List[str]]) -> List[str]:
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("["):
                return json.loads(value)
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    # Database configuration
    # Default to local SQLite with aiosqlite for zero-config local development and testing
    DATABASE_URL: str = "sqlite+aiosqlite:///./bulkshare.db"

    # Supabase Auth Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    
    # In Demo Mode, evaluator tokens and mock users are supported
    DEMO_MODE: bool = True
    DEMO_JWT_SECRET: str = "bulk-share-demo-secret-key-2026-milestone1"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
