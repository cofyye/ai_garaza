"""
Common database dependencies.
"""
from db.mongodb import get_database


async def get_db():
    """Dependency to get database instance."""
    return get_database()
