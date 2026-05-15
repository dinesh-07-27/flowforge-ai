from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "FlowForge AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "local"
    
    # Database
    DATABASE_URL: str
    SECRET_KEY: str
    GROQ_API_KEY: str
    CELERY_BROKER_URL: str
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str
    
    # AI
    GROQ_API_KEY: str = ""
    
    # Auth
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
