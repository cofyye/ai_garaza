import logging
import traceback
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from dependencies.database import get_db
from agents.schemas.interview_state import InterviewState, MessageItem
from agents.graphs.interview_graph import InterviewGraph
from agents.services.tts_service import TTSService
from agents.services.stt_service import STTService


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


class StartInterviewResponse(BaseModel):
    session_id: str
    stage: str
    can_edit_code: bool
    task_unlocked: bool
    interview_ended: bool = False
    early_termination: bool = False
    assistant: Optional[dict] = None
    messages_tail: list[dict]


class MessageRequest(BaseModel):
    text: str


class CodeRequest(BaseModel):
    code: str
    language: str = "python"


class IdleRequest(BaseModel):
    seconds_idle: int


class InterviewStateResponse(BaseModel):
    session_id: str
    stage: str
    can_edit_code: bool
    task_unlocked: bool
    interview_ended: bool = False
    early_termination: bool = False
    messages_tail: list[dict]
    code_current: str
    code_language: str


interview_graph = InterviewGraph()

# Lazy initialization for TTS and STT services
_tts_service = None
_stt_service = None

def get_tts_service():
    """Get or create the TTS service lazily."""
    global _tts_service
    if _tts_service is None:
        from agents.services.tts_service import TTSService
        _tts_service = TTSService()
    return _tts_service

def get_stt_service():
    """Get or create the STT service lazily."""
    global _stt_service
    if _stt_service is None:
        from agents.services.stt_service import STTService
        _stt_service = STTService()
    return _stt_service


def format_messages_tail(messages: list, limit: int = 20) -> list[dict]:
    tail = messages[-limit:] if len(messages) > limit else messages
    return [
        {
            "role": msg.role if hasattr(msg, 'role') else msg["role"],
            "text": msg.text if hasattr(msg, 'text') else msg["text"],
            "ts": (msg.ts if hasattr(msg, 'ts') else msg.get("ts", datetime.utcnow())).isoformat()
            if isinstance((msg.ts if hasattr(msg, 'ts') else msg.get("ts")), datetime)
            else str(msg.ts if hasattr(msg, 'ts') else msg.get("ts"))
        }
        for msg in tail
    ]


async def generate_tts_safe(text: str) -> Optional[dict]:
    if not text:
        return None
    try:
        tts_service = get_tts_service()
        return await tts_service.text_to_speech(text)
    except Exception as e:
        logger.warning(f"TTS failed, continuing without audio: {str(e)}")
        return None


def build_assistant_response(text: Optional[str], audio_data: Optional[dict]) -> Optional[dict]:
    if not text:
        return None
    return {
        "text": text,
        "audio_base64": audio_data.get("audio_base64") if audio_data else None,
        "audio_mime": audio_data.get("audio_mime") if audio_data else None
    }


def build_response_data(state: InterviewState, assistant_response: Optional[dict]) -> dict:
    return {
        "session_id": state.session_id,
        "stage": state.stage,
        "can_edit_code": state.can_edit_code,
        "task_unlocked": state.task_unlocked,
        "interview_ended": state.interview_ended,
        "early_termination": state.early_termination,
        "assistant": assistant_response,
        "messages_tail": format_messages_tail(state.messages)
    }


async def get_interview_session(session_id: str, db):
    try:
        collection = db["interview_sessions"]
        session_doc = await collection.find_one({"session_id": session_id})
        
        if session_doc:
            return session_doc
        
        assignments_collection = db["assignments"]
        assignment = await assignments_collection.find_one({"session_id": session_id})
        
        if not assignment:
            logger.warning(f"Assignment not found for session_id: {session_id}")
            raise HTTPException(status_code=404, detail=f"Assignment for session_id {session_id} not found")
        
        candidate_context = await _load_candidate_context(db, assignment)
        job_context = await _load_job_context(db, assignment)
        
        logger.info(f"Loaded context - Candidate: {candidate_context['name']}, Job: {job_context['title']} ({job_context['experience_level']})")
        
        session_doc = {
            "session_id": session_id,
            "assignment_id": str(assignment["_id"]),
            "application_id": assignment.get("application_id"),
            "stage": "INTRO",
            "can_edit_code": False,
            "task_unlocked": False,
            "interview_ended": False,
            "early_termination": False,
            "messages": [],
            "code": {"language": "python", "current": "", "last_change_at": None},
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


async def _load_candidate_context(db, assignment: dict) -> dict:
    candidate_context = {"name": "Unknown Candidate", "email": "unknown@example.com"}
    application_id = assignment.get("application_id")
    
    if not application_id:
        logger.warning(f"No application_id in assignment: {assignment.get('_id')}")
        return candidate_context
    
    applications_collection = db["applications"]
    application = await applications_collection.find_one({"_id": application_id})
    
    if not application:
        logger.warning(f"Application not found: {application_id}")
        return candidate_context
    
    user_id = application.get("user_id")
    if user_id:
        users_collection = db["users"]
        user = await users_collection.find_one({"_id": user_id})
        if user:
            candidate_context["name"] = user.get("name") or user.get("email", "").split("@")[0] or "Unknown Candidate"
            candidate_context["email"] = user.get("email") or "unknown@example.com"
        else:
            logger.warning(f"User not found: {user_id}")
    else:
        logger.warning(f"No user_id in application: {application_id}")
    
    return candidate_context


async def _load_job_context(db, assignment: dict) -> dict:
    job_context = {"title": "Unknown Position", "experience_level": "mid", "tech_stack": [], "requirements": []}
    application_id = assignment.get("application_id")
    
    if not application_id:
        logger.warning(f"No application_id in assignment for job context")
        return job_context
    
    applications_collection = db["applications"]
    application = await applications_collection.find_one({"_id": application_id})
    
    if not application:
        logger.warning(f"Application not found for job context: {application_id}")
        return job_context
    
    job_id = application.get("job_id")
    if job_id:
        jobs_collection = db["jobs"]
        job = await jobs_collection.find_one({"_id": job_id})
        if job:
            job_context["title"] = job.get("title") or "Unknown Position"
            job_context["experience_level"] = job.get("experience_level", "mid")
            job_context["tech_stack"] = job.get("tech_stack", [])
            job_context["requirements"] = job.get("requirements", [])
        else:
            logger.warning(f"Job not found: {job_id}")
    else:
        logger.warning(f"No job_id in application: {application_id}")
    
    return job_context


async def build_state_from_doc(session_doc: dict) -> InterviewState:
    messages = [
        MessageItem(role=msg["role"], text=msg["text"], ts=msg.get("ts", datetime.utcnow()))
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
        candidate_name=candidate_context.get("name"),
        candidate_email=candidate_context.get("email"),
        job_title=job_context.get("title"),
        job_experience_level=job_context.get("experience_level", "mid"),
        job_tech_stack=job_context.get("tech_stack", []),
        job_requirements=job_context.get("requirements", []),
        interview_started_at=session_doc.get("interview_started_at"),
        intro_questions_asked=counters.get("intro_questions_asked", 0),
        screening_questions_asked=counters.get("screening_questions_asked", 0),
        screening_target=counters.get("screening_target", 6),
        poor_answers_count=counters.get("poor_answers_count", 0),
        idle_nudges=counters.get("idle_nudges", 0),
        last_idle_nudge_at=counters.get("last_idle_nudge_at"),
        code_current=code.get("current", ""),
        code_language=code.get("language", "python"),
        last_code_change_at=code.get("last_change_at"),
        task_title=task_context.get("task_title"),
        task_description=task_context.get("task_description"),
        task_requirements=task_context.get("task_requirements", [])
    )


async def save_state_to_doc(state: InterviewState, db):
    collection = db["interview_sessions"]
    
    messages = [{"role": msg.role, "text": msg.text, "ts": msg.ts} for msg in state.messages]
    
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
    
    await collection.update_one({"session_id": state.session_id}, {"$set": update_data})


async def process_graph_response(state: InterviewState, db) -> tuple[InterviewState, Optional[dict]]:
    result_state = await interview_graph.run(state)
    
    if result_state.assistant_response:
        assistant_msg = MessageItem(
            role="assistant",
            text=result_state.assistant_response,
            ts=datetime.utcnow()
        )
        result_state.messages.append(assistant_msg)
    
    await save_state_to_doc(result_state, db)
    
    audio_data = await generate_tts_safe(result_state.assistant_response)
    assistant_response = build_assistant_response(result_state.assistant_response, audio_data)
    
    return result_state, assistant_response


@router.post("/{session_id}/start", response_model=StartInterviewResponse)
async def start_interview(session_id: str, db=Depends(get_db)):
    try:
        session_doc = await get_interview_session(session_id, db)
        state = await build_state_from_doc(session_doc)
        state.last_event_type = "start"
        
        result_state, assistant_response = await process_graph_response(state, db)
        
        return jsonable_encoder(build_response_data(result_state, assistant_response))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error starting interview: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{session_id}/message", response_model=StartInterviewResponse)
async def send_message(session_id: str, request: MessageRequest, db=Depends(get_db)):
    try:
        session_doc = await get_interview_session(session_id, db)
        state = await build_state_from_doc(session_doc)
        
        user_msg = MessageItem(role="user", text=request.text, ts=datetime.utcnow())
        state.messages.append(user_msg)
        state.last_user_message = request.text
        state.last_event_type = "user_message"
        
        result_state, assistant_response = await process_graph_response(state, db)
        
        return jsonable_encoder(build_response_data(result_state, assistant_response))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error sending message: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{session_id}/code")
async def update_code(session_id: str, request: CodeRequest, db=Depends(get_db)):
    try:
        collection = db["interview_sessions"]
        session_doc = await collection.find_one({"session_id": session_id})
        
        if not session_doc:
            logger.warning(f"Interview session not found: {session_id}")
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        now = datetime.utcnow()
        code_history = session_doc.get("code_history", [])
        code_history.append({"ts": now, "code": request.code})
        
        if len(code_history) > 100:
            code_history = code_history[-100:]
        
        await collection.update_one(
            {"session_id": session_id},
            {"$set": {
                "code.current": request.code,
                "code.language": request.language,
                "code.last_change_at": now,
                "code_history": code_history,
                "updated_at": now
            }}
        )
        
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating code: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{session_id}/idle", response_model=StartInterviewResponse)
async def report_idle(session_id: str, request: IdleRequest, db=Depends(get_db)):
    try:
        session_doc = await get_interview_session(session_id, db)
        state = await build_state_from_doc(session_doc)
        state.idle_seconds = request.seconds_idle
        state.last_event_type = "idle"
        
        logger.info(f"Idle check - Code length: {len(state.code_current)} chars, Language: {state.code_language}")
        
        result_state, assistant_response = await process_graph_response(state, db)
        
        return jsonable_encoder(build_response_data(result_state, assistant_response))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error reporting idle: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{session_id}/audio")
async def upload_audio(session_id: str, file: UploadFile = File(...), db=Depends(get_db)):
    logger.info(f"Audio upload received for session {session_id}")
    logger.info(f"File info: filename={file.filename}, content_type={file.content_type}")
    
    try:
        file_bytes = await file.read()
        logger.info(f"Read {len(file_bytes)} bytes from uploaded file")
        
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        try:
            stt_service = get_stt_service()
            transcript_result = await stt_service.transcribe(
                file_bytes=file_bytes,
                filename=file.filename or "audio.webm",
                mime=file.content_type or "audio/webm"
            )
            transcript = transcript_result.get("text", "")
        except HTTPException:
            raise
        except Exception as e:
            logger.exception(f"STT transcription failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        
        if not transcript or transcript.strip() == "":
            raise HTTPException(status_code=400, detail="No speech detected in audio")
        
        logger.info(f"Transcribed: {transcript[:100]}...")
        
        session_doc = await get_interview_session(session_id, db)
        state = await build_state_from_doc(session_doc)
        
        user_msg = MessageItem(role="user", text=transcript, ts=datetime.utcnow())
        state.messages.append(user_msg)
        state.last_user_message = transcript
        state.last_event_type = "user_message"
        
        result_state, assistant_response = await process_graph_response(state, db)
        
        response_data = build_response_data(result_state, assistant_response)
        response_data["transcript"] = transcript
        
        return jsonable_encoder(response_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error processing audio upload: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{session_id}/debug")
async def debug_session(session_id: str, db=Depends(get_db)):
    try:
        collection = db["interview_sessions"]
        session_doc = await collection.find_one({"session_id": session_id})
        
        if not session_doc:
            assignments_collection = db["assignments"]
            assignment = await assignments_collection.find_one({"session_id": session_id})
            return {
                "session_id": session_id,
                "has_doc": False,
                "assignment_found": assignment is not None,
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
    try:
        session_doc = await get_interview_session(session_id, db)
        code = session_doc.get("code", {})
        messages = session_doc.get("messages", [])
        
        messages_tail = [
            {
                "role": msg["role"],
                "text": msg["text"],
                "ts": msg.get("ts", datetime.utcnow()).isoformat()
                if isinstance(msg.get("ts"), datetime) else str(msg.get("ts"))
            }
            for msg in messages[-20:]
        ]
        
        return jsonable_encoder({
            "session_id": session_doc["session_id"],
            "stage": session_doc["stage"],
            "can_edit_code": session_doc.get("can_edit_code", False),
            "task_unlocked": session_doc.get("task_unlocked", False),
            "interview_ended": session_doc.get("interview_ended", False),
            "early_termination": session_doc.get("early_termination", False),
            "messages_tail": messages_tail,
            "code_current": code.get("current", ""),
            "code_language": code.get("language", "python")
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting state: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
