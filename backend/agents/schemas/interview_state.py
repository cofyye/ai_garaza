from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class MessageItem(BaseModel):
    role: Literal["user", "assistant", "system"]
    text: str
    ts: datetime = Field(default_factory=datetime.utcnow)


class InterviewState(BaseModel):
    session_id: str
    assignment_id: str
    application_id: str
    
    stage: Literal["INTRO", "SCREENING", "TASK", "CODING", "WRAPUP", "TERMINATED"] = "INTRO"
    
    can_edit_code: bool = False
    task_unlocked: bool = False
    interview_ended: bool = False
    early_termination: bool = False
    
    messages: list[MessageItem] = Field(default_factory=list)
    
    last_user_message: Optional[str] = None
    last_event_type: Optional[Literal["start", "user_message", "idle"]] = None
    
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    
    job_title: Optional[str] = None
    job_experience_level: Optional[str] = None
    job_tech_stack: list[str] = Field(default_factory=list)
    job_requirements: list[str] = Field(default_factory=list)
    
    interview_started_at: Optional[datetime] = None
    interview_max_duration_minutes: int = 30
    
    intro_questions_asked: int = 0
    intro_target: int = 2
    
    screening_questions_asked: int = 0
    screening_target: int = 5
    screening_min: int = 5
    screening_max: int = 5
    
    poor_answers_count: int = 0
    poor_answer_threshold: int = 3
    
    code_current: str = ""
    code_language: str = "python"
    last_code_change_at: Optional[datetime] = None
    
    idle_seconds: int = 0
    idle_nudges: int = 0
    last_idle_nudge_at: Optional[datetime] = None
    idle_threshold_seconds: int = 30
    
    task_title: Optional[str] = None
    task_description: Optional[str] = None
    task_requirements: list[str] = Field(default_factory=list)
    
    assistant_response: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
