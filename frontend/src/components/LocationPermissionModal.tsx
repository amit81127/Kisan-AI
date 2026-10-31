"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Search,
  Globe2,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { getT } from "@/lib/translations";
import {
  LocationData,
  MAJOR_AGRO_DISTRICTS,
  detectSmartLocation,
  saveLocationToStorage,
} from "@/lib/location";

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationDetected: (location: LocationData) => void;
  currentLanguage?: string;
}

export function LocationPermissionModal({
  isOpen,
  onClose,
  onLocationDetected,
  currentLanguage = "hi",
}: LocationPermissionModalProps) {
  const t = getT(currentLanguage);
  const [detecting, setDetecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [detectedLoc, setDetectedLoc] = useState<LocationData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  if (!isOpen) return null;

  const handleAutoDetect = async () => {
    setDetecting(true);
    setStatusMsg("Detecting device GPS coordinates...");

    try {
      const loc = await detectSmartLocation(true);
      setDetectedLoc(loc);
      const sourceLabel = loc.source === "gps" ? "Device GPS" : "Network / IP Location";
      setStatusMsg(`Connected: ${loc.locationName} (${sourceLabel})`);
      saveLocationToStorage(loc);

      setTimeout(() => {
        onLocationDetected(loc);
        setDetecting(false);
        onClose();
      }, 1000);
    } catch {
      setStatusMsg("Auto-detection timed out. Please choose your district below.");
      setShowDistrictPicker(true);
      setDetecting(false);
    }
  };

  const handleSelectDistrict = (district: (typeof MAJOR_AGRO_DISTRICTS)[0]) => {
    const loc: LocationData = {
      locationName: `${district.city}, ${district.state}`,
      lat: district.lat,
      lon: district.lon,
      source: "manual",
    };
    setDetectedLoc(loc);
    saveLocationToStorage(loc);
    onLocationDetected(loc);
    onClose();
  };

  const filteredDistricts = MAJOR_AGRO_DISTRICTS.filter(
    (d) =>
      d.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-neutral-100 overflow-hidden text-center p-6 sm:p-7 space-y-4 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Map Pin Ripple Icon */}
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf5e8] text-[#58a447]">
          <span className="absolute inset-0 rounded-full bg-[#58a447]/20 animate-ping" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#132b1e] text-[#6ecb5a] shadow-md z-10">
            <Navigation className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Header */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#58a447]">
            {t.locationTitle || "Real-Time Farmer Location"}
          </span>
          <h2 className="text-xl font-extrabold text-[#132b1e] mt-1">
            Connect Real-Time Location (लाइव स्थान)
          </h2>
          <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
            Powers real-time Open-Meteo weather, soil moisture, and localized crop disease advisories.
          </p>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className="rounded-2xl bg-[#eaf5e8] border border-[#58a447]/30 p-2.5 text-xs font-semibold text-[#132b1e] flex items-center justify-center gap-2">
            {detecting ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#58a447]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#58a447]" />
            )}
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Auto-Detect GPS Button */}
        <button
          onClick={handleAutoDetect}
          disabled={detecting}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-[#58a447] py-3.5 px-6 text-white text-xs sm:text-sm font-bold shadow-cta-glow hover:bg-[#4c923d] active:scale-98 transition-all disabled:opacity-75 cursor-pointer"
        >
          {detecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Detecting GPS Coordinates...</span>
            </>
          ) : detectedLoc ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Connected: {detectedLoc.locationName}</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 text-[#6ecb5a]" />
              <span>📍 Detect Live GPS / IP Location (ऑटो-डिटेक्ट)</span>
            </>
          )}
        </button>

        {/* Toggle Manual District Picker */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowDistrictPicker(!showDistrictPicker)}
            className="text-xs font-bold text-[#132b1e] hover:text-[#58a447] flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <Globe2 className="w-3.5 h-3.5 text-[#58a447]" />
            <span>
              {showDistrictPicker
                ? "Hide District List ▲"
                : "Or Select Your District Manually (या जिला चुनें) ▼"}
            </span>
          </button>
        </div>

        {/* District Picker Body */}
        {showDistrictPicker && (
          <div className="flex-1 flex flex-col min-h-0 text-left pt-2 space-y-2 border-t border-neutral-100">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search district or state (e.g. Kanpur, Pune)..."
                className="w-full text-xs rounded-xl bg-[#f4f7f4] border border-neutral-200 pl-8 pr-3 py-2 text-[#132b1e] font-medium focus:outline-none focus:ring-2 focus:ring-[#58a447]"
              />
            </div>

            {/* Scrollable District List */}
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredDistricts.map((d, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectDistrict(d)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#eaf5e8] text-xs font-medium text-[#132b1e] transition-colors border border-transparent hover:border-[#58a447]/30"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#58a447]" />
                    <span>
                      <strong>{d.city}</strong>, {d.state}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              ))}
              {filteredDistricts.length === 0 && (
                <p className="text-xs text-neutral-400 text-center py-3">No matching districts found.</p>
              )}
            </div>
          </div>
        )}

        {/* Privacy Note */}
        <div className="rounded-2xl bg-[#f4f7f4] p-2.5 text-[11px] text-neutral-600 flex items-center justify-center gap-2 border border-neutral-200/80">
          <ShieldCheck className="w-4 h-4 text-[#58a447] shrink-0" />
          <span>Private & secured for agriculture advisory.</span>
        </div>
      </div>
    </div>
  );
}
