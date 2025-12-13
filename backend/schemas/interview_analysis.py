"""
Pydantic models for Interview Analysis (Agent 3 output)
These models match the TypeScript interfaces in frontend/lib/types.ts
"""
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime


class TechnicalScores(BaseModel):
    """Technical performance scores (0-100 for each)"""
    code_quality: int = Field(..., ge=0, le=100, description="Code organization, readability, best practices")
    problem_solving: int = Field(..., ge=0, le=100, description="Approach to solving the problem")
    algorithmic_thinking: int = Field(..., ge=0, le=100, description="Algorithm design and efficiency")
    debugging: int = Field(..., ge=0, le=100, description="Ability to find and fix bugs")
    testing: int = Field(..., ge=0, le=100, description="Test coverage and quality")
    edge_case_handling: int = Field(..., ge=0, le=100, description="Consideration of edge cases")
    overall: int = Field(..., ge=0, le=100, description="Weighted average of technical scores")


class SoftSkills(BaseModel):
    """Communication and soft skills scores (0-100 for each)"""
    clarity: int = Field(..., ge=0, le=100, description="Clear communication")
    question_asking: int = Field(..., ge=0, le=100, description="Quality of questions asked")
    thought_process: int = Field(..., ge=0, le=100, description="Verbalization of thinking")
    collaboration: int = Field(..., ge=0, le=100, description="Team-work approach")
    response_to_feedback: int = Field(..., ge=0, le=100, description="How they handle feedback")
    overall: int = Field(..., ge=0, le=100, description="Weighted average of soft skills")


class BehavioralIndicators(BaseModel):
    """Behavioral indicators (0-100 for each)"""
    stress_handling: int = Field(..., ge=0, le=100, description="Composure under pressure")
    confidence: int = Field(..., ge=0, le=100, description="Self-assurance level")
    learning_agility: int = Field(..., ge=0, le=100, description="Ability to learn quickly")
    problem_decomposition: int = Field(..., ge=0, le=100, description="Breaking down complex problems")
    critical_thinking: int = Field(..., ge=0, le=100, description="Analytical reasoning")


class TimePhase(BaseModel):
    """A phase of the interview with time tracking"""
    name: str = Field(..., description="Phase name (e.g., 'Understanding Requirements')")
    duration: int = Field(..., ge=0, description="Duration in minutes")
    percentage: int = Field(..., ge=0, le=100, description="Percentage of total time")


class TimeAnalysis(BaseModel):
    """Time distribution analysis"""
    phases: List[TimePhase] = Field(..., min_items=3, description="Interview phases with time breakdowns")
    productivity: Literal["high", "medium", "low"] = Field(..., description="Overall productivity level")


class NotableMoment(BaseModel):
    """A notable moment during the interview"""
    type: Literal["positive", "negative"] = Field(..., description="Type of moment")
    timestamp: str = Field(..., pattern=r"^\d{2}:\d{2}:\d{2}$", description="Timestamp in HH:MM:SS format")
    description: str = Field(..., min_length=10, description="What happened at this moment")


class Insights(BaseModel):
    """Key insights about the candidate"""
    strengths: List[str] = Field(..., min_items=3, max_items=5, description="List of 3-5 key strengths")
    improvements: List[str] = Field(..., min_items=3, max_items=5, description="List of 3-5 areas to improve")
    red_flags: List[str] = Field(default_factory=list, max_items=5, description="List of concerning issues (can be empty)")
    notable_moments: List[NotableMoment] = Field(..., min_items=1, description="Key moments during interview")


class CodeSnippet(BaseModel):
    """A code snippet example (best or worst)"""
    type: Literal["best", "worst"] = Field(..., description="Type of code example")
    code: str = Field(..., min_length=20, description="The actual code snippet")
    explanation: str = Field(..., min_length=10, description="Why it's good or bad")


class CodeAnalysis(BaseModel):
    """Analysis of the candidate's code"""
    best_practices: List[str] = Field(..., min_items=1, description="List of good practices observed")
    issues: List[str] = Field(..., min_items=0, description="List of code issues found")
    code_snippets: List[CodeSnippet] = Field(..., min_items=1, max_items=3, description="1-3 code examples")


class Recommendation(BaseModel):
    """Final hiring recommendation"""
    verdict: Literal["STRONG_HIRE", "HIRE", "MAYBE", "NO_HIRE", "STRONG_NO_HIRE"] = Field(
        ..., description="Final hiring decision"
    )
    confidence: int = Field(..., ge=0, le=100, description="Confidence level in recommendation")
    summary: str = Field(..., min_length=50, description="2-3 sentence summary of the candidate")
    reasoning: List[str] = Field(..., min_items=3, max_items=5, description="3-5 key reasons for the verdict")
    fit_for_role: int = Field(..., ge=0, le=100, description="Overall role fit score")


class TaskInfo(BaseModel):
    """Information about the assigned task"""
    title: str = Field(..., min_length=5, description="Task name")
    difficulty: Literal["easy", "medium", "hard"] = Field(..., description="Task difficulty level")
    category: str = Field(..., min_length=3, description="Task category (e.g., 'Full-Stack Development')")
    completed: bool = Field(..., description="Whether the candidate completed the task")


class InterviewAnalysis(BaseModel):
    """
    Complete interview analysis generated by Agent 3 (Analysis Agent).
    This represents the comprehensive evaluation of a technical interview.
    """
    candidate_id: str = Field(..., description="Unique ID of the candidate")
    candidate_name: str = Field(..., min_length=2, description="Full name of the candidate")
    position: str = Field(..., min_length=3, description="Job position they applied for")
    interview_date: datetime = Field(..., description="Interview date and time")
    duration: int = Field(..., ge=1, description="Total interview duration in minutes")
    
    technical_scores: TechnicalScores
    soft_skills: SoftSkills
    behavioral: BehavioralIndicators
    time_analysis: TimeAnalysis
    insights: Insights
    code_analysis: CodeAnalysis
    recommendation: Recommendation
    task: TaskInfo

    class Config:
        json_schema_extra = {
            "example": {
                "candidate_id": "cand_123abc",
                "candidate_name": "Sarah Anderson",
                "position": "Senior Full-Stack Developer",
                "interview_date": "2025-12-10T14:30:00Z",
                "duration": 87,
                "technical_scores": {
                    "code_quality": 92,
                    "problem_solving": 88,
                    "algorithmic_thinking": 85,
                    "debugging": 90,
                    "testing": 78,
                    "edge_case_handling": 82,
                    "overall": 86
                },
                "soft_skills": {
                    "clarity": 94,
                    "question_asking": 88,
                    "thought_process": 91,
                    "collaboration": 89,
                    "response_to_feedback": 95,
                    "overall": 91
                },
                "behavioral": {
                    "stress_handling": 87,
                    "confidence": 90,
                    "learning_agility": 93,
                    "problem_decomposition": 89,
                    "critical_thinking": 91
                },
                "time_analysis": {
                    "phases": [
                        {"name": "Understanding Requirements", "duration": 12, "percentage": 14},
                        {"name": "Planning & Design", "duration": 18, "percentage": 21},
                        {"name": "Implementation", "duration": 38, "percentage": 44},
                        {"name": "Testing & Debugging", "duration": 15, "percentage": 17},
                        {"name": "Discussion & Review", "duration": 4, "percentage": 4}
                    ],
                    "productivity": "high"
                },
                "insights": {
                    "strengths": [
                        "Exceptional code organization and use of TypeScript best practices",
                        "Proactive in asking clarifying questions",
                        "Strong debugging skills"
                    ],
                    "improvements": [
                        "Could write more comprehensive unit tests",
                        "Initial solution didn't consider mobile responsiveness"
                    ],
                    "red_flags": [],
                    "notable_moments": [
                        {
                            "type": "positive",
                            "timestamp": "00:23:15",
                            "description": "Identified a potential race condition before implementation"
                        }
                    ]
                },
                "code_analysis": {
                    "best_practices": [
                        "Used TypeScript interfaces for type safety",
                        "Implemented proper error handling"
                    ],
                    "issues": [
                        "Missing error boundary for React component",
                        "No input validation"
                    ],
                    "code_snippets": [
                        {
                            "type": "best",
                            "code": "const processData = async (items: DataItem[]): Promise<Result> => { ... }",
                            "explanation": "Excellent use of async/reduce pattern"
                        }
                    ]
                },
                "recommendation": {
                    "verdict": "STRONG_HIRE",
                    "confidence": 92,
                    "summary": "Exceptional candidate with strong technical skills and excellent communication.",
                    "reasoning": [
                        "Technical skills align perfectly with role requirements",
                        "Outstanding soft skills and communication",
                        "Quick learner who adapts well to feedback"
                    ],
                    "fit_for_role": 94
                },
                "task": {
                    "title": "Build a Real-time Collaborative Task Manager",
                    "difficulty": "hard",
                    "category": "Full-Stack Development",
                    "completed": True
                }
            }
        }


# ============ Input for Agent 3 ============

class TaskGenerated(BaseModel):
    """Task generated by Agent 1"""
    task_id: str
    title: str
    description: str
    difficulty: Literal["easy", "medium", "hard"]
    category: str
    requirements: List[str]
    test_cases: Optional[List[dict]] = None


class ConversationMessage(BaseModel):
    """A message in the interview conversation"""
    timestamp: datetime
    speaker: Literal["AI", "CANDIDATE"]
    message: str


class CodeHistoryEntry(BaseModel):
    """An entry in the code history"""
    timestamp: datetime
    code: str
    language: str
    action: Literal["write", "edit", "delete"]


class TestResults(BaseModel):
    """Results from automated tests"""
    passed: int
    failed: int
    total: int
    details: List[dict]


class InterviewSessionMetadata(BaseModel):
    """Additional metadata about the interview session"""
    code_execution_attempts: Optional[int] = None
    errors_encountered: Optional[int] = None
    hints_given: Optional[int] = None


class InterviewSession(BaseModel):
    """Complete interview session data"""
    session_id: str
    candidate_id: str
    candidate_name: str
    position: str
    start_time: datetime
    end_time: datetime
    conversation: List[ConversationMessage]
    code_history: List[CodeHistoryEntry]
    final_code: str
    test_results: Optional[TestResults] = None
    metadata: Optional[InterviewSessionMetadata] = None


class Agent3Input(BaseModel):
    """Complete input for Agent 3 (Analysis Agent)"""
    task_generated: TaskGenerated
    interview_session: InterviewSession
