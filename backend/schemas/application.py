"""
Application schemas - User applying to a Job.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ApplicationStatus(str, Enum):
    """Application status lifecycle."""
    PENDING = "pending"           # Aplikacija submitted, čeka review
    REVIEWED = "reviewed"         # Pregledana od strane recruitera
    INVITED = "invited"           # Poslat zadatak kandidatu
    IN_PROGRESS = "in_progress"   # Kandidat radi na zadatku
    COMPLETED = "completed"       # Zadatak završen
    REJECTED = "rejected"         # Odbijena aplikacija
    WITHDRAWN = "withdrawn"       # Kandidat povukao aplikaciju


class ApplicationBase(BaseModel):
    """Base application fields."""
    user_id: str = Field(..., description="User (candidate) ID")
    job_id: str = Field(..., description="Job posting ID")
    cover_letter: Optional[str] = Field(None, description="Optional cover letter")
    additional_info: Optional[str] = Field(None, description="Additional information")


class ApplicationCreate(ApplicationBase):
    """Application creation schema."""
    pass


class ApplicationUpdate(BaseModel):
    """Application update schema."""
    status: Optional[ApplicationStatus] = None
    cover_letter: Optional[str] = None
    additional_info: Optional[str] = None
    notes: Optional[str] = Field(None, description="Internal notes from recruiter")


class ApplicationInDB(ApplicationBase):
    """Application as stored in database."""
    id: str = Field(alias="_id")
    status: ApplicationStatus = ApplicationStatus.PENDING
    notes: Optional[str] = Field(None, description="Internal recruiter notes")
    applied_at: datetime
    updated_at: datetime
    reviewed_at: Optional[datetime] = None
    
    # Populated fields (not stored, fetched on demand)
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439012",
                "job_id": "507f1f77bcf86cd799439013",
                "status": "pending",
                "cover_letter": "I am very interested in this position...",
                "applied_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
