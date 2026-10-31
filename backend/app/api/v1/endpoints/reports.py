import json
import logging
import httpx
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.api.v1.endpoints.crop_analysis import REPORT_CACHE
from app.core.database import db_manager
from app.core.config import settings

logger = logging.getLogger("kisanrakshak.reports")
router = APIRouter()

@router.get("/reports")
async def list_reports():
    """Fetch report history asynchronously from MongoDB Atlas with cache fallback"""
    if db_manager.db is not None:
        try:
            cursor = db_manager.db["crop_reports"].find({"status": "completed"}).sort("_id", -1)
            mongo_reports = await cursor.to_list(length=100)
            for r in mongo_reports:
                r.pop("_id", None)
            if mongo_reports:
                return {"success": True, "total": len(mongo_reports), "reports": mongo_reports}
        except Exception:
            pass

    reports_list = [r for r in REPORT_CACHE.values() if r.get("status") == "completed"]
    return {"success": True, "total": len(reports_list), "reports": reports_list}

@router.get("/reports/{report_id}")
async def get_report(report_id: str):
    """Fetch single report detail asynchronously from MongoDB Atlas"""
    if db_manager.db is not None:
        try:
            doc = await db_manager.db["crop_reports"].find_one({"id": report_id})
            if doc:
                doc.pop("_id", None)
                return {"success": True, "report": doc}
        except Exception:
            pass

    report = REPORT_CACHE.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "report": report}

@router.post("/reports/{report_id}/follow-ups")
async def ask_follow_up(report_id: str, payload: Dict[str, Any]):
    """Conversational follow-up question anchored to report evidence using Gemini AI"""
    report = None
    if db_manager.db is not None:
        try:
            report = await db_manager.db["crop_reports"].find_one({"id": report_id})
        except Exception:
            pass

    if not report:
        report = REPORT_CACHE.get(report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    question = str(payload.get("question", "")).strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    crop = report.get("crop_detected", "Crop")
    disease = report.get("disease_name", "Condition")
    voice_text = report.get("voice_text", "")

    # Live context-aware follow up using Gemini AI
    answer = "मौसम साफ होने पर और पत्तियां सूखी होने पर ही अनुशंसित मात्रा में छिड़काव करें। बारिश के दौरान छिड़काव न करें।"
    can_spray = True
    safety_note = "Always wear protective gear and maintain CIBRC waiting intervals before harvest."

    if settings.GEMINI_API_KEY:
        try:
            model = settings.GEMINI_MODEL or "gemini-3.5-flash-lite"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
            prompt = (
                f"You are an expert Indian agricultural diagnostician helping a farmer. "
                f"Diagnosed crop: {crop}. Diagnosed condition: {disease}. "
                f"Previous advisory: {voice_text}. "
                f"Farmer asks follow-up: '{question}'. "
                f"Answer the farmer's question directly, practically, and conversationally in the same language. "
                f"Return ONLY a valid JSON object with keys:\n"
                f'{{"answer": "Conversational helpful answer", "can_spray": boolean, "safety_note": "Safety advice", "voice_response": "Short natural spoken summary"}}\n'
            )
            req_body = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"}
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                g_res = await client.post(url, json=req_body)
                if g_res.status_code == 200:
                    cand = g_res.json().get("candidates", [])
                    if cand:
                        raw_text = cand[0]["content"]["parts"][0]["text"].strip()
                        if raw_text.startswith("```json"):
                            raw_text = raw_text[7:]
                        if raw_text.startswith("```"):
                            raw_text = raw_text[3:]
                        if raw_text.endswith("```"):
                            raw_text = raw_text[:-3]
                        reply_json = json.loads(raw_text.strip())
                        answer = reply_json.get("answer", answer)
                        can_spray = reply_json.get("can_spray", can_spray)
                        safety_note = reply_json.get("safety_note", safety_note)
        except Exception as e:
            logger.warning(f"Live follow-up generation failed ({e}), using safe baseline.")

    return {
        "success": True,
        "report_id": report_id,
        "question": question,
        "answer": answer,
        "voice_response": answer,
        "can_spray": can_spray,
        "safety_note": safety_note
    }
