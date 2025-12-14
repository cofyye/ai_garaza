"""
Core configuration using Pydantic Settings.
All environment variables are validated at startup.
"""
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    # App Config
    APP_NAME: str = "Engval.ai API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # MongoDB Config
    MONGODB_URL: str = Field(default="mongodb://localhost:27017")
    MONGODB_DB_NAME: str = Field(default="garaza_db")
    
    # CORS Config
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # AI/LLM Config (add as needed)
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    ELEVENLABS_API_KEY: str | None = None
    ELEVENLABS_VOICE_ID: str | None = None
    ELEVENLABS_MODEL_ID: str = "eleven_turbo_v2"
    ELEVENLABS_STT_MODEL: str = "scribe_v1"
    
    # CORS / Frontend Config
    FRONTEND_URL: str = "http://localhost:3000"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra env vars not defined in Settings
    )


settings = Settings()
