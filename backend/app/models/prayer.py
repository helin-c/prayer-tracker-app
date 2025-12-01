# ============================================================================
# FILE: backend/app/models/prayer.py (FIXED - FLOAT COORDINATES)
# ============================================================================
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class PrayerLog(Base):
    """
    Prayer tracking log - stores user's daily prayer completions.
    
    Features:
    - Unique constraint: one record per user/prayer/date
    - Indexed for fast queries by user_id and date
    - Tracks completion status and on-time performance
    - Timezone-aware timestamps
    """
    __tablename__ = "prayer_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Prayer details
    prayer_name = Column(String(20), nullable=False)  # Fajr, Dhuhr, Asr, Maghrib, Isha
    prayer_date = Column(String(10), nullable=False)  # YYYY-MM-DD format
    prayer_time = Column(String(5), nullable=False)   # HH:MM format
    
    # Status tracking
    completed = Column(Boolean, default=False, nullable=False)
    on_time = Column(Boolean, default=False, nullable=False)
    
    # Timestamps (timezone-aware)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="prayer_logs")
    
    # Constraints and Indexes
    __table_args__ = (
        # Prevent duplicate prayers for same user/date
        UniqueConstraint('user_id', 'prayer_name', 'prayer_date', name='uq_user_prayer_date'),
        
        # Performance indexes
        Index('idx_user_date', 'user_id', 'prayer_date'),
        Index('idx_user_completed', 'user_id', 'completed'),
        Index('idx_prayer_date_range', 'user_id', 'prayer_date', 'completed'),
    )
    
    def __repr__(self):
        return f"<PrayerLog(user={self.user_id}, prayer={self.prayer_name}, date={self.prayer_date}, completed={self.completed})>"
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "prayer_name": self.prayer_name,
            "prayer_date": self.prayer_date,
            "prayer_time": self.prayer_time,
            "completed": self.completed,
            "on_time": self.on_time,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PrayerStreak(Base):
    """
    Stores user's prayer streaks for performance optimization.
    
    Instead of calculating streaks each time, we maintain them here.
    Updated by background tasks or triggers.
    """
    __tablename__ = "prayer_streaks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Streak data
    current_streak = Column(Integer, default=0, nullable=False)
    best_streak = Column(Integer, default=0, nullable=False)
    last_prayer_date = Column(String(10), nullable=True)  # Last date with complete prayers
    
    # Timestamps (timezone-aware)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="prayer_streak")
    
    __table_args__ = (
        Index('idx_user_streak', 'user_id', 'current_streak'),
    )
    
    def __repr__(self):
        return f"<PrayerStreak(user={self.user_id}, current={self.current_streak}, best={self.best_streak})>"
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            "user_id": self.user_id,
            "current_streak": self.current_streak,
            "best_streak": self.best_streak,
            "last_prayer_date": self.last_prayer_date,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class UserLocation(Base):
    """
    Stores user's location for prayer time calculations.
    
    One-to-one relationship with User.
    Uses DOUBLE PRECISION (Float) for coordinates - optimized for geo-calculations.
    """
    __tablename__ = "user_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Location data (FLOAT for performance and geo-calculations)
    latitude = Column(Float, nullable=False)   # e.g., 41.0082376
    longitude = Column(Float, nullable=False)  # e.g., 28.9783589
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    timezone = Column(String(50), nullable=True)
    
    # Prayer calculation settings
    calculation_method = Column(Integer, default=2, nullable=False)  # 2 = ISNA
    asr_calculation = Column(Integer, default=0, nullable=False)     # 0 = Shafi
    
    # Timestamps (timezone-aware)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="user_location")
    
    # Index for geo-queries (optional but recommended)
    __table_args__ = (
        Index('idx_location_coords', 'latitude', 'longitude'),
    )
    
    def __repr__(self):
        return f"<UserLocation(user={self.user_id}, lat={self.latitude}, lon={self.longitude}, city={self.city})>"
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            "user_id": self.user_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "city": self.city,
            "country": self.country,
            "timezone": self.timezone,
            "calculation_method": self.calculation_method,
            "asr_calculation": self.asr_calculation,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def get_coordinates(self) -> tuple[float, float]:
        """Get coordinates as tuple (lat, lon)"""
        return (self.latitude, self.longitude)
    
    def distance_to(self, other_lat: float, other_lon: float) -> float:
        """
        Calculate distance to another point using Haversine formula.
        Returns distance in kilometers.
        """
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1 = radians(self.latitude), radians(self.longitude)
        lat2, lon2 = radians(other_lat), radians(other_lon)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c