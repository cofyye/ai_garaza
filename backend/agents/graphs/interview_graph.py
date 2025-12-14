import random
import logging
from datetime import datetime, timedelta
from langgraph.graph import StateGraph, END
from agents.schemas.interview_state import InterviewState
from agents.services.llm_service import LLMService


logger = logging.getLogger(__name__)


class InterviewGraph:
    
    def __init__(self):
        self._llm_service = None
        self.graph = self._build_graph()
    
    @property
    def llm_service(self):
        """Get or create the LLM service lazily."""
        if self._llm_service is None:
            self._llm_service = LLMService()
        return self._llm_service
    
    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(InterviewState)
        
        workflow.add_node("intro", self._intro_node)
        workflow.add_node("screening", self._screening_node)
        workflow.add_node("task_transition", self._task_transition_node)
        workflow.add_node("coding", self._coding_node)
        workflow.add_node("terminated", self._terminated_node)
        workflow.add_node("wrapup", self._wrapup_node)
        workflow.add_node("route_stage", self._route_stage)
        
        workflow.set_entry_point("route_stage")
        
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
        
        for node in ["intro", "screening", "task_transition", "coding", "terminated", "wrapup"]:
            workflow.add_edge(node, END)
        
        return workflow.compile()
    
    def _route_stage(self, state: InterviewState) -> InterviewState:
        if state.interview_started_at:
            elapsed = datetime.utcnow() - state.interview_started_at
            if elapsed > timedelta(minutes=state.interview_max_duration_minutes):
                logger.info(f"Interview timeout reached ({state.interview_max_duration_minutes} min)")
                state.stage = "WRAPUP"
                state.interview_ended = True
        return state
    
    def _build_contexts(self, state: InterviewState) -> tuple[dict, dict, dict]:
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
            "task_requirements": state.task_requirements,
            "expected_language": state.code_language
        }
        return candidate_context, job_context, task_context
    
    def _build_code_context(self, state: InterviewState) -> dict:
        code_length = len(state.code_current.strip()) if state.code_current else 0
        return {
            "code": state.code_current,
            "language": state.code_language,
            "idle_seconds": state.idle_seconds,
            "code_length": code_length,
            "nudge_count": state.idle_nudges
        }
    
    def _check_cheating_response(self, response: str) -> bool:
        response_lower = response.lower()
        cheating_phrases = [
            "ending the interview", "end the interview", "terminate",
            "concerns about authenticity", "not your own work"
        ]
        return any(phrase in response_lower for phrase in cheating_phrases)
    
    async def _intro_node(self, state: InterviewState) -> InterviewState:
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, _ = self._build_contexts(state)
        
        if not state.interview_started_at:
            state.interview_started_at = datetime.utcnow()
        
        response = await self.llm_service.generate_response(
            stage="INTRO",
            conversation_history=conversation_history,
            candidate_context=candidate_context,
            job_context=job_context
        )
        
        if state.last_event_type == "user_message":
            state.intro_questions_asked += 1
            logger.info(f"Intro exchange {state.intro_questions_asked}/{state.intro_target}")
        
        if state.intro_questions_asked >= state.intro_target:
            logger.info("Moving from INTRO to SCREENING")
            state.stage = "SCREENING"
            state.screening_target = random.randint(state.screening_min, state.screening_max)
            logger.info(f"Screening target: {state.screening_target} questions")
        
        state.assistant_response = response
        return state
    
    async def _screening_node(self, state: InterviewState) -> InterviewState:
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, _ = self._build_contexts(state)
        
        if state.poor_answers_count >= state.poor_answer_threshold:
            logger.warning(f"Early termination: {state.poor_answers_count} poor answers")
            state.stage = "TERMINATED"
            state.early_termination = True
            state.interview_ended = True
            response = await self.llm_service.generate_response(
                stage="TERMINATED",
                conversation_history=conversation_history,
                candidate_context=candidate_context,
                job_context=job_context
            )
            state.assistant_response = response
            return state
        
        screening_progress = {
            "asked": state.screening_questions_asked,
            "target": state.screening_target,
            "poor_answers": state.poor_answers_count
        }
        
        response = await self.llm_service.generate_response(
            stage="SCREENING",
            conversation_history=conversation_history,
            candidate_context=candidate_context,
            job_context=job_context,
            screening_progress=screening_progress
        )
        
        if state.last_event_type == "user_message" and state.last_user_message:
            state.screening_questions_asked += 1
            logger.info(f"Screening Q {state.screening_questions_asked}/{state.screening_target}")
            
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
                        logger.warning(f"Poor answer detected ({state.poor_answers_count}/{state.poor_answer_threshold})")
                except Exception as e:
                    logger.error(f"Failed to evaluate answer: {e}")
        
        should_transition = (
            state.screening_questions_asked >= state.screening_target or 
            state.poor_answers_count >= state.poor_answer_threshold
        )
        
        if should_transition:
            if state.poor_answers_count >= state.poor_answer_threshold:
                logger.warning("Too many poor answers - terminating")
                state.stage = "TERMINATED"
                state.early_termination = True
                state.interview_ended = True
                response = await self.llm_service.generate_response(
                    stage="TERMINATED",
                    conversation_history=conversation_history,
                    candidate_context=candidate_context,
                    job_context=job_context
                )
            else:
                logger.info("Candidate passed screening - moving to TASK")
                state.stage = "TASK"
                _, _, task_context = self._build_contexts(state)
                response = await self.llm_service.generate_response(
                    stage="TASK",
                    conversation_history=conversation_history,
                    task_context=task_context,
                    candidate_context=candidate_context,
                    job_context=job_context
                )
                state.task_unlocked = True
                state.can_edit_code = True
                state.stage = "CODING"
                logger.info("Task unlocked, stage set to CODING")
        
        state.assistant_response = response
        return state
    
    async def _task_transition_node(self, state: InterviewState) -> InterviewState:
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, task_context = self._build_contexts(state)
        
        response = await self.llm_service.generate_response(
            stage="TASK",
            conversation_history=conversation_history,
            task_context=task_context,
            candidate_context=candidate_context,
            job_context=job_context
        )
        
        state.task_unlocked = True
        state.can_edit_code = True
        state.stage = "CODING"
        logger.info("Task unlocked, moving to CODING stage")
        
        state.assistant_response = response
        return state
    
    async def _coding_node(self, state: InterviewState) -> InterviewState:
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, task_context = self._build_contexts(state)
        code_context = self._build_code_context(state)
        code_length = code_context["code_length"]
        
        if state.last_event_type == "idle":
            now = datetime.utcnow()
            cooldown_seconds = 45
            
            if state.last_idle_nudge_at:
                seconds_since_last_nudge = (now - state.last_idle_nudge_at).total_seconds()
                if seconds_since_last_nudge < cooldown_seconds:
                    logger.info(f"Idle nudge cooldown ({seconds_since_last_nudge:.0f}s < {cooldown_seconds}s)")
                    state.assistant_response = None
                    return state
            
            if code_length < 20:
                idle_context_msg = f"[SYSTEM: Candidate has been idle for {state.idle_seconds}s with almost NO CODE written ({code_length} chars). This is nudge #{state.idle_nudges + 1}. Be increasingly concerned about potential cheating or lack of effort.]"
            else:
                idle_context_msg = f"[SYSTEM: Candidate idle for {state.idle_seconds}s. They have {code_length} chars of code. Nudge #{state.idle_nudges + 1}. Check their code and offer help if stuck.]"
            
            conversation_history.append({"role": "system", "text": idle_context_msg})
            logger.info(f"Idle nudge #{state.idle_nudges + 1} after {state.idle_seconds}s (code: {code_length} chars)")
            
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
            
            if self._check_cheating_response(response):
                logger.warning("AI suspects cheating - terminating interview")
                state.stage = "TERMINATED"
                state.early_termination = True
                state.interview_ended = True
            
            state.assistant_response = response
        
        elif state.last_event_type == "user_message":
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
            state.assistant_response = None
        
        return state
    
    async def _terminated_node(self, state: InterviewState) -> InterviewState:
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, _ = self._build_contexts(state)
        
        logger.info("Interview terminated early")
        
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
        conversation_history = [{"role": msg.role, "text": msg.text} for msg in state.messages]
        candidate_context, job_context, _ = self._build_contexts(state)
        
        logger.info("Interview wrap-up")
        
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
        result = await self.graph.ainvoke(state)
        
        if isinstance(result, dict):
            for key, value in result.items():
                if hasattr(state, key):
                    setattr(state, key, value)
            return state
        
        return result
