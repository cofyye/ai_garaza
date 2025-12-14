"""
Agent 3 - Interview Analysis Service

Analyzes completed interview sessions and generates:
- Technical score
- Communication score  
- Overall score
- Verdict (STRONG_HIRE, HIRE, MAYBE, NO_HIRE)
- Key strengths
- Key insights
- Notable moments
"""
import json
import logging
from typing import Optional
from datetime import datetime
from langchain_openai import ChatOpenAI
from core.config import settings

logger = logging.getLogger(__name__)


class InterviewAnalysisService:
    """Agent 3: Analyzes completed interviews and generates candidate evaluations."""
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required for interview analysis")
        self.llm = ChatOpenAI(
            model="gpt-4.1-nano-2025-04-14",
            temperature=0.3,  # Lower temperature for more consistent analysis
            api_key=settings.OPENAI_API_KEY
        )
    
    async def analyze_interview(
        self,
        session_id: str,
        candidate_name: str,
        position: str,
        conversation: list[dict],
        final_code: str,
        code_language: str,
        task_title: str,
        task_description: str,
        interview_started_at: datetime,
        interview_ended_at: datetime,
        early_termination: bool = False
    ) -> dict:
        """
        Analyze a completed interview session.
        
        Returns a dict with:
        - technical_score (0-100)
        - communication_score (0-100)
        - overall_score (0-100)
        - verdict (STRONG_HIRE, HIRE, MAYBE, NO_HIRE)
        - key_strengths (list of 3 strings)
        - key_insights (string summary)
        - notable_moments (list of {time, description, type})
        """
        
        # Calculate duration
        duration_minutes = int((interview_ended_at - interview_started_at).total_seconds() / 60)
        
        # Format conversation for analysis
        conversation_text = self._format_conversation(conversation)
        
        # Build the analysis prompt
        prompt = self._build_analysis_prompt(
            candidate_name=candidate_name,
            position=position,
            conversation_text=conversation_text,
            final_code=final_code,
            code_language=code_language,
            task_title=task_title,
            task_description=task_description,
            duration_minutes=duration_minutes,
            early_termination=early_termination
        )
        
        try:
            response = await self.llm.ainvoke([{"role": "user", "content": prompt}])
            analysis = self._parse_analysis_response(response.content)
            
            # Add metadata
            analysis["session_id"] = session_id
            analysis["candidate_name"] = candidate_name
            analysis["position"] = position
            analysis["interview_date"] = interview_started_at.isoformat()
            analysis["duration"] = duration_minutes
            analysis["analyzed_at"] = datetime.utcnow().isoformat()
            
            logger.info(f"Interview analysis completed for session {session_id}: {analysis['verdict']}")
            return analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze interview: {e}")
            # Return a default analysis on error
            return self._default_analysis(
                session_id=session_id,
                candidate_name=candidate_name,
                position=position,
                interview_started_at=interview_started_at,
                duration_minutes=duration_minutes,
                early_termination=early_termination
            )
    
    def _format_conversation(self, conversation: list[dict]) -> str:
        """Format conversation messages for the prompt."""
        lines = []
        for msg in conversation:
            role = msg.get("role", "unknown").upper()
            text = msg.get("text", "")
            if role == "ASSISTANT":
                role = "INTERVIEWER"
            elif role == "USER":
                role = "CANDIDATE"
            lines.append(f"{role}: {text}")
        return "\n".join(lines)
    
    def _build_analysis_prompt(
        self,
        candidate_name: str,
        position: str,
        conversation_text: str,
        final_code: str,
        code_language: str,
        task_title: str,
        task_description: str,
        duration_minutes: int,
        early_termination: bool
    ) -> str:
        code_section = ""
        if final_code and final_code.strip():
            code_section = f"""
=== CANDIDATE'S CODE ===
Language: {code_language}
Task: {task_title}
Task Description: {task_description}

```{code_language}
{final_code[:3000]}
```
"""
        else:
            code_section = """
=== CANDIDATE'S CODE ===
No code was submitted (candidate did not reach or complete coding phase).
"""

        termination_note = ""
        if early_termination:
            termination_note = "\n⚠️ NOTE: This interview was terminated early (candidate did not pass screening).\n"

        return f"""You are an expert technical interview analyst. Analyze this completed interview and provide a structured evaluation.

=== INTERVIEW DETAILS ===
Candidate: {candidate_name}
Position: {position}
Duration: {duration_minutes} minutes
{termination_note}
=== CONVERSATION TRANSCRIPT ===
{conversation_text}
{code_section}

=== YOUR TASK ===
Analyze this interview and return a JSON object with these exact fields:

{{
  "technical_score": <number 0-100>,
  "communication_score": <number 0-100>,
  "overall_score": <number 0-100>,
  "verdict": "<STRONG_HIRE|HIRE|MAYBE|NO_HIRE>",
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "key_insights": "<2-3 sentence summary of the candidate>",
  "notable_moments": [
    {{"time": "MM:SS", "description": "what happened", "type": "positive|negative"}}
  ]
}}

=== SCORING GUIDELINES ===
- technical_score: Based on technical knowledge demonstrated in Q&A and code quality (if any)
- communication_score: Based on clarity, explanation ability, question asking, thought process
- overall_score: Weighted average (technical 60%, communication 40%)

=== VERDICT GUIDELINES ===
- STRONG_HIRE (85-100): Exceptional candidate, exceeded expectations
- HIRE (70-84): Good candidate, meets requirements well
- MAYBE (50-69): Borderline, has potential but concerns exist
- NO_HIRE (0-49): Does not meet requirements or major red flags

=== IMPORTANT ===
- Be objective and fair
- Base scores on actual demonstrated knowledge
- If interview was terminated early, factor that into the verdict
- Keep key_strengths to exactly 3 items
- Keep notable_moments to 2-4 items with realistic timestamps based on duration
- Return ONLY valid JSON, no other text"""

    def _parse_analysis_response(self, response_text: str) -> dict:
        """Parse the LLM response into a structured dict."""
        try:
            # Try to extract JSON from the response
            text = response_text.strip()
            
            # Find JSON in response (might be wrapped in markdown code blocks)
            if "```json" in text:
                start = text.find("```json") + 7
                end = text.find("```", start)
                text = text[start:end].strip()
            elif "```" in text:
                start = text.find("```") + 3
                end = text.find("```", start)
                text = text[start:end].strip()
            
            analysis = json.loads(text)
            
            # Validate and sanitize
            return {
                "technical_score": max(0, min(100, int(analysis.get("technical_score", 50)))),
                "communication_score": max(0, min(100, int(analysis.get("communication_score", 50)))),
                "overall_score": max(0, min(100, int(analysis.get("overall_score", 50)))),
                "verdict": analysis.get("verdict", "MAYBE") if analysis.get("verdict") in ["STRONG_HIRE", "HIRE", "MAYBE", "NO_HIRE"] else "MAYBE",
                "key_strengths": analysis.get("key_strengths", ["N/A", "N/A", "N/A"])[:3],
                "key_insights": analysis.get("key_insights", "Analysis unavailable."),
                "notable_moments": analysis.get("notable_moments", [])[:5]
            }
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.error(f"Failed to parse analysis response: {e}")
            logger.debug(f"Response text: {response_text}")
            return {
                "technical_score": 50,
                "communication_score": 50,
                "overall_score": 50,
                "verdict": "MAYBE",
                "key_strengths": ["Unable to analyze", "Unable to analyze", "Unable to analyze"],
                "key_insights": "Analysis could not be completed due to parsing error.",
                "notable_moments": []
            }
    
    def _default_analysis(
        self,
        session_id: str,
        candidate_name: str,
        position: str,
        interview_started_at: datetime,
        duration_minutes: int,
        early_termination: bool
    ) -> dict:
        """Return a default analysis when LLM fails."""
        if early_termination:
            return {
                "session_id": session_id,
                "candidate_name": candidate_name,
                "position": position,
                "interview_date": interview_started_at.isoformat(),
                "duration": duration_minutes,
                "technical_score": 30,
                "communication_score": 40,
                "overall_score": 34,
                "verdict": "NO_HIRE",
                "key_strengths": ["Interview terminated early", "Insufficient data", "N/A"],
                "key_insights": "Interview was terminated early. Candidate did not demonstrate sufficient technical knowledge during the screening phase.",
                "notable_moments": [],
                "analyzed_at": datetime.utcnow().isoformat()
            }
        
        return {
            "session_id": session_id,
            "candidate_name": candidate_name,
            "position": position,
            "interview_date": interview_started_at.isoformat(),
            "duration": duration_minutes,
            "technical_score": 50,
            "communication_score": 50,
            "overall_score": 50,
            "verdict": "MAYBE",
            "key_strengths": ["Analysis unavailable", "Analysis unavailable", "Analysis unavailable"],
            "key_insights": "Automated analysis could not be completed. Manual review recommended.",
            "notable_moments": [],
            "analyzed_at": datetime.utcnow().isoformat()
        }
