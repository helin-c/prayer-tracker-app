# ============================================================================
# FILE: backend/app/core/database.py
# ============================================================================
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# DATABASE ENGINE
# ============================================================================
def get_engine():
    """
    Create database engine with production-ready settings.
    
    Features:
    - Connection pooling
    - Pre-ping for connection health checks
    - Configurable pool size
    """
    engine_kwargs = {
        "pool_pre_ping": settings.DB_POOL_PRE_PING,
        "echo": settings.DB_ECHO,
    }
    
    # Add pooling for non-SQLite databases
    if not settings.DATABASE_URL.startswith("sqlite"):
        engine_kwargs.update({
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
        })
    else:
        # SQLite doesn't support connection pooling
        engine_kwargs["poolclass"] = NullPool
        logger.warning("Using SQLite - connection pooling disabled")
    
    engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
    
    # Enable foreign keys for SQLite
    if settings.DATABASE_URL.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_conn, connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    
    return engine


# Create engine
engine = get_engine()

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for models
Base = declarative_base()


# ============================================================================
# DATABASE DEPENDENCY
# ============================================================================
def get_db() -> Session:
    """
    Database session dependency for FastAPI routes.
    
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


# ============================================================================
# DATABASE UTILITIES
# ============================================================================
def init_db():
    """
    Initialize database tables.
    
    Creates all tables defined in models.
    Use alembic migrations in production.
    """
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")


def drop_db():
    """
    Drop all database tables.
    
    WARNING: This will delete all data!
    Use only in development/testing.
    """
    logger.warning("Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    logger.info("Database tables dropped successfully")


def reset_db():
    """
    Reset database (drop and recreate all tables).
    
    WARNING: This will delete all data!
    Use only in development/testing.
    """
    drop_db()
    init_db()


# ============================================================================
# DATABASE HEALTH CHECK
# ============================================================================
def check_db_connection() -> bool:
    """
    Check if database connection is healthy.
    
    Returns:
        bool: True if connection is healthy, False otherwise
    """
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False