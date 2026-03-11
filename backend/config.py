# backend/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_JWT_SECRET: str

    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str


    NOMIC_API_KEY: str
    GROQ_API_KEY: str

    GEMINI_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()