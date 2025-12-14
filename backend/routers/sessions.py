"""
Interview session API endpoints.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from datetime import datetime

from dependencies.database import get_db
from schemas.assignment import AssignmentInDB, AssignmentStatus
from schemas.application import ApplicationUpdate, ApplicationStatus
from services.assignment_service import AssignmentService
from services.application_service import ApplicationService

logger = logging.getLogger(__name__)
router = APIRouter()

# Lazy initialization for analysis service
_analysis_service = None

def get_analysis_service():
    """Get or create the analysis service lazily."""
    global _analysis_service
    if _analysis_service is None:
        from agents.services.interview_analysis_service import InterviewAnalysisService
        _analysis_service = InterviewAnalysisService()
    return _analysis_service


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


async def run_interview_analysis(
    db,
    session_id: str,
    session_doc: dict,
    assignment: dict
):
    """Background task to analyze completed interview."""
    try:
        logger.info(f"Starting interview analysis for session {session_id}")
        
        # Extract data for analysis
        candidate_name = session_doc.get("candidate_context", {}).get("name", "Unknown")
        position = session_doc.get("job_context", {}).get("title", "Unknown Position")
        conversation = session_doc.get("messages", [])
        code_data = session_doc.get("code", {})
        final_code = code_data.get("current", "")
        code_language = code_data.get("language", "python")
        task_context = session_doc.get("task_context", {})
        task_title = task_context.get("task_title", "Coding Task")
        task_description = task_context.get("task_description", "")
        interview_started_at = session_doc.get("interview_started_at") or session_doc.get("created_at", datetime.utcnow())
        interview_ended_at = datetime.utcnow()
        early_termination = session_doc.get("early_termination", False)
        
        # Ensure datetime objects
        if isinstance(interview_started_at, str):
            interview_started_at = datetime.fromisoformat(interview_started_at.replace("Z", "+00:00"))
        
        # Get analysis service (lazy initialization)
        analysis_service = get_analysis_service()
        
        # Run analysis
        analysis = await analysis_service.analyze_interview(
            session_id=session_id,
            candidate_name=candidate_name,
            position=position,
            conversation=conversation,
            final_code=final_code,
            code_language=code_language,
            task_title=task_title,
            task_description=task_description,
            interview_started_at=interview_started_at,
            interview_ended_at=interview_ended_at,
            early_termination=early_termination
        )
        
        # Store analysis in database
        analysis_collection = db["interview_analyses"]
        analysis["_id"] = session_id  # Use session_id as document ID
        analysis["assignment_id"] = str(assignment.get("_id", ""))
        analysis["application_id"] = assignment.get("application_id", "")
        
        # Store full conversation for reference
        analysis["full_conversation"] = conversation
        analysis["final_code"] = final_code
        
        await analysis_collection.update_one(
            {"_id": session_id},
            {"$set": analysis},
            upsert=True
        )
        
        logger.info(f"Interview analysis saved for session {session_id}: verdict={analysis['verdict']}")
        
    except Exception as e:
        logger.exception(f"Failed to analyze interview {session_id}: {e}")


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    background_tasks: BackgroundTasks,
    candidate_notes: str = None,
    db=Depends(get_db),
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
    - Trigger AI analysis in background
    """
    # Get assignment by session ID
    assignment = await assignment_service.get_assignment_by_session_id(session_id)
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Interview session not found")
    
    # Get interview session data for analysis
    session_collection = db["interview_sessions"]
    session_doc = await session_collection.find_one({"session_id": session_id})
    
    # Mark interview as ended in session
    if session_doc:
        await session_collection.update_one(
            {"session_id": session_id},
            {"$set": {
                "interview_ended": True,
                "completed_at": datetime.utcnow()
            }}
        )
    
    # Mark assignment as submitted
    await assignment_service.mark_assignment_submitted(
        assignment_id=str(assignment.id),
        candidate_notes=candidate_notes
    )
    
    # Update application status to completed
    await application_service.update_application(
        application_id=assignment.application_id,
        update=ApplicationUpdate(status=ApplicationStatus.COMPLETED)
    )
    
    # Trigger analysis in background
    if session_doc:
        assignment_dict = {
            "_id": assignment.id,
            "application_id": assignment.application_id
        }
        background_tasks.add_task(run_interview_analysis, db, session_id, session_doc, assignment_dict)
    
    return {
        "message": "Interview completed successfully",
        "assignment_id": str(assignment.id),
        "application_id": assignment.application_id,
        "status": "completed",
        "analysis_status": "processing" if session_doc else "skipped"
    }

