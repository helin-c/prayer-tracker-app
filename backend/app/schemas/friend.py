# ============================================================================
# FILE: backend/app/schemas/friend.py (NEW)
# ============================================================================
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ============================================================================
# FRIEND REQUEST SCHEMAS
# ============================================================================

class FriendRequestCreate(BaseModel):
    """Schema for creating a friend request"""
    friend_email: EmailStr = Field(..., description="Email of user to add as friend")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "friend_email": "friend@example.com"
            }
        }
    }


# ============================================================================
# FRIENDSHIP RESPONSE SCHEMAS
# ============================================================================

class FriendshipResponse(BaseModel):
    """Schema for friendship response"""
    id: int
    friend_id: int
    friend_name: str
    friend_email: str
    status: str
    is_requester: Optional[bool] = None
    current_streak: Optional[int] = 0
    best_streak: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "friend_id": 2,
                "friend_name": "John Doe",
                "friend_email": "john@example.com",
                "status": "accepted",
                "is_requester": True,
                "current_streak": 5,
                "best_streak": 12,
                "created_at": "2024-01-15T10:00:00",
                "updated_at": "2024-01-15T10:00:00"
            }
        }
    }


# ============================================================================
# FRIEND'S PRAYER DATA SCHEMAS
# ============================================================================

class FriendDayStatus(BaseModel):
    """Day status for friend's prayers"""
    date: str
    completion_percentage: float
    is_today: bool = False
    completed_count: int = 0
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "date": "2024-01-15",
                "completion_percentage": 80.0,
                "is_today": True,
                "completed_count": 4
            }
        }
    }


class FriendWeekPrayersResponse(BaseModel):
    """Friend's week prayer completion"""
    friend_id: int
    friend_name: str
    start_date: str
    end_date: str
    days: List[FriendDayStatus]
    current_streak: int = 0
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "friend_id": 2,
                "friend_name": "John Doe",
                "start_date": "2024-01-15",
                "end_date": "2024-01-21",
                "days": [
                    {
                        "date": "2024-01-15",
                        "completion_percentage": 100.0,
                        "is_today": False,
                        "completed_count": 5
                    }
                ],
                "current_streak": 5
            }
        }
    }


# ============================================================================
# MESSAGE RESPONSE
# ============================================================================

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Operation completed successfully"
            }
        }
    }