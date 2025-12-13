"""
Job API endpoints.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from dependencies.database import get_db
from schemas.job import JobCreate, JobInDB, JobUpdate
from services.job_service import JobService

router = APIRouter()


def get_job_service(db=Depends(get_db)) -> JobService:
    """Dependency to get job service."""
    return JobService(db)


@router.post("/", response_model=JobInDB, status_code=201)
async def create_job(
    job: JobCreate,
    service: JobService = Depends(get_job_service)
):
    """
    Create a new job posting.
    
    - **title**: Job title (e.g., Senior Backend Engineer)
    - **company**: Company name
    - **location**: Location or Remote
    - **description**: Full job description
    - **requirements**: List of required skills
    - **tech_stack**: Technologies used
    """
    return await service.create_job(job)


@router.get("/", response_model=list[JobInDB])
async def get_jobs(
    skip: int = Query(0, ge=0, description="Number of jobs to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max number of jobs to return"),
    status: Optional[str] = Query(None, description="Filter by status (active/closed/draft)"),
    location_type: Optional[str] = Query(None, description="Filter by location type (remote/onsite/hybrid)"),
    experience_level: Optional[str] = Query(None, description="Filter by experience level"),
    service: JobService = Depends(get_job_service)
):
    """
    Get list of jobs with optional filters.
    
    Supports pagination and filtering by status, location type, and experience level.
    """
    return await service.get_jobs(
        skip=skip,
        limit=limit,
        status=status,
        location_type=location_type,
        experience_level=experience_level
    )


@router.get("/search", response_model=list[JobInDB])
async def search_jobs(
    q: str = Query(..., min_length=1, description="Search term"),
    limit: int = Query(20, ge=1, le=100),
    service: JobService = Depends(get_job_service)
):
    """
    Search jobs by title, company, tech stack, or description.
    """
    return await service.search_jobs(search_term=q, limit=limit)


@router.get("/{job_id}", response_model=JobInDB)
async def get_job(
    job_id: str,
    service: JobService = Depends(get_job_service)
):
    """
    Get a single job by ID.
    """
    job = await service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.put("/{job_id}", response_model=JobInDB)
async def update_job(
    job_id: str,
    job_update: JobUpdate,
    service: JobService = Depends(get_job_service)
):
    """
    Update a job posting.
    
    Only provided fields will be updated.
    """
    job = await service.update_job(job_id, job_update)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.delete("/{job_id}", status_code=204)
async def delete_job(
    job_id: str,
    service: JobService = Depends(get_job_service)
):
    """
    Delete a job posting.
    """
    success = await service.delete_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    return None
