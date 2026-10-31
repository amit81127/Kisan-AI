"use client";

import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  PhoneCall,
  Clock,
  ArrowRight,
  ExternalLink,
  Droplets,
  CalendarCheck,
} from "lucide-react";

interface RiskRadarSidebarProps {
  onOpenScanner: () => void;
  onViewAllAdvisories: () => void;
}

export function RiskRadarSidebar({
  onOpenScanner,
  onViewAllAdvisories,
}: RiskRadarSidebarProps) {
  return (
    <aside className="space-y-5">
      {/* 1. Proactive Agro-Weather Risk Radar Box */}
      <div className="rounded-3xl bg-white p-5 shadow-xs border border-neutral-200/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fde8e8] text-[#e5533d]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#132b1e]">
              Proactive Risk Radar
            </h3>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-[#fde8e8] px-2 py-0.5 text-[10px] font-bold text-[#e5533d]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e5533d] animate-ping" />
            2 Active Risks
          </span>
        </div>

        {/* Risk Card 1: Tomato Late Blight Alert */}
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-3.5 mb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
              <AlertTriangle className="w-3.5 h-3.5 text-[#e5533d]" />
              <span>Tomato Late Blight Risk</span>
            </div>
            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
              High (88%)
            </span>
          </div>
          <p className="mt-1.5 text-xs text-red-800/90 leading-relaxed">
            Humidity has stayed above 80% with 24°C temp. Ideal spore germination window for next 48 hours.
          </p>
          <div className="mt-2.5 pt-2 border-t border-red-200/60 flex items-center justify-between">
            <span className="text-[10px] text-red-700 font-medium flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              Do not irrigate overhead
            </span>
            <button
              onClick={onOpenScanner}
              className="text-[11px] font-bold text-red-900 hover:underline flex items-center gap-1"
            >
              <span>Scan Leaf</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Risk Card 2: Carrot Rust Fly Alert */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-[#e58b23]" />
              <span>Carrot Pest Surveillance</span>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              Moderate (45%)
            </span>
          </div>
          <p className="mt-1.5 text-xs text-amber-800/90 leading-relaxed">
            Second generation emergence predicted. Inspect lower foliage for leaf-curling.
          </p>
          <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between">
            <span className="text-[10px] text-amber-800 font-medium">
              Use yellow sticky traps
            </span>
            <button
              onClick={onViewAllAdvisories}
              className="text-[11px] font-bold text-amber-900 hover:underline flex items-center gap-1"
            >
              <span>Advisory</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Today's Recommended Farm Operations */}
      <div className="rounded-3xl bg-white p-5 shadow-xs border border-neutral-200/80">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf5e8] text-[#58a447]">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#132b1e]">
              Today&apos;s Field Tasks
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400 font-medium">3 Pending</span>
        </div>

        <ul className="space-y-2.5 text-xs">
          <li className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#f4f7f4] transition-colors">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-neutral-300 text-[#58a447] focus:ring-[#58a447]"
              defaultChecked
            />
            <div className="flex-1">
              <p className="font-semibold text-[#132b1e] line-through text-neutral-400">
                Morning drip irrigation (Zone B - Carrots)
              </p>
              <span className="text-[10px] text-neutral-400">Completed at 07:30 AM</span>
            </div>
          </li>

          <li className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#f4f7f4] transition-colors">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-neutral-300 text-[#58a447] focus:ring-[#58a447]"
            />
            <div className="flex-1">
              <p className="font-semibold text-[#132b1e]">
                Prune infected lower tomato foliage
              </p>
              <span className="text-[10px] text-[#e5533d] font-medium flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Priority • Before Rain
              </span>
            </div>
          </li>

          <li className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#f4f7f4] transition-colors">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-neutral-300 text-[#58a447] focus:ring-[#58a447]"
            />
            <div className="flex-1">
              <p className="font-semibold text-[#132b1e]">
                Inspect yellow sticky traps on Pumpkin patch
              </p>
              <span className="text-[10px] text-neutral-500">Scheduled for 04:00 PM</span>
            </div>
          </li>
        </ul>
      </div>

      {/* 3. Official Agricultural Support (Kisan Call Centre) */}
      <div className="rounded-3xl bg-[#132b1e] p-5 text-white shadow-xs border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <PhoneCall className="w-4 h-4 text-[#6ecb5a]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6ecb5a]">
            Govt. Kisan Call Centre
          </h4>
        </div>
        <p className="text-xs text-white/80 leading-relaxed">
          Need second opinion from a Krishi Vigyan Kendra (KVK) scientist?
        </p>
        <div className="mt-3 flex items-center justify-between bg-white/10 rounded-2xl px-3.5 py-2.5 backdrop-blur-sm">
          <div>
            <span className="text-[10px] text-white/60 block">Toll-Free Helpline</span>
            <span className="text-sm font-bold text-white tracking-wide">
              1800-180-1551
            </span>
          </div>
          <a
            href="tel:18001801551"
            className="rounded-full bg-[#58a447] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4c923d] transition-colors"
          >
            Call Now
          </a>
        </div>
      </div>
    </aside>
  );
}
