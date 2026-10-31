import os
import asyncio
import json
import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.api.v1.endpoints.crop_analysis import REPORT_CACHE
from app.core.config import settings
from app.core.database import db_manager
from app.adapters.weather.weather_adapter import weather_adapter
from app.adapters.speech.gnani_adapter import gnani_adapter
from app.adapters.ai.gemini_adapter import gemini_adapter
from app.domain.safety.gatekeeper import gatekeeper
from app.domain.models.crop_report import CropReport, RecommendationItem

router = APIRouter()

@router.get("/reports/{report_id}/stream")
async def stream_report_progress(report_id: str):
    async def event_generator():
        record = REPORT_CACHE.get(report_id, {})
        
        inputs = record.get("inputs", {})
        language = inputs.get("language", "hi")
        location = inputs.get("location", "Lucknow, Uttar Pradesh")
        question = inputs.get("question", "")
        image_key = inputs.get("image_key", "")

        photo_url = f"/uploads/{image_key}" if image_key and not image_key.startswith("http") and not image_key.startswith("/") else image_key

        # If already completed, stream completed event immediately
        if record.get("status") == "completed":
            yield f"event: completed\ndata: {json.dumps(record, default=str)}\n\n"
            return

        # Step 1: Voice transcription / Audio analysis
        yield f"event: progress\ndata: {json.dumps({'step': 'transcribing', 'percent': 25, 'message': 'Transcribing audio via Gnani Indic Speech...'})}\n\n"
        audio_key = inputs.get("audio_key")
        if audio_key:
            try:
                audio_bytes = None
                if audio_key.startswith("http"):
                    async with httpx.AsyncClient(timeout=6.0) as ac:
                        ares = await ac.get(audio_key)
                        if ares.status_code == 200:
                            audio_bytes = ares.content
                else:
                    local_audio = os.path.join(settings.UPLOAD_DIR, os.path.basename(audio_key))
                    if os.path.exists(local_audio):
                        with open(local_audio, "rb") as af:
                            audio_bytes = af.read()
                if audio_bytes:
                    trans_res = await gnani_adapter.transcribe_audio(audio_bytes, language=language)
                    if trans_res and trans_res.get("text"):
                        question = f"{question} {trans_res['text']}".strip()
            except Exception:
                pass
        await asyncio.sleep(0.4)

        # Step 2: Weather & KVK context sync
        yield f"event: progress\ndata: {json.dumps({'step': 'context', 'percent': 50, 'message': 'Fetching real-time local agro-weather...'})}\n\n"
        wx = await weather_adapter.get_current_and_forecast()
        await asyncio.sleep(0.4)

        # Step 3: Multimodal Vision & Symptom extraction
        yield f"event: progress\ndata: {json.dumps({'step': 'analyzing', 'percent': 75, 'message': 'Gemini analyzing leaf lesions and symptoms...'})}\n\n"
        ai_assessment = await gemini_adapter.analyze_crop_multimodal(
            image_key=image_key,
            question=question,
            weather_context=wx,
            language=language
        )
        await asyncio.sleep(0.4)

        # Step 4: 3-Tier Gatekeeper & CIBRC verification
        yield f"event: progress\ndata: {json.dumps({'step': 'validating', 'percent': 90, 'message': '3-Tier Gatekeeper verifying official CIBRC regulations...'})}\n\n"
        crop_name = ai_assessment.get("crop_detected", "Crop")
        sanitized_recommendations = gatekeeper.verify_and_sanitize_recommendations(
            ai_assessment.get("candidate_recommendations", []),
            crop_name
        )
        await asyncio.sleep(0.4)

        # Final Completed Report with full diagnostic structure
        detected_issue = ai_assessment.get("detected_issue") or ai_assessment.get("disease_name", "Crop Health Diagnosis")
        obs = ai_assessment.get("observations") or ai_assessment.get("visible_symptoms", [])
        voice_summary = ai_assessment.get("voice_response") or ai_assessment.get("voice_text", "फसल स्वास्थ्य सलाह।")

        final_report = CropReport(
            id=report_id,
            farmer_id=record.get("farmer_id"),
            status="completed",
            detected_issue=detected_issue,
            crop_detected=ai_assessment.get("crop_detected", "Plant"),
            disease_name=ai_assessment.get("disease_name") or detected_issue,
            scientific_name=ai_assessment.get("scientific_name", "Pathogen Identified"),
            confidence=ai_assessment.get("confidence", "Moderate"),
            severity=ai_assessment.get("severity", "Medium"),
            observations=obs,
            visible_symptoms=obs,
            possible_causes=ai_assessment.get("possible_causes", []),
            recommended_solutions=ai_assessment.get("recommended_solutions", []),
            prevention=ai_assessment.get("prevention", []),
            next_steps=ai_assessment.get("next_steps", []),
            when_to_seek_expert=ai_assessment.get("when_to_seek_expert"),
            recommendations=sanitized_recommendations,
            voice_response=voice_summary,
            voice_text=voice_summary,
            location=location,
            photo_url=photo_url or None,
            question=question or None
        )
        report_dict = final_report.model_dump()
        REPORT_CACHE[report_id] = report_dict

        # Asynchronously persist completed report to MongoDB Atlas
        if db_manager.db is not None:
            try:
                await db_manager.db["crop_reports"].update_one(
                    {"id": report_id},
                    {"$set": report_dict},
                    upsert=True
                )
            except Exception as e:
                pass

        # Emit completion
        yield f"event: completed\ndata: {json.dumps(report_dict, default=str)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
