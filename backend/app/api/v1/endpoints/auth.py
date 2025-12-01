# ============================================================================
# FILE: backend/app/api/v1/endpoints/auth.py
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token
)
from app.api.deps import get_current_user, validate_refresh_token
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


# ============================================================================
# REGISTER
# ============================================================================
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account with email and password"
)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    **Process:**
    - Validates email uniqueness
    - Hashes password securely
    - Creates user with default settings
    
    **Returns:**
    - User profile information
    
    **Raises:**
    - 400: Email already registered
    - 500: Server error during registration
    """
    try:
        # Normalize email
        email = user_data.email.lower().strip()
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == email).first()
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
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"New user registered: {new_user.email}")
        return new_user
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account"
        )


# ============================================================================
# LOGIN
# ============================================================================
@router.post(
    "/login",
    response_model=Token,
    summary="User login",
    description="Authenticate user and receive JWT tokens"
)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens.
    
    **Process:**
    - Validates email and password
    - Updates last login timestamp
    - Returns access and refresh tokens
    
    **Returns:**
    - Access token (15 minutes validity)
    - Refresh token (7 days validity)
    
    **Raises:**
    - 401: Invalid credentials
    - 403: Account inactive
    - 500: Server error
    """
    try:
        # Normalize email
        email = credentials.email.lower().strip()
        
        # Find user by email
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            logger.warning(f"Login attempt with non-existent email: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Verify password
        if not verify_password(credentials.password, user.hashed_password):
            logger.warning(f"Failed login attempt for: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Check if account is active
        if not user.is_active:
            logger.warning(f"Login attempt for inactive account: {email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please contact support."
            )
        
        # Update last login timestamp
        user.last_login = func.now()
        db.commit()
        
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
# REFRESH TOKEN
# ============================================================================
@router.post(
    "/refresh",
    response_model=Token,
    summary="Refresh access token",
    description="Get new access token using refresh token"
)
async def refresh_access_token(
    token_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using valid refresh token.
    
    **Process:**
    - Validates refresh token
    - Verifies user status
    - Issues new token pair
    
    **Returns:**
    - New access and refresh tokens
    
    **Raises:**
    - 401: Invalid or expired refresh token
    - 403: User inactive
    - 500: Server error
    """
    try:
        # Validate refresh token and get user
        user = validate_refresh_token(token_request.refresh_token, db)
        
        # Generate new token pair
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh token"
        )


# ============================================================================
# GET CURRENT USER
# ============================================================================
@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get authenticated user's profile information"
)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's profile.
    
    **Requires:**
    - Valid access token in Authorization header
    
    **Returns:**
    - User profile information
    """
    return current_user


# ============================================================================
# LOGOUT
# ============================================================================
@router.post(
    "/logout",
    summary="User logout",
    description="Logout current user (client should delete tokens)"
)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user.
    
    **Note:**
    - This endpoint doesn't invalidate tokens server-side
    - Client must delete stored tokens after calling this
    
    **Returns:**
    - Success message with user email
    """
    logger.info(f"User logged out: {current_user.email}")
    
    return {
        "message": "Successfully logged out",
        "email": current_user.email
    }