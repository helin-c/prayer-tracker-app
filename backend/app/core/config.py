# ============================================================================
# FILE: backend/app/core/config.py (FIXED)
# ============================================================================
from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    All settings can be overridden via .env file or environment variables.
    """
    
    # ========================================================================
    # APP SETTINGS
    # ========================================================================
    APP_NAME: str = "Prayer Tracker API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # ========================================================================
    # DATABASE
    # ========================================================================
    DATABASE_URL: str
    
    # Database pool settings (for production)
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_PRE_PING: bool = True
    DB_ECHO: bool = False  # Set to True for SQL query logging
    
    # ========================================================================
    # SECURITY
    # ========================================================================
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Password requirements
    MIN_PASSWORD_LENGTH: int = 8
    MAX_PASSWORD_LENGTH: int = 72  # bcrypt limitation
    
    # ========================================================================
    # CORS
    # ========================================================================
    BACKEND_CORS_ORIGINS: str = "*"  # Comma-separated string or "*"
    
    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from string"""
        if self.BACKEND_CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
    
    # ========================================================================
    # REDIS (OPTIONAL)
    # ========================================================================
    REDIS_URL: Optional[str] = None
    REDIS_CACHE_EXPIRE: int = 3600  # 1 hour default
    
    # ========================================================================
    # PRAYER API SETTINGS
    # ========================================================================
    PRAYER_API_BASE_URL: str = "http://api.aladhan.com/v1"
    PRAYER_CACHE_DURATION: int = 86400  # 24 hours in seconds
    
    # ========================================================================
    # RATE LIMITING
    # ========================================================================
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # ========================================================================
    # LOGGING
    # ========================================================================
    LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from .env


# Create global settings instance
settings = Settings()


# ============================================================================
# SETTINGS VALIDATION
# ============================================================================
def validate_settings():
    """Validate critical settings on startup"""
    errors = []
    
    if not settings.SECRET_KEY or len(settings.SECRET_KEY) < 32:
        errors.append("SECRET_KEY must be at least 32 characters long")
    
    if not settings.DATABASE_URL:
        errors.append("DATABASE_URL is required")
    
    if settings.MIN_PASSWORD_LENGTH < 8:
        errors.append("MIN_PASSWORD_LENGTH must be at least 8")
    
    if errors:
        raise ValueError(f"Configuration errors: {', '.join(errors)}")


# Run validation on import
try:
    validate_settings()
except ValueError as e:
    # Don't crash on import - let the app handle it
    import logging
    logging.error(str(e))