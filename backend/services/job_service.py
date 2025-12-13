"""
Job service - Business logic for job operations.
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from schemas.job import JobCreate, JobInDB, JobUpdate


class JobService:
    """Service for managing jobs in MongoDB."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["jobs"]
    
    async def create_job(self, job: JobCreate) -> JobInDB:
        """Create a new job posting."""
        job_dict = job.model_dump()
        job_dict["applications_count"] = 0
        job_dict["created_at"] = datetime.utcnow()
        job_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(job_dict)
        job_dict["_id"] = str(result.inserted_id)
        
        return JobInDB(**job_dict)
    
    async def get_job(self, job_id: str) -> Optional[JobInDB]:
        """Get a single job by ID."""
        if not ObjectId.is_valid(job_id):
            return None
        
        job = await self.collection.find_one({"_id": ObjectId(job_id)})
        if job:
            job["_id"] = str(job["_id"])
            return JobInDB(**job)
        return None
    
    async def get_jobs(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        location_type: Optional[str] = None,
        experience_level: Optional[str] = None
    ) -> list[JobInDB]:
        """Get list of jobs with optional filters."""
        query = {}
        
        if status:
            query["status"] = status
        if location_type:
            query["location_type"] = location_type
        if experience_level:
            query["experience_level"] = experience_level
        
        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        jobs = await cursor.to_list(length=limit)
        
        for job in jobs:
            job["_id"] = str(job["_id"])
        
        return [JobInDB(**job) for job in jobs]
    
    async def update_job(self, job_id: str, job_update: JobUpdate) -> Optional[JobInDB]:
        """Update a job posting."""
        if not ObjectId.is_valid(job_id):
            return None
        
        update_data = job_update.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_job(job_id)
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(job_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
            return JobInDB(**result)
        return None
    
    async def delete_job(self, job_id: str) -> bool:
        """Delete a job posting."""
        if not ObjectId.is_valid(job_id):
            return False
        
        result = await self.collection.delete_one({"_id": ObjectId(job_id)})
        return result.deleted_count > 0
    
    async def search_jobs(self, search_term: str, limit: int = 20) -> list[JobInDB]:
        """Search jobs by title, company, or tech stack."""
        query = {
            "$or": [
                {"title": {"$regex": search_term, "$options": "i"}},
                {"company": {"$regex": search_term, "$options": "i"}},
                {"tech_stack": {"$regex": search_term, "$options": "i"}},
                {"description": {"$regex": search_term, "$options": "i"}}
            ]
        }
        
        cursor = self.collection.find(query).sort("created_at", -1).limit(limit)
        jobs = await cursor.to_list(length=limit)
        
        for job in jobs:
            job["_id"] = str(job["_id"])
        
        return [JobInDB(**job) for job in jobs]
