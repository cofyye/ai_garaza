# 🚀 Quick Start Guide - Agent 2 Interview System

## Prerequisites

- Python 3.10+ 
- Node.js 16+
- MongoDB running (localhost:27017)
- OpenAI API key
- (Optional) ElevenLabs API key for voice

## Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add:
OPENAI_API_KEY=sk-your-key-here
ELEVENLABS_API_KEY=your-key-here  # Optional
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Optional

# Seed database with sample data
python seed_database.py

# Start backend server
uvicorn main:app --reload
```

Backend will run on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## Testing the Interview Flow

### Step 1: Create Interview Assignment

1. Open `http://localhost:3000`
2. Navigate to "Jobs" page
3. Click on any job (e.g., "Junior Python Backend Developer")
4. See list of applications
5. Select one or more candidates (checkboxes)
6. Click "Send Links (X)" button
7. Modal opens → Click "Generate & Send All"
8. Interview links generated!

### Step 2: Start Interview

1. Copy the interview link from the response (or check console logs)
2. Format: `http://localhost:3000/#/interview/{session_id}`
3. Open link in browser
4. Allow microphone access when prompted

### Step 3: Experience the AI Interview

**INTRO Stage:**
- Interview auto-starts
- AI greets you with audio (if ElevenLabs configured)
- AI asks: "How are you today?" or "What's your name?"
- Speak your answer
- AI responds naturally

**SCREENING Stage:**
- AI asks 3-5 technical questions
- Example: "Tell me about your experience with Python"
- Answer each question by speaking
- AI adapts follow-up questions based on your answers

**TASK Stage:**
- After screening, AI says: "Great! Now I have a coding task for you..."
- "Task Locked" button → unlocks to "Get your task"
- Code editor unlocks (changes from grayed out to editable)
- Click "Get your task" to see full requirements

**CODING Stage:**
- Start writing code in the editor
- Ask AI questions: "How should I handle edge cases?"
- AI provides hints (not full solutions)
- If you stop coding for 20+ seconds → AI asks: "Need help?"

### Step 4: Test Barge-in

1. Wait for AI to start speaking
2. Start speaking while AI audio is playing
3. → AI audio immediately stops ✅
4. Your speech is transcribed
5. AI responds to your message

## API Testing (Optional)

### Manual API Calls

```bash
# 1. Start interview
curl -X POST http://localhost:8000/api/interview/{session_id}/start

# 2. Send message
curl -X POST http://localhost:8000/api/interview/{session_id}/message \
  -H "Content-Type: application/json" \
  -d '{"text": "My name is John"}'

# 3. Update code
curl -X POST http://localhost:8000/api/interview/{session_id}/code \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"hello\")", "language": "python"}'

# 4. Report idle
curl -X POST http://localhost:8000/api/interview/{session_id}/idle \
  -H "Content-Type: application/json" \
  -d '{"seconds_idle": 25}'

# 5. Get state
curl http://localhost:8000/api/interview/{session_id}/state
```

## Troubleshooting

### No audio playing?
**Issue:** AI responses appear as text but no audio plays

**Solutions:**
1. Check if `ELEVENLABS_API_KEY` is set in `backend/.env`
2. If not set, system works in text-only mode (expected)
3. To enable audio: Get API key from https://elevenlabs.io
4. Restart backend after adding key

### Speech recognition not working?
**Issue:** Microphone doesn't capture speech

**Solutions:**
1. Use Chrome or Edge browser (required for Web Speech API)
2. Check microphone permissions in browser
3. Look for microphone icon in address bar
4. Grant permission when prompted
5. Check browser console for errors

### Code editor stays locked?
**Issue:** Can't type in code editor

**Solutions:**
1. Complete the intro + screening questions first
2. Wait for AI to say "Now I have a coding task for you"
3. Check stage in conversation panel (should be "CODING")
4. Browser console → check for `can_edit_code: true`

### Task button stays locked?
**Issue:** "Task Locked" button doesn't unlock

**Solutions:**
1. Answer screening questions (3-5 questions)
2. AI must explicitly transition to coding phase
3. Look for "task unlocked" in Network tab responses
4. Check stage → must be "TASK" or "CODING"

### Backend errors?
**Issue:** Server crashes or 500 errors

**Solutions:**
1. Check MongoDB is running: `mongosh` or `mongo`
2. Verify all env vars in `.env`
3. Check Python version: `python --version` (need 3.10+)
4. Reinstall dependencies: `pip install -r requirements.txt`
5. Check logs in terminal

### Frontend build errors?
**Issue:** Vite build fails

**Solutions:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Check Node version: `node --version` (need 16+)
4. Clear Vite cache: `rm -rf node_modules/.vite`

## Feature Verification Checklist

Use this checklist to verify all features work:

- [ ] Interview auto-starts on page load
- [ ] AI greeting plays (text + audio if ElevenLabs configured)
- [ ] Speech recognition captures user voice
- [ ] Final transcript triggers AI response
- [ ] Barge-in works (user interrupts AI → audio stops)
- [ ] INTRO → SCREENING transition after 1-2 exchanges
- [ ] SCREENING → TASK transition after 3-5 questions
- [ ] Task button locked until SCREENING complete
- [ ] Code editor locked until SCREENING complete
- [ ] Task button unlocks when AI transitions
- [ ] Code editor unlocks when AI transitions
- [ ] Code changes persist to backend (check Network tab)
- [ ] Idle detection triggers after 20s of no typing
- [ ] AI nudge appears: "Need help?"
- [ ] Cooldown works (no spam within 60s)
- [ ] Conversation panel shows last 10 messages
- [ ] User messages in blue, AI in gray
- [ ] Run code button works (Python execution)
- [ ] End interview button completes session

## MongoDB Inspection

Check interview data in MongoDB:

```bash
# Connect to MongoDB
mongosh

# Switch to database
use garaza_db

# View interview sessions
db.interview_sessions.find().pretty()

# View specific session
db.interview_sessions.findOne({session_id: "your_session_id"})

# Check messages
db.interview_sessions.findOne(
  {session_id: "your_session_id"},
  {messages: 1}
)

# Check code history
db.interview_sessions.findOne(
  {session_id: "your_session_id"},
  {code_history: 1}
)
```

## Performance Tips

### Reduce audio latency:
- Use faster ElevenLabs model: `eleven_turbo_v2` (default)
- Lower audio quality if needed (in TTS service)

### Reduce LLM latency:
- Using `gpt-4o-mini` (fast + cheap)
- Consider `gpt-3.5-turbo` for even faster responses
- Adjust temperature (currently 0.7)

### Reduce network latency:
- Keep conversation history to last 10 messages (already implemented)
- Debounce code saves to 800ms (already implemented)

## Next Steps

1. **Test thoroughly** using the checklist above
2. **Add ElevenLabs key** for full voice experience
3. **Customize system prompts** in `llm_service.py` if needed
4. **Adjust screening questions** (change `screening_target` range)
5. **Implement Agent 3** for post-interview analysis

## Support

- Check `AGENT_2_IMPLEMENTATION.md` for detailed architecture
- Review `backend/API_DOCS.md` for API reference
- Inspect browser console for frontend errors
- Check backend terminal for Python errors
- MongoDB logs: Look for connection issues

---

**Happy Testing! 🎉**

If everything works, you should see:
1. ✅ AI greeting with voice
2. ✅ Natural conversation flow
3. ✅ Smooth stage transitions
4. ✅ Locked → Unlocked editor
5. ✅ Idle nudges
6. ✅ Barge-in capability
7. ✅ Full persistence in MongoDB
