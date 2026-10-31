from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ChemicalDosage(BaseModel):
    chemical_name: str
    active_ingredient: str
    dosage_per_litre: str
    waiting_period_days: int
    cibrc_approved: bool = True

class AdvisoryRecord(BaseModel):
    advisory_id: str = Field(..., description="Unique stable ID e.g. ICAR-KVK-TOM-2026")
    authority: str = Field(default="ICAR / KVK")
    crop: str
    target_disease: str
    scientific_name: str
    symptoms: List[str]
    cultural_actions: List[str]
    chemical_sprays: List[ChemicalDosage]
    banned_chemicals_blacklist: List[str] = [
        "Endosulfan", "Monocrotophos", "Paraquat", "Methyl Parathion", "DDT"
    ]
    applicable_regions: List[str] = ["All India", "Uttar Pradesh", "Punjab", "Maharashtra"]
    valid_until: Optional[datetime] = None

# Curated ground truth database of ICAR & CIBRC vetted advisories
VETTED_ADVISORY_DATABASE: List[AdvisoryRecord] = [
    AdvisoryRecord(
        advisory_id="ICAR-KVK-TOM-2026",
        authority="ICAR - Indian Institute of Horticultural Research",
        crop="Tomato",
        target_disease="Early Blight of Tomato (अगेती झुलसा)",
        scientific_name="Alternaria solani",
        symptoms=[
          "Lower leaves show dark brown to black concentric rings (target-board pattern)",
          "Yellow chlorotic halo around mature lesions",
          "Premature defoliation during high humidity (>80%)"
        ],
        cultural_actions=[
          "Prune and destroy infected lower foliage immediately to prevent ground-splash dispersal.",
          "Avoid overhead sprinkler irrigation and maintain field aeration."
        ],
        chemical_sprays=[
          ChemicalDosage(
            chemical_name="Mancozeb 75% WP",
            active_ingredient="Mancozeb",
            dosage_per_litre="2.0 grams per litre of water (500g in 250L water per acre)",
            waiting_period_days=7,
            cibrc_approved=True
          )
        ]
    ),
    AdvisoryRecord(
        advisory_id="ICAR-IIWBR-WHT-2026",
        authority="ICAR - Indian Institute of Wheat and Barley Research",
        crop="Wheat",
        target_disease="Yellow / Stripe Rust of Wheat (पीला रतुआ)",
        scientific_name="Puccinia striiformis",
        symptoms=[
          "Bright yellow powdery pustules arranged in linear stripes along leaf veins",
          "Yellow spore dust rubs off easily onto fingers upon touch",
          "Cool weather (10-20°C) with morning dew accelerating infestation"
        ],
        cultural_actions=[
          "Inspect field borders and shaded rows daily.",
          "Avoid excessive nitrogen fertilizer application which promotes vegetative vulnerability."
        ],
        chemical_sprays=[
          ChemicalDosage(
            chemical_name="Propiconazole 25% EC (Tilt)",
            active_ingredient="Propiconazole",
            dosage_per_litre="1.0 ml per litre of water (200 ml in 200L water per acre)",
            waiting_period_days=14,
            cibrc_approved=True
          )
        ]
    ),
    AdvisoryRecord(
        advisory_id="ICAR-CPRI-POT-2026",
        authority="ICAR - Central Potato Research Institute",
        crop="Potato",
        target_disease="Late Blight of Potato (पछेती झुलसा)",
        scientific_name="Phytophthora infestans",
        symptoms=[
          "Water-soaked dark purplish lesions on leaf margins and tips",
          "White cottony fungal mildew visible on lower leaf surfaces under humid morning conditions"
        ],
        cultural_actions=[
          "Earthing-up tubers with 10-15 cm soil cover to prevent tuber infection.",
          "Cut and destroy infected foliage before harvest."
        ],
        chemical_sprays=[
          ChemicalDosage(
            chemical_name="Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ)",
            active_ingredient="Metalaxyl + Mancozeb",
            dosage_per_litre="2.5 grams per litre of water",
            waiting_period_days=14,
            cibrc_approved=True
          )
        ]
    )
]
