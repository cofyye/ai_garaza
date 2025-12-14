"""
Speech-to-Text service using ElevenLabs API.
"""
import logging
from typing import Optional
import httpx
from fastapi import HTTPException
from core.config import settings


logger = logging.getLogger(__name__)


class STTService:
    """Service for speech-to-text using ElevenLabs."""
    
    def __init__(self):
        """Initialize STT service."""
        self.api_key = settings.ELEVENLABS_API_KEY
        self.model_id = settings.ELEVENLABS_STT_MODEL
        self.base_url = "https://api.elevenlabs.io/v1"
    
    async def transcribe(self, file_bytes: bytes, filename: str, mime: str) -> dict:
        """
        Transcribe audio to text using ElevenLabs Speech-to-Text.
        
        Args:
            file_bytes: Audio file bytes
            filename: Original filename
            mime: MIME type (e.g., audio/webm, audio/wav)
            
        Returns:
            dict with "text" key containing transcript
            
        Raises:
            HTTPException if transcription fails
        """
        logger.info(f"🎙️ STT Request: {len(file_bytes)} bytes, mime: {mime}, filename: {filename}")
        
        # If no API key, return empty transcript with warning
        if not self.api_key:
            logger.warning("⚠️  ElevenLabs API key not configured - STT disabled")
            return {"text": ""}
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Prepare multipart form data
                files = {
                    "file": (filename, file_bytes, mime)
                }
                data = {
                    "model_id": self.model_id
                }
                
                logger.info(f"📡 Calling ElevenLabs STT API with model: {self.model_id}")
                
                response = await client.post(
                    f"{self.base_url}/speech-to-text",
                    headers={
                        "xi-api-key": self.api_key
                    },
                    files=files,
                    data=data
                )
                
                logger.info(f"📊 STT Response status: {response.status_code}")
                
                # Check response status
                if response.status_code != 200:
                    error_detail = response.text
                    logger.error(f"❌ ElevenLabs STT API error {response.status_code}: {error_detail}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Speech-to-text failed: {error_detail}"
                    )
                
                # Parse JSON response
                result = response.json()
                logger.info(f"📝 STT Raw response: {result}")
                
                # ElevenLabs returns {"text": "..."}
                transcript_text = result.get("text", "")
                
                if not transcript_text or transcript_text.strip() == "":
                    logger.warning("⚠️ Empty transcript returned from ElevenLabs STT")
                    return {"text": ""}
                
                logger.info(f"✅ Transcribed audio: {transcript_text}")
                return {"text": transcript_text.strip()}
                
        except httpx.TimeoutException:
            logger.exception("ElevenLabs STT timeout")
            raise HTTPException(
                status_code=504,
                detail="Speech-to-text request timed out"
            )
        except httpx.HTTPError as e:
            logger.exception(f"ElevenLabs STT HTTP error: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail=f"Speech-to-text service error: {str(e)}"
            )
        except Exception as e:
            logger.exception(f"ElevenLabs STT unexpected error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Speech-to-text failed: {str(e)}"
            )
