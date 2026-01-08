# ============================================================================
# FILE: backend/app/core/security.py (PRODUCTION-READY)
# ============================================================================
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Set
from jose import JWTError, jwt
import bcrypt
import re
import secrets
from app.core.config import settings
from app.core.redis import redis_client  #
import logging

logger = logging.getLogger(__name__)

# ❌ REMOVED: _token_blacklist (In-memory storage is not stateless/scalable)

# ============================================================================
# PASSWORD VALIDATION & HASHING
# ============================================================================

def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """Validate password strength with comprehensive checks."""
    if len(password) < settings.MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {settings.MIN_PASSWORD_LENGTH} characters"
    
    if len(password.encode('utf-8')) > settings.MAX_PASSWORD_LENGTH:
        return False, f"Password too long (max {settings.MAX_PASSWORD_LENGTH} bytes)"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    common_passwords = {'password', '12345678', 'qwerty123', 'password123'}
    if password.lower() in common_passwords:
        return False, "Password is too common"
    
    return True, None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
        raise ValueError(error_msg)
    
    try:
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise ValueError("Failed to hash password")


# ============================================================================
# TOKEN BLACKLIST MANAGEMENT (CENTRALIZED & REDIS-BASED)
# ============================================================================

def blacklist_token_jti(jti: str, ttl_seconds: int, user_id: int) -> bool:
    """
    Add token JTI to Redis blacklist.
    
    Args:
        jti: JWT ID from token
        ttl_seconds: Time to live (should match token expiry)
        user_id: User ID for audit trail
        
    Returns:
        bool: True if successfully blacklisted
    """
    if not settings.TOKEN_BLACKLIST_ENABLED:
        return True

    try:
        # Key format: blacklist:jti:{jti_string}
        redis_client.setex(
            name=f"blacklist:jti:{jti}",
            time=ttl_seconds,
            value=str(user_id)
        )
        logger.info(f"Token JTI blacklisted: {jti[:8]}... for user {user_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to blacklist token: {e}")
        # Return False to let caller decide (e.g. return 500 error)
        return False


def is_token_blacklisted(jti: str) -> bool:
    """
    Check if token JTI is in Redis blacklist.
    
    Args:
        jti: JWT ID to check
        
    Returns:
        bool: True if blacklisted
    """
    if not settings.TOKEN_BLACKLIST_ENABLED:
        return False

    try:
        return redis_client.exists(f"blacklist:jti:{jti}")
    except Exception as e:
        logger.error(f"Blacklist check failed: {e}")
        
        # FAIL CLOSED: If Redis is down in production, deny access to be safe
        if settings.REDIS_FAIL_CLOSED and not settings.DEBUG:
            logger.critical("Redis down in production: Failing closed (denying auth)")
            raise  # Will be caught by caller
            
        return False


# ============================================================================
# JWT TOKEN GENERATION
# ============================================================================

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token with JTI."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Generate unique JTI
    jti = secrets.token_urlsafe(32)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
        "jti": jti
    })
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create JWT refresh token with JTI."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    jti = secrets.token_urlsafe(32)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh",
        "jti": jti
    })
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ============================================================================
# JWT TOKEN VALIDATION
# ============================================================================

def decode_token(token: str, check_blacklist: bool = True) -> Optional[Dict[str, Any]]:
    """
    Decode and validate JWT token.
    Optionally checks blacklist using JTI.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        if check_blacklist:
            jti = payload.get("jti")
            if not jti:
                logger.warning("Token missing JTI claim")
                return None
                
            # Use centralized blacklist check
            try:
                if is_token_blacklisted(jti):
                    logger.warning(f"Attempted use of blacklisted token JTI: {jti[:8]}...")
                    return None
            except Exception:
                # Redis failed and we are failing closed
                return None
        
        return payload
    
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.JWTClaimsError:
        logger.warning("Invalid token claims")
        return None
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        return None