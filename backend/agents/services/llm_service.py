from typing import Optional
from langchain_openai import ChatOpenAI
from core.config import settings


class LLMService:
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required for interview agent")
        self.llm = ChatOpenAI(
            model="gpt-4.1-nano-2025-04-14",
            temperature=0.7,
            api_key=settings.OPENAI_API_KEY
        )
    
    def _build_candidate_info(self, candidate_context: Optional[dict]) -> str:
        if not candidate_context:
            return ""
        name = candidate_context.get('name') or 'Candidate'
        return f"CANDIDATE: {name}"
    
    def _build_job_info(self, job_context: Optional[dict]) -> tuple[str, list, list]:
        if not job_context:
            return "", [], []
        level = job_context.get('experience_level', 'mid').upper()
        job_tech = job_context.get('tech_stack', [])
        job_requirements = job_context.get('requirements', [])
        job_title = job_context.get('title', 'Software Developer')
        tech_stack = ', '.join(job_tech) if job_tech else 'General'
        job_info = f"""POSITION: {job_title} ({level})
TECH STACK: {tech_stack}
KEY REQUIREMENTS: {'; '.join(job_requirements[:5]) if job_requirements else 'General software development'}"""
        return job_info, job_tech, job_requirements
    
    def _build_progress_info(self, screening_progress: Optional[dict]) -> str:
        if not screening_progress:
            return ""
        asked = screening_progress.get('asked', 0)
        target = screening_progress.get('target', 5)
        poor = screening_progress.get('poor_answers', 0)
        return f"\nPROGRESS: Question {asked}/{target}. Poor answers: {poor}/3"
    
    def _build_code_info(self, code_context: Optional[dict]) -> str:
        if not code_context:
            return ""
        current_code = code_context.get('code', '') or ''
        code_lang = code_context.get('language', 'python')
        idle_seconds = code_context.get('idle_seconds', 0)
        code_length = len(current_code.strip())
        nudge_count = code_context.get('nudge_count', 0)
        
        if current_code.strip():
            code_preview = current_code[:800] + ('...' if len(current_code) > 800 else '')
            return f"""
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
        
        return f"""
=== CODE EDITOR (LIVE VIEW) ===
Language selected: {code_lang}
Code length: 0 characters (EMPTY!)
Idle time: {idle_seconds} seconds
Times nudged: {nudge_count}

⚠️ THE CODE EDITOR IS EMPTY - CANDIDATE HAS NOT WRITTEN ANY CODE YET!
=== END CODE ==="""
    
    def _build_base_prompt(
        self,
        candidate_info: str,
        job_info: str,
        progress_info: str,
        code_info: str
    ) -> str:
        return f"""You are a FRIENDLY but PROFESSIONAL HR INTERVIEWER conducting a technical screening.
{candidate_info}
{job_info}
{progress_info}
{code_info}

YOUR PERSONALITY:
- Talk like a REAL person, not a robot
- Be conversational and natural
- Show genuine interest in their thinking process
- Be encouraging when appropriate: "Good start", "I like that approach", "Nice thinking"
- You have the authority to end the interview at any time
- Show empathy for technical issues (mic problems, connection issues)

CRITICAL RULES:
1. YOU lead the interview - NEVER ask the candidate what they want to do
2. NEVER say "would you like to..." or "do you want to..." - just tell them what's next
3. Keep responses SHORT (1-2 sentences, MAX 30 words)
4. This is VOICE - be natural and conversational
5. Vary your responses - don't repeat the same phrases
6. The coding task is PRE-DEFINED - do NOT create your own tasks
7. During technical questions, be direct but friendly"""
    
    def _get_intro_prompt(self) -> str:
        return """

STAGE: Introduction (2 exchanges)
This is the warm-up phase. Be friendly and NATURAL!

FIRST MESSAGE (if no conversation yet):
Pick ONE of these greeting styles randomly - DO NOT use the same one every time:
- "Hey there! I'm your AI interviewer for today's technical screening. What's your name and how's your day going?"
- "Hi! Welcome to your interview. I'll be guiding you through this. First off - who am I speaking with today?"
- "Hello! Thanks for joining. I'm the AI conducting your technical screening today. Before we dive in, tell me your name?"
- "Hey! Glad you could make it. I'm your interviewer today. How are you doing, and what should I call you?"
- "Hi there! Ready for your tech interview? I'm excited to chat. What's your name?"

Be warm and conversational. Mix it up!

SECOND MESSAGE (after they respond):
Acknowledge them naturally - vary your response:
- "Great to meet you, [name]! Alright, let's jump into some technical stuff about [tech stack]."
- "Nice! Thanks [name]. So let's get into it - I've got some questions about [job title/tech]."
- "Awesome, [name]! Ready to talk tech? Let's start with [tech stack]."
- "[name], cool! Let's see what you know about [tech stack]."

Then the system will move you to SCREENING stage.
Keep it natural. This is the only small talk allowed."""
    
    def _get_screening_prompt(self, job_tech: list, job_context: Optional[dict]) -> str:
        tech_list = ', '.join(job_tech[:5]) if job_tech else 'general software development'
        job_title = job_context.get('title', 'this position') if job_context else 'this position'
        job_requirements = job_context.get('requirements', []) if job_context else []
        experience_level = job_context.get('experience_level', 'mid') if job_context else 'mid'
        requirements_str = ', '.join(job_requirements[:3]) if job_requirements else ''
        
        return f"""

STAGE: Technical Screening (5 questions MAXIMUM)
YOUR GOAL: Test if this candidate has the fundamentals for {job_title}.

=== JOB CONTEXT - BASE YOUR QUESTIONS ON THIS ===
Position: {job_title}
Experience Level: {experience_level.upper()}
Tech Stack: {tech_list}
Key Requirements: {requirements_str}

=== CRITICAL: FOCUS ON THE TECH STACK ===
Your questions MUST be about the technologies listed above: {tech_list}

For each question, pick ONE technology from the stack and ask about it.
Adapt difficulty to the experience level ({experience_level}).

=== QUESTION TYPES (vary these, don't repeat same type) ===
- Explain a concept from the tech stack
- Compare two related things (when to use which)
- Describe how something works
- Ask about common problems/errors and how to fix them
- Ask about their experience or a project they worked on
- Ask about best practices (code quality, testing, documentation)

=== RULES ===
1. Questions MUST relate to: {tech_list}
2. Keep questions CONCEPTUAL - NO coding tasks (there's a separate coding phase)
3. One question at a time
4. Vary your question style - don't start every question the same way
5. For {experience_level} level - adjust complexity appropriately

=== DO NOT ===
- Ask generic questions unrelated to the job's tech stack
- Ask mini coding tasks ("write a function to...", "implement X")
- Ask the same question twice
- Ask multiple questions at once

=== AFTER EACH ANSWER ===
- Good answer: Brief acknowledgment ("Nice!", "Good", "Solid") → next question
- Partial: Ask them to expand on the weak part
- Wrong: Move on without correcting

Keep asking until the system moves you to the next stage."""
    
    def _get_task_prompt(self) -> str:
        return """

STAGE: Coding Task Introduction
The candidate can already SEE the task on their screen (it was locked, now unlocked).
You do NOT need to explain the task - they can read it themselves.

YOUR JOB: Just transition smoothly and let them start.

Example ways to transition (pick one, vary it):
- "Alright, nice work on the questions! You can now start working on the coding task. Let me know if you have any questions."
- "Good stuff! Go ahead and start on the coding task whenever you're ready. Feel free to ask if anything's unclear."
- "Cool, you did well! The task is unlocked now - dive in. I'm here if you need clarification."
- "Great! Time for coding. Go ahead and start, and just ask if you have questions about the task."

IMPORTANT:
- Do NOT explain or summarize the task - they can read it
- Do NOT ask "would you like to..." - just tell them to start
- Let them know they can ask clarifying questions if needed"""
    
    def _get_coding_prompt(self, task_context: Optional[dict]) -> str:
        task_title = task_context.get('task_title', 'Coding Task') if task_context else 'Coding Task'
        task_description = task_context.get('task_description', '') if task_context else ''
        task_requirements = task_context.get('task_requirements', []) if task_context else []
        task_lang = task_context.get('expected_language', 'python') if task_context else 'python'
        
        requirements_str = ""
        if task_requirements:
            requirements_str = "\nRequirements:\n" + "\n".join(f"- {req}" for req in task_requirements)
        
        return f"""

STAGE: Coding Phase
TASK: {task_title}
DESCRIPTION: {task_description}{requirements_str}
EXPECTED LANGUAGE: {task_lang}

CODE MONITORING - You can see their code editor in real-time.

=== CHEATING DETECTION (IMPORTANT) ===
Watch for signs of cheating:
1. NO CODE FOR A LONG TIME (25+ seconds idle with empty/minimal code):
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

ChatGPT said:

DETECT WRONG LANGUAGE (by code syntax only):

Goal: Identify whether the submitted code is in the expected language.
Method: Look at syntax/keywords/import style/structure.
If the syntax clearly matches a different language than expected → flag as wrong language.

IF THE CODE IS IN THE WRONG LANGUAGE:
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
    
    def _get_terminated_prompt(self) -> str:
        return """

STAGE: Interview Ended Early
The candidate did not pass the technical screening. Be professional but direct.

Pick one closing - vary it:
- "I appreciate your time today, but I don't think we'll be moving forward. We'll be in touch with feedback."
- "Thanks for coming in. Unfortunately, we won't be continuing with the process. Best of luck with your search."
- "I have to wrap this up here. We'll send you feedback on your performance. Thanks for your time."
- "Alright, I think we have what we need. We'll review and get back to you. Thanks for joining."

Be brief and professional. Do NOT explain why or give detailed feedback.
Then STOP. Say nothing else."""
    
    def _get_wrapup_prompt(self) -> str:
        return """

STAGE: Interview Complete
Pick one closing - vary it:
- "Time's up! We'll review your code and reach out with feedback. Thanks!"
- "Alright, that's time. Good effort - we'll take a look and get back to you."
- "And that's a wrap! We'll check out your submission and follow up soon. Thanks for your work!"
- "Okay, time's up. We'll review everything and be in touch. Appreciate it!"
END."""
    
    def create_system_prompt(
        self, 
        stage: str, 
        task_context: Optional[dict] = None,
        candidate_context: Optional[dict] = None,
        job_context: Optional[dict] = None,
        screening_progress: Optional[dict] = None,
        code_context: Optional[dict] = None
    ) -> str:
        candidate_info = self._build_candidate_info(candidate_context)
        job_info, job_tech, _ = self._build_job_info(job_context)
        progress_info = self._build_progress_info(screening_progress)
        code_info = self._build_code_info(code_context)
        
        base = self._build_base_prompt(candidate_info, job_info, progress_info, code_info)
        
        stage_prompts = {
            "INTRO": self._get_intro_prompt(),
            "SCREENING": self._get_screening_prompt(job_tech, job_context),
            "TASK": self._get_task_prompt(),
            "CODING": self._get_coding_prompt(task_context),
            "TERMINATED": self._get_terminated_prompt(),
            "WRAPUP": self._get_wrapup_prompt(),
        }
        
        return base + stage_prompts.get(stage, "")
    
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
        system_prompt = self.create_system_prompt(
            stage, 
            task_context,
            candidate_context,
            job_context,
            screening_progress,
            code_context
        )
        
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in conversation_history[-10:]:
            if msg["role"] == "system":
                continue
            messages.append({"role": msg["role"], "content": msg["text"]})
        
        response = await self.llm.ainvoke(messages)
        return response.content.strip()
    
    async def evaluate_answer_quality(
        self,
        question: str,
        answer: str,
        expected_level: str
    ) -> dict:
        eval_prompt = f"""You are evaluating a technical interview answer.

QUESTION: {question}
CANDIDATE ANSWER: {answer}
EXPECTED LEVEL: {expected_level}

Rate the answer:
- POOR: Wrong, "I don't know", nonsense, or completely off-topic
- OKAY: Partially correct, shows some understanding
- GOOD: Correct and appropriate for the level

Reply with ONLY one word: POOR, OKAY, or GOOD"""
        
        response = await self.llm.ainvoke([{"role": "user", "content": eval_prompt}])
        result = response.content.strip().upper()
        
        return {
            "quality": result if result in ["POOR", "OKAY", "GOOD"] else "OKAY",
            "is_poor": result == "POOR"
        }
