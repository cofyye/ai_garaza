"""
Assignment service - Business logic for technical assignments.
Includes AI agent for task generation using LangChain.
"""
from datetime import datetime, timedelta
from typing import Optional
import json

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from schemas.assignment import AssignmentCreate, AssignmentInDB, AssignmentStatus, AssignmentUpdate
from core.config import settings


class GeneratedTask(BaseModel):
    """Structured output model for AI-generated tasks."""
    task_title: str = Field(description="Clear, concise task title")
    task_description: str = Field(description="Detailed task description with context, requirements, and time estimate")
    task_requirements: list[str] = Field(description="List of specific requirements - as many as needed for the task")
    evaluation_criteria: list[str] = Field(description="List of evaluation criteria - as many as needed to properly assess the work")
    additional_resources: Optional[str] = Field(None, description="Optional hints, documentation links, or tech stack notes")


class AITaskGenerator:
    """
    AI-powered task generator using LangChain and OpenAI.
    Generates practical, verifiable technical assignments (30-60 min).
    """
    
    def __init__(self, openai_api_key: Optional[str] = None):
        """Initialize AI task generator with LLM and structured output."""
        api_key = openai_api_key or settings.OPENAI_API_KEY
        
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY is required for AI task generation. "
                "Please set it in your .env file or pass it as a parameter."
            )
        
        # Use structured output with Pydantic model
        self.llm = ChatOpenAI(
            model="gpt-5",
            temperature=1, 
            api_key=api_key
        ).with_structured_output(GeneratedTask)
        
        # System prompt for task generation
        self.system_prompt = """You are an expert technical interviewer and software architect designing practical coding assignments.

**YOUR MISSION:**
Generate a realistic, verifiable technical coding task that can be completed in 30-60 minutes during a live technical interview.

**CRITICAL REQUIREMENTS:**
1. **Practicality**: Task must be something they can actually code and run in a console/editor
2. **Verifiable**: Output should be clearly testable (prints to console, returns values, runs commands)
3. **Appropriate Scope**: 30-60 minutes max - NOT a multi-hour project
4. **Position-Specific**: Tailor to the exact role (frontend/backend/fullstack/data)
5. **Seniority-Appropriate**: Match complexity to experience level
6. **Real Problem**: Solve something realistic, not academic puzzles

**WHAT TO AVOID:**
- Large architectural tasks requiring multiple files/services
- Tasks requiring deployment, Docker, CI/CD setup
- Extensive boilerplate or project scaffolding
- Database schema design without implementation
- Vague "design a system" questions without coding

**WHAT TO INCLUDE:**
- Clear, focused problem statement
- Specific input/output examples
- Core functionality that demonstrates skill
- Edge cases to handle
- Success criteria

**TASK STRUCTURE:**
- Generate as many requirements as needed for the task (typically 3-7)
- Generate as many evaluation criteria as needed (typically 3-6)
- Be specific and actionable - avoid generic statements
- Adapt complexity to the candidate's experience level

**EXAMPLES OF GOOD TASKS:**
- "Build a rate limiter function that tracks requests per IP"
- "Implement autocomplete with debouncing"
- "Create a CLI tool that parses log files and shows statistics"
- "Build a simple todo list with filters"
- "Write a function to detect cycles in a dependency graph\""""
        
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", """Generate a technical coding task for this position:

**Job Title:** {job_title}
**Tech Stack:** {tech_stack}
**Experience Level:** {experience_level}

{custom_instructions}

Generate a practical, focused task that can be completed in 30-60 minutes. Tailor the complexity and expectations to the experience level.""")
        ])
    
    def generate_task(
        self,
        job_title: str,
        tech_stack: list[str],
        experience_level: str,
        custom_requirements: Optional[str] = None
    ) -> dict:
        """
        Generate technical task using AI with structured output.
        This is a core product feature - AI generation is required.
        """
        # Build custom instructions
        custom_instructions = ""
        if custom_requirements:
            custom_instructions = f"\n**CUSTOM REQUIREMENTS FROM INTERVIEWER:**\n{custom_requirements}\n\nPrioritize these requirements while maintaining 30-60 min scope."
        
        # Add experience-level specific guidance
        experience_guidance = {
            "intern": "Intern/Entry level: Focus on fundamentals, basic implementations, very clear instructions. Avoid complex algorithms.",
            "junior": "Junior level: Focus on fundamentals, basic implementations, clear instructions. Avoid complex algorithms.",
            "mid": "Mid level: Expect solid implementation, error handling, edge cases, some optimization.",
            "senior": "Senior level: Expect production-quality code, performance considerations, design patterns, extensibility.",
            "lead": "Lead level: Expect architectural thinking, trade-off decisions, scalability, maintainability, documentation.",
            "staff": "Staff level: Expect architectural thinking, trade-off decisions, scalability, maintainability, documentation."
        }
        custom_instructions += f"\n\n**EXPERIENCE LEVEL GUIDANCE:** {experience_guidance.get(experience_level.lower(), experience_guidance['mid'])}"
        
        # Generate with AI - returns GeneratedTask Pydantic model
        chain = self.prompt_template | self.llm
        result: GeneratedTask = chain.invoke({
            "job_title": job_title,
            "tech_stack": ", ".join(tech_stack) if tech_stack else "Any modern stack",
            "experience_level": experience_level,
            "custom_instructions": custom_instructions
        })
        
        # Convert to dict for database storage
        return result.model_dump()



class AssignmentService:
    """Service for managing technical assignments."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["assignments"]
        self.applications_collection = db["applications"]
        self.jobs_collection = db["jobs"]
        self.users_collection = db["users"]
        self.ai_generator = AITaskGenerator()
    
    async def generate_and_create_assignment(
        self, 
        application_id: str,
        auto_send: bool = False,
        custom_requirements: Optional[str] = None
    ) -> AssignmentInDB:
        """
        Generate a technical assignment for an application using AI agent.
        Optionally send invitation email immediately.
        """
        if not ObjectId.is_valid(application_id):
            raise ValueError("Invalid application_id")
        
        # Get application details
        application = await self.applications_collection.find_one({"_id": ObjectId(application_id)})
        if not application:
            raise ValueError("Application not found")
        
        # Get job details for context
        job = await self.jobs_collection.find_one({"_id": ObjectId(application["job_id"])})
        if not job:
            raise ValueError("Job not found")
        
        # Get experience level from job
        experience_level = job.get("experience_level", "mid")
        
        generated_task = self.ai_generator.generate_task(
            job_title=job.get("title", "Developer"),
            tech_stack=job.get("tech_stack", []),
            experience_level=experience_level,
            custom_requirements=custom_requirements
        )
        
        # Generate unique session ID
        import secrets
        session_id = secrets.token_urlsafe(32)
        
        # Create assignment - no difficulty field for task itself
        assignment_data = {
            "application_id": application_id,
            "time_limit_hours": 72,  # Default 72 hours
            **generated_task,
            "status": AssignmentStatus.PENDING,
            "session_id": session_id,
            "session_url": f"http://localhost:3000/#/interview/{session_id}",  # Frontend URL
            "created_at": datetime.utcnow(),
            "email_sent_count": 0
        }
        
        result = await self.collection.insert_one(assignment_data)
        assignment_data["_id"] = str(result.inserted_id)
        
        # Update application status
        await self.applications_collection.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {"status": "invited", "updated_at": datetime.utcnow()}}
        )
        
        assignment = AssignmentInDB(**assignment_data)
        
        # Send email if auto_send is True
        if auto_send:
            await self.send_assignment_email(str(assignment.id))
        
        return assignment
    
    async def send_assignment_email(self, assignment_id: str) -> bool:
        """
        Send assignment invitation email to candidate.
        For now, this is a MOCK - just prints to console.
        """
        if not ObjectId.is_valid(assignment_id):
            return False
        
        assignment = await self.collection.find_one({"_id": ObjectId(assignment_id)})
        if not assignment:
            return False
        
        # Get application and user info
        application = await self.applications_collection.find_one(
            {"_id": ObjectId(assignment["application_id"])}
        )
        if not application:
            return False
        
        user = await self.users_collection.find_one({"_id": ObjectId(application["user_id"])})
        job = await self.jobs_collection.find_one({"_id": ObjectId(application["job_id"])})
        
        if not user or not job:
            return False
        
        # Calculate deadline
        time_limit = assignment.get("time_limit_hours", 72)
        deadline = datetime.utcnow() + timedelta(hours=time_limit)
        
        # Update assignment with email tracking
        await self.collection.update_one(
            {"_id": ObjectId(assignment_id)},
            {
                "$set": {
                    "status": AssignmentStatus.SENT,
                    "sent_at": datetime.utcnow(),
                    "deadline": deadline,
                    "last_email_sent_at": datetime.utcnow()
                },
                "$inc": {"email_sent_count": 1}
            }
        )
        
        # MOCK EMAIL - Print to console
        print("\n" + "="*80)
        print("📧 MOCK EMAIL NOTIFICATION")
        print("="*80)
        print(f"To: {user.get('email')}")
        print(f"Subject: Technical Assignment - {job.get('title')} at {job.get('company')}")
        print(f"\nDear {user.get('full_name', 'Candidate')},\n")
        print(f"Congratulations! We'd like to move forward with your application for {job.get('title')}.")
        print(f"\n📝 Assignment: {assignment.get('task_title')}")
        print(f"⏰ Time Limit: {time_limit} hours")
        print(f"📅 Deadline: {deadline.strftime('%Y-%m-%d %H:%M UTC')}")
        print(f"\n{assignment.get('task_description')}")
        print(f"\n✅ Requirements:")
        for req in assignment.get('task_requirements', []):
            print(f"   - {req}")
        print(f"\n🔍 Evaluation Criteria:")
        for criteria in assignment.get('evaluation_criteria', []):
            print(f"   - {criteria}")
        if assignment.get('additional_resources'):
            print(f"\n📚 Resources: {assignment.get('additional_resources')}")
        
        # Use session_url if available, otherwise fall back to assignment ID
        interview_link = assignment.get('session_url', f"http://localhost:3000/#/interview/{assignment.get('session_id', assignment_id)}")
        print(f"\n🔗 Interview Link: {interview_link}")
        print(f"\nGood luck!")
        print(f"\nBest regards,")
        print(f"Engval.ai Team")
        print("="*80 + "\n")
        
        return True
    
    async def get_assignment(self, assignment_id: str) -> Optional[AssignmentInDB]:
        """Get assignment by ID."""
        if not ObjectId.is_valid(assignment_id):
            return None
        
        assignment = await self.collection.find_one({"_id": ObjectId(assignment_id)})
        if assignment:
            assignment["_id"] = str(assignment["_id"])
            return AssignmentInDB(**assignment)
        return None
    
    async def get_assignment_by_application(self, application_id: str) -> Optional[AssignmentInDB]:
        """Get assignment for a specific application."""
        assignment = await self.collection.find_one({"application_id": application_id})
        if assignment:
            assignment["_id"] = str(assignment["_id"])
            return AssignmentInDB(**assignment)
        return None
    
    async def update_assignment(
        self, 
        assignment_id: str, 
        update: AssignmentUpdate
    ) -> Optional[AssignmentInDB]:
        """Update assignment (e.g., candidate submission, reviewer feedback)."""
        if not ObjectId.is_valid(assignment_id):
            return None
        
        update_data = update.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_assignment(assignment_id)
        
        # Handle status transitions
        if "status" in update_data:
            if update_data["status"] == AssignmentStatus.IN_PROGRESS and "started_at" not in update_data:
                update_data["started_at"] = datetime.utcnow()
            elif update_data["status"] == AssignmentStatus.SUBMITTED and "submitted_at" not in update_data:
                update_data["submitted_at"] = datetime.utcnow()
            elif update_data["status"] == AssignmentStatus.REVIEWED and "reviewed_at" not in update_data:
                update_data["reviewed_at"] = datetime.utcnow()
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(assignment_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
            return AssignmentInDB(**result)
        return None
    
    async def get_assignment_stats(self, assignment_id: str) -> dict:
        """Get timing statistics for an assignment."""
        assignment = await self.get_assignment(assignment_id)
        if not assignment:
            return {}
        
        now = datetime.utcnow()
        stats = {
            "assignment_id": assignment_id,
            "status": assignment.status,
            "time_limit_hours": assignment.time_limit_hours,
        }
        
        if assignment.sent_at:
            stats["email_sent_at"] = assignment.sent_at
            stats["hours_since_sent"] = (now - assignment.sent_at).total_seconds() / 3600
        
        if assignment.deadline:
            stats["deadline"] = assignment.deadline
            stats["hours_until_deadline"] = (assignment.deadline - now).total_seconds() / 3600
            stats["is_expired"] = now > assignment.deadline
        
        if assignment.started_at:
            stats["started_at"] = assignment.started_at
            if assignment.submitted_at:
                stats["time_taken_hours"] = (assignment.submitted_at - assignment.started_at).total_seconds() / 3600
        
        return stats
    
    async def get_assignment_by_session_id(self, session_id: str) -> Optional[AssignmentInDB]:
        """Get assignment by session ID."""
        assignment = await self.collection.find_one({"session_id": session_id})
        if assignment:
            assignment["_id"] = str(assignment["_id"])
            return AssignmentInDB(**assignment)
        return None
    
    async def mark_assignment_started(self, assignment_id: str) -> Optional[AssignmentInDB]:
        """Mark assignment as started."""
        if not ObjectId.is_valid(assignment_id):
            return None
        
        update_data = {
            "status": AssignmentStatus.IN_PROGRESS,
            "started_at": datetime.utcnow()
        }
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(assignment_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
            return AssignmentInDB(**result)
        return None
    
    async def mark_assignment_submitted(
        self, 
        assignment_id: str,
        candidate_notes: Optional[str] = None
    ) -> Optional[AssignmentInDB]:
        """Mark assignment as submitted."""
        if not ObjectId.is_valid(assignment_id):
            return None
        
        update_data = {
            "status": AssignmentStatus.SUBMITTED,
            "submitted_at": datetime.utcnow()
        }
        
        if candidate_notes:
            update_data["candidate_notes"] = candidate_notes
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(assignment_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
            return AssignmentInDB(**result)
        return None
