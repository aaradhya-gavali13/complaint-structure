import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App config
    APP_NAME: str = "National Citizen Grievance Portal API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database: Default SQLite; change to postgresql://user:pass@host/dbname when ready
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./grievances.db")

    # Ollama AI Classifier
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    OLLAMA_TIMEOUT_SECONDS: int = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "15"))

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
