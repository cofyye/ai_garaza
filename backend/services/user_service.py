"""
User service - Business logic for user management.
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from schemas.user import UserCreate, UserInDB, UserUpdate


class UserService:
    """Service for managing users (candidates)."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["users"]
    
    async def create_user(self, user: UserCreate) -> UserInDB:
        """Create a new user."""
        # Check if email already exists
        existing = await self.collection.find_one({"email": user.email})
        if existing:
            raise ValueError("User with this email already exists")
        
        user_dict = user.model_dump()
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = str(result.inserted_id)
        
        return UserInDB(**user_dict)
    
    async def get_user(self, user_id: str) -> Optional[UserInDB]:
        """Get a user by ID."""
        if not ObjectId.is_valid(user_id):
            return None
        
        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
            return UserInDB(**user)
        return None
    
    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """Get a user by email."""
        user = await self.collection.find_one({"email": email})
        if user:
            user["_id"] = str(user["_id"])
            return UserInDB(**user)
        return None
    
    async def get_users(self, skip: int = 0, limit: int = 50) -> list[UserInDB]:
        """Get list of users."""
        cursor = self.collection.find().sort("created_at", -1).skip(skip).limit(limit)
        users = await cursor.to_list(length=limit)
        
        for user in users:
            user["_id"] = str(user["_id"])
        
        return [UserInDB(**user) for user in users]
    
    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[UserInDB]:
        """Update a user."""
        if not ObjectId.is_valid(user_id):
            return None
        
        update_data = user_update.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_user(user_id)
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
            return UserInDB(**result)
        return None
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete a user."""
        if not ObjectId.is_valid(user_id):
            return False
        
        result = await self.collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
