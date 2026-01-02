# ============================================================================
# FILE: backend/app/schemas/user.py (FIXED)
# ============================================================================
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re


# ============================================================================
# BASE SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=255)
    preferred_language: str = Field(default="en", max_length=10)


# ============================================================================
# USER AUTHENTICATION SCHEMAS
# ============================================================================

class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """
        Validate password strength.
        
        Requirements:
        - Min 8 chars
        - At least 1 uppercase
        - At least 1 lowercase
        - At least 1 digit
        - (Special characters are optional)
        """
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
                "password": "SecurePass123",
                "full_name": "John Doe",
                "preferred_language": "en"
            }
        }
    }


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123"
            }
        }
    }


# ============================================================================
# TOKEN SCHEMAS
# ============================================================================

class Token(BaseModel):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }
    }


class TokenData(BaseModel):
    """Schema for decoded token data"""
    user_id: Optional[int] = None
    exp: Optional[datetime] = None


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str


# ============================================================================
# USER PROFILE SCHEMAS
# ============================================================================

class UserResponse(UserBase):
    """Schema for user response (public info)"""
    id: int
    is_active: bool
    is_verified: bool
    role: str = "user"
    phone: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "full_name": "John Doe",
                "is_active": True,
                "is_verified": False,
                "role": "user",
                "phone": "+1234567890",
                "location": "Istanbul, Turkey",
                "preferred_language": "en",
                "created_at": "2024-01-15T10:00:00",
                "updated_at": "2024-01-15T10:00:00",
                "last_login": "2024-01-15T12:00:00"
            }
        }
    }


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=255)
    preferred_language: Optional[str] = Field(None, max_length=10)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "full_name": "John Doe Updated",
                "phone": "+905551234567",
                "location": "Istanbul, Turkey",
                "preferred_language": "tr"
            }
        }
    }


class PasswordChange(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        """Validate new password strength"""
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
                "current_password": "OldPass123",
                "new_password": "NewSecurePass456"
            }
        }
    }


# ============================================================================
# MESSAGE RESPONSE
# ============================================================================

class MessageResponse(BaseModel):
    """Generic message response schema"""
    message: str
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Operation completed successfully"
            }
        }
    }