# ============================================================================
# FILE: backend/app/api/v1/endpoints/users.py
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
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

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# GET CURRENT USER PROFILE
# ============================================================================
@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Retrieve authenticated user's profile information"
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's profile information.
    
    **Requires:**
    - Valid access token
    
    **Returns:**
    - Complete user profile data
    """
    return current_user


# ============================================================================
# UPDATE USER PROFILE
# ============================================================================
@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update user profile",
    description="Update authenticated user's profile information"
)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    
    **Updatable Fields:**
    - full_name: User's full name
    - phone: Phone number
    - location: User's location
    - preferred_language: Language preference (en, tr, etc.)
    
    **Returns:**
    - Updated user profile
    
    **Raises:**
    - 500: Server error during update
    """
    try:
        # Track if any updates were made
        updated = False
        
        # Update fields if provided
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
            db.commit()
            db.refresh(current_user)
            logger.info(f"User profile updated: {current_user.email}")
        else:
            logger.info(f"No changes made to profile: {current_user.email}")
        
        return current_user
        
    except Exception as e:
        db.rollback()
        logger.error(f"Profile update error for {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


# ============================================================================
# CHANGE PASSWORD
# ============================================================================
@router.post(
    "/me/change-password",
    response_model=MessageResponse,
    summary="Change password",
    description="Change user's password with current password verification"
)
async def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user's password.
    
    **Process:**
    - Verifies current password
    - Validates new password strength
    - Updates password hash
    
    **Requirements:**
    - Current password must be correct
    - New password must be different
    - New password must meet strength requirements
    
    **Returns:**
    - Success message
    
    **Raises:**
    - 400: Invalid current password or weak new password
    - 500: Server error
    """
    try:
        # Verify current password
        if not verify_password(
            password_change.current_password,
            current_user.hashed_password
        ):
            logger.warning(f"Failed password change attempt: {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Check new password is different
        if verify_password(
            password_change.new_password,
            current_user.hashed_password
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )
        
        # Update password
        current_user.hashed_password = get_password_hash(password_change.new_password)
        db.commit()
        
        logger.info(f"Password changed successfully for user: {current_user.email}")
        return MessageResponse(message="Password changed successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Password change error for {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


# ============================================================================
# GET USERS LIST (OPTIONAL - for admin or browse features)
# ============================================================================
@router.get(
    "/",
    response_model=List[UserResponse],
    summary="Get users list",
    description="Get paginated list of users (requires authentication)"
)
async def get_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of users (paginated).
    
    **Query Parameters:**
    - skip: Offset for pagination (default: 0)
    - limit: Number of records (default: 100, max: 100)
    
    **Returns:**
    - List of user profiles
    
    **Note:**
    - Only returns active users
    - Can be restricted to admin users if needed
    """
    users = db.query(User)\
        .filter(User.is_active == True)\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return users


# ============================================================================
# GET USER BY ID
# ============================================================================
@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID",
    description="Get specific user's profile by ID"
)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user profile by ID.
    
    **Path Parameters:**
    - user_id: Target user's ID
    
    **Returns:**
    - User profile information
    
    **Raises:**
    - 404: User not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


# ============================================================================
# DELETE ACCOUNT
# ============================================================================
@router.delete(
    "/me",
    response_model=MessageResponse,
    summary="Delete account",
    description="Delete user account and all associated data"
)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user account.
    
    **WARNING:**
    - This action is irreversible
    - Deletes user and all associated data (prayers, streaks, etc.)
    - Uses database CASCADE to clean up related records
    
    **Returns:**
    - Success message
    
    **Raises:**
    - 500: Server error during deletion
    """
    try:
        email = current_user.email
        
        # Hard delete user (cascade will handle related data)
        db.delete(current_user)
        db.commit()
        
        logger.warning(f"User account permanently deleted: {email}")
        return MessageResponse(message="Account deleted successfully")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Account deletion error for {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )


# ============================================================================
# DEACTIVATE ACCOUNT (Soft Delete Alternative)
# ============================================================================
@router.post(
    "/me/deactivate",
    response_model=MessageResponse,
    summary="Deactivate account",
    description="Deactivate account (soft delete - can be reactivated)"
)
async def deactivate_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate user account (soft delete).
    
    **Note:**
    - Account can be reactivated by contacting support
    - Data is preserved
    - User cannot login while deactivated
    
    **Returns:**
    - Success message
    
    **Raises:**
    - 500: Server error
    """
    try:
        current_user.is_active = False
        db.commit()
        
        logger.info(f"User account deactivated: {current_user.email}")
        return MessageResponse(message="Account deactivated successfully")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Account deactivation error for {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate account"
        )