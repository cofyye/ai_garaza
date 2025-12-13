"""
Assignment schemas - Technical task for candidates.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class AssignmentStatus(str, Enum):
    """Assignment status lifecycle."""
    PENDING = "pending"           # Kreiran, čeka slanje
    SENT = "sent"                 # Email poslat kandidatu
    IN_PROGRESS = "in_progress"   # Kandidat počeo zadatak
    SUBMITTED = "submitted"       # Kandidat predao rešenje
    REVIEWED = "reviewed"         # Pregledano
    EXPIRED = "expired"           # Rok istekao


class AssignmentDifficulty(str, Enum):
    """Task difficulty based on job level."""
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"


class AssignmentBase(BaseModel):
    """Base assignment fields."""
    application_id: str = Field(..., description="Application ID")
    task_title: str = Field(..., description="Task title")
    task_description: str = Field(..., description="Full task description")
    task_requirements: list[str] = Field(default_factory=list, description="Task requirements")
    evaluation_criteria: list[str] = Field(default_factory=list, description="How it will be evaluated")
    difficulty: AssignmentDifficulty
    time_limit_hours: int = Field(72, description="Time limit in hours (default 72h)")
    additional_resources: Optional[str] = Field(None, description="Links or resources for task")


class AssignmentCreate(AssignmentBase):
    """Assignment creation schema."""
    pass


class AssignmentUpdate(BaseModel):
    """Assignment update schema."""
    status: Optional[AssignmentStatus] = None
    submission_url: Optional[str] = None
    submission_notes: Optional[str] = None
    reviewer_score: Optional[int] = Field(None, ge=0, le=100, description="Score 0-100")
    reviewer_feedback: Optional[str] = None


class AssignmentInDB(AssignmentBase):
    """Assignment as stored in database."""
    id: str = Field(alias="_id")
    status: AssignmentStatus = AssignmentStatus.PENDING
    
    # Timing
    created_at: datetime
    sent_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    
    # Submission
    submission_url: Optional[str] = None
    candidate_notes: Optional[str] = None
    
    # Review
    reviewer_feedback: Optional[str] = None
    score: Optional[int] = None
    
    # Email tracking
    email_sent_count: int = Field(default=0, description="Number of emails sent")
    last_email_sent_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "application_id": "507f1f77bcf86cd799439012",
                "task_title": "Build a REST API for Task Management",
                "task_description": "Create a FastAPI application...",
                "difficulty": "mid",
                "status": "sent",
                "time_limit_hours": 72,
                "created_at": "2024-01-01T00:00:00",
                "sent_at": "2024-01-01T01:00:00",
                "deadline": "2024-01-04T01:00:00",
                "email_sent_count": 1
            }
        }
