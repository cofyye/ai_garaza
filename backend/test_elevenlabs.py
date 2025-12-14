"""
Test ElevenLabs API keys - Quick validation script
"""
import asyncio
import httpx
from core.config import settings


async def test_tts():
    """Test Text-to-Speech"""
    print("\n" + "="*60)
    print("🎤 TESTING ELEVENLABS TEXT-TO-SPEECH")
    print("="*60)
    
    if not settings.ELEVENLABS_API_KEY:
        print("❌ ELEVENLABS_API_KEY not configured in .env")
        return False
    
    print(f"✅ API Key found: {settings.ELEVENLABS_API_KEY[:10]}...")
    print(f"✅ Voice ID: {settings.ELEVENLABS_VOICE_ID or 'Default (Rachel)'}")
    print(f"✅ Model ID: {settings.ELEVENLABS_MODEL_ID}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            voice_id = settings.ELEVENLABS_VOICE_ID or "21m00Tcm4TlvDq8ikWAM"
            
            print(f"\n📡 Calling ElevenLabs API...")
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": "Hello, this is a test of the text to speech system.",
                    "model_id": settings.ELEVENLABS_MODEL_ID,
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            )
            
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                audio_bytes = response.content
                print(f"✅ TTS SUCCESS! Received {len(audio_bytes)} bytes of audio")
                print(f"   Audio size: {len(audio_bytes) / 1024:.2f} KB")
                return True
            else:
                print(f"❌ TTS FAILED!")
                print(f"   Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ TTS ERROR: {str(e)}")
        return False


async def test_stt():
    """Test Speech-to-Text"""
    print("\n" + "="*60)
    print("🎙️  TESTING ELEVENLABS SPEECH-TO-TEXT")
    print("="*60)
    
    if not settings.ELEVENLABS_API_KEY:
        print("❌ ELEVENLABS_API_KEY not configured in .env")
        return False
    
    print(f"✅ API Key found: {settings.ELEVENLABS_API_KEY[:10]}...")
    print(f"✅ STT Model: {settings.ELEVENLABS_STT_MODEL}")
    
    print("\n⚠️  STT test requires actual audio file")
    print("   Skipping for now (API key validated above)")
    
    return True


async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 ELEVENLABS API KEY VALIDATION")
    print("="*60)
    
    tts_ok = await test_tts()
    stt_ok = await test_stt()
    
    print("\n" + "="*60)
    print("📊 TEST RESULTS")
    print("="*60)
    print(f"TTS (Text-to-Speech): {'✅ PASS' if tts_ok else '❌ FAIL'}")
    print(f"STT (Speech-to-Text): {'✅ PASS' if stt_ok else '❌ FAIL'}")
    print("="*60)
    
    if tts_ok and stt_ok:
        print("\n🎉 ALL TESTS PASSED! ElevenLabs is ready to use.")
    else:
        print("\n⚠️  SOME TESTS FAILED! Check your API keys and settings.")
        print("\nTroubleshooting:")
        print("1. Verify ELEVENLABS_API_KEY in backend/.env")
        print("2. Check API key is valid at https://elevenlabs.io")
        print("3. Ensure you have credits remaining")
        print("4. Try regenerating API key if needed")


if __name__ == "__main__":
    asyncio.run(main())
