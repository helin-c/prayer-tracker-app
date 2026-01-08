# ============================================================================
# FILE: backend/app/schemas/password_reset.py
# ============================================================================
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class PasswordResetRequest(BaseModel):
    """Schema for requesting password reset"""
    email: EmailStr
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com"
            }
        }
    }


class PasswordResetVerify(BaseModel):
    """Schema for verifying reset token"""
    email: EmailStr
    token: str = Field(..., min_length=10)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "token": "abc123xyz789..."
            }
        }
    }


class PasswordResetComplete(BaseModel):
    """Schema for completing password reset"""
    email: EmailStr
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
            
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
            
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
            
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "token": "abc123xyz789...",
                "new_password": "NewSecurePass123"
            }
        }
    }


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str