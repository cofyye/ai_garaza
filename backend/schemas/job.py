"""
Job schemas for MongoDB - Tech positions.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class JobType(str, Enum):
    """Job employment type."""
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"


class ExperienceLevel(str, Enum):
    """Experience level required."""
    INTERN = "intern"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    STAFF = "staff"


class LocationType(str, Enum):
    """Work location type."""
    REMOTE = "remote"
    ONSITE = "onsite"
    HYBRID = "hybrid"


class JobStatus(str, Enum):
    """Job posting status."""
    ACTIVE = "active"
    CLOSED = "closed"
    DRAFT = "draft"


class SalaryRange(BaseModel):
    """Salary range in specific currency."""
    min: Optional[int] = None
    max: Optional[int] = None
    currency: str = "USD"


class JobBase(BaseModel):
    """Base job fields."""
    title: str = Field(..., description="Job title (e.g., Senior Backend Engineer)")
    company: str = Field(default="Company", description="Company name")
    location: str = Field(..., description="Location (e.g., Belgrade, Serbia or Remote)")
    location_type: LocationType = LocationType.HYBRID
    job_type: JobType = JobType.FULL_TIME
    experience_level: ExperienceLevel = ExperienceLevel.MID
    
    description: str = Field(..., description="Full job description")
    responsibilities: list[str] = Field(default_factory=list, description="Key responsibilities")
    requirements: list[str] = Field(default_factory=list, description="Required skills/qualifications")
    nice_to_have: list[str] = Field(default_factory=list, description="Nice to have skills")
    
    tech_stack: list[str] = Field(default_factory=list, description="Technologies used (e.g., Python, React, AWS)")
    benefits: list[str] = Field(default_factory=list, description="Company benefits")
    
    salary_range: Optional[SalaryRange] = None
    
    company_website: Optional[HttpUrl] = None
    apply_url: Optional[HttpUrl] = None
    
    status: JobStatus = JobStatus.ACTIVE


class JobCreate(JobBase):
    """Job creation schema."""
    pass


class JobUpdate(BaseModel):
    """Job update schema - all fields optional."""
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    location_type: Optional[LocationType] = None
    job_type: Optional[JobType] = None
    experience_level: Optional[ExperienceLevel] = None
    description: Optional[str] = None
    responsibilities: Optional[list[str]] = None
    requirements: Optional[list[str]] = None
    nice_to_have: Optional[list[str]] = None
    tech_stack: Optional[list[str]] = None
    benefits: Optional[list[str]] = None
    salary_range: Optional[SalaryRange] = None
    company_website: Optional[HttpUrl] = None
    apply_url: Optional[HttpUrl] = None
    status: Optional[JobStatus] = None


class JobInDB(JobBase):
    """Job as stored in database."""
    id: str = Field(alias="_id")
    applications_count: int = Field(default=0, description="Number of applications")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "title": "Senior Full Stack Engineer",
                "location": "Belgrade, Serbia",
                "location_type": "hybrid",
                "job_type": "full-time",
                "experience_level": "senior",
                "description": "We are looking for an experienced Full Stack Engineer...",
                "responsibilities": [
                    "Design and develop scalable web applications",
                    "Collaborate with product team",
                    "Mentor junior developers"
                ],
                "requirements": [
                    "5+ years of software development experience",
                    "Strong knowledge of React and Node.js",
                    "Experience with MongoDB and PostgreSQL"
                ],
                "nice_to_have": [
                    "Experience with AWS",
                    "Knowledge of Docker/Kubernetes"
                ],
                "tech_stack": ["React", "Node.js", "MongoDB", "TypeScript", "AWS"],
                "benefits": [
                    "Competitive salary",
                    "Remote work flexibility",
                    "Professional development budget"
                ],
                "salary_range": {
                    "min": 60000,
                    "max": 90000,
                    "currency": "USD"
                },
                "status": "active",
                "applications_count": 15,
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
