import uuid
from fastapi import APIRouter, status, HTTPException
from app.domain.models.crop_report import CropAnalysisRequest, AnalysisIngressResponse
from app.core.database import get_database

router = APIRouter()

# Global memory cache for reports (synced with MongoDB if active)
REPORT_CACHE = {}

@router.post("/analyze", response_model=AnalysisIngressResponse, status_code=status.HTTP_202_ACCEPTED)
async def analyze_crop(payload: CropAnalysisRequest):
    # Verify at least one input is provided
    if not payload.image_key and not payload.audio_key and not (payload.question and payload.question.strip()):
        raise HTTPException(
            status_code=400,
            detail="At least one input (leaf photo, voice recording, or typed question) must be provided."
        )

    report_id = f"KR-{uuid.uuid4().hex[:6].upper()}"
    
    # Store initial pending state
    initial_record = {
        "id": report_id,
        "status": "PENDING",
        "farmer_id": payload.farmer_id or "farmer_guest",
        "inputs": payload.model_dump(),
        "created_at": None
    }
    REPORT_CACHE[report_id] = initial_record

    return AnalysisIngressResponse(
        report_id=report_id,
        status="PENDING",
        stream_url=f"/api/v1/reports/{report_id}/stream",
        poll_url=f"/api/v1/reports/{report_id}"
    )
