"""
LLM Service for Agent 2 - Interview Conductor.
"""
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from core.config import settings


class LLMService:
    """Service for generating interview responses using OpenAI."""
    
    def __init__(self):
        """Initialize LLM with OpenAI."""
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required for interview agent")
        
        self.llm = ChatOpenAI(
            model="gpt-4o",  # Using GPT-4o for better, smarter questions
            temperature=0.5,  # Lower temp for more focused responses
            api_key=settings.OPENAI_API_KEY
        )
    
    def create_system_prompt(
        self, 
        stage: str, 
        task_context: Optional[dict] = None,
        candidate_context: Optional[dict] = None,
        job_context: Optional[dict] = None,
        screening_progress: Optional[dict] = None,
        code_context: Optional[dict] = None
    ) -> str:
        """Create stage-specific system prompt with full context."""
        
        # Build candidate info section
        candidate_info = ""
        if candidate_context:
            name = candidate_context.get('name') or 'Candidate'
            candidate_info = f"CANDIDATE: {name}"
        
        # Build job info section - DETAILED for job-specific questions
        job_info = ""
        job_requirements = []
        job_tech = []
        if job_context:
            level = job_context.get('experience_level', 'mid').upper()
            job_tech = job_context.get('tech_stack', [])
            job_requirements = job_context.get('requirements', [])
            job_title = job_context.get('title', 'Software Developer')
            tech_stack = ', '.join(job_tech) if job_tech else 'General'
            job_info = f"""POSITION: {job_title} ({level})
TECH STACK: {tech_stack}
KEY REQUIREMENTS: {'; '.join(job_requirements[:5]) if job_requirements else 'General software development'}"""
        
        # Progress info for screening
        progress_info = ""
        if screening_progress:
            asked = screening_progress.get('asked', 0)
            target = screening_progress.get('target', 5)
            poor = screening_progress.get('poor_answers', 0)
            progress_info = f"\nPROGRESS: Question {asked}/{target}. Poor answers: {poor}/3"
        
        # Code context for CODING stage - ALWAYS show this during coding
        code_info = ""
        if code_context:
            current_code = code_context.get('code', '') or ''
            code_lang = code_context.get('language', 'python')
            idle_seconds = code_context.get('idle_seconds', 0)
            code_length = len(current_code.strip())
            nudge_count = code_context.get('nudge_count', 0)
            
            if current_code.strip():
                # There is code - show it
                code_preview = current_code[:800] + ('...' if len(current_code) > 800 else '')
                code_info = f"""
=== CODE EDITOR (LIVE VIEW) ===
Language selected: {code_lang}
Code length: {code_length} characters
Idle time: {idle_seconds} seconds
Times nudged: {nudge_count}

CANDIDATE'S CURRENT CODE:
```
{code_preview}
```
=== END CODE ==="""
            else:
                # No code yet - emphasize this
                code_info = f"""
=== CODE EDITOR (LIVE VIEW) ===
Language selected: {code_lang}
Code length: 0 characters (EMPTY!)
Idle time: {idle_seconds} seconds
Times nudged: {nudge_count}

⚠️ THE CODE EDITOR IS EMPTY - CANDIDATE HAS NOT WRITTEN ANY CODE YET!
=== END CODE ==="""
        
        base = f"""You are a FRIENDLY but PROFESSIONAL HR INTERVIEWER conducting a technical screening.
{candidate_info}
{job_info}
{progress_info}
{code_info}

YOUR PERSONALITY:
- Warm and professional, but efficient
- You can be friendly during intro, then more focused during technical questions
- You have the authority to end the interview at any time
- Show empathy for technical issues (mic problems, connection issues)
- Stay ON TOPIC - this interview is about THIS POSITION

SPEAKING RULES:
1. Keep responses SHORT (1-2 sentences, MAX 25 words)
2. This is VOICE - be natural and conversational
3. During technical questions, be direct - no filler"""
        
        if stage == "INTRO":
            return base + """

STAGE: Introduction (2 exchanges)
This is the warm-up phase. Be friendly!

FIRST MESSAGE (if no conversation yet):
- Greet them warmly
- Introduce yourself: "Hi! I'm your AI interviewer today. I'll be conducting your technical screening."
- Ask how they're doing and their name: "How are you today? And can I get your name?"

SECOND MESSAGE (after they respond):
- Acknowledge their name if they gave it
- Brief transition: "Nice to meet you, [name]. Let's get started with a few technical questions about [job title/tech stack]."
- Then the system will move you to SCREENING stage

Keep it natural and human. This is the only small talk allowed."""
        
        elif stage == "SCREENING":
            tech_examples = ""
            if job_tech:
                tech_examples = f"\nTECH STACK TO FOCUS ON: {', '.join(job_tech[:5])}"
            
            job_title = job_context.get('title', 'this position') if job_context else 'this position'
            
            return base + f"""

STAGE: Technical Screening (5 questions MAXIMUM)
YOUR GOAL: Test if this candidate understands the FUNDAMENTALS needed for {job_title}.
{tech_examples}

QUESTION STRATEGY - Test UNDERSTANDING of core concepts:
Ask questions that reveal if they truly understand, not just memorized answers.

GOOD QUESTION TYPES:
1. "What is [concept] and why would you use it?" (tests understanding)
2. "Can you explain how [technology] works under the hood?" (tests depth)
3. "When would you choose [A] over [B]?" (tests decision-making)
4. "What problems does [framework/tool] solve?" (tests practical knowledge)
5. "How would you approach [common problem in their stack]?" (tests problem-solving)

EXAMPLES FOR COMMON STACKS:
- React: "What problem does React solve? Why use components?"
- Python: "What's the difference between a list and a tuple? When use each?"
- Node.js: "Why is Node.js good for certain applications? What's it bad at?"
- SQL: "What's the difference between JOIN types? When use each?"
- REST API: "What makes an API RESTful? What are HTTP methods for?"

DO NOT ASK:
- Obscure trivia or gotcha questions
- Questions unrelated to the job requirements
- Multiple questions at once

AFTER EACH ANSWER:
- Good answer: move to next question (brief "Okay" or "Got it" is fine)
- Partial answer: "Can you elaborate?" or "What about [specific part]?"
- Wrong/confused: move on, don't correct them

IMPORTANT: You are ONLY asking questions. The SYSTEM decides when to end.
Just keep asking until the system moves you to the next stage."""
        
        elif stage == "TASK":
            return base + """

STAGE: Coding Task Introduction
Say: "Alright, you've done well so far. Now there's a coding task on your screen. Take your time to read it and start coding when you're ready. Let me know if you have any questions."
Be encouraging but brief."""
        
        elif stage == "CODING":
            task_info = ""
            if task_context:
                task_info = f"\nTASK: {task_context.get('task_title', 'Coding Task')}"
                task_lang = task_context.get('expected_language', 'python')
            else:
                task_lang = 'python'
            
            return base + f"""

STAGE: Coding Phase{task_info}
EXPECTED LANGUAGE: {task_lang}

CODE MONITORING - You can see their code editor in real-time.

=== CHEATING DETECTION (IMPORTANT) ===
Watch for signs of cheating:
1. NO CODE FOR A LONG TIME (60+ seconds idle with empty/minimal code):
   - First nudge: "I notice you haven't started typing. Is everything okay? Do you need clarification on the task?"
   - Second nudge: "You've been quiet for a while. Please start working on the solution."
   - Third+ nudge: "I need to see you actively working. Not typing anything is concerning."

2. SUSPICIOUS BEHAVIOR (long idle periods, then suddenly large chunks of code):
   - "That's quite a bit of code that appeared suddenly. Can you walk me through your approach?"
   - If they can't explain: "I'm concerned this may not be your own work."

3. IF YOU'RE CONFIDENT THEY'RE CHEATING:
   - Say: "I have concerns about the authenticity of this work. I'm going to end the interview here."
   - Then the system will terminate the interview.

=== WRONG LANGUAGE DETECTION (CRITICAL) ===
The task expects: {task_lang}

DETECT WRONG LANGUAGE by looking at the code syntax:
- C/C++ signs: #include, int main(), printf, cout, cin, std::, ->>, semicolons everywhere, curly braces for functions
- Java signs: public class, public static void main, System.out.println, import java
- JavaScript signs: console.log, const/let/var, function keyword, => arrows, require()
- Python signs: def, print(), no semicolons, indentation-based, import without curly braces

IF THE CODE IS CLEARLY IN THE WRONG LANGUAGE:
- Say something like: "Hold on - I notice you're writing what looks like C++ code, but this task should be solved in Python. Are you aware of that?"
- Or: "That syntax looks like Java, not Python. Would you like to switch to Python?"

=== CODE QUALITY HINTS ===
IF THEY HAVE OBVIOUS SYNTAX ERRORS:
- "Looks like there might be a syntax issue around line [area]. Want to double-check?"

IF THEIR APPROACH IS FUNDAMENTALLY WRONG:
- "Hmm, are you sure about that approach? Think about [gentle hint]."

IF THEY'RE STUCK BUT TRYING:
- "What's your current thinking? Maybe I can point you in the right direction."

IF THEY ASK FOR HELP:
- Give hints, not solutions
- Guide them to think through the problem

=== WHEN TO STAY SILENT ===
- When they're actively typing correct code
- When they're making good progress
- When the code looks reasonable and in the right language

DEFAULT: Let them work. Only intervene when necessary or when something is wrong."""
        
        elif stage == "TERMINATED":
            return base + """

STAGE: Interview Ended
Say EXACTLY: "Thank you for your time today. We'll review everything and be in touch."
Then STOP. Nothing else."""
        
        elif stage == "WRAPUP":
            return base + """

STAGE: Interview Complete
Say: "Time's up. We'll review your submission and contact you with next steps. Thank you."
END."""
        
        return base
    
    async def generate_response(
        self,
        stage: str,
        conversation_history: list[dict],
        task_context: Optional[dict] = None,
        candidate_context: Optional[dict] = None,
        job_context: Optional[dict] = None,
        screening_progress: Optional[dict] = None,
        code_context: Optional[dict] = None
    ) -> str:
        """Generate interviewer response based on context."""
        system_prompt = self.create_system_prompt(
            stage, 
            task_context,
            candidate_context,
            job_context,
            screening_progress,
            code_context
        )
        
        # Build messages for LLM
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history (last 10 messages to keep context tight)
        for msg in conversation_history[-10:]:
            role = msg["role"]
            if role == "system":
                continue  # Skip system messages in history
            messages.append({
                "role": role,
                "content": msg["text"]
            })
        
        # Create prompt and invoke
        response = await self.llm.ainvoke(messages)
        return response.content.strip()
    
    async def evaluate_answer_quality(
        self,
        question: str,
        answer: str,
        expected_level: str
    ) -> dict:
        """Evaluate if an answer indicates poor performance."""
        eval_prompt = f"""You are evaluating a technical interview answer.

QUESTION: {question}
CANDIDATE ANSWER: {answer}
EXPECTED LEVEL: {expected_level}

Rate the answer:
- POOR: Wrong, "I don't know", nonsense, or completely off-topic
- OKAY: Partially correct, shows some understanding
- GOOD: Correct and appropriate for the level

Reply with ONLY one word: POOR, OKAY, or GOOD"""
        
        messages = [{"role": "user", "content": eval_prompt}]
        response = await self.llm.ainvoke(messages)
        
        result = response.content.strip().upper()
        return {
            "quality": result if result in ["POOR", "OKAY", "GOOD"] else "OKAY",
            "is_poor": result == "POOR"
        }
