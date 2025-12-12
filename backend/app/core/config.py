from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "AI Garaza API"

    class Config:
        env_file = ".env"


settings = Settings()
