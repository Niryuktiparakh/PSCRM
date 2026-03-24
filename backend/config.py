from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    GEMINI_API_KEY: str
    NOMIC_API_KEY: str
    GROQ_API_KEY: str
    AUTH_JWT_SECRET: str
    AUTH_JWT_ALGORITHM: str = "HS256"
    AUTH_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    SUPABASE_JWT_SECRET: Optional[str] = None
    GCS_ENABLED: bool = False
    GCS_BUCKET_NAME: Optional[str] = None
    GCS_PROJECT_ID: Optional[str] = None
    GCS_UPLOAD_PREFIX: str = "complaints"
    GCS_EMBEDDINGS_PREFIX: str = "embeddings"
    GCS_STRICT_MODE: bool = False
    GCS_SERVICE_ACCOUNT_KEY_PATH: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "serviceAccountKey.json"
    PUBSUB_ENABLED: bool = False
    PUBSUB_PUSH_SECRET: Optional[str] = None
    VERTEX_AI_LOCATION: str = "asia-south1"
    SMTP_HOST:     Optional[str] = None
    SMTP_PORT:     int           = 465
    SMTP_USER:     Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    GOOGLE_GEOCODING_API_KEY: Optional[str] = None

settings = Settings()