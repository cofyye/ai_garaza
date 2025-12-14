"""
Text-to-Speech service using ElevenLabs API.
"""
import base64
from typing import Optional
import httpx
from core.config import settings


class TTSService:
    """Service for text-to-speech using ElevenLabs."""
    
    def __init__(self):
        """Initialize TTS service."""
        self.api_key = settings.ELEVENLABS_API_KEY
        self.voice_id = settings.ELEVENLABS_VOICE_ID
        self.model_id = settings.ELEVENLABS_MODEL_ID
        self.base_url = "https://api.elevenlabs.io/v1"
    
    async def text_to_speech(self, text: str) -> Optional[dict]:
        """
        Convert text to speech using ElevenLabs.
        
        Returns:
            dict with audio_base64 and audio_mime, or None if TTS unavailable
        """
        # If no API key, return None (graceful fallback)
        if not self.api_key:
            print("⚠️  ElevenLabs API key not configured - TTS disabled")
            return None
        
        print(f"🎤 TTS Request: Converting {len(text)} characters to speech...")
        
        # Use default voice if not configured
        voice_id = self.voice_id or "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/text-to-speech/{voice_id}",
                    headers={
                        "xi-api-key": self.api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "text": text,
                        "model_id": self.model_id,
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.75
                        }
                    }
                )
                
                if response.status_code == 200:
                    # Convert audio bytes to base64
                    audio_bytes = response.content
                    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                    
                    print(f"✅ TTS Success: Generated {len(audio_bytes)} bytes of audio")
                    
                    return {
                        "audio_base64": audio_base64,
                        "audio_mime": "audio/mpeg"
                    }
                else:
                    print(f"❌ ElevenLabs TTS failed: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            print(f"❌ ElevenLabs TTS error: {str(e)}")
            return None
