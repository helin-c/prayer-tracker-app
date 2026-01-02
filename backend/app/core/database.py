# ============================================================================
# FILE: backend/app/core/database.py (FIXED - ASYNC PRODUCTION-READY)
# ============================================================================
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import text, event
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool  
from contextlib import asynccontextmanager
from app.core.config import settings
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)

# ============================================================================
# ASYNC DATABASE ENGINE (FIXED)
# ============================================================================
def get_async_engine():
    """
    Create asynchronous database engine with production-ready settings.
    Requires 'asyncpg' driver for PostgreSQL.
    """
    # Convert standard postgres URL to asyncpg URL
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    
    engine_kwargs = {
        "pool_pre_ping": settings.DB_POOL_PRE_PING,
        "echo": settings.DB_ECHO,
    }
    
    # PostgreSQL specific optimizations
    if "postgresql" in db_url:
        # ✅ FIXED: Use NullPool for async or configure async pool properly
        # Option 1: NullPool (simpler, good for most cases)
        engine_kwargs["poolclass"] = NullPool
        
        # Option 2: Async pool with proper configuration (better for high traffic)
        # Uncomment below if you want connection pooling:
        # engine_kwargs["poolclass"] = AsyncAdaptedQueuePool
        # engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
        # engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
        # engine_kwargs["pool_recycle"] = 3600
        # engine_kwargs["pool_timeout"] = 30
        
        # AsyncPG specific connect args
        engine_kwargs["connect_args"] = {
            "server_settings": {
                "statement_timeout": "30000"  # 30 seconds
            }
        }
    elif "sqlite" in db_url:
        # SQLite async requires special handling
        if not db_url.startswith("sqlite+aiosqlite://"):
            db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://")
        engine_kwargs["poolclass"] = NullPool
        logger.warning("⚠️  Using SQLite with Async - strictly for development")

    return create_async_engine(db_url, **engine_kwargs)


# Create global async engine
async_engine = get_async_engine()

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()


# ============================================================================
# DATABASE DEPENDENCY (ASYNC)
# ============================================================================
async def get_db() -> AsyncSession:
    """
    Async Database session dependency.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}", exc_info=True)
            await session.rollback()
            raise
        finally:
            await session.close()


# ============================================================================
# TRANSACTION CONTEXT MANAGER (ASYNC)
# ============================================================================
@asynccontextmanager
async def transaction_scope():
    """
    Provide an async transactional scope.
    """
    async with AsyncSessionLocal() as session:
        try:
            async with session.begin():
                yield session
        except Exception as e:
            logger.error(f"Async transaction failed: {e}", exc_info=True)
            raise


# ============================================================================
# DATABASE UTILITIES (ASYNC)
# ============================================================================
async def init_db():
    """Initialize database tables (Async)."""
    logger.info("Creating database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")


async def drop_db():
    """Drop all database tables (Async)."""
    if not settings.DEBUG:
        raise RuntimeError("Cannot drop database in production mode!")
    
    logger.warning("Dropping all database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    logger.info("Database tables dropped successfully")


# ============================================================================
# HEALTH CHECK (ASYNC)
# ============================================================================
async def check_db_connection(timeout: int = 5) -> tuple[bool, Optional[str]]:
    """Check database connection health asynchronously."""
    try:
        async with AsyncSessionLocal() as session:
            start_time = time.time()
            await session.execute(text("SELECT 1"))
            query_time = time.time() - start_time
            
        if query_time > 1.0:
            logger.warning(f"Slow database response: {query_time:.2f}s")
            
        return True, None
        
    except Exception as e:
        error_msg = f"Database health check failed: {str(e)}"
        logger.error(error_msg)
        return False, error_msg


# ============================================================================
# CONNECTION POOL STATS
# ============================================================================
def get_pool_stats() -> dict:
    """Get pool statistics."""
    if isinstance(async_engine.pool, NullPool):
        return {"message": "No connection pooling (NullPool)", "note": "Each request creates new connection"}
        
    pool = async_engine.pool
    return {
        "pool_size": pool.size(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
    }