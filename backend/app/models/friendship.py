# ============================================================================
# FILE: backend/app/models/friendship.py (NEW)
# ============================================================================
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint, Index, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class FriendshipStatus(enum.Enum):
    """Friendship status enumeration"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Friendship(Base):
    """
    Friendship model - stores friend relationships between users.
    
    Features:
    - Bidirectional friendship (user1 <-> user2)
    - Status tracking (pending, accepted, rejected)
    - Request sender/receiver tracking
    - Timestamps for audit trail
    """
    __tablename__ = "friendships"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User relationships
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    friend_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Status
    status = Column(
        Enum(FriendshipStatus), 
        default=FriendshipStatus.PENDING, 
        nullable=False
    )
    
    # Who initiated the request
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps (timezone-aware)
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    # Relationships (to get user details)
    user = relationship(
        "User",
        foreign_keys=[user_id],
        backref="friendships_as_user"
    )
    
    friend = relationship(
        "User",
        foreign_keys=[friend_id],
        backref="friendships_as_friend"
    )
    
    requester = relationship(
        "User",
        foreign_keys=[requester_id],
        backref="sent_friend_requests"
    )
    
    # Constraints and Indexes
    __table_args__ = (
        # Prevent duplicate friendships
        UniqueConstraint('user_id', 'friend_id', name='uq_user_friend'),
        
        # Performance indexes
        Index('idx_user_status', 'user_id', 'status'),
        Index('idx_friend_status', 'friend_id', 'status'),
        Index('idx_requester', 'requester_id'),
    )
    
    def __repr__(self):
        return f"<Friendship(id={self.id}, user={self.user_id}, friend={self.friend_id}, status={self.status.value})>"
    
    def to_dict(self, current_user_id: int):
        """
        Convert to dictionary for JSON serialization.
        
        Args:
            current_user_id: ID of current user to determine friend info
        """
        # Determine who is the "friend" from current user's perspective
        is_user = self.user_id == current_user_id
        friend_user = self.friend if is_user else self.user
        
        return {
            "id": self.id,
            "friend_id": friend_user.id,
            "friend_name": friend_user.full_name or friend_user.email.split('@')[0],
            "friend_email": friend_user.email,
            "status": self.status.value,
            "is_requester": self.requester_id == current_user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def is_pending(self) -> bool:
        """Check if friendship is pending"""
        return self.status == FriendshipStatus.PENDING
    
    def is_accepted(self) -> bool:
        """Check if friendship is accepted"""
        return self.status == FriendshipStatus.ACCEPTED
    
    def is_rejected(self) -> bool:
        """Check if friendship is rejected"""
        return self.status == FriendshipStatus.REJECTED