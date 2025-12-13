"""
Application API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query

from dependencies.database import get_db
from schemas.application import ApplicationCreate, ApplicationInDB, ApplicationUpdate
from services.application_service import ApplicationService
from services.assignment_service import AssignmentService

router = APIRouter()


def get_application_service(db=Depends(get_db)) -> ApplicationService:
    """Dependency to get application service."""
    return ApplicationService(db)


def get_assignment_service(db=Depends(get_db)) -> AssignmentService:
    """Dependency to get assignment service."""
    return AssignmentService(db)


@router.post("/", response_model=ApplicationInDB, status_code=201)
async def create_application(
    application: ApplicationCreate,
    generate_task: bool = Query(False, description="Auto-generate technical assignment"),
    send_email: bool = Query(False, description="Auto-send invitation email"),
    service: ApplicationService = Depends(get_application_service),
    assignment_service: AssignmentService = Depends(get_assignment_service)
):
    """
    Create a new job application.
    
    - **user_id**: ID of the user applying
    - **job_id**: ID of the job position
    - **cover_letter**: Optional cover letter
    - **generate_task**: If true, automatically generate technical assignment
    - **send_email**: If true, send invitation email immediately (requires generate_task=true)
    """
    try:
        app = await service.create_application(application)
        
        # Generate assignment if requested
        if generate_task:
            assignment = await assignment_service.generate_and_create_assignment(
                application_id=str(app.id),
                auto_send=send_email
            )
            print(f"✅ Assignment generated for application {app.id}")
            if send_email:
                print(f"✅ Invitation email sent")
        
        return app
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[ApplicationInDB])
async def get_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    job_id: str = Query(None, description="Filter by job ID"),
    user_id: str = Query(None, description="Filter by user ID"),
    status: str = Query(None, description="Filter by status"),
    service: ApplicationService = Depends(get_application_service)
):
    """
    Get all applications with optional filters.
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **job_id**: Filter by specific job
    - **user_id**: Filter by specific user
    - **status**: Filter by application status
    """
    # If job_id is provided, use the specific method
    if job_id:
        return await service.get_applications_by_job(job_id, status)
    
    # If user_id is provided, use the specific method
    if user_id:
        return await service.get_applications_by_user(user_id)
    
    # Otherwise, get all applications with pagination and enrichment
    match_stage = {}
    if status:
        match_stage["status"] = status
    
    # Aggregation pipeline to enrich with user and job data
    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {"$sort": {"applied_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
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
                "job_title": {"$arrayElemAt": ["$job_data.title", 0]}
            }
        },
        {"$project": {"user_data": 0, "job_data": 0}}
    ]
    
    cursor = service.collection.aggregate(pipeline)
    applications = await cursor.to_list(length=limit)
    
    for app in applications:
        app["_id"] = str(app["_id"])
    
    return [ApplicationInDB(**app) for app in applications]


@router.get("/{application_id}", response_model=ApplicationInDB)
async def get_application(
    application_id: str,
    service: ApplicationService = Depends(get_application_service)
):
    """Get a single application by ID."""
    app = await service.get_application(application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.get("/job/{job_id}", response_model=list[ApplicationInDB])
async def get_applications_by_job(
    job_id: str,
    status: str = Query(None, description="Filter by status"),
    service: ApplicationService = Depends(get_application_service)
):
    """Get all applications for a specific job."""
    return await service.get_applications_by_job(job_id, status)


@router.get("/user/{user_id}", response_model=list[ApplicationInDB])
async def get_applications_by_user(
    user_id: str,
    service: ApplicationService = Depends(get_application_service)
):
    """Get all applications by a specific user."""
    return await service.get_applications_by_user(user_id)


@router.put("/{application_id}", response_model=ApplicationInDB)
async def update_application(
    application_id: str,
    update: ApplicationUpdate,
    service: ApplicationService = Depends(get_application_service)
):
    """Update application status or details."""
    app = await service.update_application(application_id, update)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.delete("/{application_id}", status_code=204)
async def delete_application(
    application_id: str,
    service: ApplicationService = Depends(get_application_service)
):
    """Delete an application."""
    success = await service.delete_application(application_id)
    if not success:
        raise HTTPException(status_code=404, detail="Application not found")
    return None


@router.post("/{application_id}/generate-assignment", response_model=ApplicationInDB)
async def generate_and_send_assignment(
    application_id: str,
    deadline_hours: int = Query(168, description="Assignment deadline in hours (default 7 days)"),
    app_service: ApplicationService = Depends(get_application_service),
    assignment_service: AssignmentService = Depends(get_assignment_service)
):
    """
    Generate a technical assignment for this application and send invitation email.
    
    This endpoint:
    1. Gets application details
    2. Uses mock AI agent to generate unique assignment based on job
    3. Sends mock email invitation to candidate
    4. Updates application status to ASSIGNMENT_SENT
    
    Later the AI agent will use LangGraph to generate realistic, job-specific tasks.
    """
    # Get application
    application = await app_service.get_application(application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if assignment already exists
    existing_assignment = await assignment_service.get_assignment_by_application(application_id)
    if existing_assignment:
        raise HTTPException(status_code=400, detail="Assignment already exists for this application")
    
    # Generate assignment using mock AI agent (auto_send will handle email and application update)
    assignment = await assignment_service.generate_and_create_assignment(
        application_id=application_id,
        auto_send=True  # Automatically send email invitation
    )
    
    # Get updated application (status should be "assignment_sent" now)
    updated_application = await app_service.get_application(application_id)
    
    if not updated_application:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated application")
    
    return updated_application
