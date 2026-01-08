# ============================================================================
# FILE: backend/app/api/v1/endpoints/password_reset.py
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta
import secrets
import logging

from app.core.database import get_db
from app.core.redis import redis_client
from app.core.security import get_password_hash
from app.core.rate_limiter import rate_limit
from app.models.user import User
from app.schemas.password_reset import (
    PasswordResetRequest,
    PasswordResetVerify,
    PasswordResetComplete,
    MessageResponse
)
from app.services.email_service import send_password_reset_email

router = APIRouter()
logger = logging.getLogger(__name__)

# Constants
RESET_TOKEN_EXPIRE_MINUTES = 15
RESET_TOKEN_LENGTH = 32


# ============================================================================
# REQUEST PASSWORD RESET
# ============================================================================
@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request password reset",
    dependencies=[Depends(rate_limit(3, 3600, by_ip=True))]  # 3 requests per hour
)
async def request_password_reset(
    request_data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request a password reset token.
    Sends an email with a reset code if the email exists.
    Always returns success to prevent email enumeration.
    """
    try:
        email = request_data.email.lower().strip()
        
        # Find user
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        
        # Always return success message (security: prevent email enumeration)
        success_message = (
            "If an account exists with this email, "
            "you will receive a password reset code shortly."
        )
        
        if not user:
            logger.info(f"Password reset requested for non-existent email: {email}")
            return MessageResponse(message=success_message)
        
        if not user.is_active:
            logger.warning(f"Password reset requested for inactive account: {email}")
            return MessageResponse(message=success_message)
        
        # Generate secure reset token
        reset_token = secrets.token_urlsafe(RESET_TOKEN_LENGTH)
        
        # Store token in Redis with expiration
        redis_key = f"password_reset:{user.id}"
        redis_client.setex(
            redis_key,
            RESET_TOKEN_EXPIRE_MINUTES * 60,
            reset_token
        )
        
        # Send email with reset token
        try:
            await send_password_reset_email(
                email=user.email,
                name=user.full_name or "User",
                reset_token=reset_token,
                language=user.preferred_language
            )
            logger.info(f"Password reset email sent to: {email}")
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            # Continue anyway - don't reveal email sending failed
        
        return MessageResponse(message=success_message)
        
    except Exception as e:
        logger.error(f"Password reset request error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request"
        )


# ============================================================================
# VERIFY RESET TOKEN
# ============================================================================
@router.post(
    "/verify-reset-token",
    response_model=MessageResponse,
    summary="Verify password reset token",
    dependencies=[Depends(rate_limit(5, 300, by_ip=True))]  # 5 attempts per 5 min
)
async def verify_reset_token(
    verify_data: PasswordResetVerify,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify that a reset token is valid.
    This allows the frontend to enable the password reset form.
    """
    try:
        email = verify_data.email.lower().strip()
        
        # Find user
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Check token in Redis
        redis_key = f"password_reset:{user.id}"
        stored_token = redis_client.get(redis_key)
        
        if not stored_token or stored_token != verify_data.token:
            logger.warning(f"Invalid reset token attempt for user: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        return MessageResponse(message="Token verified successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify reset token"
        )


# ============================================================================
# COMPLETE PASSWORD RESET
# ============================================================================
@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password with token",
    dependencies=[Depends(rate_limit(5, 300, by_ip=True))]
)
async def reset_password(
    reset_data: PasswordResetComplete,
    db: AsyncSession = Depends(get_db)
):
    """
    Complete the password reset process.
    Validates token and updates password.
    """
    try:
        email = reset_data.email.lower().strip()
        
        # Find user
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Verify token
        redis_key = f"password_reset:{user.id}"
        stored_token = redis_client.get(redis_key)
        
        if not stored_token or stored_token != reset_data.token:
            logger.warning(f"Invalid reset token for password change: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Check if new password is same as old (optional security measure)
        from app.core.security import verify_password
        if verify_password(reset_data.new_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )
        
        # Update password
        user.hashed_password = get_password_hash(reset_data.new_password)
        user.updated_at = datetime.utcnow()
        
        db.add(user)
        await db.commit()
        
        # Delete token from Redis
        redis_client.delete(redis_key)
        
        logger.info(f"Password reset completed for user: {email}")
        
        return MessageResponse(
            message="Password has been reset successfully. You can now login with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Password reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )


# ============================================================================
# CANCEL PASSWORD RESET (Optional)
# ============================================================================
@router.post(
    "/cancel-reset",
    response_model=MessageResponse,
    summary="Cancel password reset request"
)
async def cancel_password_reset(
    request_data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel an active password reset request.
    Deletes the reset token from Redis.
    """
    try:
        email = request_data.email.lower().strip()
        
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        
        if user:
            redis_key = f"password_reset:{user.id}"
            redis_client.delete(redis_key)
            logger.info(f"Password reset cancelled for: {email}")
        
        return MessageResponse(message="Password reset request cancelled")
        
    except Exception as e:
        logger.error(f"Cancel reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel password reset"
        )