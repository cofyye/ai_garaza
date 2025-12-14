"""
Interview API endpoints - Agent 2 (Interview Conductor).
"""
import logging
import traceback
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from bson import ObjectId

from dependencies.database import get_db
from agents.schemas.interview_state import InterviewState, MessageItem
from agents.graphs.interview_graph import InterviewGraph
from agents.services.tts_service import TTSService
from agents.services.stt_service import STTService


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models
class StartInterviewResponse(BaseModel):
    """Response for starting interview."""
    session_id: str
    stage: str
    can_edit_code: bool
    task_unlocked: bool
    interview_ended: bool = False  # True if interview has ended
    early_termination: bool = False  # True if ended due to poor performance
    assistant: Optional[dict] = None
    messages_tail: list[dict]


class MessageRequest(BaseModel):
    """Request for sending a message."""
    text: str


class CodeRequest(BaseModel):
    """Request for updating code."""
    code: str
    language: str = "python"


class IdleRequest(BaseModel):
    """Request for reporting idle time."""
    seconds_idle: int


class InterviewStateResponse(BaseModel):
    """Response for getting interview state."""
    session_id: str
    stage: str
    can_edit_code: bool
    task_unlocked: bool
    interview_ended: bool = False
    early_termination: bool = False
    messages_tail: list[dict]
    code_current: str
    code_language: str


# Initialize services
interview_graph = InterviewGraph()
tts_service = TTSService()
stt_service = STTService()


async def get_interview_session(session_id: str, db):
    """Get or create interview session document with candidate and job context."""
    try:
        collection = db["interview_sessions"]
        
        # Try to find existing session
        session_doc = await collection.find_one({"session_id": session_id})
        
        if session_doc:
            return session_doc
        
        # Create new session - need to load assignment first
        assignments_collection = db["assignments"]
        assignment = await assignments_collection.find_one({"session_id": session_id})
        
        if not assignment:
            logger.warning(f"Assignment not found for session_id: {session_id}")
            raise HTTPException(status_code=404, detail=f"Assignment for session_id {session_id} not found")
        
        # Load application to get user info
        application_id = assignment.get("application_id")
        candidate_context = {"name": None, "email": None}
        job_context = {"title": None, "experience_level": "mid", "tech_stack": [], "requirements": []}
        
        if application_id:
            applications_collection = db["applications"]
            application = await applications_collection.find_one({"_id": application_id})
            
            if application:
                # Load user info
                user_id = application.get("user_id")
                if user_id:
                    users_collection = db["users"]
                    user = await users_collection.find_one({"_id": user_id})
                    if user:
                        candidate_context["name"] = user.get("name") or user.get("email", "").split("@")[0]
                        candidate_context["email"] = user.get("email")
                
                # Load job info
                job_id = application.get("job_id")
                if job_id:
                    jobs_collection = db["jobs"]
                    job = await jobs_collection.find_one({"_id": job_id})
                    if job:
                        job_context["title"] = job.get("title")
                        job_context["experience_level"] = job.get("experience_level", "mid")
                        job_context["tech_stack"] = job.get("tech_stack", [])
                        job_context["requirements"] = job.get("requirements", [])
        
        logger.info(f"📋 Loaded context - Candidate: {candidate_context['name']}, Job: {job_context['title']} ({job_context['experience_level']})")
        
        # Create new interview session document
        session_doc = {
            "session_id": session_id,
            "assignment_id": str(assignment["_id"]),
            "application_id": application_id,
            "stage": "INTRO",
            "can_edit_code": False,
            "task_unlocked": False,
            "interview_ended": False,
            "early_termination": False,
            "messages": [],
            "code": {
                "language": "python",
                "current": "",
                "last_change_at": None
            },
            "code_history": [],
            "counters": {
                "intro_questions_asked": 0,
                "screening_questions_asked": 0,
                "screening_target": 6,
                "poor_answers_count": 0,
                "idle_nudges": 0,
                "last_idle_nudge_at": None
            },
            "candidate_context": candidate_context,
            "job_context": job_context,
            "task_context": {
                "task_title": assignment.get("task_title"),
                "task_description": assignment.get("task_description"),
                "task_requirements": assignment.get("task_requirements", [])
            },
            "interview_started_at": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await collection.insert_one(session_doc)
        return session_doc
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting/creating interview session: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


async def build_state_from_doc(session_doc: dict) -> InterviewState:
    """Build InterviewState from MongoDB document."""
    # Convert messages
    messages = [
        MessageItem(
            role=msg["role"],
            text=msg["text"],
            ts=msg.get("ts", datetime.utcnow())
        )
        for msg in session_doc.get("messages", [])
    ]
    
    counters = session_doc.get("counters", {})
    code = session_doc.get("code", {})
    task_context = session_doc.get("task_context", {})
    candidate_context = session_doc.get("candidate_context", {})
    job_context = session_doc.get("job_context", {})
    
    return InterviewState(
        session_id=session_doc["session_id"],
        assignment_id=session_doc["assignment_id"],
        application_id=session_doc.get("application_id", ""),
        stage=session_doc["stage"],
        can_edit_code=session_doc.get("can_edit_code", False),
        task_unlocked=session_doc.get("task_unlocked", False),
        interview_ended=session_doc.get("interview_ended", False),
        early_termination=session_doc.get("early_termination", False),
        messages=messages,
        # Candidate info
        candidate_name=candidate_context.get("name"),
        candidate_email=candidate_context.get("email"),
        # Job info
        job_title=job_context.get("title"),
        job_experience_level=job_context.get("experience_level", "mid"),
        job_tech_stack=job_context.get("tech_stack", []),
        job_requirements=job_context.get("requirements", []),
        # Interview timing
        interview_started_at=session_doc.get("interview_started_at"),
        # Counters
        intro_questions_asked=counters.get("intro_questions_asked", 0),
        screening_questions_asked=counters.get("screening_questions_asked", 0),
        screening_target=counters.get("screening_target", 6),
        poor_answers_count=counters.get("poor_answers_count", 0),
        idle_nudges=counters.get("idle_nudges", 0),
        last_idle_nudge_at=counters.get("last_idle_nudge_at"),
        # Code state
        code_current=code.get("current", ""),
        code_language=code.get("language", "python"),
        last_code_change_at=code.get("last_change_at"),
        # Task context
        task_title=task_context.get("task_title"),
        task_description=task_context.get("task_description"),
        task_requirements=task_context.get("task_requirements", [])
    )


async def save_state_to_doc(state: InterviewState, db):
    """Save InterviewState back to MongoDB."""
    collection = db["interview_sessions"]
    
    # Convert messages
    messages = [
        {
            "role": msg.role,
            "text": msg.text,
            "ts": msg.ts
        }
        for msg in state.messages
    ]
    
    update_data = {
        "stage": state.stage,
        "can_edit_code": state.can_edit_code,
        "task_unlocked": state.task_unlocked,
        "interview_ended": state.interview_ended,
        "early_termination": state.early_termination,
        "messages": messages,
        "code": {
            "language": state.code_language,
            "current": state.code_current,
            "last_change_at": state.last_code_change_at
        },
        "counters": {
            "intro_questions_asked": state.intro_questions_asked,
            "screening_questions_asked": state.screening_questions_asked,
            "screening_target": state.screening_target,
            "poor_answers_count": state.poor_answers_count,
            "idle_nudges": state.idle_nudges,
            "last_idle_nudge_at": state.last_idle_nudge_at
        },
        "interview_started_at": state.interview_started_at,
        "updated_at": datetime.utcnow()
    }
    
    await collection.update_one(
        {"session_id": state.session_id},
        {"$set": update_data}
    )


@router.post("/{session_id}/start", response_model=StartInterviewResponse)
async def start_interview(session_id: str, db=Depends(get_db)):
    """
    Start the interview session.
    
    Creates interview session document and returns initial greeting.
    """
    try:
        # Get or create session
        session_doc = await get_interview_session(session_id, db)
        
        # Build state
        state = await build_state_from_doc(session_doc)
        state.last_event_type = "start"
        
        # Run graph
        result_state = await interview_graph.run(state)
        
        # Add assistant message to history
        if result_state.assistant_response:
            assistant_msg = MessageItem(
                role="assistant",
                text=result_state.assistant_response,
                ts=datetime.utcnow()
            )
            result_state.messages.append(assistant_msg)
        
        # Save state
        await save_state_to_doc(result_state, db)
        
        # Generate audio (safe - doesn't crash if no API key)
        audio_data = None
        if result_state.assistant_response:
            try:
                audio_data = await tts_service.text_to_speech(result_state.assistant_response)
            except Exception as e:
                logger.warning(f"TTS failed, continuing without audio: {str(e)}")
                audio_data = None
        
        # Build response
        assistant_response = None
        if result_state.assistant_response:
            assistant_response = {
                "text": result_state.assistant_response,
                "audio_base64": audio_data.get("audio_base64") if audio_data else None,
                "audio_mime": audio_data.get("audio_mime") if audio_data else None
            }
        
        messages_tail = [
            {
                "role": msg.role,
                "text": msg.text,
                "ts": msg.ts.isoformat() if hasattr(msg.ts, 'isoformat') else str(msg.ts)
            }
            for msg in result_state.messages[-20:]
        ]
        
        response_data = {
            "session_id": result_state.session_id,
            "stage": result_state.stage,
            "can_edit_code": result_state.can_edit_code,
            "task_unlocked": result_state.task_unlocked,
            "interview_ended": result_state.interview_ended,
            "early_termination": result_state.early_termination,
            "assistant": assistant_response,
            "messages_tail": messages_tail
        }
        
        # Use jsonable_encoder to handle any ObjectId/datetime safely
        return jsonable_encoder(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error starting interview: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{session_id}/message", response_model=StartInterviewResponse)
async def send_message(session_id: str, request: MessageRequest, db=Depends(get_db)):
    """
    Send a user message to the interview.
    """
    try:
        # Get session
        session_doc = await get_interview_session(session_id, db)
        
        # Build state
        state = await build_state_from_doc(session_doc)
        
        # Add user message to history
        user_msg = MessageItem(
            role="user",
            text=request.text,
            ts=datetime.utcnow()
        )
        state.messages.append(user_msg)
        state.last_user_message = request.text
        state.last_event_type = "user_message"
        
        # Run graph
        result_state = await interview_graph.run(state)
        
        # Add assistant message to history
        if result_state.assistant_response:
            assistant_msg = MessageItem(
                role="assistant",
                text=result_state.assistant_response,
                ts=datetime.utcnow()
            )
            result_state.messages.append(assistant_msg)
        
        # Save state
        await save_state_to_doc(result_state, db)
        
        # Generate audio (safe - doesn't crash if no API key)
        audio_data = None
        if result_state.assistant_response:
            try:
                audio_data = await tts_service.text_to_speech(result_state.assistant_response)
            except Exception as e:
                logger.warning(f"TTS failed, continuing without audio: {str(e)}")
                audio_data = None
        
        # Build response
        assistant_response = None
        if result_state.assistant_response:
            assistant_response = {
                "text": result_state.assistant_response,
                "audio_base64": audio_data.get("audio_base64") if audio_data else None,
                "audio_mime": audio_data.get("audio_mime") if audio_data else None
            }
        
        messages_tail = [
            {
                "role": msg.role,
                "text": msg.text,
                "ts": msg.ts.isoformat() if hasattr(msg.ts, 'isoformat') else str(msg.ts)
            }
            for msg in result_state.messages[-20:]
        ]
        
        response_data = {
            "session_id": result_state.session_id,
            "stage": result_state.stage,
            "can_edit_code": result_state.can_edit_code,
            "task_unlocked": result_state.task_unlocked,
            "interview_ended": result_state.interview_ended,
            "early_termination": result_state.early_termination,
            "assistant": assistant_response,
            "messages_tail": messages_tail
        }
        
        return jsonable_encoder(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error sending message: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{session_id}/code")
async def update_code(session_id: str, request: CodeRequest, db=Depends(get_db)):
    """
    Update the current code being written.
    """
    try:
        collection = db["interview_sessions"]
        
        # Get session
        session_doc = await collection.find_one({"session_id": session_id})
        if not session_doc:
            logger.warning(f"Interview session not found: {session_id}")
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        # Update code
        now = datetime.utcnow()
        
        # Add to code history
        code_history = session_doc.get("code_history", [])
        code_history.append({
            "ts": now,
            "code": request.code
        })
        
        # Keep last 100 snapshots
        if len(code_history) > 100:
            code_history = code_history[-100:]
        
        await collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "code.current": request.code,
                    "code.language": request.language,
                    "code.last_change_at": now,
                    "code_history": code_history,
                    "updated_at": now
                }
            }
        )
        
        return {"ok": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating code: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{session_id}/idle", response_model=StartInterviewResponse)
async def report_idle(session_id: str, request: IdleRequest, db=Depends(get_db)):
    """
    Report that the user has been idle for a certain time.
    """
    try:
        # Get session
        session_doc = await get_interview_session(session_id, db)
        
        # Build state
        state = await build_state_from_doc(session_doc)
        state.idle_seconds = request.seconds_idle
        state.last_event_type = "idle"
        
        # Log code context for debugging
        logger.info(f"📝 Idle check - Code length: {len(state.code_current)} chars, Language: {state.code_language}")
        if state.code_current:
            logger.info(f"📝 Code preview: {state.code_current[:200]}...")
        
        # Run graph (may or may not respond based on cooldown)
        result_state = await interview_graph.run(state)
        
        # Add assistant message to history if present
        if result_state.assistant_response:
            assistant_msg = MessageItem(
                role="assistant",
                text=result_state.assistant_response,
                ts=datetime.utcnow()
            )
            result_state.messages.append(assistant_msg)
        
        # Save state
        await save_state_to_doc(result_state, db)
        
        # Generate audio if response present (safe - doesn't crash if no API key)
        audio_data = None
        if result_state.assistant_response:
            try:
                audio_data = await tts_service.text_to_speech(result_state.assistant_response)
            except Exception as e:
                logger.warning(f"TTS failed, continuing without audio: {str(e)}")
                audio_data = None
        
        # Build response
        assistant_response = None
        if result_state.assistant_response:
            assistant_response = {
                "text": result_state.assistant_response,
                "audio_base64": audio_data.get("audio_base64") if audio_data else None,
                "audio_mime": audio_data.get("audio_mime") if audio_data else None
            }
        
        messages_tail = [
            {
                "role": msg.role,
                "text": msg.text,
                "ts": msg.ts.isoformat() if hasattr(msg.ts, 'isoformat') else str(msg.ts)
            }
            for msg in result_state.messages[-20:]
        ]
        
        response_data = {
            "session_id": result_state.session_id,
            "stage": result_state.stage,
            "can_edit_code": result_state.can_edit_code,
            "task_unlocked": result_state.task_unlocked,
            "interview_ended": result_state.interview_ended,
            "early_termination": result_state.early_termination,
            "assistant": assistant_response,
            "messages_tail": messages_tail
        }
        
        return jsonable_encoder(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error reporting idle: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{session_id}/audio")
async def upload_audio(
    session_id: str,
    file: UploadFile = File(...),
    db=Depends(get_db)
):
    """
    Upload audio file for transcription and get AI response.
    
    This replaces the /message endpoint for voice input.
    Uses ElevenLabs STT to transcribe, then processes like a text message.
    """
    logger.info(f"🎤 AUDIO UPLOAD RECEIVED for session {session_id}")
    logger.info(f"📁 File info: filename={file.filename}, content_type={file.content_type}")
    
    try:
        # Read audio file
        file_bytes = await file.read()
        
        logger.info(f"📦 Read {len(file_bytes)} bytes from uploaded file")
        
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Transcribe using ElevenLabs STT
        logger.info(f"Transcribing audio for session {session_id}, size: {len(file_bytes)} bytes")
        
        try:
            transcript_result = await stt_service.transcribe(
                file_bytes=file_bytes,
                filename=file.filename or "audio.webm",
                mime=file.content_type or "audio/webm"
            )
            transcript = transcript_result.get("text", "")
        except HTTPException as e:
            # Re-raise HTTP exceptions from STT service
            raise
        except Exception as e:
            logger.exception(f"STT transcription failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        
        if not transcript or transcript.strip() == "":
            raise HTTPException(status_code=400, detail="No speech detected in audio")
        
        logger.info(f"✅ Transcribed: {transcript[:100]}...")
        
        # Get session
        session_doc = await get_interview_session(session_id, db)
        
        # Build state
        state = await build_state_from_doc(session_doc)
        
        # Add user message to history
        user_msg = MessageItem(
            role="user",
            text=transcript,
            ts=datetime.utcnow()
        )
        state.messages.append(user_msg)
        state.last_user_message = transcript
        state.last_event_type = "user_message"
        
        # Run graph
        result_state = await interview_graph.run(state)
        
        # Add assistant message to history
        if result_state.assistant_response:
            assistant_msg = MessageItem(
                role="assistant",
                text=result_state.assistant_response,
                ts=datetime.utcnow()
            )
            result_state.messages.append(assistant_msg)
        
        # Save state
        await save_state_to_doc(result_state, db)
        
        # Generate audio (safe - doesn't crash if no API key)
        audio_data = None
        if result_state.assistant_response:
            try:
                audio_data = await tts_service.text_to_speech(result_state.assistant_response)
            except Exception as e:
                logger.warning(f"TTS failed, continuing without audio: {str(e)}")
                audio_data = None
        
        # Build response
        assistant_response = None
        if result_state.assistant_response:
            assistant_response = {
                "text": result_state.assistant_response,
                "audio_base64": audio_data.get("audio_base64") if audio_data else None,
                "audio_mime": audio_data.get("audio_mime") if audio_data else None
            }
        
        messages_tail = [
            {
                "role": msg.role,
                "text": msg.text,
                "ts": msg.ts.isoformat() if hasattr(msg.ts, 'isoformat') else str(msg.ts)
            }
            for msg in result_state.messages[-20:]
        ]
        
        response_data = {
            "session_id": result_state.session_id,
            "transcript": transcript,
            "assistant": assistant_response,
            "stage": result_state.stage,
            "can_edit_code": result_state.can_edit_code,
            "task_unlocked": result_state.task_unlocked,
            "interview_ended": result_state.interview_ended,
            "early_termination": result_state.early_termination,
            "messages_tail": messages_tail
        }
        
        # Use jsonable_encoder to handle any ObjectId/datetime safely
        return jsonable_encoder(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error processing audio upload: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{session_id}/debug")
async def debug_session(session_id: str, db=Depends(get_db)):
    """
    Debug endpoint to verify session state without crashing.
    
    Returns minimal session info for troubleshooting.
    """
    try:
        collection = db["interview_sessions"]
        session_doc = await collection.find_one({"session_id": session_id})
        
        has_doc = session_doc is not None
        
        if not has_doc:
            # Check if assignment exists
            assignments_collection = db["assignments"]
            assignment = await assignments_collection.find_one({"session_id": session_id})
            assignment_found = assignment is not None
            
            return {
                "session_id": session_id,
                "has_doc": False,
                "assignment_found": assignment_found,
                "stage": None,
                "can_edit_code": None,
                "task_unlocked": None
            }
        
        return {
            "session_id": session_id,
            "has_doc": True,
            "assignment_found": True,
            "stage": session_doc.get("stage"),
            "can_edit_code": session_doc.get("can_edit_code"),
            "task_unlocked": session_doc.get("task_unlocked"),
            "message_count": len(session_doc.get("messages", []))
        }
        
    except Exception as e:
        logger.exception(f"Debug endpoint error: {str(e)}")
        return {
            "session_id": session_id,
            "error": str(e),
            "has_doc": False,
            "assignment_found": False
        }


@router.get("/{session_id}/state", response_model=InterviewStateResponse)
async def get_state(session_id: str, db=Depends(get_db)):
    """
    Get current interview state.
    """
    try:
        # Get session
        session_doc = await get_interview_session(session_id, db)
        
        code = session_doc.get("code", {})
        messages = session_doc.get("messages", [])
        
        messages_tail = [
            {
                "role": msg["role"],
                "text": msg["text"],
                "ts": msg.get("ts", datetime.utcnow()).isoformat() if isinstance(msg.get("ts"), datetime) else str(msg.get("ts"))
            }
            for msg in messages[-20:]
        ]
        
        response_data = {
            "session_id": session_doc["session_id"],
            "stage": session_doc["stage"],
            "can_edit_code": session_doc.get("can_edit_code", False),
            "task_unlocked": session_doc.get("task_unlocked", False),
            "interview_ended": session_doc.get("interview_ended", False),
            "early_termination": session_doc.get("early_termination", False),
            "messages_tail": messages_tail,
            "code_current": code.get("current", ""),
            "code_language": code.get("language", "python")
        }
        
        return jsonable_encoder(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting state: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
