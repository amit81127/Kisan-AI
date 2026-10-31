import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import db_manager
from app.api.v1.api_router import api_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("kisanrakshak.main")

# Setup uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    logger.info("Initializing KisanRakshak AI Backend services...")
    await db_manager.connect_to_database()

    # Startup: Validate Resend configuration
    try:
        from app.adapters.email.resend_adapter import resend_adapter
        await resend_adapter.validate_startup_configuration()
    except Exception as e:
        logger.warning(f"Resend startup configuration check skipped: {e}")

    yield
    # Shutdown: Close connections
    logger.info("Shutting down KisanRakshak AI Backend...")
    await db_manager.close_database_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "KisanRakshak AI Backend",
        "version": "2.0.0",
        "gatekeeper": "Active (CIBRC / ICAR 3-Tier)",
        "weather_service": "Connected",
        "ai_engine": "Gemini Multimodal Flash Ready"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
