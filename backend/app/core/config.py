# ============================================================================
# FILE: backend/app/core/config.py (PRODUCTION-READY & SECURE)
# ============================================================================
from pydantic_settings import BaseSettings
from typing import Optional, List
import logging
import sys

logger = logging.getLogger("app.core.config")

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
    
    # Database pool settings (Optimized for production)
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
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
    # CORS (CRITICAL SECURITY SETTINGS)
    # ========================================================================
    BACKEND_CORS_ORIGINS: str = "*"  # Comma-separated string or "*"
    
    def get_cors_origins(self) -> List[str]:
        """
        Parse and validate CORS origins.
        
        CRITICAL SECURITY CHECK:
        - In Production: Raises error if set to "*" (wildcard).
        - In Debug: Allows "*" but logs a warning.
        """
        if self.DEBUG and self.BACKEND_CORS_ORIGINS == "*":
            logger.warning("⚠️  CORS set to '*' (Wildcard) in DEBUG mode. This is unsafe for production.")
            return ["*"]
            
        if not self.DEBUG and self.BACKEND_CORS_ORIGINS == "*":
            # 🛑 FAIL FAST: Do not allow starting production app with wildcard CORS
            raise ValueError(
                "SECURITY ERROR: CORS cannot be '*' in production. "
                "Set BACKEND_CORS_ORIGINS to specific comma-separated domains (e.g., 'https://myapp.com')."
            )
            
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
    
    # ========================================================================
    # REDIS (REQUIRED FOR PRODUCTION TOKENS)
    # ========================================================================
    REDIS_URL: Optional[str] = None
    REDIS_CACHE_TTL: int = 3600  # 1 hour default
    
    # New Setting: Fail closed ensures security if Redis is down (tokens aren't checked)
    REDIS_FAIL_CLOSED: bool = True
    
    # Token blacklist settings
    TOKEN_BLACKLIST_ENABLED: bool = True
    
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
    
    # Default limits
    RATE_LIMIT_LOGIN: int = 5  # per minute
    RATE_LIMIT_REGISTER: int = 3  # per hour
    RATE_LIMIT_FRIEND_REQUEST: int = 10  # per day
    RATE_LIMIT_PRAYER_TIMES: int = 60  # per hour
    RATE_LIMIT_API_DEFAULT: int = 60  # per minute
    
    # ========================================================================
    # LOGGING
    # ========================================================================
    LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL

    # ========================================================================
    # VALIDATION LOGIC
    # ========================================================================
    def validate_production_settings(self):
        """
        Validate critical settings for production environments.
        Returns False if critical security issues are found.
        """
        errors = []
        
        # 1. Debug Mode Check
        if self.DEBUG is True:
            if not self.DATABASE_URL.startswith("sqlite"):
                 logger.warning("⚠️  DEBUG is True but using a production-like database.")

        # 2. CORS Check (Double check)
        if not self.DEBUG and self.BACKEND_CORS_ORIGINS == "*":
            errors.append("CORS allow_origins is set to '*' in production. This is insecure.")
        
        # 3. Secret Key Strength
        if len(self.SECRET_KEY) < 32:
            errors.append(f"SECRET_KEY is too short ({len(self.SECRET_KEY)} chars). Min 32 required.")
        
        # 4. Redis Requirement (Token Blacklisting)
        if not self.DEBUG and not self.REDIS_URL:
            errors.append("REDIS_URL is missing. Token blacklisting (logout) will not work in production.")
        
        # Log all errors found
        if errors:
            logger.error("❌ PRODUCTION CONFIGURATION ERRORS:")
            for err in errors:
                logger.error(f"   - {err}")
            return False
            
        return True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


# Create global settings instance
settings = Settings()

# Run basic validation on import
if not settings.SECRET_KEY:
    raise ValueError("SECRET_KEY is required in .env file")