"""
Assignment service - Business logic for technical assignments.
Includes mock AI agent for task generation.
"""
from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from schemas.assignment import AssignmentCreate, AssignmentDifficulty, AssignmentInDB, AssignmentStatus, AssignmentUpdate


class MockAIAgent:
    """
    Mock AI Agent for generating technical assignments.
    Later will be replaced with real LangGraph agent.
    """
    
    @staticmethod
    def generate_task(job_title: str, tech_stack: list[str], difficulty: AssignmentDifficulty) -> dict:
        """Generate a realistic technical task based on job requirements."""
        
        # Mock task templates based on difficulty
        tasks = {
            AssignmentDifficulty.JUNIOR: {
                "title": f"Build a Simple {tech_stack[0] if tech_stack else 'Web'} Application",
                "description": f"""
Create a basic application using {', '.join(tech_stack[:3]) if tech_stack else 'modern tech stack'}.

**Objective:**
Build a small {job_title.lower()} project that demonstrates your understanding of core concepts.

**Requirements:**
- Implement basic CRUD operations
- Clean, readable code with comments
- Simple error handling
- README with setup instructions

**What we're looking for:**
- Code organization
- Basic understanding of the tech stack
- Ability to follow requirements
                """.strip(),
                "requirements": [
                    "Functional application with basic features",
                    "Clean code structure",
                    "Basic error handling",
                    "Documentation in README"
                ],
                "evaluation": [
                    "Code quality and organization",
                    "Functionality completeness",
                    "Documentation quality",
                    "Following best practices"
                ]
            },
            AssignmentDifficulty.MID: {
                "title": f"Design and Implement a {job_title} Feature",
                "description": f"""
Design and build a production-ready feature using {', '.join(tech_stack[:3]) if tech_stack else 'your tech stack'}.

**Objective:**
Create a realistic feature that solves a real-world problem, demonstrating your mid-level engineering skills.

**Requirements:**
- RESTful API design (or equivalent for your role)
- Database schema design
- Error handling and validation
- Unit tests (at least 70% coverage)
- API documentation
- Docker setup (optional but preferred)

**What we're looking for:**
- System design thinking
- Code quality and maintainability
- Testing approach
- Production-ready mindset
                """.strip(),
                "requirements": [
                    "Well-designed API/feature architecture",
                    "Proper error handling and validation",
                    "Unit tests with good coverage",
                    "Clear documentation",
                    "Database schema (if applicable)"
                ],
                "evaluation": [
                    "System design and architecture",
                    "Code quality and patterns",
                    "Test coverage and quality",
                    "Documentation completeness",
                    "Scalability considerations"
                ]
            },
            AssignmentDifficulty.SENIOR: {
                "title": f"Architect a Scalable {job_title} Solution",
                "description": f"""
Design and implement a scalable, production-grade system using {', '.join(tech_stack) if tech_stack else 'modern architecture'}.

**Objective:**
Build a sophisticated system that demonstrates senior-level engineering: architecture, scalability, monitoring, and operational excellence.

**Requirements:**
- Microservices or modular architecture
- Database design with scaling in mind
- Comprehensive error handling and logging
- Extensive test coverage (unit + integration)
- API documentation (OpenAPI/Swagger)
- Docker + docker-compose setup
- CI/CD configuration
- Monitoring and observability considerations
- Security best practices

**What we're looking for:**
- Architectural thinking and trade-offs
- Production-ready, enterprise-grade code
- Scalability and performance considerations
- Comprehensive testing strategy
- DevOps and operational awareness
                """.strip(),
                "requirements": [
                    "Scalable architecture design",
                    "Production-ready code with all best practices",
                    "Comprehensive testing (unit, integration, e2e)",
                    "Full API documentation",
                    "Docker containerization",
                    "CI/CD pipeline configuration",
                    "Monitoring/logging setup",
                    "Security considerations documented"
                ],
                "evaluation": [
                    "Architectural design and scalability",
                    "Code quality and enterprise patterns",
                    "Testing strategy and coverage",
                    "DevOps and operational readiness",
                    "Documentation and communication",
                    "Performance optimization",
                    "Security implementation"
                ]
            },
            AssignmentDifficulty.LEAD: {
                "title": f"Technical Leadership Challenge: {job_title} System",
                "description": f"""
Design a complete system architecture and lead its implementation using {', '.join(tech_stack) if tech_stack else 'enterprise tech stack'}.

**Objective:**
Demonstrate technical leadership: architecture design, team collaboration, technical decision-making, and system ownership.

**Requirements:**
- Complete system architecture document (diagrams, trade-offs, scalability)
- Multi-service implementation with clear boundaries
- Infrastructure as Code (IaC)
- Comprehensive testing strategy
- API design and documentation
- Deployment strategy (Kubernetes/cloud-native)
- Monitoring, alerting, and observability
- Technical documentation for team
- Code review guidelines

**What we're looking for:**
- Systems thinking and architecture
- Technical decision-making and trade-offs documentation
- Leadership through code and documentation
- Operational excellence
- Team-oriented solutions
                """.strip(),
                "requirements": [
                    "System architecture document with diagrams",
                    "Multi-service implementation",
                    "Infrastructure as Code setup",
                    "Complete testing strategy",
                    "API design documentation",
                    "Deployment and scaling strategy",
                    "Monitoring and alerting setup",
                    "Technical documentation for team",
                    "Trade-offs and decision log"
                ],
                "evaluation": [
                    "System architecture and design thinking",
                    "Technical leadership and decision-making",
                    "Code quality and best practices",
                    "Operational excellence",
                    "Documentation and communication",
                    "Team collaboration approach",
                    "Scalability and performance design"
                ]
            }
        }
        
        task_template = tasks.get(difficulty, tasks[AssignmentDifficulty.MID])
        
        return {
            "task_title": task_template["title"],
            "task_description": task_template["description"],
            "task_requirements": task_template["requirements"],
            "evaluation_criteria": task_template["evaluation"],
            "additional_resources": f"Use {', '.join(tech_stack)} and refer to official documentation for best practices." if tech_stack else None
        }


class AssignmentService:
    """Service for managing technical assignments."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["assignments"]
        self.applications_collection = db["applications"]
        self.jobs_collection = db["jobs"]
        self.users_collection = db["users"]
        self.ai_agent = MockAIAgent()
    
    async def generate_and_create_assignment(
        self, 
        application_id: str,
        auto_send: bool = False
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
        
        # Determine difficulty based on job experience level
        difficulty_mapping = {
            "intern": AssignmentDifficulty.JUNIOR,
            "junior": AssignmentDifficulty.JUNIOR,
            "mid": AssignmentDifficulty.MID,
            "senior": AssignmentDifficulty.SENIOR,
            "lead": AssignmentDifficulty.LEAD,
            "staff": AssignmentDifficulty.LEAD
        }
        difficulty = difficulty_mapping.get(job.get("experience_level", "mid"), AssignmentDifficulty.MID)
        
        # Generate task using AI agent
        generated_task = self.ai_agent.generate_task(
            job_title=job.get("title", "Developer"),
            tech_stack=job.get("tech_stack", []),
            difficulty=difficulty
        )
        
        # Create assignment
        assignment_data = {
            "application_id": application_id,
            "difficulty": difficulty,
            "time_limit_hours": 72,  # Default 72 hours
            **generated_task,
            "status": AssignmentStatus.PENDING,
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
        print(f"\n🔗 Submission Link: http://localhost:8000/api/assignments/{assignment_id}/submit")
        print(f"\nGood luck!")
        print(f"\nBest regards,")
        print(f"{job.get('company')} Team")
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
