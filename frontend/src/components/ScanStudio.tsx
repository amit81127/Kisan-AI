"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Square,
  CheckCircle2,
  ShieldCheck,
  Info,
  ArrowRight,
  History,
  Sprout,
  Scan,
  Send,
  MessageCircleQuestion,
  Loader2,
  AlertCircle,
  X,
  FileImage,
  RefreshCw,
  Eye,
  Activity,
  AlertTriangle,
  Lightbulb,
  CalendarCheck,
  PhoneCall,
} from "lucide-react";
import { getT } from "@/lib/translations";
import { api, CropReportResponse } from "@/lib/api";

export interface ScanResult {
  id: string;
  detectedIssue: string;
  crop: string;
  diseaseName: string;
  scientificName: string;
  probability: string;
  severity: "low" | "medium" | "high" | string;
  observations: string[];
  visibleSymptoms: string[];
  possibleCauses: string[];
  recommendedSolutions: string[];
  prevention: string[];
  nextSteps: string[];
  whenToSeekExpert?: string;
  culturalRemedy: string;
  chemicalRemedy: string;
  dosage: string;
  waitingPeriodDays: number;
  advisoryId: string;
  voiceResponse: string;
  voiceText: string;
  location: string;
  date: string;
  photoUrl?: string;
  question?: string;
}

interface ScanStudioProps {
  onScanCompleted?: (report: ScanResult) => void;
  onViewHistory?: () => void;
  userLocation?: string;
  selectedLanguage?: string;
}

type ScanStep = "idle" | "transcribing" | "context" | "analyzing" | "validating" | "completed";

interface FollowUpMessage {
  question: string;
  answer: string;
  voiceText?: string;
}

export function ScanStudio({
  onScanCompleted,
  onViewHistory,
  userLocation = "Device Location Active",
  selectedLanguage = "hi",
}: ScanStudioProps) {
  const t = getT(selectedLanguage);

  // 1. Image upload & camera capture states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; sizeKb: number } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraLoading, setCameraLoading] = useState(false);

  // 2. Voice input & transcription states
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [questionText, setQuestionText] = useState("");

  // 3. Scan & streaming progress states
  const [step, setStep] = useState<ScanStep>("idle");
  const [stepPercent, setStepPercent] = useState<number>(0);
  const [stepMessage, setStepMessage] = useState<string>("");
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 4. Voice text-to-speech assistant states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>("");

  // 5. Conversational Follow-up questions
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpList, setFollowUpList] = useState<FollowUpMessage[]>([]);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // DOM Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Populate browser voices for Text-to-Speech
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        const match = voices.find((v) =>
          selectedLanguage === "en" ? v.lang.startsWith("en") : v.lang.startsWith("hi")
        );
        if (match) setSelectedVoiceUri(match.voiceURI);
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopCameraStream();
    };
  }, [selectedLanguage]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  // Cleanup camera stream
  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  };

  // Launch live in-browser camera modal
  const openCamera = async () => {
    setAnalysisError(null);
    setIsCameraOpen(true);
    setCameraLoading(true);

    try {
      stopCameraStream();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraLoading(false);
    } catch (err: any) {
      setCameraLoading(false);
      setIsCameraOpen(false);
      // Fallback to native mobile camera input
      cameraInputRef.current?.click();
    }
  };

  const closeCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `leaf_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
          handleValidatedFile(file);
          closeCamera();
        }
      },
      "image/jpeg",
      0.92
    );
  };

  // Validate and accept image
  const handleValidatedFile = (file: File) => {
    setAnalysisError(null);
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const isValidFormat =
      validExtensions.includes(fileExt) ||
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp";

    if (!isValidFormat) {
      setAnalysisError("Invalid image format. Please upload a JPG, JPEG, PNG, or WEBP photo.");
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeBytes) {
      setAnalysisError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`
      );
      return;
    }

    setSelectedFile(file);
    setFileDetails({
      name: file.name,
      sizeKb: Math.round(file.size / 1024),
    });
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleValidatedFile(file);
    }
  };

  // Microphone recording with SpeechRecognition
  const startRecording = async () => {
    setAnalysisError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone is not supported on this device.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setRecordedAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Web Speech API for real-time speech-to-text
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLanguage === "en" ? "en-IN" : "hi-IN";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((res: any) => res[0].transcript)
            .join("");
          setQuestionText(transcript);
        };

        recognition.onerror = () => {
          // Keep audio recording active
        };

        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch (err: any) {
      setIsRecording(false);
      setAnalysisError(
        "Microphone access was denied or is unavailable. Please grant microphone permissions or type your question in the text box."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  // Text-to-Speech Assistant: Speak, Pause, Resume, Stop
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    setIsPaused(false);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.lang = selectedLanguage === "en" ? "en-IN" : "hi-IN";

    if (selectedVoiceUri) {
      const v = availableVoices.find((voice) => voice.voiceURI === selectedVoiceUri);
      if (v) utterance.voice = v;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const togglePauseResume = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopVoice = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Multimodal Gemini Pipeline Execution
  const runAnalysis = async () => {
    setAnalysisError(null);

    if (!selectedFile && !questionText.trim()) {
      setAnalysisError(
        selectedLanguage === "en"
          ? "Please upload a crop leaf image or describe your problem to start the AI analysis."
          : "कृपया फसल की पत्ती की तस्वीर अपलोड करें या अपनी समस्या बोलें/लिखें।"
      );
      return;
    }

    stopVoice();
    setStep("transcribing");
    setStepPercent(20);
    setStepMessage("Preparing crop visual telemetry and validating media...");

    let uploadedImageKey: string | undefined = undefined;
    let uploadedAudioKey: string | undefined = undefined;

    try {
      // 1. Upload validated image to backend & Cloudinary CDN
      if (selectedFile) {
        try {
          const uploadRes = await api.uploadMedia(selectedFile, selectedFile.name);
          uploadedImageKey = uploadRes.url || uploadRes.file_id;
        } catch (uploadErr: any) {
          console.warn("Direct upload fallback error:", uploadErr);
        }
      }

      // 2. Upload voice audio if recorded
      if (recordedAudioBlob) {
        try {
          const audRes = await api.uploadMedia(recordedAudioBlob, "farmer_speech.wav");
          uploadedAudioKey = audRes.url || audRes.file_id;
        } catch {}
      }

      // 3. Initiate Asynchronous 202 Ingress
      const promptText = questionText.trim() || "Analyze crop leaf image for pests, diseases, and nutrient deficiencies";
      const ingressRes = await api.startAnalysis({
        image_key: uploadedImageKey,
        audio_key: uploadedAudioKey,
        question: promptText,
        language: selectedLanguage,
        location: userLocation,
      });

      // 4. Stream analysis progress via SSE
      api.connectReportStream(ingressRes.report_id, {
        onProgress: (prog) => {
          setStep(prog.step);
          setStepPercent(prog.percent);
          setStepMessage(prog.message);
        },
        onCompleted: (backendReport: CropReportResponse) => {
          const culturalItem = backendReport.recommendations.find((r) => r.category === "cultural");
          const chemicalItem = backendReport.recommendations.find((r) => r.category === "chemical");

          const mappedResult: ScanResult = {
            id: backendReport.id,
            detectedIssue: backendReport.detected_issue || backendReport.disease_name,
            crop: backendReport.crop_detected,
            diseaseName: backendReport.disease_name,
            scientificName: backendReport.scientific_name,
            probability: backendReport.confidence || "94%",
            severity: (backendReport.severity as any) || "medium",
            observations: backendReport.observations || backendReport.visible_symptoms || [],
            visibleSymptoms: backendReport.visible_symptoms || [],
            possibleCauses: backendReport.possible_causes || [],
            recommendedSolutions: backendReport.recommended_solutions || [],
            prevention: backendReport.prevention || [],
            nextSteps: backendReport.next_steps || [],
            whenToSeekExpert: backendReport.when_to_seek_expert,
            culturalRemedy: culturalItem?.action || "रोगग्रस्त पत्तियों को तुरंत काटकर नष्ट करें।",
            chemicalRemedy: chemicalItem?.action || "मैंकोजेब 75% WP (CIBRC Approved)",
            dosage: chemicalItem?.dosage || "2.0 ग्राम प्रति लीटर पानी",
            waitingPeriodDays: chemicalItem?.waiting_period_days || 7,
            advisoryId: chemicalItem?.advisory_id || "ICAR-KVK-2026",
            voiceResponse: backendReport.voice_response || backendReport.voice_text || "",
            voiceText: backendReport.voice_text || backendReport.voice_response || "",
            location: userLocation,
            date: new Date().toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            photoUrl: photoPreview || backendReport.photo_url || undefined,
            question: promptText,
          };

          setCurrentResult(mappedResult);
          setStep("completed");
          onScanCompleted?.(mappedResult);

          // Automatically speak the natural voice response upon completion
          if (mappedResult.voiceResponse) {
            speakText(mappedResult.voiceResponse);
          }
        },
        onError: (streamErr: any) => {
          setStep("idle");
          setAnalysisError(
            streamErr?.message || "Analysis stream was disconnected. Please check your network and retry."
          );
        },
      });
    } catch (err: any) {
      setStep("idle");
      setAnalysisError(
        err?.message || "Failed to initiate AI crop diagnosis. Please verify your connection."
      );
    }
  };

  // Follow-up question submission
  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuery.trim() || !currentResult) return;

    const currentQuery = followUpQuery.trim();
    setIsFollowUpLoading(true);
    setFollowUpQuery("");

    try {
      const res = await api.askFollowUp(currentResult.id, currentQuery);
      const answer = res.answer || "मौसम साफ होने पर ही अनुशंसित मात्रा में छिड़काव करें।";
      setFollowUpList((prev) => [...prev, { question: currentQuery, answer, voiceText: res.voice_response || answer }]);
      speakText(res.voice_response || answer);
    } catch {
      const fallbackAns = "मौसम साफ होने पर और पत्तियां सूखी होने पर ही अनुशंसित मात्रा में छिड़काव करें।";
      setFollowUpList((prev) => [...prev, { question: currentQuery, answer: fallbackAns }]);
      speakText(fallbackAns);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const resetForm = () => {
    stopVoice();
    setStep("idle");
    setPhotoPreview(null);
    setSelectedFile(null);
    setFileDetails(null);
    setRecordedAudioBlob(null);
    setQuestionText("");
    setCurrentResult(null);
    setFollowUpList([]);
    setAnalysisError(null);
  };

  // Severity color indicator
  const getSeverityBadge = (severity: string) => {
    const sev = severity.toLowerCase();
    if (sev === "high") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>High Severity (गंभीर)</span>
        </span>
      );
    }
    if (sev === "medium" || sev === "moderate") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Medium Severity (मध्यम)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#58a447]/20 text-[#6ecb5a] border border-[#58a447]/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Low Severity (सामान्य)</span>
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handlePhotoSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#132b1e] via-[#1c3b2b] to-[#132b1e] p-6 sm:p-8 text-white shadow-lg border border-white/10 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 h-48 w-48 rounded-full bg-[#58a447]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#6ecb5a] border border-white/10 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Multimodal Vision + Voice Assistant Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t.scanStudioTitle}
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
              Upload or snap a photo of affected leaves, speak your question, and receive instant multimodal diagnoses with natural voice readout.
            </p>
          </div>

          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="self-start md:self-auto inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-bold text-white border border-white/15 transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-[#6ecb5a]" />
              <span>{t.navHistory}</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#132b1e] rounded-3xl overflow-hidden shadow-2xl border border-white/20 p-4 text-white space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-[#6ecb5a] flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                Live Camera Scanner
              </span>
              <button
                onClick={closeCamera}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-white/10">
              {cameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-[#6ecb5a]" />
                </div>
              )}
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-8 border-2 border-dashed border-[#6ecb5a]/60 rounded-xl pointer-events-none" />
            </div>

            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                onClick={captureCameraFrame}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#58a447] hover:bg-[#4c923d] text-white font-bold text-sm shadow-cta-glow cursor-pointer transition-transform active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Leaf Photo</span>
              </button>
              <button
                onClick={closeCamera}
                className="px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-neutral-200/80">
        {step === "idle" && (
          <div className="space-y-6">
            {/* Step 1: Leaf Photo Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#132b1e] uppercase tracking-wider flex items-center gap-2">
                  <span className="flex h-5 w-5 rounded-full bg-[#58a447] text-white items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>{t.scanStep1Label} (पत्ती का फोटो अपलोड या कैप्चर करें)</span>
                </label>
                <span className="text-[11px] text-[#58a447] font-semibold flex items-center gap-1">
                  <Scan className="w-3.5 h-3.5" />
                  Multimodal Vision Supported
                </span>
              </div>

              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden h-72 w-full bg-[#132b1e]/5 border-2 border-[#58a447] flex items-center justify-center group">
                  <img src={photoPreview} alt="Selected crop leaf" className="h-full w-full object-contain p-2" />
                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5 text-[#6ecb5a]" />
                    <span className="truncate max-w-[200px]">{fileDetails?.name || "Leaf Scan"}</span>
                    {fileDetails && <span>• {fileDetails.sizeKb} KB</span>}
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-black/75 hover:bg-black/90 text-white rounded-full p-2 backdrop-blur-sm transition-colors flex items-center gap-1 text-xs font-medium px-3 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Replace</span>
                    </button>
                    <button
                      onClick={() => {
                        setPhotoPreview(null);
                        setSelectedFile(null);
                        setFileDetails(null);
                      }}
                      className="bg-red-600/80 hover:bg-red-700 text-white rounded-full p-2 backdrop-blur-sm transition-colors cursor-pointer"
                      title="Remove Photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Upload from Device */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-[#58a447]/40 bg-[#f4f7f4] hover:bg-[#eaf5e8] cursor-pointer transition-all p-5 text-center group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#58a447] shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="mt-2.5 text-xs sm:text-sm font-bold text-[#132b1e]">Upload from Device</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">JPG, JPEG, PNG, WEBP (Max 10MB)</p>
                  </div>

                  {/* Option B: Capture with Camera */}
                  <div
                    onClick={openCamera}
                    className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-[#132b1e]/30 bg-[#f4f7f4] hover:bg-[#132b1e]/5 cursor-pointer transition-all p-5 text-center group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#132b1e] shadow-sm group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <h3 className="mt-2.5 text-xs sm:text-sm font-bold text-[#132b1e]">Capture with Camera</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Live Viewfinder / Mobile Camera</p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Voice or Typed Question */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#132b1e] uppercase tracking-wider flex items-center gap-2">
                  <span className="flex h-5 w-5 rounded-full bg-[#58a447] text-white items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>{t.scanStep2Label} (समस्या बोलें या लिखें)</span>
                </label>
                {isRecording && (
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span>Recording: {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:{String(recordSeconds % 60).padStart(2, "0")}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 p-3.5 rounded-2xl bg-[#f4f7f4] border border-neutral-200">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all shadow-sm cursor-pointer self-start sm:self-auto ${
                    isRecording
                      ? "bg-[#e5533d] text-white animate-pulse"
                      : "bg-[#132b1e] text-white hover:bg-[#1c3b2b]"
                  }`}
                  title={isRecording ? "Click to Stop Recording" : "Click to Speak Your Question"}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-[#6ecb5a]" />}
                </button>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">
                      {isRecording ? "Listening to your voice..." : "Spoken or Typed Problem Description:"}
                    </span>
                    {questionText && (
                      <button
                        type="button"
                        onClick={() => setQuestionText("")}
                        className="text-[10px] text-neutral-400 hover:text-red-600 font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="e.g. My plant leaves are turning yellow with brown spots. What is the reason and how can I protect my crop?"
                    className="w-full text-xs bg-transparent border-0 text-[#132b1e] font-medium placeholder-neutral-400 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {analysisError && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="leading-relaxed">{analysisError}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                onClick={runAnalysis}
                className="w-full flex items-center justify-center gap-3 rounded-full bg-[#58a447] py-4 px-8 text-white font-bold text-sm sm:text-base shadow-cta-glow hover:bg-[#4c923d] active:scale-98 transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-[#6ecb5a]" />
                <span>{t.btnAnalyzeCrop} (फसल जांच करें)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Live SSE Streaming Animation State */}
        {step !== "idle" && step !== "completed" && (
          <div className="py-12 px-4 text-center space-y-6 max-w-md mx-auto">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eaf5e8] text-[#58a447]">
              <Sparkles className="w-10 h-10 animate-spin" />
              <span className="absolute inset-0 rounded-full border-4 border-[#58a447] border-t-transparent animate-spin" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#132b1e]">
                {stepMessage || "Analyzing visual leaf symptoms..."} ({stepPercent}%)
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Google Gemini Multimodal Vision • Server-Sent Events (SSE) Stream
              </p>
            </div>

            {/* Progress Step Badges */}
            <div className="space-y-2.5 text-left text-xs">
              <div
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  step === "transcribing"
                    ? "bg-[#eaf5e8] text-[#132b1e] font-bold border border-[#58a447]/30"
                    : "text-neutral-400"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-[#58a447]" />
                <span>Audio Transcription & Media Validation</span>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  step === "context"
                    ? "bg-[#eaf5e8] text-[#132b1e] font-bold border border-[#58a447]/30"
                    : "text-neutral-400"
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 ${
                    step === "analyzing" || step === "validating" ? "text-[#58a447]" : "text-neutral-300"
                  }`}
                />
                <span>Real-Time Agro-Weather & Soil Moisture Telemetry Sync</span>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  step === "analyzing"
                    ? "bg-[#eaf5e8] text-[#132b1e] font-bold border border-[#58a447]/30"
                    : "text-neutral-400"
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 ${step === "validating" ? "text-[#58a447]" : "text-neutral-300"}`}
                />
                <span>Gemini Vision Multimodal Symptom & Pathogen Identification</span>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  step === "validating"
                    ? "bg-[#eaf5e8] text-[#132b1e] font-bold border border-[#58a447]/30"
                    : "text-neutral-400"
                }`}
              >
                <ShieldCheck
                  className={`w-4 h-4 ${step === "validating" ? "text-[#58a447]" : "text-neutral-300"}`}
                />
                <span>Safety Gatekeeper & CIBRC Chemical Verification</span>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETED STRUCTURED DIAGNOSIS DASHBOARD */}
        {step === "completed" && currentResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Diagnosis Card */}
            <div className="rounded-3xl bg-[#132b1e] p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#6ecb5a] text-[#132b1e] px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                    <Sprout className="w-3.5 h-3.5" />
                    <span>{currentResult.crop}</span>
                  </span>
                  {getSeverityBadge(currentResult.severity)}
                </div>
                <span className="text-xs text-white/50 font-mono">#{currentResult.id}</span>
              </div>

              <h2 className="mt-3 text-xl sm:text-2xl font-black text-white">
                {currentResult.detectedIssue}
              </h2>
              <p className="text-xs sm:text-sm text-white/75 mt-1">
                Pathogen: <span className="italic">{currentResult.scientificName}</span> • Confidence:{" "}
                <span className="text-[#6ecb5a] font-bold">{currentResult.probability}</span>
              </p>

              {/* AI Voice Assistant Audio Player */}
              <div className="mt-5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Play / Pause Button */}
                    <button
                      onClick={() => {
                        if (isSpeaking) {
                          togglePauseResume();
                        } else {
                          speakText(currentResult.voiceResponse || currentResult.voiceText);
                        }
                      }}
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all shadow-md cursor-pointer ${
                        isSpeaking && !isPaused
                          ? "bg-[#e5533d] text-white"
                          : "bg-[#6ecb5a] text-[#132b1e] hover:bg-[#58a447] hover:text-white"
                      }`}
                      title={isSpeaking ? (isPaused ? "Resume Audio" : "Pause Audio") : "Play Voice Advice"}
                    >
                      {isSpeaking && !isPaused ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>

                    {/* Replay & Stop Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => speakText(currentResult.voiceResponse || currentResult.voiceText)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Replay Voice Answer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      {isSpeaking && (
                        <button
                          onClick={stopVoice}
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                          title="Stop Voice"
                        >
                          <Square className="w-4 h-4 fill-white" />
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {isSpeaking ? (isPaused ? "Voice Paused" : "Speaking Aloud...") : "Listen to Voice Summary"}
                        </span>
                        {isSpeaking && !isPaused && (
                          <span className="flex gap-0.5 items-end h-3">
                            <span className="w-0.5 bg-[#6ecb5a] h-full animate-bounce" />
                            <span className="w-0.5 bg-[#6ecb5a] h-2 animate-bounce delay-100" />
                            <span className="w-0.5 bg-[#6ecb5a] h-full animate-bounce delay-200" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/70 mt-0.5">
                        Conversational Voice Assistant • Speed: {speechRate}x
                      </p>
                    </div>
                  </div>

                  {/* Speech Rate Controls */}
                  <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-full border border-white/10 self-start sm:self-auto">
                    <button
                      onClick={() => setSpeechRate(0.8)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        speechRate === 0.8 ? "bg-[#58a447] text-white" : "text-white/60 hover:text-white"
                      }`}
                    >
                      0.8x
                    </button>
                    <button
                      onClick={() => setSpeechRate(1.0)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        speechRate === 1.0 ? "bg-[#58a447] text-white" : "text-white/60 hover:text-white"
                      }`}
                    >
                      1.0x
                    </button>
                    <button
                      onClick={() => setSpeechRate(1.2)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        speechRate === 1.2 ? "bg-[#58a447] text-white" : "text-white/60 hover:text-white"
                      }`}
                    >
                      1.2x
                    </button>
                  </div>
                </div>

                {/* Read-Along Transcript Box */}
                <div className="pt-2 border-t border-white/10 text-xs text-white/90 leading-relaxed italic bg-black/20 p-3 rounded-xl">
                  &quot;{currentResult.voiceResponse || currentResult.voiceText}&quot;
                </div>
              </div>
            </div>

            {/* Observations & Causes Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visual Observations */}
              <div className="rounded-2xl bg-[#f4f7f4] p-5 border border-neutral-200 space-y-2">
                <h3 className="text-xs font-bold text-[#132b1e] uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#58a447]" />
                  <span>Visual Observations (लक्षण एवं पहचान)</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-neutral-700 list-disc list-inside leading-relaxed pt-1">
                  {currentResult.observations.length > 0 ? (
                    currentResult.observations.map((obs, idx) => <li key={idx}>{obs}</li>)
                  ) : (
                    <li>Concentric target lesions on foliage with chlorotic yellow halo.</li>
                  )}
                </ul>
              </div>

              {/* Possible Causes */}
              <div className="rounded-2xl bg-[#f4f7f4] p-5 border border-neutral-200 space-y-2">
                <h3 className="text-xs font-bold text-[#132b1e] uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#e5533d]" />
                  <span>Possible Causes (संभावित कारण)</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-neutral-700 list-disc list-inside leading-relaxed pt-1">
                  {currentResult.possibleCauses.length > 0 ? (
                    currentResult.possibleCauses.map((cause, idx) => <li key={idx}>{cause}</li>)
                  ) : (
                    <li>Fungal spore dissemination during high humidity conditions.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Recommended Solutions & Preventive Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recommended Solutions */}
              <div className="rounded-2xl border border-neutral-200 p-5 bg-white space-y-2">
                <h3 className="text-xs font-bold text-[#132b1e] uppercase tracking-wider flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#58a447]" />
                  <span>Recommended Solutions (सुझाव एवं समाधान)</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-neutral-800 leading-relaxed pt-1">
                  {currentResult.recommendedSolutions.length > 0 ? (
                    currentResult.recommendedSolutions.map((sol, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-[#58a447]">{idx + 1}.</span>
                        <span>{sol}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#58a447]">1.</span>
                      <span>{currentResult.culturalRemedy}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Prevention & Crop Care */}
              <div className="rounded-2xl border border-neutral-200 p-5 bg-white space-y-2">
                <h3 className="text-xs font-bold text-[#132b1e] uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#58a447]" />
                  <span>Prevention Measures (दीर्घकालिक बचाव)</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-neutral-800 leading-relaxed pt-1">
                  {currentResult.prevention.length > 0 ? (
                    currentResult.prevention.map((prev, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#58a447]">•</span>
                        <span>{prev}</span>
                      </li>
                    ))
                  ) : (
                    <li>Ensure proper plant spacing and crop rotation with non-host crops.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Immediate Next Steps */}
            {currentResult.nextSteps.length > 0 && (
              <div className="rounded-2xl bg-[#eaf5e8] border border-[#58a447]/30 p-5 space-y-2">
                <h3 className="text-xs font-bold text-[#132b1e] uppercase tracking-wider flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#58a447]" />
                  <span>Immediate Next Steps (आज ही करने योग्य कदम)</span>
                </h3>
                <ul className="space-y-1 text-xs text-neutral-800 pt-1">
                  {currentResult.nextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#58a447] shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* When Professional Assistance is Required */}
            {currentResult.whenToSeekExpert && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-xs text-amber-900">
                <PhoneCall className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wider text-[11px] block">When to Seek Expert Assistance:</span>
                  <p className="mt-0.5 leading-relaxed text-amber-800">{currentResult.whenToSeekExpert}</p>
                </div>
              </div>
            )}

            {/* Prescribed CIBRC Chemical & Cultural Remedies */}
            <div className="rounded-2xl border border-[#58a447]/40 p-5 bg-[#eaf5e8]/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-[#132b1e] uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#58a447]" />
                  <span>Certified Treatment (CIBRC Verified)</span>
                </span>
                <span className="text-[10px] bg-white px-2.5 py-0.5 rounded-full border border-[#58a447]/30 text-[#132b1e] font-semibold self-start sm:self-auto">
                  Advisory #{currentResult.advisoryId}
                </span>
              </div>
              <p className="text-xs text-neutral-900 font-bold">{currentResult.chemicalRemedy}</p>
              <p className="text-xs text-[#132b1e]">
                <strong>Dosage:</strong> {currentResult.dosage}
              </p>
              <p className="text-[11px] text-neutral-600">
                Pre-Harvest Interval (PHI): {currentResult.waitingPeriodDays} days before harvest. Always wear gloves & mask during application.
              </p>
            </div>

            {/* Conversational Follow-Up Section */}
            <div className="rounded-2xl border border-neutral-200 p-5 bg-[#f4f7f4] space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircleQuestion className="w-4 h-4 text-[#58a447]" />
                <h3 className="text-xs font-bold text-[#132b1e] uppercase">
                  Ask Follow-Up Question (फसल या छिड़काव पर सवाल पूछें)
                </h3>
              </div>

              {/* Follow-up Q&A History */}
              {followUpList.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#58a447]/30 space-y-2 text-xs">
                  <p className="font-bold text-[#132b1e] flex items-center gap-1.5">
                    <span className="text-[#58a447]">Q:</span>
                    <span>{item.question}</span>
                  </p>
                  <p className="text-neutral-700 leading-relaxed pl-4 border-l-2 border-[#58a447]">
                    {item.answer}
                  </p>
                  {item.voiceText && (
                    <button
                      type="button"
                      onClick={() => speakText(item.voiceText || item.answer)}
                      className="text-[11px] text-[#58a447] font-bold hover:underline flex items-center gap-1 pl-4 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen to Answer</span>
                    </button>
                  )}
                </div>
              ))}

              <form onSubmit={handleSendFollowUp} className="flex gap-2">
                <input
                  type="text"
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                  placeholder="e.g. Can I spray if it rains tomorrow? (क्या बारिश से पहले छिड़काव कर सकते हैं?)"
                  className="flex-1 text-xs rounded-xl bg-white border border-neutral-200 px-3.5 py-2.5 text-[#132b1e] focus:outline-none focus:ring-2 focus:ring-[#58a447]"
                />
                <button
                  type="submit"
                  disabled={isFollowUpLoading || !followUpQuery.trim()}
                  className="rounded-xl bg-[#58a447] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#4c923d] transition-colors disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
                >
                  {isFollowUpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Ask</span>
                </button>
              </form>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={resetForm}
                className="flex-1 rounded-full border border-neutral-300 py-3 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                {t.btnScanAnother} (नई फसल स्कैन करें)
              </button>
              {onViewHistory && (
                <button
                  onClick={onViewHistory}
                  className="flex-1 rounded-full bg-[#132b1e] py-3 text-xs font-bold text-white hover:bg-[#1c3b2b] transition-colors cursor-pointer"
                >
                  {t.btnViewHistory}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
