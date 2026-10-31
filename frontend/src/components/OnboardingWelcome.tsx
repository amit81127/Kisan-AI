"use client";

import React from "react";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";

interface OnboardingWelcomeProps {
  onGetStarted: () => void;
}

export function OnboardingWelcome({ onGetStarted }: OnboardingWelcomeProps) {
  return (
    <div className="relative min-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end p-6 sm:p-8 text-white border border-white/10">
      {/* Background Aerial Terraces Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=85"
          alt="Terraced Green Farm with River"
          className="h-full w-full object-cover contrast-[1.05]"
        />
        {/* Cinematic gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1e15] via-[#0d1e15]/40 to-transparent" />
      </div>

      {/* Top Brand Badge */}
      <div className="relative z-10 self-start mb-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1.5 border border-white/15 text-xs font-semibold text-white">
          <Sparkles className="w-3.5 h-3.5 text-[#6ecb5a]" />
          <span>KisanRakshak AI</span>
        </div>
      </div>

      {/* Hero Typography & CTA */}
      <div className="relative z-10 max-w-md space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-tight drop-shadow-md">
            YOUR FARM, <br />
            SMARTER.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/80 font-normal leading-relaxed">
            Monitor crop health, optimize resources, and increase yield with
            data-driven insights.
          </p>
        </div>

        {/* The Exact Reference "Get Started >>>" Button */}
        <div className="pt-3">
          <button
            onClick={onGetStarted}
            className="group flex w-full items-center justify-between rounded-full bg-[#58a447] py-3.5 pl-6 pr-2.5 text-white shadow-cta-glow transition-all hover:bg-[#4c923d] active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#132b1e] text-white transition-transform group-hover:scale-105">
                <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <span className="text-base font-bold tracking-wide ml-2">
                Get Started
              </span>
            </div>

            <div className="flex items-center text-white/70 group-hover:text-white transition-colors mr-2">
              <ChevronRight className="w-4 h-4 -mr-2" />
              <ChevronRight className="w-4 h-4 -mr-2" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
