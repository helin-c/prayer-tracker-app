# ============================================================================
# FILE: backend/app/api/v1/endpoints/users.py (ASYNC PRODUCTION READY)
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession  # ✅ CHANGED
from sqlalchemy.future import select             # ✅ CHANGED
from typing import List
import logging

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    PasswordChange,
    MessageResponse
)
from app.services.push_notification_service import push_service
from app.core.rate_limiter import rate_limit

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# GET CURRENT USER PROFILE
# ============================================================================
@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile"
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile information."""
    return current_user


# ============================================================================
# UPDATE USER PROFILE (ASYNC)
# ============================================================================
@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update user profile",
    dependencies=[Depends(rate_limit(10, 60, by_user=True))]
)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)  # ✅ CHANGED
):
    """Update current user's profile."""
    try:
        updated = False
        
        if user_update.full_name is not None:
            current_user.full_name = user_update.full_name.strip()
            updated = True
        
        if user_update.phone is not None:
            current_user.phone = user_update.phone.strip()
            updated = True
        
        if user_update.location is not None:
            current_user.location = user_update.location.strip()
            updated = True
        
        if user_update.preferred_language is not None:
            current_user.preferred_language = user_update.preferred_language.lower()
            updated = True
        
        if updated:
            # Need to merge/add to session to ensure it's tracked for async commit
            db.add(current_user)
            await db.commit()  # ✅ Async Commit
            await db.refresh(current_user)  # ✅ Async Refresh
            logger.info(f"User profile updated: {current_user.email}")
        
        return current_user
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


# ============================================================================
# SAVE PUSH TOKEN (ASYNC)
# ============================================================================
@router.post(
    "/me/push-token",
    summary="Save push token",
    dependencies=[Depends(rate_limit(5, 60, by_user=True))]
)
async def save_push_token(
    push_token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save user's Expo push token."""
    try:
        if not push_token.startswith('ExponentPushToken['):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid push token format")
        
        current_user.push_token = push_token
        db.add(current_user)
        await db.commit()
        
        logger.info(f"✅ Push token saved for user {current_user.id}")
        return {"message": "Push token saved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error saving push token: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save push token")


# ============================================================================
# CHANGE PASSWORD (ASYNC)
# ============================================================================
@router.post(
    "/me/change-password",
    response_model=MessageResponse,
    summary="Change password",
    dependencies=[Depends(rate_limit(3, 3600, by_user=True))]
)
async def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change user's password."""
    try:
        # Verify current password
        if not verify_password(password_change.current_password, current_user.hashed_password):
            logger.warning(f"Failed password change attempt: {current_user.email}")
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        
        # Check new password
        if verify_password(password_change.new_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )
        
        # Update password
        current_user.hashed_password = get_password_hash(password_change.new_password)
        
        db.add(current_user)
        await db.commit()
        
        logger.info(f"Password changed successfully for user: {current_user.email}")
        return MessageResponse(message="Password changed successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Password change error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


# ============================================================================
# GET USERS LIST (ASYNC)
# ============================================================================
@router.get(
    "/",
    response_model=List[UserResponse],
    summary="Get users list"
)
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of users (paginated)."""
    try:
        query = select(User).filter(User.is_active == True).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    except Exception as e:
        logger.error(f"Error getting users list: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to get users")


# ============================================================================
# GET USER BY ID (ASYNC)
# ============================================================================
@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID"
)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user profile by ID."""
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user


# ============================================================================
# DELETE ACCOUNT (ASYNC)
# ============================================================================
@router.delete(
    "/me",
    response_model=MessageResponse,
    summary="Delete account"
)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete user account."""
    try:
        email = current_user.email
        await db.delete(current_user)  # ✅ Async Delete
        await db.commit()
        
        logger.warning(f"User account permanently deleted: {email}")
        return MessageResponse(message="Account deleted successfully")
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Account deletion error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )


# ============================================================================
# DEACTIVATE ACCOUNT (ASYNC)
# ============================================================================
@router.post(
    "/me/deactivate",
    response_model=MessageResponse,
    summary="Deactivate account"
)
async def deactivate_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate user account (soft delete)."""
    try:
        current_user.is_active = False
        db.add(current_user)
        await db.commit()
        
        logger.info(f"User account deactivated: {current_user.email}")
        return MessageResponse(message="Account deactivated successfully")
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Account deactivation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate account"
        )