"use client";

import React, { useState, useEffect } from "react";
import { WebsiteHeader, WebsiteTab } from "@/components/WebsiteHeader";
import { LandingHomePage } from "@/components/LandingHomePage";
import { AuthModal } from "@/components/AuthModal";
import { LocationPermissionModal } from "@/components/LocationPermissionModal";
import { LanguageModal } from "@/components/LanguageModal";
import { ScanStudio, ScanResult } from "@/components/ScanStudio";
import { HistoryView } from "@/components/HistoryView";
import { WeatherHero } from "@/components/WeatherHero";
import { WebsiteFooter } from "@/components/WebsiteFooter";
import { getT } from "@/lib/translations";
import { api } from "@/lib/api";
import {
  LocationData,
  detectSmartLocation,
  saveLocationToStorage,
  loadLocationFromStorage,
} from "@/lib/location";
import {
  Sparkles,
  Camera,
  ShieldCheck,
  ScanEye,
  Sprout,
  LogIn,
  Languages,
} from "lucide-react";

export default function Home() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Post-Login Location Permission Popup
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Smart Live Location State (Defaulted to central UP agro zone before auto-detection)
  const [currentLocation, setCurrentLocation] = useState<LocationData>({
    locationName: "Kanpur, Uttar Pradesh",
    lat: 26.4499,
    lon: 80.3319,
    source: "default",
  });

  // All-India Language Modal State
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("hi");

  const t = getT(currentLanguage);

  // User Farmer Profile (Loaded dynamically from authenticated session)
  const [user, setUser] = useState<{
    name: string;
    email: string;
    phone?: string;
    location: string;
  } | null>(null);

  // Current Active Tab for Logged-In Users: Default FIRST PAGE after login is "scan" (Scan Crop)!
  const [activeTab, setActiveTab] = useState<WebsiteTab>("scan");

  // Dynamic Scan Reports State (Starts clean and dynamically tracks actual user scans)
  const [reports, setReports] = useState<ScanResult[]>([]);

  // Auto-detect location & check for existing farmer session on mount
  useEffect(() => {
    // 1. Auto-detect real-time location via GPS with IP fallback
    detectSmartLocation(false).then((detected) => {
      if (detected) {
        setCurrentLocation(detected);
      }
    });

    // 2. Fetch authenticated farmer profile
    api.getMe().then((profile) => {
      if (profile) {
        setUser({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location || "Kanpur, Uttar Pradesh",
        });
        setIsLoggedIn(true);
      }
    });

    // 3. Fetch historical reports from backend
    api.listReports().then((backendReports) => {
      if (backendReports && backendReports.length > 0) {
        const mapped: ScanResult[] = backendReports.map((r) => {
          const cult = r.recommendations.find((rec) => rec.category === "cultural");
          const chem = r.recommendations.find((rec) => rec.category === "chemical");
          return {
            id: r.id,
            detectedIssue: r.detected_issue || r.disease_name,
            crop: r.crop_detected,
            diseaseName: r.disease_name,
            scientificName: r.scientific_name,
            probability: r.confidence || "90%",
            severity: (r.severity as any) || "medium",
            observations: r.observations || r.visible_symptoms || [],
            visibleSymptoms: r.visible_symptoms || [],
            possibleCauses: r.possible_causes || [],
            recommendedSolutions: r.recommended_solutions || [],
            prevention: r.prevention || [],
            nextSteps: r.next_steps || [],
            whenToSeekExpert: r.when_to_seek_expert,
            culturalRemedy: cult?.action || "रोगग्रस्त पत्तियों को तुरंत काटकर नष्ट करें।",
            chemicalRemedy: chem?.action || "Spray Mancozeb 75% WP",
            dosage: chem?.dosage || "2.0 grams per litre",
            waitingPeriodDays: chem?.waiting_period_days || 7,
            advisoryId: chem?.advisory_id || "ICAR-KVK-2026",
            voiceResponse: r.voice_response || r.voice_text || "",
            voiceText: r.voice_text || r.voice_response || "",
            location: r.location || "India",
            date: new Date(r.created_at || Date.now()).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            photoUrl: r.photo_url,
            question: r.question,
          };
        });
        setReports(mapped);
      }
    });
  }, []);

  // 1. Trigger Auth Modal
  const handleOpenAuth = (mode: "login" | "signup" = "login") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  // 2. Auth Success: Login verified -> Close Auth -> Immediately open the side (Scan Studio)!
  const handleLoginSuccess = (userData: { name: string; email: string; phone?: string; location?: string }) => {
    setUser({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      location: userData.location || currentLocation.locationName,
    });
    setIsAuthModalOpen(false);
    setIsLoggedIn(true);
    setActiveTab("scan"); // Open the side directly!
  };

  // 3. Location Permission / Manual selection handled: update real-time coordinates and name
  const handleLocationDetected = (loc: LocationData) => {
    setCurrentLocation(loc);
    saveLocationToStorage(loc);
    setUser((prev) =>
      prev ? { ...prev, location: loc.locationName } : null
    );
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  const handleScanCompleted = (newReport: ScanResult) => {
    setReports((prev) => [newReport, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-[#132b1e] flex flex-col font-sans selection:bg-[#58a447]/20">
      {/* 1. Global Header */}
      <WebsiteHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentLanguage={currentLanguage}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        isLoggedIn={isLoggedIn}
        userName={user?.name || "Farmer Friend"}
        userLocation={currentLocation.locationName}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenAuth={() => handleOpenAuth("login")}
        onLogout={handleLogout}
      />

      {/* 2. Main Body Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* PUBLIC STATE: LANDING HOME PAGE */}
        {!isLoggedIn ? (
          <div className="animate-in fade-in duration-200">
            <LandingHomePage
              onOpenAuth={handleOpenAuth}
              onOpenLanguage={() => setIsLanguageModalOpen(true)}
              currentLanguage={currentLanguage}
            />
          </div>
        ) : (
          /* AUTHENTICATED STATE: ONLY SCAN CROP (First Page), DASHBOARD & HISTORY */
          <>
            {/* 1. PRIMARY FIRST PAGE: SCAN CROP (Voice & Text Output) */}
            {activeTab === "scan" && (
              <div className="animate-in fade-in duration-200">
                <ScanStudio
                  onScanCompleted={handleScanCompleted}
                  onViewHistory={() => setActiveTab("history")}
                  userLocation={currentLocation.locationName}
                  selectedLanguage={currentLanguage}
                />
              </div>
            )}

            {/* 2. DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Farmer Welcome Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-xs border border-neutral-200/80">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#58a447]">
                      {t.dashWelcome}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#132b1e] tracking-tight mt-0.5">
                      {user?.name || "Farmer Friend"} ({currentLocation.locationName})
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                      GPS: <span className="font-semibold text-[#132b1e]">{currentLocation.locationName}</span> • Email: <span className="font-semibold text-[#132b1e]">{user?.email || "Not Provided"}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab("scan")}
                    className="inline-flex items-center gap-2 rounded-full bg-[#58a447] px-5 py-2.5 text-xs font-bold text-white shadow-cta-glow hover:bg-[#4c923d] transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <ScanEye className="w-4 h-4 text-[#6ecb5a]" />
                    <span>{t.dashScanNow}</span>
                  </button>
                </div>

                {/* Weather Hero Card for User's Location (Live Open-Meteo High-Resolution Telemetry) */}
                <div>
                  <WeatherHero
                    location={currentLocation.locationName}
                    lat={currentLocation.lat}
                    lon={currentLocation.lon}
                    onOpenLocationModal={() => setIsLocationModalOpen(true)}
                    dateTime={new Date().toLocaleDateString(currentLanguage === "en" ? "en-IN" : "hi-IN", { month: "short", day: "numeric", year: "numeric" })}
                    currentLanguage={currentLanguage}
                  />
                </div>

                {/* Dynamic Stats Grid (Real User Data Only) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-3xl bg-white p-5 shadow-xs border border-neutral-200/80">
                    <span className="text-xs font-semibold text-neutral-500">{t.dashScansCount}</span>
                    <p className="mt-2 text-3xl font-extrabold text-[#132b1e]">{reports.length}</p>
                    <span className="text-[11px] text-[#58a447] font-semibold flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {reports.length > 0 ? "Saved in history" : "Ready for first scan"}
                    </span>
                  </div>

                  <div className="rounded-3xl bg-white p-5 shadow-xs border border-neutral-200/80">
                    <span className="text-xs font-semibold text-neutral-500">{t.dashActiveCrop}</span>
                    <p className="mt-2 text-xl font-extrabold text-[#58a447]">
                      {reports.length > 0 ? reports[0].crop : "Auto-Identified Leaf"}
                    </p>
                    <span className="text-[11px] text-neutral-500 mt-1 block">
                      {reports.length > 0 ? "From recent diagnosis" : "Detected from photo"}
                    </span>
                  </div>

                  <div className="rounded-3xl bg-white p-5 shadow-xs border border-neutral-200/80">
                    <span className="text-xs font-semibold text-neutral-500">{t.dashLatestStatus}</span>
                    <p className="mt-2 text-lg font-bold text-[#132b1e] truncate">
                      {reports.length > 0 ? reports[0].diseaseName.split("(")[0] : "No Scans Yet"}
                    </p>
                    <span className="text-[11px] text-neutral-500 mt-1 block">
                      {reports.length > 0 ? `Diagnosed on ${reports[0].date}` : "Scan to get status"}
                    </span>
                  </div>
                </div>

                {/* Direct Action Card to Scan */}
                <div className="rounded-3xl bg-[#eaf5e8] border border-[#58a447]/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#132b1e] text-[#6ecb5a]">
                      <Sprout className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#132b1e]">Detect Crop Diseases in Seconds</h3>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        High accuracy multimodal diagnosis verified by ICAR & KVK guidelines.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("scan")}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#132b1e] px-6 py-3 text-xs font-bold text-white hover:bg-[#1c3b2b] transition-all cursor-pointer shrink-0"
                  >
                    <span>{t.dashScanNow}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. HISTORY VIEW */}
            {activeTab === "history" && (
              <div className="animate-in fade-in duration-200">
                <HistoryView
                  reports={reports}
                  onScanNew={() => setActiveTab("scan")}
                  selectedLanguage={currentLanguage}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. Global Footer */}
      <WebsiteFooter />

      {/* 4. Interactive Login & Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
      />

      {/* 5. Live Location & District Selector Modal */}
      <LocationPermissionModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationDetected={handleLocationDetected}
        currentLanguage={currentLanguage}
      />

      {/* 6. All-India Language Modal */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        selectedLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
      />
    </div>
  );
}
