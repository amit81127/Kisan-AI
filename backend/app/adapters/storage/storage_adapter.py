import os
import uuid
import time
import logging
from typing import Dict, Any, List, Optional
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from app.core.config import settings

logger = logging.getLogger("kisanrakshak.cloudinary")

class CloudinaryStorageAdapter:
    """
    Cloudinary Media Storage Adapter (replacing Cloudflare R2 / AWS S3)
    Handles high-performance image optimization, CDN caching, and direct uploads for crop scans.
    """

    def __init__(self):
        self.cloud_name = settings.CLOUDINARY_CLOUD_NAME
        self.api_key = settings.CLOUDINARY_API_KEY
        self.api_secret = settings.CLOUDINARY_API_SECRET
        self.url = settings.CLOUDINARY_URL

        self.is_configured = False
        if self.cloud_name and self.api_key and self.api_secret:
            try:
                cloudinary.config(
                    cloud_name=self.cloud_name,
                    api_key=self.api_key,
                    api_secret=self.api_secret,
                    secure=True
                )
                self.is_configured = True
                logger.info(f"Cloudinary storage adapter initialized for cloud '{self.cloud_name}'.")
            except Exception as e:
                logger.error(f"Failed to configure Cloudinary with credentials: {e}")
        elif self.url:
            try:
                os.environ["CLOUDINARY_URL"] = self.url
                cloudinary.reset_config()
                self.is_configured = True
                logger.info("Cloudinary storage adapter initialized with CLOUDINARY_URL.")
            except Exception as e:
                logger.error(f"Failed to parse CLOUDINARY_URL: {e}")
        else:
            logger.warning("Cloudinary credentials not configured. Running in resilient local disk fallback mode.")

    def upload_file_bytes(
        self,
        file_bytes: bytes,
        filename: str = "leaf_scan.jpg",
        folder: str = "kisanrakshak/crops"
    ) -> Dict[str, Any]:
        """
        Upload raw image/audio bytes directly to Cloudinary or fallback to local disk.
        """
        if self.is_configured and len(file_bytes) > 0:
            try:
                res = cloudinary.uploader.upload(
                    file_bytes,
                    folder=folder,
                    resource_type="auto"
                )
                logger.info(f"Media successfully uploaded to Cloudinary CDN: {res.get('secure_url')}")
                return {
                    "success": True,
                    "provider": "cloudinary",
                    "file_id": res.get("public_id"),
                    "url": res.get("secure_url"),
                    "format": res.get("format"),
                    "bytes": res.get("bytes")
                }
            except Exception as e:
                logger.error(f"Cloudinary upload failed: {e}. Falling back to local disk.")

        # Local storage fallback
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = filename.split(".")[-1] if "." in filename else "jpg"
        unique_name = f"{uuid.uuid4().hex[:12]}.{ext}"
        target_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        with open(target_path, "wb") as f:
            f.write(file_bytes)

        return {
            "success": True,
            "provider": "local_fallback",
            "file_id": unique_name,
            "url": f"/uploads/{unique_name}",
            "format": ext,
            "bytes": len(file_bytes)
        }

    def generate_upload_signature(self, folder: str = "kisanrakshak/crops") -> Dict[str, Any]:
        """
        Generate Cloudinary signed upload parameters for direct client-side uploads.
        """
        timestamp = int(time.time())
        params = {
            "folder": folder,
            "timestamp": timestamp
        }
        signature = ""
        if self.is_configured and self.api_secret:
            signature = cloudinary.utils.api_sign_request(params, self.api_secret)

        return {
            "cloud_name": self.cloud_name,
            "api_key": self.api_key,
            "timestamp": timestamp,
            "signature": signature,
            "folder": folder,
            "upload_url": f"https://api.cloudinary.com/v1_1/{self.cloud_name or 'demo'}/auto/upload"
        }

storage_adapter = CloudinaryStorageAdapter()
