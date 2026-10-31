"use client";

import React, { useState } from "react";
import {
  History,
  ShieldCheck,
  Volume2,
  Calendar,
  ChevronRight,
  Sprout,
  Plus,
  Play,
  Pause,
  Info,
} from "lucide-react";
import { ScanResult } from "./ScanStudio";
import { getT } from "@/lib/translations";

interface HistoryViewProps {
  reports: ScanResult[];
  onScanNew: () => void;
  selectedLanguage?: string;
}

export function HistoryView({ reports, onScanNew, selectedLanguage = "hi" }: HistoryViewProps) {
  const t = getT(selectedLanguage);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const toggleAudio = (report: ScanResult) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Voice playback is not supported on this browser.");
      return;
    }

    if (playingId === report.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(report.voiceText);
    utterance.rate = 0.9;
    utterance.lang = selectedLanguage === "en" ? "en-IN" : "hi-IN";

    utterance.onstart = () => setPlayingId(report.id);
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-xs border border-neutral-200/80">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf5e8] text-[#58a447]">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#132b1e] tracking-tight">
              {t.historyTitle}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {t.historySubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={onScanNew}
          className="inline-flex items-center gap-2 rounded-full bg-[#58a447] px-5 py-2.5 text-xs font-bold text-white shadow-cta-glow hover:bg-[#4c923d] transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#6ecb5a]" />
          <span>{t.btnScanNew}</span>
        </button>
      </div>

      {/* Empty State when no scans performed yet */}
      {reports.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center shadow-xs border border-neutral-200/80 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#f4f7f4] text-neutral-400 flex items-center justify-center mx-auto">
            <Sprout className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#132b1e]">{t.historyTitle}</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {t.historyEmpty}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onScanNew}
              className="inline-flex items-center gap-2 rounded-full bg-[#58a447] px-6 py-3 text-xs font-bold text-white shadow-cta-glow hover:bg-[#4c923d] transition-all"
            >
              <Plus className="w-4 h-4 text-[#6ecb5a]" />
              <span>{t.btnScanNew}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Real Dynamic Reports List */
        <div className="space-y-4">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-neutral-200/80 hover:border-[#58a447]/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-extrabold text-[#132b1e]">
                    {rep.crop}
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="text-xs font-bold text-neutral-500">
                    {rep.id}
                  </span>
                  <span className="rounded-full bg-[#eaf5e8] px-2.5 py-0.5 text-[10px] font-bold text-[#58a447] border border-[#58a447]/30">
                    ICAR Verified ({rep.probability})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{rep.date}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-[#132b1e]">
                {rep.diseaseName}
              </h3>
              <p className="text-xs text-neutral-500 italic mt-0.5">
                Pathogen: {rep.scientificName}
              </p>

              {/* Text Remedies */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-[#f4f7f4] p-3 border border-neutral-200">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                    {t.resultCulturalTitle}:
                  </span>
                  <p className="mt-1 text-neutral-800 font-medium">
                    {rep.culturalRemedy}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#eaf5e8]/60 p-3 border border-[#58a447]/30">
                  <span className="text-[10px] uppercase font-bold text-[#132b1e] block">
                    {t.resultChemicalTitle}:
                  </span>
                  <p className="mt-1 text-neutral-900 font-semibold">
                    {rep.chemicalRemedy}
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    Dosage: {rep.dosage}
                  </p>
                </div>
              </div>

              {/* Voice Audio Playback Bar */}
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <button
                  onClick={() => toggleAudio(rep)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#58a447] hover:underline"
                >
                  {playingId === rep.id ? (
                    <>
                      <Pause className="w-4 h-4 text-[#e5533d]" />
                      <span className="text-[#e5533d] font-bold">Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-[#58a447]" />
                      <span>{t.historyListenAloud}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onScanNew}
                  className="flex items-center gap-1 text-xs font-bold text-[#132b1e] hover:text-[#58a447] transition-colors"
                >
                  <span>Re-Scan</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
