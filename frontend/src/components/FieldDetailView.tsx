"use client";

import React from "react";
import {
  ChevronLeft,
  Droplets,
  Sprout,
  Layers,
  ShieldAlert,
  Sparkles,
  MapPin,
  Calendar,
  Scale,
} from "lucide-react";

interface FieldDetailViewProps {
  onBack: () => void;
  onRunAIScan: () => void;
}

export function FieldDetailView({ onBack, onRunAIScan }: FieldDetailViewProps) {
  return (
    <div className="relative min-h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-5 text-white bg-neutral-900 border border-white/10">
      {/* Background Aerial Field with SVG Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85"
          alt="Aerial Field View"
          className="h-full w-full object-cover brightness-[0.85] contrast-[1.1]"
        />
        {/* Soft dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* SVG Geo-Fence Boundary Polygon Overlay */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox="0 0 400 600"
          preserveAspectRatio="none"
        >
          {/* Dotted boundary polygon */}
          <polygon
            points="60,180 340,160 360,420 50,450"
            fill="rgba(110, 203, 90, 0.12)"
            stroke="white"
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
          {/* Geo-markers / pins */}
          <circle cx="60" cy="180" r="5" fill="white" className="animate-pulse" />
          <circle cx="340" cy="160" r="5" fill="white" className="animate-pulse" />
          <circle cx="360" cy="420" r="5" fill="white" className="animate-pulse" />
          <circle cx="50" cy="450" r="5" fill="white" className="animate-pulse" />
          <circle cx="200" cy="300" r="7" fill="#6ecb5a" />
          <circle cx="200" cy="300" r="14" fill="none" stroke="#6ecb5a" strokeWidth="2" opacity="0.6" className="animate-ping" />
        </svg>
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors border border-white/10"
          aria-label="Go Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h1 className="text-base sm:text-lg font-bold text-white tracking-wide drop-shadow-md">
          My Garden field
        </h1>

        <div className="w-10 h-10 rounded-full border-2 border-[#58a447] overflow-hidden bg-[#1c3b2b] flex items-center justify-center text-xs font-bold text-white shadow-md">
          <span>AN</span>
        </div>
      </div>

      {/* Middle Top: Field Specs Card */}
      <div className="relative z-10 my-auto max-w-sm w-full mx-auto">
        <div className="rounded-3xl glass-field p-5 shadow-glass-dark">
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-white/90">
              <span className="flex items-center gap-1.5 text-white/70">
                <MapPin className="w-3.5 h-3.5 text-[#6ecb5a]" />
                Total Area
              </span>
              <span className="font-semibold text-white">12 Hectares</span>
            </div>

            <div className="flex items-center justify-between text-white/90">
              <span className="flex items-center gap-1.5 text-white/70">
                <Calendar className="w-3.5 h-3.5 text-[#6ecb5a]" />
                Plant Age
              </span>
              <span className="font-semibold text-white">45 Days</span>
            </div>

            <div className="flex items-center justify-between text-white/90">
              <span className="flex items-center gap-1.5 text-white/70">
                <Scale className="w-3.5 h-3.5 text-[#6ecb5a]" />
                Yield
              </span>
              <span className="font-semibold text-white">15 Tons</span>
            </div>
          </div>

          {/* Carrot Crop Badge & Action */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white border border-white/10 backdrop-blur-sm">
              <span className="text-sm">🥕</span>
              <span>Carrot</span>
            </div>

            <button
              onClick={onRunAIScan}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#58a447] px-3.5 py-1.5 text-xs font-semibold text-white shadow-cta-glow hover:bg-[#4c923d] transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#6ecb5a]" />
              <span>Inspect Crop</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 2x2 Sensor/Analytics Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3 mt-4">
        {/* Water Depth */}
        <div className="rounded-2xl glass-dark p-4 shadow-glass-dark border border-white/10">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Water Depth</span>
            <Droplets className="w-4 h-4 text-[#3d9be5]" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            35%
          </p>
          <div className="mt-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#3d9be5] rounded-full w-[35%]" />
          </div>
        </div>

        {/* Plant Health */}
        <div className="rounded-2xl glass-dark p-4 shadow-glass-dark border border-white/10">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Plant Health</span>
            <Sprout className="w-4 h-4 text-[#6ecb5a]" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            56%
          </p>
          <div className="mt-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#6ecb5a] rounded-full w-[56%]" />
          </div>
        </div>

        {/* Soil Quality */}
        <div className="rounded-2xl glass-dark p-4 shadow-glass-dark border border-white/10">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Soil Quality</span>
            <Layers className="w-4 h-4 text-amber-300" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            75%
          </p>
          <div className="mt-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full w-[75%]" />
          </div>
        </div>

        {/* Pest Risk */}
        <div className="rounded-2xl glass-dark p-4 shadow-glass-dark border border-white/10">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Pest Risk</span>
            <ShieldAlert className="w-4 h-4 text-[#e58b23]" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#e58b23]">
            10%
          </p>
          <div className="mt-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#e58b23] rounded-full w-[10%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
