# 🔧 Audio Not Working - Troubleshooting Guide

## Problem: "AI se ne čuje, samo piše u ćaskanju"

### Razlog 1: Browser Autoplay Blokada ✅ FIXED

**Problem:** 
```
NotAllowedError: play() failed because the user didn't interact with the document first
```

**Rešenje:**
- ✅ Dodao sam "Start Interview" dugme
- Korisnik **mora** da klikne dugme pre nego što audio može da se reprodukuje
- Ovo je browser sigurnosna politika (Chrome, Firefox, Edge)

---

### Razlog 2: ElevenLabs API Ključ

**Provera:**
```powershell
cd backend
python test_elevenlabs.py
```

**Očekivani Output:**
```
✅ TTS SUCCESS! Received 45678 bytes of audio
```

**Ako dobiješ grešku:**
1. Proveri `backend/.env` - da li postoji `ELEVENLABS_API_KEY`
2. Proveri da li ključ važi na https://elevenlabs.io
3. Proveri da li imaš kredite (characters remaining)

---

### Razlog 3: Backend Ne Šalje Audio

**Provera Backend Logova:**

Pokreni backend i gledaj terminal za:
```
🎤 TTS Request: Converting 123 characters to speech...
✅ TTS Success: Generated 45678 bytes of audio
```

**Ako vidiš:**
```
⚠️  ElevenLabs API key not configured - TTS disabled
```
→ Dodaj API ključ u `.env`

**Ako vidiš:**
```
❌ ElevenLabs TTS failed: 401
```
→ API ključ nije validan

**Ako vidiš:**
```
❌ ElevenLabs TTS failed: 429
```
→ Rate limit (puno zahteva) ili nemaš kredite

---

### Razlog 4: Frontend Ne Prima Audio

**Provera Browser Console:**

U Developer Tools Console (F12) treba da vidiš:
```
✅ AI greeting received, playing audio...
```

**Ako vidiš:**
```
⚠️ No audio in greeting: { text: "...", audio_base64: null }
```
→ Backend nije poslao audio (vidi Razlog 3)

**Ako vidiš:**
```
Failed to play audio: NotAllowedError
```
→ Klikni "Start Interview" dugme prvo (vidi Razlog 1)

---

## 🧪 Quick Test Steps

### 1. Test ElevenLabs API
```powershell
cd C:\Users\Ilija\Desktop\GarazaAI\ai_garaza\backend
python test_elevenlabs.py
```

**Expected:** ✅ ALL TESTS PASSED!

---

### 2. Restart Backend
```powershell
cd C:\Users\Ilija\Desktop\GarazaAI\ai_garaza\backend
py -m uvicorn main:app --reload
```

**Watch for:**
```
✅ Successfully connected to MongoDB
INFO: Application startup complete.
```

---

### 3. Reload Frontend
```
http://localhost:3000/
```

**Clear cache:** Ctrl+Shift+R (hard reload)

---

### 4. Start Interview

1. Go to Applications page
2. Click "Bulk Send Interview Links"
3. Copy interview link
4. Open link in **new tab**
5. **KLIKNI "Start Interview" dugme** ← VAŽNO!
6. Dozvoli mikrofon
7. Sačekaj AI greeting

---

### 5. Check Console

Open DevTools (F12) → Console tab

**Look for:**
```
✅ AI greeting received, playing audio...
```

**And in backend terminal:**
```
🎤 TTS Request: Converting 85 characters to speech...
✅ TTS Success: Generated 45678 bytes of audio
```

---

## 🎯 Most Common Issue

**❌ Problem:** Audio ne radi jer korisnik nije kliknuo ništa

**✅ Solution:** Klikni "Start Interview" dugme koje sam dodao

---

## 🔍 Debug Mode

Dodaj ovo u browser console da vidiš šta se dešava:
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Reload page
location.reload();
```

---

## 📞 Still Not Working?

1. **Proveri .env:**
```bash
ELEVENLABS_API_KEY=sk_...
```

2. **Test API direktno:**
```bash
python test_elevenlabs.py
```

3. **Check backend logs** za bilo kakve greške

4. **Check browser console (F12)** za greške

5. **Try different browser** (Chrome recommended)

---

## ✅ Working Configuration

```bash
# backend/.env
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Optional (Rachel voice)
ELEVENLABS_MODEL_ID=eleven_turbo_v2        # Optional
ELEVENLABS_STT_MODEL=scribe_v1             # Optional
```

**Backend must show:**
```
🎤 TTS Request: Converting ...
✅ TTS Success: Generated ...
```

**Frontend must show:**
```
✅ AI greeting received, playing audio...
```

**User must:**
- Click "Start Interview" button first
- Allow microphone permissions

---

**Ako sve ovo vidiš i DALJE ne radi, screenshot-uj:**
1. Backend terminal output
2. Browser console (F12)
3. Network tab (F12 → Network → XHR)

I posalji da vidim tačno šta se dešava!
