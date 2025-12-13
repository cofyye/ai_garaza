"""
MongoDB database connection and setup.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure

from core.config import settings


class MongoDB:
    client: AsyncIOMotorClient = None
    db = None


mongodb = MongoDB()


async def connect_to_mongo():
    """Connect to MongoDB."""
    try:
        mongodb.client = AsyncIOMotorClient(settings.MONGODB_URL)
        mongodb.db = mongodb.client[settings.MONGODB_DB_NAME]
        # Test connection
        await mongodb.client.admin.command("ping")
        print("✅ Successfully connected to MongoDB")
    except ConnectionFailure as e:
        print(f"❌ Could not connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection."""
    if mongodb.client:
        mongodb.client.close()
        print("✅ Closed MongoDB connection")


def get_database():
    """Get database instance."""
    return mongodb.db
