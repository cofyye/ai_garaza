"""
Interview State schema for LangGraph Agent 2.
"""
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class MessageItem(BaseModel):
    """A single conversation message."""
    role: Literal["user", "assistant", "system"]
    text: str
    ts: datetime = Field(default_factory=datetime.utcnow)


class InterviewState(BaseModel):
    """State for the interview LangGraph."""
    # Session identifiers
    session_id: str
    assignment_id: str
    application_id: str
    
    # Interview stage
    stage: Literal["INTRO", "SCREENING", "TASK", "CODING", "WRAPUP", "TERMINATED"] = "INTRO"
    
    # Control flags
    can_edit_code: bool = False
    task_unlocked: bool = False
    interview_ended: bool = False
    early_termination: bool = False  # True if AI ended interview early due to poor performance
    
    # Conversation history
    messages: list[MessageItem] = Field(default_factory=list)
    
    # Current context
    last_user_message: Optional[str] = None
    last_event_type: Optional[Literal["start", "user_message", "idle"]] = None
    
    # Candidate info (loaded from application/user)
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    
    # Job/Position info (loaded from job posting)
    job_title: Optional[str] = None
    job_experience_level: Optional[str] = None  # junior, mid, senior, etc.
    job_tech_stack: list[str] = Field(default_factory=list)
    job_requirements: list[str] = Field(default_factory=list)
    
    # Interview timing
    interview_started_at: Optional[datetime] = None
    interview_max_duration_minutes: int = 30  # Auto-end after 30 minutes
    
    # Intro phase
    intro_questions_asked: int = 0
    intro_target: int = 2  # 2 intro exchanges: greeting + name, then transition to technical
    
    # Screening counters
    screening_questions_asked: int = 0
    screening_target: int = 5  # FIXED at 5 questions
    screening_min: int = 5
    screening_max: int = 5  # Hard cap at 5
    
    # Performance tracking (for early termination)
    poor_answers_count: int = 0  # Count of clearly wrong/no-answer responses
    poor_answer_threshold: int = 3  # If 3 poor answers, terminate early
    
    # Code state
    code_current: str = ""
    code_language: str = "python"
    last_code_change_at: Optional[datetime] = None
    
    # Idle tracking
    idle_seconds: int = 0
    idle_nudges: int = 0
    last_idle_nudge_at: Optional[datetime] = None
    idle_threshold_seconds: int = 30  # Nudge after 30s of no typing
    
    # Task context (loaded from assignment)
    task_title: Optional[str] = None
    task_description: Optional[str] = None
    task_requirements: list[str] = Field(default_factory=list)
    
    # Output
    assistant_response: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
