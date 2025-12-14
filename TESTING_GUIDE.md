# 🧪 Quick Testing Guide - COPILOT FIX

## Prerequisites
```bash
# Backend .env must have:
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...  # For voice features
```

## 🚀 Start Servers

### Terminal 1: Backend
```powershell
cd backend
uvicorn main:app --reload
```

### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```

---

## ✅ Test 1: No More 500 Errors

### Get a Session ID
1. Navigate to Jobs page
2. Create/view a job
3. Go to Applications
4. Click "Bulk Send Interview Links"
5. Copy a session ID from the generated link

### Test Debug Endpoint
```powershell
# Replace YOUR_SESSION_ID with actual session_id
curl http://localhost:8000/api/interview/YOUR_SESSION_ID/debug
```

**Expected Output:**
```json
{
  "session_id": "abc123",
  "has_doc": false,
  "assignment_found": true,
  "stage": null,
  "can_edit_code": null,
  "task_unlocked": null
}
```

### Test Start Interview
```powershell
curl -X POST http://localhost:8000/api/interview/YOUR_SESSION_ID/start
```

**Expected Output:**
- ✅ **200 OK** with greeting
- ✅ **404 NOT FOUND** if session invalid (NOT 500!)

**Success Criteria:**
- No 500 errors
- Clear error messages if session missing
- AI greeting returned if valid

---

## ✅ Test 2: Voice Recording Works

### Open Interview
1. Open the interview link in Chrome/Edge
2. Grant microphone permissions
3. Interview should auto-start

### Record Audio
1. Click microphone button (should turn red/active)
2. Speak clearly: **"Hello, my name is John and I'm excited about this opportunity"**
3. Wait 700ms (auto-stop) OR click mic again
4. Open browser DevTools console

**Expected Console Output:**
```
🎤 Recording stopped, uploading audio...
✅ Transcribed: Hello, my name is John and I'm excited about this opportunity
```

**Expected UI:**
- AI responds with text
- Audio plays (if ELEVENLABS_API_KEY configured)
- Conversation appears in left panel
- No errors

**Success Criteria:**
- ✅ Recording starts/stops
- ✅ Audio uploads
- ✅ Transcript returned
- ✅ AI responds

---

## ✅ Test 3: Barge-in Works

### Test Interruption
1. Start interview (AI greeting plays)
2. **While AI is speaking**, click mic button
3. AI audio should stop immediately

**Expected Console Output:**
```
🛑 Barge-in: Stopping AI audio
🎤 Recording started
```

**Success Criteria:**
- ✅ AI stops speaking when recording starts
- ✅ No overlapping audio
- ✅ User can interrupt smoothly

---

## ✅ Test 4: Error Handling

### Test Missing API Key
```powershell
# Edit backend/.env
# Comment out: # ELEVENLABS_API_KEY=...
# Restart backend
```

**Test Recording:**
1. Record audio in interview
2. Upload completes

**Expected:**
- ⚠️ Backend logs: "⚠️  ElevenLabs API key not configured - STT disabled"
- ⚠️ Frontend alert: "Failed to process audio: No speech detected"
- ✅ System doesn't crash
- ✅ Can still continue interview

### Test Microphone Denial
1. Deny microphone permissions in browser
2. Click mic button

**Expected:**
- ⚠️ Red error box appears: "Failed to access microphone"
- ✅ System doesn't crash

**Success Criteria:**
- ✅ Clear error messages
- ✅ No 500 errors
- ✅ Graceful degradation

---

## ✅ Test 5: Full Interview Flow

### Complete Interview
1. Start interview (auto-starts)
2. Answer 2-3 intro questions via voice:
   - "Hello, my name is John"
   - "I have 5 years of Python experience"
   - "I'm interested in backend development"
3. AI transitions to SCREENING stage
4. Answer 3-5 technical questions
5. AI transitions to TASK stage
6. Task button unlocks ✅
7. Code editor unlocks ✅
8. Write code in editor
9. AI monitors idle time (20s+)
10. Receive nudge if idle

**Expected Stages:**
- INTRO → SCREENING → TASK → CODING

**Expected UI Changes:**
- Task button: Locked 🔒 → Unlocked ✅
- Code editor: Disabled → Enabled
- Conversation updates in real-time

**Success Criteria:**
- ✅ All stage transitions work
- ✅ Lock/unlock mechanics correct
- ✅ Idle detection triggers (after 20s)
- ✅ MongoDB persists all data

---

## 🔍 Debugging Commands

### Check MongoDB
```powershell
# Connect to MongoDB
mongosh

use garaza_db

# Check interview sessions
db.interview_sessions.find().pretty()

# Check assignments
db.assignments.find().pretty()

# Check specific session
db.interview_sessions.findOne({"session_id": "YOUR_SESSION_ID"})
```

### Check Backend Logs
Look for these patterns:
```
✅ - Success
⚠️  - Warning
❌ - Error
💥 - Exception
```

### Test ElevenLabs API Directly
```powershell
# Test TTS
curl -X POST https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM `
  -H "xi-api-key: YOUR_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{"text": "Hello world", "model_id": "eleven_turbo_v2"}' `
  --output test-audio.mp3

# Test STT
curl -X POST https://api.elevenlabs.io/v1/speech-to-text `
  -H "xi-api-key: YOUR_API_KEY" `
  -F "file=@test.webm" `
  -F "model_id=scribe_v1"
```

---

## 📊 Success Checklist

Run through all tests and mark:

- [ ] Debug endpoint returns JSON (not 500)
- [ ] Start interview returns 200 or 404 (not 500)
- [ ] Voice recording starts/stops
- [ ] Audio uploads successfully
- [ ] Transcript appears in console
- [ ] AI responds with text
- [ ] Audio plays (if API key configured)
- [ ] Barge-in stops AI audio
- [ ] Missing API key shows clear error (not crash)
- [ ] Microphone denial handled gracefully
- [ ] Stage transitions work (INTRO → SCREENING → TASK → CODING)
- [ ] Task button unlocks at correct time
- [ ] Code editor unlocks at correct time
- [ ] Idle detection triggers after 20s
- [ ] Conversation persists to MongoDB
- [ ] Code history persists to MongoDB

---

## 🎉 All Tests Pass?

**Congratulations!** The system is working correctly.

### Next Steps:
1. Test with real candidates
2. Monitor production logs
3. Adjust silence threshold if needed (`silenceThreshold` in `use-voice-recorder.ts`)
4. Tune idle detection timing if needed (`interview-room-page.tsx`)

### Performance Tuning:
- **Silence threshold**: Lower = more sensitive (stops sooner)
- **Silence duration**: Lower = stops sooner after silence
- **Idle timer**: Adjust 20s threshold in `interview-room-page.tsx`

---

## 🆘 Common Issues

### Issue: "No speech detected"
**Cause:** Empty transcript from STT  
**Fix:** Speak louder, closer to mic, or check API key

### Issue: Recording never stops
**Cause:** Silence threshold too low  
**Fix:** Increase `silenceThreshold` to 0.02 or 0.03

### Issue: Recording stops too early
**Cause:** Silence threshold too high  
**Fix:** Lower `silenceThreshold` to 0.005

### Issue: 500 error persists
**Cause:** MongoDB connection or data corruption  
**Fix:** Check MongoDB logs, restart MongoDB, verify connection string

---

**Last Updated**: December 13, 2025  
**Status**: All systems operational ✅
