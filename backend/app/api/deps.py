# ============================================================================
# FILE: backend/app/api/deps.py
# ============================================================================
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token, verify_token_type
from app.models.user import User, UserRole
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()


# ============================================================================
# AUTHENTICATION DEPENDENCIES
# ============================================================================
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    This dependency:
    1. Extracts JWT token from Authorization header
    2. Validates and decodes the token
    3. Verifies token type is "access"
    4. Fetches user from database
    5. Checks user is active
    
    Args:
        credentials: JWT token from Authorization header
        db: Database session
        
    Returns:
        User: Authenticated user object
        
    Raises:
        HTTPException 401: If token is invalid, expired, or user not found
        HTTPException 403: If user account is inactive
    """
    # Extract token
    token = credentials.credentials
    
    # Decode token
    payload = decode_token(token)
    if payload is None:
        logger.warning("Invalid or expired token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verify token type
    if not verify_token_type(payload, "access"):
        logger.warning(f"Invalid token type: {payload.get('type')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Use access token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Extract user ID
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        logger.error("Invalid user ID in token payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Check if user is active
    if not user.is_active:
        logger.warning(f"Inactive user attempted access: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support."
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (additional check).
    
    This is a redundant check since get_current_user already checks
    is_active, but kept for explicit clarity in endpoints that require
    active users.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        User: Active user object
        
    Raises:
        HTTPException 403: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current verified user.
    
    Use this dependency for endpoints that require email verification.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        User: Verified user object
        
    Raises:
        HTTPException 403: If user is not verified
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required. Please verify your email."
        )
    return current_user


# ============================================================================
# AUTHORIZATION DEPENDENCIES
# ============================================================================
async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and verify admin role.
    
    Use this dependency for admin-only endpoints.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        User: Admin user object
        
    Raises:
        HTTPException 403: If user is not an admin
    """
    if not current_user.is_admin:
        logger.warning(f"Non-admin user attempted admin access: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


# ============================================================================
# OPTIONAL AUTHENTICATION
# ============================================================================
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise.
    
    Use this for endpoints that work both with and without authentication,
    providing different behavior based on auth status.
    
    Args:
        credentials: Optional JWT token from Authorization header
        db: Database session
        
    Returns:
        User: Authenticated user object, or None if not authenticated
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        
        if payload is None or not verify_token_type(payload, "access"):
            return None
        
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()
        
        return user
    
    except Exception as e:
        logger.debug(f"Optional auth failed: {e}")
        return None


# ============================================================================
# REFRESH TOKEN VALIDATION
# ============================================================================
async def validate_refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Validate refresh token and return user.
    
    Use this for token refresh endpoints.
    
    Args:
        credentials: JWT refresh token from Authorization header
        db: Database session
        
    Returns:
        User: User object associated with refresh token
        
    Raises:
        HTTPException 401: If refresh token is invalid
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    if not verify_token_type(payload, "refresh"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Use refresh token."
        )
    
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True
    ).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user