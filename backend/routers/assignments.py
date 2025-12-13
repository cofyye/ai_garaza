"""
Assignment API endpoints.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel

from dependencies.database import get_db
from schemas.assignment import AssignmentInDB, AssignmentUpdate
from services.assignment_service import AssignmentService

router = APIRouter()


def get_assignment_service(db=Depends(get_db)) -> AssignmentService:
    """Dependency to get assignment service."""
    return AssignmentService(db)


class GenerateAssignmentRequest(BaseModel):
    """Request body for generating assignment."""
    auto_send: bool = False
    custom_requirements: Optional[str] = None


class GenerateBulkAssignmentsRequest(BaseModel):
    """Request body for bulk assignment generation."""
    application_ids: list[str]
    auto_send: bool = False
    custom_requirements: Optional[str] = None


@router.post("/generate/{application_id}", response_model=AssignmentInDB, status_code=201)
async def generate_assignment(
    application_id: str,
    request: GenerateAssignmentRequest,
    service: AssignmentService = Depends(get_assignment_service)
):
    """
    Generate a technical assignment for an application using AI agent.
    
    - **application_id**: ID of the application
    - **auto_send**: If true, send invitation email immediately
    - **custom_requirements**: Optional custom instructions for the AI agent
    """
    try:
        assignment = await service.generate_and_create_assignment(
            application_id=application_id,
            auto_send=request.auto_send,
            custom_requirements=request.custom_requirements
        )
        return assignment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate-bulk", status_code=201)
async def generate_bulk_assignments(
    request: GenerateBulkAssignmentsRequest,
    service: AssignmentService = Depends(get_assignment_service)
):
    """
    Generate technical assignments for multiple applications at once.
    
    - **application_ids**: List of application IDs to generate assignments for
    - **auto_send**: If true, send invitation emails immediately
    - **custom_requirements**: Optional custom instructions for the AI agent
    
    Returns a list of generated assignments with their interview links.
    """
    results = []
    errors = []
    
    for application_id in request.application_ids:
        try:
            # Generate assignment - this also updates application status to "invited"
            assignment = await service.generate_and_create_assignment(
                application_id=application_id,
                auto_send=request.auto_send,
                custom_requirements=request.custom_requirements
            )
            
            results.append({
                "application_id": application_id,
                "assignment_id": assignment.id,
                "session_url": assignment.session_url,
                "email_sent": request.auto_send,
                "success": True
            })
            
        except Exception as e:
            errors.append({
                "application_id": application_id,
                "error": str(e),
                "success": False
            })
    
    return {
        "total": len(request.application_ids),
        "successful": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors
    }


@router.post("/{assignment_id}/send-email")
async def send_assignment_email(
    assignment_id: str,
    service: AssignmentService = Depends(get_assignment_service)
):
    """Send (or resend) assignment invitation email to candidate."""
    success = await service.send_assignment_email(assignment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Email sent successfully", "assignment_id": assignment_id}


@router.get("/{assignment_id}", response_model=AssignmentInDB)
async def get_assignment(
    assignment_id: str,
    service: AssignmentService = Depends(get_assignment_service)
):
    """Get assignment by ID."""
    assignment = await service.get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@router.get("/application/{application_id}", response_model=AssignmentInDB)
async def get_assignment_by_application(
    application_id: str,
    service: AssignmentService = Depends(get_assignment_service)
):
    """Get assignment for a specific application."""
    assignment = await service.get_assignment_by_application(application_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found for this application")
    return assignment


@router.get("/{assignment_id}/stats")
async def get_assignment_stats(
    assignment_id: str,
    service: AssignmentService = Depends(get_assignment_service)
):
    """
    Get timing statistics for an assignment.
    
    Returns:
    - Email sent time
    - Hours since sent
    - Deadline
    - Hours until deadline
    - Is expired
    - Time taken (if submitted)
    """
    stats = await service.get_assignment_stats(assignment_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return stats


@router.put("/{assignment_id}", response_model=AssignmentInDB)
async def update_assignment(
    assignment_id: str,
    update: AssignmentUpdate,
    service: AssignmentService = Depends(get_assignment_service)
):
    """
    Update assignment (candidate submission, reviewer feedback, etc.).
    """
    assignment = await service.update_assignment(assignment_id, update)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@router.post("/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: str,
    submission_url: str,
    candidate_notes: str = None,
    service: AssignmentService = Depends(get_assignment_service)
):
    """
    Submit an assignment solution.
    
    - **submission_url**: GitHub repo or hosted solution URL
    - **candidate_notes**: Optional notes from candidate
    """
    update = AssignmentUpdate(
        status="submitted",
        submission_url=submission_url,
        candidate_notes=candidate_notes
    )
    
    assignment = await service.update_assignment(assignment_id, update)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return {
        "message": "Assignment submitted successfully",
        "assignment_id": assignment_id,
        "submitted_at": assignment.submitted_at
    }
