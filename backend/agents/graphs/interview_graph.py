"""
Interview Graph - LangGraph state machine for Agent 2.
"""
import random
import logging
from datetime import datetime, timedelta
from typing import Literal
from langgraph.graph import StateGraph, END
from agents.schemas.interview_state import InterviewState, MessageItem
from agents.services.llm_service import LLMService


logger = logging.getLogger(__name__)


class InterviewGraph:
    """LangGraph state machine for conducting interviews."""
    
    def __init__(self):
        """Initialize interview graph."""
        self.llm_service = LLMService()
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the interview state machine graph."""
        workflow = StateGraph(InterviewState)
        
        # Add nodes
        workflow.add_node("intro", self._intro_node)
        workflow.add_node("screening", self._screening_node)
        workflow.add_node("task_transition", self._task_transition_node)
        workflow.add_node("coding", self._coding_node)
        workflow.add_node("terminated", self._terminated_node)
        workflow.add_node("wrapup", self._wrapup_node)
        
        # Set entry point
        workflow.set_entry_point("route_stage")
        
        # Add routing node
        workflow.add_node("route_stage", self._route_stage)
        
        # Route from route_stage to appropriate node
        workflow.add_conditional_edges(
            "route_stage",
            lambda state: state.stage,
            {
                "INTRO": "intro",
                "SCREENING": "screening",
                "TASK": "task_transition",
                "CODING": "coding",
                "TERMINATED": "terminated",
                "WRAPUP": "wrapup"
            }
        )
        
        # All nodes return to END
        workflow.add_edge("intro", END)
        workflow.add_edge("screening", END)
        workflow.add_edge("task_transition", END)
        workflow.add_edge("coding", END)
        workflow.add_edge("terminated", END)
        workflow.add_edge("wrapup", END)
        
        return workflow.compile()
    
    def _route_stage(self, state: InterviewState) -> InterviewState:
        """Route to appropriate node based on current stage."""
        # Check for 30-minute timeout
        if state.interview_started_at:
            elapsed = datetime.utcnow() - state.interview_started_at
            if elapsed > timedelta(minutes=state.interview_max_duration_minutes):
                logger.info(f"⏰ Interview timeout reached ({state.interview_max_duration_minutes} min)")
                state.stage = "WRAPUP"
                state.interview_ended = True
        
        return state
    
    def _build_contexts(self, state: InterviewState) -> tuple[dict, dict, dict]:
        """Build context dicts for LLM service."""
        candidate_context = {
            "name": state.candidate_name,
            "email": state.candidate_email
        }
        
        job_context = {
            "title": state.job_title,
            "experience_level": state.job_experience_level,
            "tech_stack": state.job_tech_stack,
            "requirements": state.job_requirements
        }
        
        task_context = {
            "task_title": state.task_title,
            "task_description": state.task_description,
            "task_requirements": state.task_requirements
        }
        
        return candidate_context, job_context, task_context
    
    async def _intro_node(self, state: InterviewState) -> InterviewState:
        """Handle introduction stage (max 2 exchanges)."""
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, _ = self._build_contexts(state)
        
        # Set interview start time if not set
        if not state.interview_started_at:
            state.interview_started_at = datetime.utcnow()
        
        # Generate greeting/response
        response = await self.llm_service.generate_response(
            stage="INTRO",
            conversation_history=conversation_history,
            candidate_context=candidate_context,
            job_context=job_context
        )
        
        # Count intro exchanges
        if state.last_event_type == "user_message":
            state.intro_questions_asked += 1
            logger.info(f"📝 Intro exchange {state.intro_questions_asked}/{state.intro_target}")
        
        # After 2 exchanges, move to screening
        if state.intro_questions_asked >= state.intro_target:
            logger.info("➡️ Moving from INTRO to SCREENING")
            state.stage = "SCREENING"
            # Set random target for screening (5-7 questions)
            state.screening_target = random.randint(state.screening_min, state.screening_max)
            logger.info(f"🎯 Screening target: {state.screening_target} questions")
        
        state.assistant_response = response
        return state
    
    async def _screening_node(self, state: InterviewState) -> InterviewState:
        """Handle technical screening questions (5 questions MAX)."""
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, _ = self._build_contexts(state)
        
        # Check for early termination (too many poor answers)
        if state.poor_answers_count >= state.poor_answer_threshold:
            logger.warning(f"❌ Early termination: {state.poor_answers_count} poor answers")
            state.stage = "TERMINATED"
            state.early_termination = True
            state.interview_ended = True
            # Generate termination message
            response = await self.llm_service.generate_response(
                stage="TERMINATED",
                conversation_history=conversation_history,
                candidate_context=candidate_context,
                job_context=job_context
            )
            state.assistant_response = response
            return state
        
        # Build progress info for LLM
        screening_progress = {
            "asked": state.screening_questions_asked,
            "target": state.screening_target,
            "poor_answers": state.poor_answers_count
        }
        
        # Generate next question or response
        response = await self.llm_service.generate_response(
            stage="SCREENING",
            conversation_history=conversation_history,
            candidate_context=candidate_context,
            job_context=job_context,
            screening_progress=screening_progress
        )
        
        # Count screening questions when user responds
        if state.last_event_type == "user_message" and state.last_user_message:
            state.screening_questions_asked += 1
            logger.info(f"📝 Screening Q {state.screening_questions_asked}/{state.screening_target}")
            
            # Evaluate answer quality for potential early termination
            # Get the previous assistant message (the question)
            assistant_messages = [m for m in state.messages if m.role == "assistant"]
            if assistant_messages:
                last_question = assistant_messages[-1].text
                try:
                    eval_result = await self.llm_service.evaluate_answer_quality(
                        question=last_question,
                        answer=state.last_user_message,
                        expected_level=state.job_experience_level or "mid"
                    )
                    if eval_result["is_poor"]:
                        state.poor_answers_count += 1
                        logger.warning(f"⚠️ Poor answer detected ({state.poor_answers_count}/{state.poor_answer_threshold})")
                except Exception as e:
                    logger.error(f"Failed to evaluate answer: {e}")
        
        # Check if we've asked enough questions OR hit poor answer threshold
        if state.screening_questions_asked >= state.screening_target or state.poor_answers_count >= state.poor_answer_threshold:
            if state.poor_answers_count >= state.poor_answer_threshold:
                # FAIL - too many poor answers, terminate
                logger.warning("❌ Too many poor answers - terminating")
                state.stage = "TERMINATED"
                state.early_termination = True
                state.interview_ended = True
                # Generate termination message (don't use the screening response)
                response = await self.llm_service.generate_response(
                    stage="TERMINATED",
                    conversation_history=conversation_history,
                    candidate_context=candidate_context,
                    job_context=job_context
                )
            else:
                # PASS - good enough answers, move to coding task
                logger.info("✅ Candidate passed screening - moving to TASK")
                state.stage = "TASK"
                # Generate task introduction message
                _, _, task_context = self._build_contexts(state)
                response = await self.llm_service.generate_response(
                    stage="TASK",
                    conversation_history=conversation_history,
                    task_context=task_context,
                    candidate_context=candidate_context,
                    job_context=job_context
                )
                # Unlock task and code editor
                state.task_unlocked = True
                state.can_edit_code = True
                state.stage = "CODING"  # Move directly to CODING after task intro
                logger.info("🔓 Task unlocked, stage set to CODING")
        
        state.assistant_response = response
        return state
    
    async def _task_transition_node(self, state: InterviewState) -> InterviewState:
        """Transition to coding task - unlock the task."""
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, task_context = self._build_contexts(state)
        
        # Generate transition message
        response = await self.llm_service.generate_response(
            stage="TASK",
            conversation_history=conversation_history,
            task_context=task_context,
            candidate_context=candidate_context,
            job_context=job_context
        )
        
        # Unlock task and code editor
        state.task_unlocked = True
        state.can_edit_code = True
        state.stage = "CODING"
        
        logger.info("🔓 Task unlocked, moving to CODING stage")
        
        state.assistant_response = response
        return state
    
    async def _coding_node(self, state: InterviewState) -> InterviewState:
        """Handle coding phase with hints on idle, code monitoring, and cheating detection."""
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, task_context = self._build_contexts(state)
        
        # Build code context for AI to see what's in the editor
        code_length = len(state.code_current.strip()) if state.code_current else 0
        code_context = {
            "code": state.code_current,
            "language": state.code_language,
            "idle_seconds": state.idle_seconds,
            "code_length": code_length,
            "nudge_count": state.idle_nudges
        }
        
        # Handle different event types
        if state.last_event_type == "idle":
            # Check cooldown (don't nudge more than once per 45 seconds)
            now = datetime.utcnow()
            cooldown_seconds = 45
            
            if state.last_idle_nudge_at:
                seconds_since_last_nudge = (now - state.last_idle_nudge_at).total_seconds()
                if seconds_since_last_nudge < cooldown_seconds:
                    logger.info(f"⏳ Idle nudge cooldown ({seconds_since_last_nudge:.0f}s < {cooldown_seconds}s)")
                    state.assistant_response = None
                    return state
            
            # Build context message based on situation
            if code_length < 20:
                # Almost no code written - suspicious
                idle_context_msg = f"[SYSTEM: Candidate has been idle for {state.idle_seconds}s with almost NO CODE written ({code_length} chars). This is nudge #{state.idle_nudges + 1}. Be increasingly concerned about potential cheating or lack of effort.]"
            else:
                # Some code exists - maybe stuck
                idle_context_msg = f"[SYSTEM: Candidate idle for {state.idle_seconds}s. They have {code_length} chars of code. Nudge #{state.idle_nudges + 1}. Check their code and offer help if stuck.]"
            
            conversation_history.append({"role": "system", "text": idle_context_msg})
            
            logger.info(f"💤 Idle nudge #{state.idle_nudges + 1} after {state.idle_seconds}s (code: {code_length} chars)")
            
            response = await self.llm_service.generate_response(
                stage="CODING",
                conversation_history=conversation_history,
                task_context=task_context,
                candidate_context=candidate_context,
                job_context=job_context,
                code_context=code_context
            )
            
            state.idle_nudges += 1
            state.last_idle_nudge_at = now
            
            # Check if AI wants to terminate due to suspected cheating
            # (AI will say something like "I'm ending the interview" or "concerns about authenticity")
            response_lower = response.lower()
            if any(phrase in response_lower for phrase in ["ending the interview", "end the interview", "terminate", "concerns about authenticity", "not your own work"]):
                logger.warning("🚨 AI suspects cheating - terminating interview")
                state.stage = "TERMINATED"
                state.early_termination = True
                state.interview_ended = True
            
            state.assistant_response = response
        
        elif state.last_event_type == "user_message":
            # User asked a question or made a comment
            response = await self.llm_service.generate_response(
                stage="CODING",
                conversation_history=conversation_history,
                task_context=task_context,
                candidate_context=candidate_context,
                job_context=job_context,
                code_context=code_context
            )
            state.assistant_response = response
        else:
            # No response needed (e.g., code change event)
            state.assistant_response = None
        
        return state
    
    async def _terminated_node(self, state: InterviewState) -> InterviewState:
        """Handle early termination - candidate not qualified."""
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, _ = self._build_contexts(state)
        
        logger.info("🛑 Interview terminated early")
        
        response = await self.llm_service.generate_response(
            stage="TERMINATED",
            conversation_history=conversation_history,
            candidate_context=candidate_context,
            job_context=job_context
        )
        
        state.interview_ended = True
        state.assistant_response = response
        return state
    
    async def _wrapup_node(self, state: InterviewState) -> InterviewState:
        """Handle interview wrap-up."""
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, _ = self._build_contexts(state)
        
        logger.info("🏁 Interview wrap-up")
        
        response = await self.llm_service.generate_response(
            stage="WRAPUP",
            conversation_history=conversation_history,
            candidate_context=candidate_context,
            job_context=job_context
        )
        
        state.interview_ended = True
        state.assistant_response = response
        return state
    
    async def run(self, state: InterviewState) -> InterviewState:
        """Run the graph with the given state."""
        result = await self.graph.ainvoke(state)
        
        # LangGraph returns a dict, convert back to InterviewState
        if isinstance(result, dict):
            for key, value in result.items():
                if hasattr(state, key):
                    setattr(state, key, value)
            return state
        
        return result
