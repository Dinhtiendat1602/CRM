from pathlib import Path
import os
from dotenv import load_dotenv

# Xác định đường dẫn file .env
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE)

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    class Settings(BaseSettings):
        model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

        PORT: int = int(os.getenv("PORT", "8000"))
        HOST: str = os.getenv("HOST", "0.0.0.0")
        
        # Gemini AI Config
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
        
        # Database PostgreSQL Config
        DB_HOST: str = os.getenv("DB_HOST", "localhost")
        DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
        DB_NAME: str = os.getenv("DB_NAME", "CRM")
        DB_USER: str = os.getenv("DB_USER", "postgres")
        DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
        
        # Redis / Cache Config
        REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
        REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
        REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")

        # JWT Config
        JWT_SECRET: str = os.getenv("JWT_SECRET", "zen_crm_super_secret_jwt_key_2026_at_least_32_characters_long")
        JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

        # Express Backend REST API Config
        BACKEND_API_BASE: str = os.getenv("BACKEND_API_BASE", "http://localhost:8888/api")
except ImportError:
    from pydantic import BaseModel
    class Settings(BaseModel):
        PORT: int = int(os.getenv("PORT", "8000"))
        HOST: str = os.getenv("HOST", "0.0.0.0")
        
        # Gemini AI Config
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
        
        # Database PostgreSQL Config
        DB_HOST: str = os.getenv("DB_HOST", "localhost")
        DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
        DB_NAME: str = os.getenv("DB_NAME", "CRM")
        DB_USER: str = os.getenv("DB_USER", "postgres")
        DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
        
        # Redis / Cache Config
        REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
        REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
        REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")

        # JWT Config
        JWT_SECRET: str = os.getenv("JWT_SECRET", "zen_crm_super_secret_jwt_key_2026_at_least_32_characters_long")
        JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

        # Express Backend REST API Config
        BACKEND_API_BASE: str = os.getenv("BACKEND_API_BASE", "http://localhost:8888/api")

settings = Settings()

