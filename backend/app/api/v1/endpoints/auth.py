# ============================================================================
# FILE: backend/app/api/v1/endpoints/auth.py (ASYNC PRODUCTION READY)
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession  
from sqlalchemy.future import select             
from sqlalchemy.sql import func
from datetime import datetime
import logging
from jose import jwt
from typing import Any

from app.core.database import get_db
from app.core.config import settings
from app.core.redis import redis_client 
from app.core.rate_limiter import rate_limit 

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    RefreshTokenRequest
)

router = APIRouter()
logger = logging.getLogger(__name__)
ALGORITHM = settings.ALGORITHM

# Reusable scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

# ============================================================================
# REGISTER (ASYNC)
# ============================================================================
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    dependencies=[Depends(rate_limit(3, 3600, by_ip=True))]
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)  # ✅ CHANGED: AsyncSession
):
    """Register a new user account."""
    try:
        # Normalize email
        email = user_data.email.lower().strip()
        
        # ✅ CHANGED: Async Query
        result = await db.execute(select(User).filter(User.email == email))
        existing_user = result.scalars().first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        new_user = User(
            email=email,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            preferred_language=user_data.preferred_language,
            is_active=True,
            is_verified=False
        )
        
        db.add(new_user)
        # ✅ CHANGED: Async Commit/Refresh
        await db.commit()
        await db.refresh(new_user)
        
        logger.info(f"New user registered: {new_user.email}")
        return new_user
        
    except HTTPException:
        await db.rollback()  # ✅ CHANGED: Async Rollback
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account"
        )


# ============================================================================
# LOGIN (ASYNC)
# ============================================================================
@router.post(
    "/login",
    response_model=Token,
    summary="User login",
    dependencies=[Depends(rate_limit(5, 60, by_ip=True))]
)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)  # ✅ CHANGED: AsyncSession
):
    """Authenticate user and return JWT tokens."""
    try:
        # Normalize email
        email = credentials.email.lower().strip()
        
        # ✅ CHANGED: Async Query
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        
        if not user:
            logger.warning(f"Login attempt with non-existent email: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Verify password (CPU-bound, but fast enough for now)
        if not verify_password(credentials.password, user.hashed_password):
            logger.warning(f"Failed login attempt for: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        if not user.is_active:
            logger.warning(f"Login attempt for inactive account: {email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please contact support."
            )
        
        # ✅ CHANGED: Async Update
        user.last_login = func.now()
        await db.commit()
        
        # Generate tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        logger.info(f"User logged in successfully: {email}")
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )


# ============================================================================
# REFRESH TOKEN (ASYNC)
# ============================================================================
@router.post(
    "/refresh",
    response_model=Token,
    summary="Refresh access token",
    dependencies=[Depends(rate_limit(10, 60, by_ip=True))]
)
async def refresh_access_token(
    token_request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)  # ✅ CHANGED: AsyncSession
):
    """Refresh access token using refresh token."""
    try:
        # 1. Decode token
        payload = decode_token(token_request.refresh_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # 2. Check JTI Blacklist (Redis is sync, but fast)
        jti = payload.get("jti")
        if jti and redis_client.exists(f"blacklist:jti:{jti}"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
                headers={"WWW-Authenticate": "Bearer"}
            )

        # 3. Get User (Async)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token claim")
            
        # ✅ CHANGED: Async Query instead of calling synchronous helper
        result = await db.execute(select(User).filter(User.id == int(user_id)))
        user = result.scalars().first()
        
        if not user:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
            
        if not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is inactive")
        
        # 4. Generate new tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        logger.info(f"Token refreshed for user: {user.email}")
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"}
        )


# ============================================================================
# GET CURRENT USER
# ============================================================================
@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user"
)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's profile.
    Note: get_current_user dependency must also be updated to support AsyncSession separately.
    """
    return current_user


# ============================================================================
# LOGOUT
# ============================================================================
@router.post(
    "/logout",
    summary="User logout"
)
async def logout(
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user)
):
    """Logout by blacklisting token's JTI."""
    try:
        payload = decode_token(token, check_blacklist=False)
        
        if not payload:
            return {"message": "Already logged out or invalid token"}
            
        jti = payload.get("jti")
        if not jti:
            return {"message": "Token format outdated, logged out locally"}
            
        exp_timestamp = payload.get("exp")
        current_timestamp = datetime.utcnow().timestamp()
        ttl = int(exp_timestamp - current_timestamp)
        
        if ttl > 0:
            redis_client.setex(
                f"blacklist:jti:{jti}",
                ttl,
                str(current_user.id)
            )
            logger.info(f"Token JTI blacklisted for user {current_user.id}")
        
        return {
            "message": "Successfully logged out",
            "detail": "Token has been invalidated"
        }
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return {
            "message": "Logged out locally", 
            "warning": "Server-side invalidation failed"
        }