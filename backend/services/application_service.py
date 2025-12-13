"""
Application service - Business logic for job applications.
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from schemas.application import ApplicationCreate, ApplicationInDB, ApplicationStatus, ApplicationUpdate


class ApplicationService:
    """Service for managing job applications."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["applications"]
        self.users_collection = db["users"]
        self.jobs_collection = db["jobs"]
    
    async def create_application(self, application: ApplicationCreate) -> ApplicationInDB:
        """Create a new job application."""
        # Validate user and job exist
        if not ObjectId.is_valid(application.user_id) or not ObjectId.is_valid(application.job_id):
            raise ValueError("Invalid user_id or job_id")
        
        # Check if user already applied
        existing = await self.collection.find_one({
            "user_id": application.user_id,
            "job_id": application.job_id
        })
        if existing:
            raise ValueError("User already applied to this job")
        
        app_dict = application.model_dump()
        app_dict["status"] = ApplicationStatus.PENDING
        app_dict["applied_at"] = datetime.utcnow()
        app_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(app_dict)
        app_dict["_id"] = str(result.inserted_id)
        
        # Increment applications count on job
        await self.jobs_collection.update_one(
            {"_id": ObjectId(application.job_id)},
            {"$inc": {"applications_count": 1}}
        )
        
        return ApplicationInDB(**app_dict)
    
    async def get_application(self, application_id: str) -> Optional[ApplicationInDB]:
        """Get a single application by ID with populated fields."""
        if not ObjectId.is_valid(application_id):
            return None
        
        app = await self.collection.find_one({"_id": ObjectId(application_id)})
        if not app:
            return None
        
        # Populate user and job info
        app["_id"] = str(app["_id"])
        
        if ObjectId.is_valid(app["user_id"]):
            user = await self.users_collection.find_one({"_id": ObjectId(app["user_id"])})
            if user:
                app["user_email"] = user.get("email")
                app["user_name"] = user.get("full_name")
        
        if ObjectId.is_valid(app["job_id"]):
            job = await self.jobs_collection.find_one({"_id": ObjectId(app["job_id"])})
            if job:
                app["job_title"] = job.get("title")
                app["company_name"] = job.get("company")
        
        return ApplicationInDB(**app)
    
    async def get_applications_by_job(self, job_id: str, status: Optional[str] = None) -> list[ApplicationInDB]:
        """Get all applications for a specific job with user and job details."""
        if not ObjectId.is_valid(job_id):
            return []
        
        match_stage = {"job_id": job_id}
        if status:
            match_stage["status"] = status
        
        # Aggregation pipeline to enrich with user and job data
        pipeline = [
            {"$match": match_stage},
            {"$sort": {"applied_at": -1}},
            {
                "$lookup": {
                    "from": "users",
                    "let": {"user_id_str": "$user_id"},
                    "pipeline": [
                        {"$addFields": {"_id_str": {"$toString": "$_id"}}},
                        {"$match": {"$expr": {"$eq": ["$_id_str", "$$user_id_str"]}}}
                    ],
                    "as": "user_data"
                }
            },
            {
                "$lookup": {
                    "from": "jobs",
                    "let": {"job_id_str": "$job_id"},
                    "pipeline": [
                        {"$addFields": {"_id_str": {"$toString": "$_id"}}},
                        {"$match": {"$expr": {"$eq": ["$_id_str", "$$job_id_str"]}}}
                    ],
                    "as": "job_data"
                }
            },
            {
                "$addFields": {
                    "user_email": {"$arrayElemAt": ["$user_data.email", 0]},
                    "user_name": {"$arrayElemAt": ["$user_data.full_name", 0]},
                    "job_title": {"$arrayElemAt": ["$job_data.title", 0]},
                    "company_name": {"$arrayElemAt": ["$job_data.company", 0]}
                }
            },
            {"$project": {"user_data": 0, "job_data": 0}}
        ]
        
        cursor = self.collection.aggregate(pipeline)
        apps = await cursor.to_list(length=100)
        
        for app in apps:
            app["_id"] = str(app["_id"])
        
        return [ApplicationInDB(**app) for app in apps]
    
    async def get_applications_by_user(self, user_id: str) -> list[ApplicationInDB]:
        """Get all applications by a specific user."""
        if not ObjectId.is_valid(user_id):
            return []
        
        cursor = self.collection.find({"user_id": user_id}).sort("applied_at", -1)
        apps = await cursor.to_list(length=100)
        
        for app in apps:
            app["_id"] = str(app["_id"])
        
        return [ApplicationInDB(**app) for app in apps]
    
    async def update_application(
        self, 
        application_id: str, 
        update: ApplicationUpdate
    ) -> Optional[ApplicationInDB]:
        """Update application status or details."""
        if not ObjectId.is_valid(application_id):
            return None
        
        update_data = update.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_application(application_id)
        
        update_data["updated_at"] = datetime.utcnow()
        
        if "status" in update_data and update_data["status"] == ApplicationStatus.REVIEWED:
            update_data["reviewed_at"] = datetime.utcnow()
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(application_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
            return ApplicationInDB(**result)
        return None
    
    async def delete_application(self, application_id: str) -> bool:
        """Delete an application."""
        if not ObjectId.is_valid(application_id):
            return False
        
        # Get application to decrement job counter
        app = await self.collection.find_one({"_id": ObjectId(application_id)})
        if app and ObjectId.is_valid(app.get("job_id")):
            await self.jobs_collection.update_one(
                {"_id": ObjectId(app["job_id"])},
                {"$inc": {"applications_count": -1}}
            )
        
        result = await self.collection.delete_one({"_id": ObjectId(application_id)})
        return result.deleted_count > 0
