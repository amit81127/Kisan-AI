from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

class CropAnalysisRequest(BaseModel):
    image_key: Optional[str] = Field(None, description="Cloudinary URL / upload ID for leaf photo")
    audio_key: Optional[str] = Field(None, description="Cloudinary URL for voice audio")
    question: Optional[str] = Field(None, max_length=1000, description="Typed or spoken question")
    language: str = Field(default="hi", max_length=10)
    location: Optional[str] = Field(default="India", max_length=150)
    farmer_id: Optional[str] = Field(None)

class RecommendationItem(BaseModel):
    category: str = "cultural"  # cultural or chemical
    action: str
    dosage: Optional[str] = None
    cibrc_approved: bool = True
    waiting_period_days: Optional[int] = None
    advisory_id: str = "ICAR-KVK-2026"

class CropReport(BaseModel):
    id: str
    farmer_id: Optional[str] = None
    status: str = "completed"  # pending, transcribing, analyzing, validating, completed, failed
    
    # Core Diagnostics
    detected_issue: str = "Crop Health Diagnosis"
    crop_detected: str = "Plant"
    disease_name: str = "Condition Diagnosed"
    scientific_name: str = "Pathogen Identified"
    confidence: str = "Moderate"
    severity: str = "Medium"  # Low, Medium, High
    
    # Detailed Observations & Causes
    observations: List[str] = Field(default_factory=list)
    visible_symptoms: List[str] = Field(default_factory=list)
    possible_causes: List[str] = Field(default_factory=list)
    
    # Actionable Solutions & Prevention
    recommended_solutions: List[str] = Field(default_factory=list)
    prevention: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    when_to_seek_expert: Optional[str] = None
    
    # Structured Agricultural Prescriptions (ICAR/KVK Grounded)
    recommendations: List[RecommendationItem] = Field(default_factory=list)
    
    # Voice Summaries
    voice_response: str = ""
    voice_text: str = ""
    
    # Context
    location: str = "India"
    photo_url: Optional[str] = None
    question: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalysisIngressResponse(BaseModel):
    report_id: str
    status: str = "PENDING"
    stream_url: str
    poll_url: str
