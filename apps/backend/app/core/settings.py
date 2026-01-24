from typing import Any, Optional
import json
from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    GOOGLE_APPLICATION_CREDS: str = Field(
        validation_alias=AliasChoices(
            "GOOGLE_APPLICATION_CREDS",
            "GOOGLE_APPLICATION_CREDENTIALS",  # common convention
        )
    )
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/rate_the_washroom",
        env="DATABASE_URL"
    )

    # Security
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production",
        env="SECRET_KEY"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Rate the Washroom"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ],
        env="BACKEND_CORS_ORIGINS"
    )

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: Any) -> Any:
        """
        Accept either a JSON list (recommended) or a comma-separated string.

        Examples:
        - ["http://localhost:3000", "http://localhost:8000"]
        - http://localhost:3000,http://localhost:8000
        """
        if value is None:
            return value
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        return parsed
                except Exception:
                    # Fall back to comma-splitting below
                    pass
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        return value

    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: list = ["image/jpeg", "image/png", "image/webp"]
    UPLOAD_DIR: str = "uploads"

    # Redis (for caching/sessions)
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")

    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None

    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")

    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


settings = Settings()
