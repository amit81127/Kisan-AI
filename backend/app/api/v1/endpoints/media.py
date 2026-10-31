import io
import os
import logging
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.core.config import settings
from app.adapters.storage.storage_adapter import storage_adapter

logger = logging.getLogger("kisanrakshak.media")
router = APIRouter()

# Ensure local fallback directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024  # 12 MB
ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_AUDIO_EXTS = {".wav", ".webm", ".mp3", ".ogg", ".m4a"}

class MediaSignatureRequest(BaseModel):
    folder: Optional[str] = "kisanrakshak/crops"

@router.post("/signature")
async def get_cloudinary_signature(payload: Optional[MediaSignatureRequest] = None):
    """
    Generate signed upload credentials for direct client-to-Cloudinary uploads.
    """
    folder = payload.folder if payload and payload.folder else "kisanrakshak/crops"
    sig = storage_adapter.generate_upload_signature(folder=folder)
    return {"success": True, "cloudinary": sig}

@router.post("/presign")
async def generate_presign_urls(payload: Dict[str, Any]):
    """
    Maintains backward compatibility while serving Cloudinary signatures.
    """
    sig = storage_adapter.generate_upload_signature()
    return {"success": True, "uploads": [sig]}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Direct multipart media upload for leaf photos and voice recordings.
    Enforces format validation (JPG, JPEG, PNG, WEBP), file size checks, and corrupt file detection.
    Pushes to Cloudinary CDN with fallback to local static storage.
    """
    try:
        filename = (file.filename or "upload.jpg").strip()
        ext = os.path.splitext(filename)[1].lower()

        # 1. Extension validation
        if ext not in ALLOWED_IMAGE_EXTS and ext not in ALLOWED_AUDIO_EXTS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed image formats are: JPG, JPEG, PNG, WEBP."
            )

        # 2. File size validation
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum limit of 12MB (received {len(file_bytes) / (1024*1024):.1f}MB)."
            )

        # 3. For images, verify image integrity using Pillow
        if ext in ALLOWED_IMAGE_EXTS:
            try:
                with Image.open(io.BytesIO(file_bytes)) as img:
                    img.verify()
            except Exception as img_err:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid or corrupted image file: {str(img_err)}"
                )

        # 4. Upload to Cloudinary / storage
        res = storage_adapter.upload_file_bytes(
            file_bytes=file_bytes,
            filename=filename,
            folder="kisanrakshak/crops"
        )

        return {
            "success": True,
            "filename": filename,
            "file_id": res.get("file_id"),
            "url": res.get("url"),
            "provider": res.get("provider"),
            "content_type": file.content_type,
            "bytes": len(file_bytes)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Media upload processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
