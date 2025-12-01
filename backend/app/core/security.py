# ============================================================================
# FILE: backend/app/core/security.py
# ============================================================================
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# PASSWORD HASHING
# ============================================================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password using bcrypt.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to compare against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        str: Hashed password
        
    Raises:
        ValueError: If password is too long or invalid
    """
    try:
        # Validate password length
        if len(password) < settings.MIN_PASSWORD_LENGTH:
            raise ValueError(f"Password must be at least {settings.MIN_PASSWORD_LENGTH} characters")
        
        # Truncate password to 72 bytes if needed (bcrypt limitation)
        if len(password.encode('utf-8')) > settings.MAX_PASSWORD_LENGTH:
            password = password[:settings.MAX_PASSWORD_LENGTH]
            logger.warning("Password truncated to 72 characters (bcrypt limit)")
        
        # Generate salt and hash
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise ValueError("Failed to hash password")


# ============================================================================
# JWT TOKEN GENERATION
# ============================================================================
def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token.
    
    Args:
        data: Payload data to encode (usually contains user_id)
        expires_delta: Custom expiration time (optional)
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # Add standard claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    # Encode token
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create JWT refresh token with longer expiration.
    
    Args:
        data: Payload data to encode (usually contains user_id)
        
    Returns:
        str: Encoded JWT refresh token
    """
    to_encode = data.copy()
    
    # Refresh tokens have longer expiration
    expire = datetime.utcnow() + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    
    # Add standard claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    # Encode token
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


# ============================================================================
# JWT TOKEN VALIDATION
# ============================================================================
def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate JWT token.
    
    Args:
        token: JWT token string to decode
        
    Returns:
        dict: Decoded payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
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


def verify_token_type(payload: Dict[str, Any], expected_type: str) -> bool:
    """
    Verify that token is of expected type (access or refresh).
    
    Args:
        payload: Decoded JWT payload
        expected_type: Expected token type ("access" or "refresh")
        
    Returns:
        bool: True if token type matches, False otherwise
    """
    token_type = payload.get("type")
    return token_type == expected_type


# ============================================================================
# TOKEN UTILITIES
# ============================================================================
def create_token_pair(user_id: int) -> Dict[str, str]:
    """
    Create both access and refresh tokens for a user.
    
    Args:
        user_id: User ID to encode in tokens
        
    Returns:
        dict: Dictionary containing access_token and refresh_token
    """
    token_data = {"sub": str(user_id)}
    
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer"
    }


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get expiration datetime from token.
    
    Args:
        token: JWT token string
        
    Returns:
        datetime: Token expiration time, None if invalid
    """
    payload = decode_token(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"])
    return None