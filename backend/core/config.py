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
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


settings = Settings()
