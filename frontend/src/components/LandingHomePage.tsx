"use client";

import React from "react";
import {
  Sprout,
  Camera,
  Mic,
  Volume2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  Languages,
  Activity,
} from "lucide-react";
import { getT } from "@/lib/translations";

interface LandingHomePageProps {
  onOpenAuth: (mode?: "login" | "signup") => void;
  onOpenLanguage: () => void;
  currentLanguage: string;
}

export function LandingHomePage({
  onOpenAuth,
  onOpenLanguage,
  currentLanguage,
}: LandingHomePageProps) {
  const t = getT(currentLanguage);

  return (
    <div className="w-full space-y-16 py-6 sm:py-10">
      {/* 1. HERO SECTION */}
      <section className="relative rounded-4xl bg-gradient-to-br from-[#132b1e] via-[#1c3b2b] to-[#0d1e15] text-white p-7 sm:p-12 lg:p-16 shadow-2xl border border-white/10 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#58a447]/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-[#6ecb5a]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#6ecb5a] border border-white/15">
              <Sparkles className="w-4 h-4" />
              <span>{t.heroBadge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {t.heroTitle} <br />
              <span className="text-[#6ecb5a]">{t.heroTitleAccent}</span>
            </h1>

            <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl font-normal">
              {t.heroSubtitle}
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => onOpenAuth("signup")}
                className="flex items-center justify-center gap-3 rounded-full bg-[#58a447] py-4 px-8 text-white font-extrabold text-sm sm:text-base shadow-cta-glow hover:bg-[#4c923d] active:scale-98 transition-all"
              >
                <span>{t.btnStartDiagnosis}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => onOpenAuth("login")}
                className="flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md py-4 px-7 text-white text-sm font-bold border border-white/15 transition-colors"
              >
                <span>{t.btnSignIn}</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6ecb5a]" />
                <span>{t.trustCibrc}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6ecb5a]" />
                <span>{t.trustDialects}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6ecb5a]" />
                <span>{t.trustZeroHallucination}</span>
              </div>
            </div>
          </div>

          {/* Right Visual Simulator Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl glass-field p-5 sm:p-6 shadow-glass-dark border border-white/15 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#6ecb5a] animate-ping" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Diagnostic Simulator
                  </span>
                </div>
                <span className="text-[10px] text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full">
                  AI Active
                </span>
              </div>

              {/* Sample Photo & Symptoms */}
              <div className="flex items-center gap-3 bg-black/30 p-3 rounded-2xl border border-white/10">
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=300&q=80"
                    alt="Crop leaf sample"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-[#6ecb5a] uppercase">
                    {t.resultAutoDetected} Tomato (टमाटर)
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    Early Blight (अगेती झुलसा)
                  </h4>
                  <p className="text-[11px] text-white/70">
                    Match Confidence: <strong className="text-[#6ecb5a]">95%</strong>
                  </p>
                </div>
              </div>

              {/* Sample Voice & Text Output */}
              <div className="rounded-2xl bg-white/10 p-3.5 space-y-2 border border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-[#6ecb5a]" />
                    <span>{t.resultListenVoice}</span>
                  </span>
                  <span className="text-[10px] text-[#6ecb5a] font-semibold">Playing Aloud</span>
                </div>
                <p className="text-xs text-white/90 italic leading-relaxed bg-black/20 p-2.5 rounded-xl">
                  &quot;निचली पत्तियों को काटकर नष्ट करें। मैंकोजेब 75% WP, 2 ग्राम प्रति लीटर पानी में मिलाकर छिड़कें...&quot;
                </p>
              </div>

              {/* Sample Approved Spray */}
              <div className="rounded-2xl bg-[#58a447]/20 border border-[#58a447]/50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#6ecb5a]">Approved Chemical Spray:</span>
                  <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded text-white font-mono">
                    ICAR-UP-2026
                  </span>
                </div>
                <p className="text-white font-semibold mt-1">Mancozeb 75% WP @ 2.0g/L water</p>
                <p className="text-[10px] text-white/70 mt-0.5">Wait 7 days before picking fruit.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#58a447]">
            Simple & Accessible Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#132b1e] tracking-tight">
            {t.howItWorksTitle}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600">
            {t.howItWorksSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="rounded-3xl bg-white p-7 shadow-xs border border-neutral-200/80 hover:border-[#58a447]/40 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf5e8] text-[#58a447]">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-3xl font-black text-neutral-200">01</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#132b1e]">{t.step1Title}</h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                {t.step1Desc}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl bg-white p-7 shadow-xs border border-neutral-200/80 hover:border-[#58a447]/40 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf5e8] text-[#58a447]">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-3xl font-black text-neutral-200">02</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#132b1e]">{t.step2Title}</h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                {t.step2Desc}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl bg-white p-7 shadow-xs border border-neutral-200/80 hover:border-[#58a447]/40 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf5e8] text-[#58a447]">
                <Volume2 className="w-6 h-6" />
              </div>
              <span className="text-3xl font-black text-neutral-200">03</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#132b1e]">{t.step3Title}</h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                {t.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE ADVANTAGES */}
      <section className="rounded-4xl bg-white p-8 sm:p-12 shadow-xs border border-neutral-200/80 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#58a447]">
            Built with Agricultural Integrity
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#132b1e] tracking-tight">
            Why Indian Farmers Rely on KisanRakshak AI
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="p-5 rounded-2xl bg-[#f4f7f4] border border-neutral-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#58a447] text-white flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#132b1e]">{t.trustCibrc}</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Every chemical dosage maps 1:1 to audited Central Insecticides Board (CIBRC) registered labels.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#f4f7f4] border border-neutral-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#58a447] text-white flex items-center justify-center mx-auto shadow-sm">
              <Languages className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#132b1e]">{t.trustDialects}</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Designed for high spoken inclusivity across Hindi, Marathi, Telugu, Tamil, Bengali, and more.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#f4f7f4] border border-neutral-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#58a447] text-white flex items-center justify-center mx-auto shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#132b1e]">Weather Grounded</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Accounts for humidity, rainfall forecasts, and temperature before recommending spray timings.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#f4f7f4] border border-neutral-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#58a447] text-white flex items-center justify-center mx-auto shadow-sm">
              <Volume2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#132b1e]">Dual Audio Playback</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Listen to the diagnosis spoken clearly aloud with variable speed controls for easy listening.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION BANNER */}
      <section className="rounded-3xl bg-[#132b1e] p-8 sm:p-12 text-white text-center space-y-5 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="max-w-xl mx-auto space-y-3 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ready to Protect Your Crops Today?
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Join thousands of farmers using AI-powered crop intelligence. No cost, simple mobile access,
            and reliable advice whenever you need it.
          </p>
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth("signup")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#58a447] py-3.5 px-8 text-white font-extrabold text-sm shadow-cta-glow hover:bg-[#4c923d] active:scale-98 transition-all"
            >
              <span>{t.btnStartDiagnosis}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth("login")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 py-3.5 px-8 text-white font-bold text-sm border border-white/15 transition-colors"
            >
              <span>{t.btnSignIn}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
