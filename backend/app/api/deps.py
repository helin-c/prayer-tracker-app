# ============================================================================
# FILE: backend/app/api/deps.py (ASYNC PRODUCTION-READY)
# ============================================================================
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession  
from sqlalchemy.future import select             
from jose import JWTError
from typing import Optional
import logging

from app.core.database import get_db
from app.core.security import decode_token
from app.core.redis import redis_client
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


# ============================================================================
# GET CURRENT USER (Main authentication dependency)
# ============================================================================
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)  # ✅ CHANGED: AsyncSession
) -> User:
    """
    Get current authenticated user from JWT access token.
    Checks JTI blacklist in Redis.
    """
    try:
        token = credentials.credentials
        
        # 1. Decode token (Centralized function handles blacklist check logic internally)
        # Note: We pass check_blacklist=False here because we want to handle the specific
        # Redis error/fail-closed logic explicitly in this dependency for better HTTP errors.
        payload = decode_token(token, check_blacklist=False)
        
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # 2. Explicit JTI Blacklist Check
        jti = payload.get("jti")
        if not jti:
            logger.warning("Token missing JTI claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        try:
            # Check Redis for JTI
            if redis_client.exists(f"blacklist:jti:{jti}"):
                logger.warning(f"🚫 Blocked blacklisted token JTI: {jti[:8]}...")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked",
                    headers={"WWW-Authenticate": "Bearer"}
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Redis blacklist check failed: {e}")
            # ✅ FAIL CLOSED: If Redis is down in production, deny access for security
            if settings.REDIS_FAIL_CLOSED and not settings.DEBUG:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Authentication service temporarily unavailable"
                )
        
        # 3. Get User (Async)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID format",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # ✅ CHANGED: Async Database Query
        result = await db.execute(select(User).filter(User.id == user_id_int))
        user = result.scalars().first()
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
            
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"}
        )


# ============================================================================
# VALIDATE REFRESH TOKEN
# ============================================================================
async def validate_refresh_token(
    refresh_token: str,
    db: AsyncSession  # ✅ CHANGED: AsyncSession
) -> User:
    """Validate refresh token with JTI blacklist check."""
    try:
        # Decode without internal check to handle explicitly
        payload = decode_token(refresh_token, check_blacklist=False)
        
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # Check JTI Blacklist
        jti = payload.get("jti")
        if jti:
            if redis_client.exists(f"blacklist:jti:{jti}"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token has been revoked",
                    headers={"WWW-Authenticate": "Bearer"}
                )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
            
        # ✅ CHANGED: Async Database Query
        result = await db.execute(select(User).filter(User.id == int(user_id)))
        user = result.scalars().first()
        
        if not user or not user.is_active:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="User invalid")
            
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refresh token validation error: {e}")
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
    db: AsyncSession = Depends(get_db)  # ✅ CHANGED: AsyncSession
) -> Optional[User]:
    """Get current user if authenticated, checks blacklist."""
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        
        # Decode and verify blacklist internally
        payload = decode_token(token, check_blacklist=True)
        
        if payload is None:
            return None
        
        user_id = payload.get("sub")
        
        # ✅ CHANGED: Async Database Query
        result = await db.execute(select(User).filter(User.id == int(user_id), User.is_active == True))
        user = result.scalars().first()
        
        return user
    
    except Exception:
        return None


# ============================================================================
# GET CURRENT ACTIVE USER - Explicit active check
# ============================================================================
async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (additional check).
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
    """
    if not current_user.is_admin:
        logger.warning(f"Non-admin user attempted admin access: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user