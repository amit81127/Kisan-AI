from fastapi import APIRouter
from app.api.v1.endpoints import auth, media, crop_analysis, sse_stream, reports, weather

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(media.router, prefix="/media", tags=["Media Storage"])
api_router.include_router(crop_analysis.router, prefix="/crop", tags=["Crop Analysis"])
api_router.include_router(sse_stream.router, tags=["Live SSE Progress"])
api_router.include_router(reports.router, tags=["Reports & History"])
api_router.include_router(weather.router, tags=["Weather Telemetry"])
