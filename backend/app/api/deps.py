# ============================================================================
# FILE: backend/app/api/deps.py (FINAL PRODUCTION VERSION)
# ============================================================================
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError
from typing import Optional
import logging

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


# ============================================================================
# GET CURRENT USER (Main authentication dependency)
# ============================================================================
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT access token.
    
    This dependency:
    1. Extracts JWT token from Authorization header
    2. Validates and decodes the token
    3. Fetches user from database
    4. Checks user is active
    
    Args:
        credentials: Bearer token from Authorization header
        db: Database session
        
    Returns:
        User: Authenticated user object
        
    Raises:
        HTTPException 401: If token is invalid, expired, or user not found
        HTTPException 403: If user account is inactive
    """
    try:
        # Get token from credentials
        token = credentials.credentials
        
        # Decode token
        payload = decode_token(token)
        
        if payload is None:
            logger.warning("Token decode failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Get user ID from token
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warning("Token missing 'sub' claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Convert to int
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            logger.warning(f"Invalid user ID format: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id_int).first()
        
        if user is None:
            logger.warning(f"User not found for ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Inactive user attempted access: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        return user
        
    except HTTPException:
        raise
    except JWTError as e:
        logger.warning(f"JWT error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"}
        )


# ============================================================================
# VALIDATE REFRESH TOKEN (For token refresh endpoint)
# ============================================================================
def validate_refresh_token(
    refresh_token: str,
    db: Session
) -> User:
    """
    Validate refresh token and return user.
    
    This is a synchronous function (not async) that's called directly
    from the refresh endpoint, not as a FastAPI dependency.
    
    Args:
        refresh_token: JWT refresh token string
        db: Database session
        
    Returns:
        User: User object if token is valid
        
    Raises:
        HTTPException 401: If token is invalid or expired
        HTTPException 403: If user is inactive
    """
    try:
        # Decode token
        payload = decode_token(refresh_token)
        
        if payload is None:
            logger.warning("Refresh token decode failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Get user ID from token
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warning("Refresh token missing 'sub' claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token format",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Convert to int
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            logger.warning(f"Invalid user ID in refresh token: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id_int).first()
        
        if user is None:
            logger.warning(f"User not found for refresh token: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Inactive user attempted token refresh: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        return user
        
    except HTTPException:
        raise
    except JWTError as e:
        logger.warning(f"Refresh token JWT error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        logger.error(f"Validate refresh token error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed",
            headers={"WWW-Authenticate": "Bearer"}
        )


# ============================================================================
# GET CURRENT USER (OPTIONAL) - For public/private hybrid endpoints
# ============================================================================
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise.
    
    Use this for endpoints that work both with and without authentication,
    providing different behavior based on auth status.
    
    Example:
        - Public content visible to everyone
        - Additional features for authenticated users
    
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
        
        if payload is None:
            return None
        
        user_id = payload.get("sub")
        if user_id is None:
            return None
        
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            return None
        
        user = db.query(User).filter(
            User.id == user_id_int,
            User.is_active == True
        ).first()
        
        return user
    
    except Exception as e:
        logger.debug(f"Optional auth failed: {e}")
        return None


# ============================================================================
# GET CURRENT ACTIVE USER - Explicit active check
# ============================================================================
async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (additional check).
    
    This is redundant since get_current_user already checks is_active,
    but kept for explicit clarity in endpoints that require active users.
    
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


# ============================================================================
# GET CURRENT VERIFIED USER - Email verification required
# ============================================================================
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
# GET CURRENT ADMIN USER - Admin role required
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