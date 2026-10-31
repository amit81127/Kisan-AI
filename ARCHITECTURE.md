# KisanRakshak AI — 10/10 Production Architecture Specification
## Next.js (App Router PWA) + FastAPI (AsyncIO & Pydantic v2)

> **Document Version:** 3.0.0 (Definitive Production Architecture)  
> **Primary Tech Stack:**  
> • **Frontend:** Next.js 15+ (App Router, TypeScript, React 19, Tailwind CSS, Shadcn UI, Serwist PWA, Web Workers, IndexedDB)  
> • **Backend:** FastAPI (Python 3.11+, AsyncIO, Pydantic v2, Motor / Beanie ODM, Redis + ARQ Task Worker, aioboto3)  
> • **Database:** MongoDB Atlas (Geospatial `2dsphere` indexes, GeoJSON, immutable audit schemas)  
> • **Storage:** Cloudinary Media Storage (Automatic WebP compression, global CDN, signed direct uploads)  
> • **External Services:** Google Gemini 1.5/2.0 Flash (Multimodal Vision/Text), Gnani.ai (Indic Speech STT & TTS), Open-Meteo / IMD (Agro-Weather)

---

## 1. System Topology & Hexagonal Component Architecture

```mermaid
flowchart TB
    subgraph CLIENT[Frontend Tier: Next.js 15 App Router PWA]
      direction TB
      PAGE_SCAN["/scan (Multimodal Capture: Photo / Voice / Text)"]
      PAGE_REPORT["/reports/[id] (Interactive Diagnosis & Audio Playback)"]
      PAGE_RADAR["/radar (Proactive Disease & Pest Risk Radar)"]
      PAGE_FARM["/farm (Geo-Profile & Crop Sowing Stages)"]
      
      subgraph CLIENT_EDGE[Client Edge Processing]
        WW[Image Compression Web Worker - 1600px WebP]
        AW[AudioWorklet - 16kHz 16-bit Mono PCM WAV]
        IDB[(IndexedDB Offline Outbox - Serwist / Workbox)]
      end

      PAGE_SCAN <--> WW
      PAGE_SCAN <--> AW
      PAGE_SCAN <--> IDB
    end

    subgraph INGRESS[Edge Gateway & Media Storage]
      CDN[Cloudflare Edge CDN]
      R2[(Private Object Storage - Cloudflare R2 / S3)]
    end

    subgraph BACKEND[Backend Tier: FastAPI Modular Monolith]
      direction TB

      subgraph API_ROUTER[FastAPI HTTP & Streaming Ingress]
        AUTH_ROUTER["/api/v1/auth"]
        MEDIA_ROUTER["/api/v1/media/presign"]
        ANALYSIS_ROUTER["/api/v1/crop/analyze (202 Accepted)"]
        SSE_ROUTER["/api/v1/reports/{id}/stream (SSE)"]
        REPORT_ROUTER["/api/v1/reports"]
        RADAR_ROUTER["/api/v1/risks"]
      end

      subgraph DOMAIN_CORE[Pure Python Domain Core - Zero 3rd Party Bindings]
        GATEKEEPER[3-Tier Deterministic Safety Gatekeeper]
        EVIDENCE_ENGINE[Visible Observation & Cause Evaluator]
        RISK_EVALUATOR[Forecast & Crop-Stage Risk Evaluator]
        CIBRC_RULES[CIBRC Pesticide & Dosage Compliance Matrix]
      end

      subgraph WORKERS[Async Queue & Worker Subsystem - ARQ / Redis]
        JOB_ORCH[Pipeline Orchestrator State Machine]
        REDIS[(Redis 7 - State & Event Pub/Sub)]
      end

      subgraph ADAPTERS[Hexagonal Infrastructure Adapters]
        ADAPT_GEMINI[GeminiAdapter - google-genai SDK]
        ADAPT_GNANI[GnaniSpeechAdapter - aiohttp Streaming STT/TTS]
        ADAPT_WX[WeatherAdapter - Agro-Meteo / IMD]
        ADAPT_S3[StorageAdapter - aioboto3 Presigning]
        ADAPT_MONGO[MongoRepositoryAdapter - Motor / Beanie]
      end
    end

    subgraph PERSISTENCE[Persistence & Advisory Ground Truth]
      MONGO[(MongoDB Atlas - 2dsphere GeoJSON)]
      KB[(Curated ICAR / KVK Advisory Knowledge Base)]
    end

    %% Edge Connections
    CLIENT -->|1. Direct Upload via Presigned URL| R2
    CLIENT -->|2. REST Requests & Auth| CDN --> API_ROUTER
    CLIENT <-.-|3. Server-Sent Events SSE Stream| SSE_ROUTER

    %% Backend Internals
    API_ROUTER --> MEDIA_ROUTER --> ADAPT_S3
    API_ROUTER --> ANALYSIS_ROUTER --> JOB_ORCH
    JOB_ORCH <--> REDIS
    JOB_ORCH --> ADAPT_GNANI
    JOB_ORCH --> ADAPT_WX
    JOB_ORCH --> ADAPT_GEMINI
    JOB_ORCH --> DOMAIN_CORE
    DOMAIN_CORE --> GATEKEEPER
    GATEKEEPER <--> CIBRC_RULES
    GATEKEEPER <--> KB
    ADAPT_MONGO <--> MONGO
```

---

## 2. Directory Structure: Next.js + FastAPI

### 2.1 Frontend Structure (`/frontend` - Next.js App Router)
```text
frontend/
├── public/
│   ├── icons/
│   ├── audio-worklet-processor.js      # 16kHz Mono PCM Recorder Worklet
│   └── sw.js                           # Serwist PWA Service Worker
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── scan/page.tsx           # Primary Multimodal Capture screen
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx            # Report History
│   │   │   │   └── [id]/page.tsx       # Live Diagnosis & Audio Player
│   │   │   ├── radar/page.tsx          # Proactive Risk Radar
│   │   │   └── farm/page.tsx           # Farm Geo-Profile & Sowing Date
│   │   ├── api/health/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx                    # Landing / Language Selection
│   ├── components/
│   │   ├── ui/                         # Shadcn accessible primitives
│   │   ├── camera/
│   │   │   ├── CameraCapture.tsx       # Camera with real-time blur/darkness detection
│   │   │   └── ImagePreview.tsx
│   │   ├── voice/
│   │   │   ├── VoiceRecorder.tsx       # Hold-to-speak or Tap-to-record with wave visualizer
│   │   │   └── AudioPlayer.tsx         # Gnani TTS audio playback with pause/speed
│   │   ├── scanner/
│   │   │   ├── AnalysisProgress.tsx    # Real-time SSE progress pill
│   │   │   └── OfflineOutboxBanner.tsx
│   │   └── report/
│   │   │   ├── ObservationCard.tsx     # Evidence-backed visual symptoms
│   │   │   ├── CausesAccordion.tsx     # Possible causes with confidence levels
│   │   │   └── SourcedActionCard.tsx   # Verified recommendations with KVK source badge
│   ├── workers/
│   │   └── image-compressor.worker.ts  # OffscreenCanvas bicubic downsampling (WebP)
│   ├── lib/
│   │   ├── api-client.ts               # Fetch client with token refresh & retry
│   │   ├── sse-client.ts               # EventSource wrapper with auto-reconnect
│   │   ├── outbox-db.ts                # IndexedDB persistence (idb-keyval)
│   │   └── sound-recorder.ts           # AudioContext & AudioWorklet interface
│   ├── hooks/
│   │   ├── useCamera.ts
│   │   ├── useVoiceRecorder.ts
│   │   ├── useSSEAnalysis.ts           # Hook binding SSE events to UI state
│   │   └── useOfflineSync.ts           # Hook triggering outbox sync on network ping
│   └── types/
│       ├── crop-analysis.ts
│       └── report.ts
├── next.config.mjs
└── package.json
```

### 2.2 Backend Structure (`/backend` - FastAPI Hexagonal)
```text
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py             # Phone OTP / JWT login
│   │   │   │   ├── media.py            # S3 / R2 presigned URL generation
│   │   │   │   ├── crop_analysis.py    # POST /analyze (202 Accepted)
│   │   │   │   ├── sse_stream.py       # GET /reports/{id}/stream (SSE)
│   │   │   │   ├── reports.py          # GET /reports, Follow-ups
│   │   │   │   ├── voice.py            # Standalone STT / TTS endpoints
│   │   │   │   ├── weather.py          # Farm weather & 7-day agro-forecast
│   │   │   │   ├── farms.py            # Farm profile & crop stages
│   │   │   │   └── risks.py            # Risk Radar query & acknowledge
│   │   │   └── api_router.py
│   ├── core/
│   │   ├── config.py                   # Pydantic Settings (.env validation)
│   │   ├── security.py                 # JWT encode/decode, token scopes
│   │   ├── database.py                 # Motor / AsyncIOMotorClient setup
│   │   └── redis.py                    # Redis connection pool & pub/sub
│   ├── domain/                         # Pure Business Logic (No external frameworks)
│   │   ├── entities/
│   │   │   ├── assessment.py           # CropObservation, CandidateCause, Treatment
│   │   │   ├── advisory.py             # VettedAdvisory, OfficialCitation
│   │   │   └── risk.py                 # WeatherRiskRule, RiskAlert
│   │   └── safety/
│   │       ├── gatekeeper.py           # 3-Tier Gatekeeper Orchestrator
│   │       ├── cibrc_validator.py      # Banned pesticides, dosages, safety notes
│   │       └── advisory_matcher.py     # Deterministic ID verifier
│   ├── ports/                          # Abstract Interface Contracts
│   │   ├── speech_provider.py          # ISpeechToTextProvider, ITextToSpeechProvider
│   │   ├── ai_model_provider.py        # IVisionLanguageModelProvider
│   │   ├── weather_provider.py         # IWeatherProvider
│   │   ├── storage_provider.py         # IObjectStorageProvider
│   │   └── repository.py               # IReportRepository, IAdvisoryRepository
│   ├── adapters/                       # Swappable Concrete Implementations
│   │   ├── speech/
│   │   │   └── gnani_adapter.py        # Gnani Indic STT & TTS client
│   │   ├── ai/
│   │   │   └── gemini_adapter.py       # Google Gemini Flash multimodal client
│   │   ├── weather/
│   │   │   └── meteo_adapter.py        # Open-Meteo & IMD client
│   │   ├── storage/
│   │   │   └── s3_adapter.py           # aioboto3 Presigning & S3 operations
│   │   └── repository/
│   │       ├── mongo_report_repo.py    # Motor implementation for CropReports
│   │       └── mongo_advisory_repo.py  # Motor implementation for Advisories
│   ├── workers/                        # Asynchronous Pipeline Workers (ARQ / Redis)
│   │   ├── tasks.py                    # execute_crop_analysis_pipeline job
│   │   ├── cron_radar.py               # Nightly agro-weather risk recalculation
│   │   └── worker_settings.py
│   ├── schemas/                        # Pydantic v2 Ingress/Egress & Event Schemas
│   │   ├── media.py
│   │   ├── analysis_request.py
│   │   ├── sse_events.py
│   │   ├── report_response.py
│   │   └── gemini_contracts.py         # Strict JSON schemas passed to Gemini
│   └── main.py                         # FastAPI App, CORS, Lifespan handler
├── tests/
├── pyproject.toml
└── Dockerfile
```

---

## 3. Complete Architectural Flows (12 Comprehensive Flows)

---

### Flow 1: Authentication & Farm Profile Onboarding (FastAPI + MongoDB 2dsphere)
A farmer logs in with their phone number via a rapid 4-digit OTP, stores their language preference, and geo-tags their farm boundaries or village centroid.

```mermaid
sequenceDiagram
    actor Farmer
    participant UI as Next.js Client
    participant API as FastAPI (/auth & /farms)
    participant DB as MongoDB Atlas

    Farmer->>UI: Enters Mobile Number (e.g., +91 98765 43210)
    UI->>API: POST /api/v1/auth/request-otp
    API-->>UI: 200 OK (OTP Sent via SMS Provider)
    Farmer->>UI: Enters 4-digit OTP
    UI->>API: POST /api/v1/auth/verify-otp
    API->>DB: Find or create farmer record; generate JWT access token
    API-->>UI: 200 OK { token, farmer: { id, preferredLanguage: "hi" } }
    
    opt Farm Onboarding / Location Setup
      Farmer->>UI: Selects "Use My GPS Location" or selects State/District
      UI->>API: POST /api/v1/farms { location: { type: "Point", coordinates: [80.94, 26.84] }, crop: "Tomato", sowingDate: "2026-09-15" }
      API->>DB: Insert into `farms` collection with 2dsphere index
      DB-->>API: farmId
      API-->>UI: 201 Created { farmId }
    end
```

---

### Flow 2: Offline Outbox Capture & Auto-Sync Flow (Client Edge)
When a farmer is deep in the fields with zero mobile network, they can capture photos and record audio without error.

```mermaid
flowchart TD
    START[Farmer captures photo & records audio in field] --> CHECK{navigator.onLine?}
    
    CHECK -->|Yes: Online| UPLOAD[Proceed to Flow 3: Presigned Direct Upload]
    
    CHECK -->|No: Offline| STORE[Save to IndexedDB Outbox table: id, blob_img, blob_audio, timestamp, metadata]
    STORE --> OPTIMISTIC[UI renders: 'Saved in Local Outbox. Will auto-analyze when signal returns.']
    
    OPTIMISTIC --> LISTENER[Listen to 'online' event & Workbox BackgroundSync registration]
    LISTENER --> NET_RESTORE[Network Connectivity Restored]
    NET_RESTORE --> DEQUEUE[Read items from IndexedDB Outbox FIFO]
    DEQUEUE --> UPLOAD
```

---

### Flow 3: Direct Presigned Media Upload Flow (Cloudflare R2 / AWS S3)
Raw heavy media **never passes through the FastAPI server process**. The browser compresses the image, requests short-lived presigned URLs, and uploads directly to Object Storage.

```mermaid
sequenceDiagram
    actor Farmer
    participant Worker as Web Worker (Next.js)
    participant UI as Next.js UI
    participant API as FastAPI (/media/presign)
    participant S3 as Object Storage (S3 / R2)

    Farmer->>UI: Takes 48MP photo (15MB) & records audio
    UI->>Worker: Offload raw image buffer
    Worker->>Worker: Canvas bicubic resize (1600px max edge, WebP q=0.82) -> 320KB
    Worker-->>UI: Compressed WebP Blob

    UI->>API: POST /api/v1/media/presign { files: [{ type: "image", ext: "webp" }, { type: "audio", ext: "wav" }] }
    API->>API: aioboto3 generate_presigned_url(ClientMethod='put_object', ExpiresIn=300)
    API-->>UI: 200 OK { uploads: [{ key: "img_uuid.webp", url: "https://r2.../img" }, { key: "aud_uuid.wav", url: "https://r2.../aud" }] }

    par Direct S3 Image Upload
      UI->>S3: PUT binary compressed image (320KB)
      S3-->>UI: 200 OK (ETag)
    and Direct S3 Audio Upload
      UI->>S3: PUT binary 16kHz PCM WAV (96KB)
      S3-->>UI: 200 OK (ETag)
    end
    UI->>UI: All media uploaded successfully in < 1.2s total
```

---

### Flow 4: Crop Analysis Ingestion & Asynchronous Pipeline Flow
The core request lifecycle. FastAPI issues an immediate `202 Accepted` and offloads the heavy orchestration to an asynchronous worker task over Redis.

```mermaid
sequenceDiagram
    actor Farmer
    participant UI as Next.js PWA
    participant API as FastAPI Endpoint
    participant Redis as Redis Queue / ARQ
    participant Worker as Pipeline Async Worker
    participant DB as MongoDB Atlas

    UI->>API: POST /api/v1/crop/analyze { imageKey, audioKey, question, crop, language, farmId }
    API->>API: Validate payload using Pydantic v2 (AnalysisRequestSchema)
    API->>DB: Insert initial ICropReport { status: "PENDING", farmerId, inputs, createdAt }
    DB-->>API: reportId
    API->>Redis: Enqueue job: `execute_crop_analysis_pipeline(reportId)`
    API-->>UI: 202 Accepted { reportId, status: "PENDING", streamUrl: "/api/v1/reports/{reportId}/stream" }

    UI->>API: Connect to SSE stream: GET /api/v1/reports/{reportId}/stream
    Worker->>Redis: Pop job `execute_crop_analysis_pipeline`
    Worker->>Worker: Execute Flows 5, 6, 7, 8 in parallel & sequence
    Worker->>Redis: Publish progress step events to Redis channel `report_events:{reportId}`
    API-->>UI: Relay SSE progress events in real-time
```

---

### Flow 5: Gnani Speech-to-Text & Transcoding Fallback Flow
Handles regional Indic dialects (Hindi, Marathi, Telugu, Tamil, Kannada) and guarantees clean 16kHz audio input to Gnani STT.

```mermaid
flowchart TD
    START[Audio Key provided in Analysis Job] --> FETCH[Worker streams audio bytes from S3/R2]
    FETCH --> CHECK_FMT{Audio format 16kHz PCM WAV?}
    
    CHECK_FMT -->|Yes: From AudioWorklet| DIRECT[Stream directly to Gnani STT API]
    
    CHECK_FMT -->|No: WebM/Opus fallback| TRANSCODE[In-memory ffmpeg stream pipe: ffmpeg -i pipe:0 -ar 16000 -ac 1 -f wav pipe:1]
    TRANSCODE --> DIRECT

    DIRECT --> CALL_GNANI[aiohttp POST to Gnani Indic ASR Endpoint]
    CALL_GNANI --> TIMEOUT{Responded within 4,000ms?}
    
    TIMEOUT -->|Yes: Success| TRANSCRIPT[Extract text, language & confidence score]
    TRANSCRIPT --> EMIT[Emit SSE: 'STT_COMPLETED' with extracted Hindi/Regional text]
    
    TIMEOUT -->|No: Timeout / Error| FALLBACK[Degrade gracefully: log warning, proceed with typed question or image only]
    FALLBACK --> EMIT_WARN[Emit SSE: 'STT_SKIPPED' - 'Audio could not be transcribed, proceeding with image.']
```

---

### Flow 6: Weather & Geospatial Advisory Retrieval Flow
Queries real-time meteorological conditions for the farm coordinates and pulls officially vetted advisories from MongoDB.

```mermaid
sequenceDiagram
    participant Worker as Pipeline Async Worker
    participant WX as Weather Adapter (Open-Meteo / IMD)
    participant DB as MongoDB Atlas (advisories & farms)

    par Fetch Real Weather
      Worker->>WX: GET forecast & current weather (lat, lon) [Timeout: 2500ms]
      WX-->>Worker: { tempC: 29.4, humidity: 82%, rainfallLast48h: 18mm, forecastRain: true }
    and Fetch Applicable Advisories
      Worker->>DB: Query `advisories` collection matching { crop: "Tomato", region: "Uttar Pradesh", validUntil: { $gte: now } }
      DB-->>Worker: List of vetted official advisory documents (ICAR / KVK records)
    end

    Worker->>Worker: Snapshot weather & applicable advisory IDs into report context
    Worker->>Worker: Emit SSE Event: 'CONTEXT_LOADED'
```

---

### Flow 7: Gemini Multimodal Vision & Inference Flow
Passes the compressed crop photo, farmer's transcript/question, weather facts, and official advisory excerpts to Gemini with strict schema enforcement.

```mermaid
sequenceDiagram
    participant Worker as Pipeline Async Worker
    participant S3 as Object Storage (S3 / R2)
    participant Gemini as Google Gemini 1.5/2.0 Flash (google-genai SDK)

    Worker->>S3: Read compressed WebP image bytes
    S3-->>Worker: image_bytes
    
    Worker->>Worker: Build System Instruction & Multimodal Payload:<br/>1. Role: Agricultural diagnostician<br/>2. Structured JSON response schema<br/>3. Strict instruction: ONLY reference provided advisory IDs
    
    Worker->>Gemini: client.aio.models.generate_content(<br/>model='gemini-1.5-flash',<br/>contents=[image_part, prompt_text],<br/>config={'response_mime_type': 'application/json', 'response_schema': GeminiCandidateAssessmentSchema}<br/>)
    
    Gemini-->>Worker: Structured Candidate JSON:<br/>{ observations: [...], possibleCauses: [...], candidateRecommendations: [...] }
    Worker->>Worker: Emit SSE Event: 'AI_INFERENCE_DONE'
```

---

### Flow 8: Deterministic 3-Tier Safety Gatekeeper & CIBRC Compliance Flow
The zero-tolerance safety barrier. **No unverified chemical advice ever reaches the database or farmer.**

```mermaid
flowchart TD
    RAW[Raw Gemini Candidate JSON] --> TIER1{Tier 1: Pydantic v2 Schema Validation}
    
    TIER1 -->|Schema Error / Malformed| RETRY[Retry Gemini once with bounded schema repair]
    RETRY -->|Fails again| SAFE_FAIL[Drop recommendations. Return observation-only report + KVK contact]

    TIER1 -->|Valid Schema| TIER2{Tier 2: Advisory ID Grounding}
    TIER2 --> VERIFY_ID[Loop through candidateRecommendations: Does recommendation.advisoryId exist in MongoDB vetted table?]
    
    VERIFY_ID -->|ID Not Found / Invented by LLM| STRIP[PURGE recommendation item completely]
    VERIFY_ID -->|ID Found & Verified| TIER3{Tier 3: CIBRC Chemical & Dosage Guard}

    TIER3 --> CHK_BANNED{Is active chemical on CIBRC Banned List?}
    CHK_BANNED -->|Yes: E.g., Endosulfan / Monocrotophos| BLOCK[Purge chemical. Insert warning: 'Chemical is banned under Indian regulations. Use recommended biological alternative.']
    
    CHK_BANNED -->|No: Registered Substance| CHK_DOSAGE{Is dosage <= label safety limit?}
    CHK_DOSAGE -->|Exceeds Label Limit| CLAMP[Clamp to official recommended dosage per litre & add safety warning]
    CHK_DOSAGE -->|Within Bounds| PASS[Pass recommendation verified]

    PASS --> ASSEMBLE[Assemble Final Audited Report]
    STRIP --> ASSEMBLE
    BLOCK --> ASSEMBLE
    CLAMP --> ASSEMBLE
```

---

### Flow 9: Server-Sent Events (SSE) Real-Time Progress Streaming Flow
Provides continuous, transparent feedback to the farmer on mobile screens over flaky connections.

```mermaid
sequenceDiagram
    actor Farmer
    participant UI as Next.js SSE Client (`useSSEAnalysis`)
    participant API as FastAPI SSE Endpoint (`/stream`)
    participant Redis as Redis Pub/Sub

    UI->>API: GET /api/v1/reports/{id}/stream (Accept: text/event-stream)
    API->>Redis: SUBSCRIBE `report_events:{id}`
    API-->>UI: HTTP 200 OK (headers: Cache-Control: no-cache, Connection: keep-alive)

    Redis-->>API: Message: {"step": "TRANSCRIBING", "message": "आवाज़ को टेक्स्ट में बदला जा रहा है..."}
    API-->>UI: event: progress\ndata: {"step": "TRANSCRIBING", "percent": 25}\n\n

    Redis-->>API: Message: {"step": "CONTEXT", "message": "मौसम और मिट्टी की नमी जांची जा रही है..."}
    API-->>UI: event: progress\ndata: {"step": "CONTEXT", "percent": 50}\n\n

    Redis-->>API: Message: {"step": "ANALYZING", "message": "फसल के पत्तों का विश्लेषण जारी है..."}
    API-->>UI: event: progress\ndata: {"step": "ANALYZING", "percent": 75}\n\n

    Redis-->>API: Message: {"step": "COMPLETED", "reportId": "..."}
    API-->>UI: event: completed\ndata: {"reportId": "...", "reportUrl": "/reports/..."}\n\n

    UI->>UI: Close EventSource; Transition smoothly to Report Detail Page
```

---

### Flow 10: Farmer Follow-Up Question & Chat Context Memory Flow
Farmers can ask conversational follow-up questions (e.g., *"Can I spray neem oil tomorrow morning if it rains?"*) anchored to the original report's evidence snapshot.

```mermaid
sequenceDiagram
    actor Farmer
    participant UI as Next.js Report Page
    participant API as FastAPI Endpoint (/reports/{id}/follow-ups)
    participant Guard as 3-Tier Safety Gatekeeper
    participant Gemini as Gemini Model
    participant DB as MongoDB Atlas

    Farmer->>UI: Types or speaks: "कल बारिश होगी, क्या मैं अभी छिड़काव कर सकता हूँ?"
    UI->>API: POST /api/v1/reports/{reportId}/follow-ups { questionText: "...", audioKey?: "..." }
    
    API->>DB: Fetch original ICropReport (includes immutable weather & diagnosis snapshots)
    DB-->>API: originalReport
    
    API->>Gemini: Generate follow-up answer using Context: (Original symptoms + Weather forecast + Farmer's follow-up)
    Gemini-->>API: Structured response: "बारिश के 24 घंटे पहले छिड़काव न करें..."
    
    API->>Guard: Validate response against safety & weather spray rules
    Guard-->>API: Sanitized follow-up response
    
    API->>DB: Append to `cropReports.followUps` array
    API-->>UI: 200 OK { answer: "...", canSpray: false, reason: "Rain forecast within 12 hours will wash away spray" }
```

---

### Flow 11: Text-to-Speech (TTS) Audio Generation Flow (Gnani Indic TTS)
To empower farmers who prefer listening over reading, validated advice is converted into natural Indic speech with caching.

```mermaid
flowchart TD
    START[Farmer clicks 'Listen to Advice' button] --> CHECK_CACHE{TTS Audio Key exists in Report document?}
    
    CHECK_CACHE -->|Yes: Cached| GET_URL[Generate short-lived signed GET URL from S3/R2]
    GET_URL --> PLAY[Next.js AudioPlayer plays audio]

    CHECK_CACHE -->|No: First time requested| API_CALL[UI calls POST /api/v1/voice/synthesize { reportId, language: 'hi' }]
    API_CALL --> EXTRACT[FastAPI extracts validated recommendations text]
    EXTRACT --> GNANI_TTS[FastAPI streams text to Gnani Indic TTS API]
    GNANI_TTS --> AUDIO_BYTES[Receive synthesized 24kHz MP3 audio stream]
    AUDIO_BYTES --> S3_PUT[Store MP3 in S3: audio/tts/{reportId}.mp3]
    S3_PUT --> DB_UPDATE[Save ttsAudioKey in MongoDB cropReports record]
    DB_UPDATE --> GET_URL
```

---

### Flow 12: Proactive Weather & Crop Risk Radar Flow (Nightly ARQ Scheduler)
Monitors registered farms against incoming weather anomalies (e.g., 3 days of high humidity + 28°C triggers Late Blight risk in tomatoes).

```mermaid
flowchart TD
    CRON[Nightly ARQ Scheduler - Runs at 02:00 AM] --> LOAD_FARMS[Query active farms with crop stages from MongoDB]
    LOAD_FARMS --> BATCH_WX[Batch query 7-day weather forecast for farm coordinates]
    
    BATCH_WX --> EVAL_RULES[Evaluate Agro-Epidemiology Rules: e.g. Tomato Late Blight: Humidity > 80% AND Temp 15-22°C for 48h]
    
    EVAL_RULES --> RISK_DETECTED{Risk threshold crossed?}
    
    RISK_DETECTED -->|No Risk| SKIP[Do nothing / log metrics]
    
    RISK_DETECTED -->|High / Medium Risk| CHECK_DEDUPE{Alert sent within last 72h cooldown?}
    CHECK_DEDUPE -->|Yes: Already notified| SKIP
    
    CHECK_DEDUPE -->|No: New Risk| CREATE_ALERT[Insert into `riskAssessments` collection]
    CREATE_ALERT --> NOTIFY[Dispatch Web Push Notification / WhatsApp Alert to Farmer]
    NOTIFY --> RADAR_PAGE[Farmer opens '/radar' to see preventative steps]
```

---

## 4. Pydantic v2 Contracts & Schemas

### 4.1 Ingress Schema: Analysis Submission
```python
# app/schemas/analysis_request.py
from pydantic import BaseModel, Field, model_validator
from typing import Optional

class FarmLocationHint(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    district: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)

class CropAnalysisCreate(BaseModel):
    image_key: Optional[str] = Field(None, description="S3 object key for compressed crop image")
    audio_key: Optional[str] = Field(None, description="S3 object key for 16kHz PCM WAV audio")
    question: Optional[str] = Field(None, max_length=1000, description="Typed farmer question")
    crop: Optional[str] = Field(None, max_length=100, description="Crop name if identified by farmer")
    language: str = Field(default="hi", regex="^(hi|mr|te|ta|kn|en)$", description="ISO language code")
    farm_id: Optional[str] = Field(None, description="Saved farm reference")
    location: Optional[FarmLocationHint] = None

    @model_validator(mode="after")
    def verify_at_least_one_input(self):
        if not self.image_key and not self.audio_key and not (self.question and self.question.strip()):
            raise ValueError("At least one input (photo, audio, or typed question) must be provided.")
        return self
```

### 4.2 Gemini Candidate Assessment Schema (Strict Structured Output)
```python
# app/schemas/gemini_contracts.py
from pydantic import BaseModel, Field
from typing import List, Optional

class CandidateObservation(BaseModel):
    symptom: str = Field(description="Visual observation, e.g., 'Brown concentric rings on lower leaves'")
    affected_part: str = Field(regex="^(leaf|stem|fruit|root|whole_plant)$")
    severity: str = Field(regex="^(low|medium|high)$")
    confidence: float = Field(ge=0.0, le=1.0)

class CandidateCause(BaseModel):
    name: str = Field(description="Name of the pest, disease, or deficiency")
    scientific_name: Optional[str] = None
    category: str = Field(regex="^(fungal|bacterial|viral|pest|deficiency|water_stress|unknown)$")
    probability: float = Field(ge=0.0, le=1.0)
    reasoning: str = Field(description="Why this observation and weather facts support this cause")

class CandidateRecommendation(BaseModel):
    category: str = Field(regex="^(cultural|biological|chemical)$")
    action: str = Field(description="Practical action step for the farmer")
    source_advisory_id: str = Field(description="MUST match one of the vetted advisory IDs provided in prompt context")
    suggested_dosage: Optional[str] = None

class GeminiCandidateAssessment(BaseModel):
    observations: List[CandidateObservation]
    possible_causes: List[CandidateCause]
    recommendations: List[CandidateRecommendation]
    follow_up_questions: List[str] = Field(max_items=3)
    photo_quality_acceptable: bool
    uncertainty_note: str
```

### 4.3 Verified Report Response Schema (Farmer Egress)
```python
# app/schemas/report_response.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class VerifiedRecommendation(BaseModel):
    category: str
    action: str
    verified_authority: str  # e.g., "ICAR - Indian Institute of Horticultural Research"
    source_advisory_id: str
    dosage: Optional[str] = None
    safety_note: Optional[str] = None
    cibrc_approved: bool

class CropReportResponse(BaseModel):
    report_id: str
    status: str
    created_at: datetime
    crop_name: Optional[str]
    image_url: Optional[str]
    transcript: Optional[str]
    observations: List[CandidateObservation]
    possible_causes: List[CandidateCause]
    recommendations: List[VerifiedRecommendation]
    follow_up_questions: List[str]
    weather_summary: Optional[str]
    tts_audio_url: Optional[str]
    disclaimer: str
```

---

## 5. Security, Tenancy & Environmental Configuration

### 5.1 Environment Variables Matrix

#### Backend (`/backend/.env`)
```bash
# Environment & Server
ENVIRONMENT=production
DEBUG=false
PROJECT_NAME="KisanRakshak AI"
API_V1_STR="/api/v1"
SECRET_KEY="generate-with-openssl-rand-hex-32"
ACCESS_TOKEN_EXPIRE_MINUTES=43200 # 30 days for farmers

# Database & Cache
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/kisanrakshak?retryWrites=true&w=majority"
REDIS_URL="redis://localhost:6379/0"

# Cloudinary Media Storage (https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
# Or single connection URL:
# CLOUDINARY_URL="cloudinary://<api_key>:<api_secret>@<cloud_name>"

# AI & Speech Services
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-1.5-flash"
GNANI_API_KEY="gnani-api-token"
GNANI_ASR_ENDPOINT="https://asr.gnani.ai/v1/recognize"
GNANI_TTS_ENDPOINT="https://tts.gnani.ai/v1/synthesize"

# Weather API
OPEN_METEO_BASE_URL="https://api.open-meteo.com/v1/forecast"
```

#### Frontend (`/frontend/.env.local`)
```bash
NEXT_PUBLIC_API_BASE_URL="https://api.kisanrakshak.in"
NEXT_PUBLIC_APP_NAME="KisanRakshak AI"
NEXT_PUBLIC_DEFAULT_LANG="hi"
```

---

## 6. Production Verification & Test Suite

| Test Category | Test Case | Target Metric |
|---|---|---|
| **Edge Ingestion** | 48MP raw image client-side compression | Web Worker completes in < 350ms; output WebP < 400KB |
| **Direct Upload** | Presigned S3 direct PUT | HTTP 200 OK directly to S3; 0 bytes piped through FastAPI RAM |
| **Pipeline Latency** | Full async run (STT + Gemini + 3-Tier Check) | Under 5.5s total duration from `202 Accepted` to `COMPLETED` |
| **Safety Gatekeeper** | Inject hallucinated chemical and invalid `sourceAdvisoryId` | Gatekeeper purges 100% of unverified recommendations |
| **Offline Resilience** | Disconnect Wi-Fi/4G, capture photo, reconnect | Background Sync triggers automatically without tab refresh |
| **Audio Compatibility**| Submit 16kHz PCM WAV from AudioWorklet | Gnani STT yields confidence > 0.88 on Hindi speech |

---

## 7. Architectural Summary

By unifying **Next.js 15 (App Router PWA)** and **FastAPI (AsyncIO Hexagonal Monolith)**:
- The **frontend** solves the rural edge problem (client-side compression, 16kHz AudioWorklets, offline IndexedDB Outbox).
- The **backend** solves the AI reliability and safety problem (async `202 Accepted` job processing, Redis SSE streaming, and a deterministic 3-tier regulatory gatekeeper).

This architecture delivers a **10/10 standard in latency, resilience, and agricultural safety**.
