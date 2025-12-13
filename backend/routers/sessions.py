"""
Interview session API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from dependencies.database import get_db
from schemas.assignment import AssignmentInDB, AssignmentStatus
from services.assignment_service import AssignmentService
from services.application_service import ApplicationService

router = APIRouter()


def get_assignment_service(db=Depends(get_db)) -> AssignmentService:
    """Dependency to get assignment service."""
    return AssignmentService(db)


def get_application_service(db=Depends(get_db)) -> ApplicationService:
    """Dependency to get application service."""
    return ApplicationService(db)


@router.get("/{session_id}", response_model=AssignmentInDB)
async def get_session(
    session_id: str,
    service: AssignmentService = Depends(get_assignment_service)
):
    """
    Get interview session by session ID.
    
    This endpoint is used by candidates to access their technical interview.
    """
    assignment = await service.get_assignment_by_session_id(session_id)
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Interview session not found")
    
    # Mark as started if not already
    if assignment.status == AssignmentStatus.SENT and not assignment.started_at:
        await service.mark_assignment_started(str(assignment.id))
        # Refresh assignment data
        assignment = await service.get_assignment_by_session_id(session_id)
    
    return assignment


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    candidate_notes: str = None,
    assignment_service: AssignmentService = Depends(get_assignment_service),
    application_service: ApplicationService = Depends(get_application_service)
):
    """
    Mark interview session as completed.
    
    This endpoint is called when candidate finishes the technical interview.
    It will:
    - Update assignment status to SUBMITTED
    - Update application status to COMPLETED
    - Record completion timestamp
    """
    # Get assignment by session ID
    assignment = await assignment_service.get_assignment_by_session_id(session_id)
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Interview session not found")
    
    # Mark assignment as submitted
    await assignment_service.mark_assignment_submitted(
        assignment_id=str(assignment.id),
        candidate_notes=candidate_notes
    )
    
    # Update application status to completed
    await application_service.update_application(
        application_id=assignment.application_id,
        update={"status": "completed"}
    )
    
    return {
        "message": "Interview completed successfully",
        "assignment_id": str(assignment.id),
        "application_id": assignment.application_id,
        "status": "completed"
    }
