from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class UserRole(enum.Enum):
    """User role enumeration"""
    USER = "user"
    ADMIN = "admin"


class User(Base):
    """
    User model with authentication, profile, and prayer tracking.
    
    Features:
    - Role-based access control (USER/ADMIN)
    - Profile information (phone, location, language)
    - Prayer tracking relationships
    - Timezone-aware timestamps
    """
    __tablename__ = "users"
    
    # Primary fields
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # Status and role
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    
    # Profile information
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    preferred_language = Column(String(10), default="en", nullable=False)
    
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
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # ========================================================================
    # RELATIONSHIPS
    # ========================================================================
    
    # Prayer tracking (one-to-many)
    prayer_logs = relationship(
        "PrayerLog",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic"  # For efficient queries on large datasets
    )
    
    # Prayer streak (one-to-one)
    prayer_streak = relationship(
        "PrayerStreak",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    # User location (one-to-one)
    user_location = relationship(
        "UserLocation",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    # ========================================================================
    # INDEXES
    # ========================================================================
    
    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
        Index('idx_user_role', 'role'),
    )
    
    # ========================================================================
    # METHODS
    # ========================================================================
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role.value})>"
    
    def to_dict(self, include_prayer_stats: bool = False):
        """
        Convert to dictionary for JSON serialization.
        
        Args:
            include_prayer_stats: Include prayer statistics if True
        """
        data = {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "role": self.role.value,
            "phone": self.phone,
            "location": self.location,
            "preferred_language": self.preferred_language,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
        
        if include_prayer_stats and self.prayer_streak:
            data["prayer_stats"] = {
                "current_streak": self.prayer_streak.current_streak,
                "best_streak": self.prayer_streak.best_streak,
                "last_prayer_date": self.prayer_streak.last_prayer_date,
            }
        
        return data
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin role"""
        return self.role == UserRole.ADMIN
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = func.now()