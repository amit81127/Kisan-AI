import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KisanRakshak AI Backend"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # CORS Allow Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "*"
    ]

    # JWT Authentication
    SECRET_KEY: str = "kisanrakshak-super-secret-jwt-key-2026-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days for farmers

    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    DATABASE_NAME: str = "kisanrakshak"

    # Resend Email Service for Verification & OTP (Custom Domain: kisanai.com)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    RESEND_FROM_EMAIL: str = os.getenv("RESEND_FROM_EMAIL", "KisanRakshak AI <no-reply@kisanai.com>")

    # SMTP Configuration (Optional alternative to Resend to deliver to any recipient)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")

    # AI & Speech Services
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    GNANI_API_KEY: str = os.getenv("GNANI_API_KEY", "")
    GNANI_ASR_ENDPOINT: str = "https://asr.gnani.ai/v1/recognize"
    GNANI_TTS_ENDPOINT: str = "https://tts.gnani.ai/v1/synthesize"

    # Cloudinary Media Storage (https://cloudinary.com)
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    CLOUDINARY_URL: str = os.getenv("CLOUDINARY_URL", "")
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

    # Weather
    WEATHER_API_URL: str = "https://api.open-meteo.com/v1/forecast"

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
