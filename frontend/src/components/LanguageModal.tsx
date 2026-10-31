"use client";

import React, { useState } from "react";
import { Languages, Search, Check, X, Sparkles } from "lucide-react";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  region: string;
}

export const ALL_INDIA_LANGUAGES: LanguageOption[] = [
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "North & Central India" },
  { code: "en", name: "English", nativeName: "English", region: "Pan-India" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", region: "Andhra Pradesh & Telangana" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", region: "Maharashtra" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", region: "Tamil Nadu & Puducherry" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "West Bengal & Tripura" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", region: "Gujarat" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", region: "Karnataka" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", region: "Kerala" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", region: "Punjab & Haryana" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", region: "Odisha" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", region: "Assam & North East" },
];

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
}

export function LanguageModal({
  isOpen,
  onClose,
  selectedLanguage,
  onSelectLanguage,
}: LanguageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredLanguages = ALL_INDIA_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Top Header */}
        <div className="bg-[#132b1e] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#58a447] text-[#132b1e]">
              <Languages className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6ecb5a]">
              Pan-India Support (अखिल भारतीय भाषाएं)
            </span>
          </div>

          <h2 className="text-xl font-bold text-white">
            Choose Your Language (अपनी भाषा चुनें)
          </h2>
          <p className="text-xs text-white/70 mt-1">
            Voice recommendations and advisory texts will be read aloud in your chosen language.
          </p>

          {/* Search Box */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by language or state (e.g. Hindi, Punjab, Tamil)..."
              className="w-full text-xs rounded-full bg-white/10 border border-white/20 pl-9 pr-4 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#58a447] focus:bg-white/20 transition-all"
            />
          </div>
        </div>

        {/* Languages Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredLanguages.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? "bg-[#eaf5e8] border-[#58a447] shadow-xs"
                      : "bg-white border-neutral-200 hover:border-neutral-300 hover:bg-[#f4f7f4]"
                  }`}
                >
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-[#132b1e]">
                        {lang.nativeName}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium">
                        ({lang.name})
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">
                      {lang.region}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#58a447] text-white">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <p className="text-center py-8 text-xs text-neutral-500">
              No language found matching &quot;{searchQuery}&quot;.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            Selected: <strong className="text-[#132b1e]">{ALL_INDIA_LANGUAGES.find((l) => l.code === selectedLanguage)?.nativeName}</strong>
          </span>
          <button
            onClick={onClose}
            className="rounded-full bg-[#132b1e] text-white px-5 py-2 font-bold hover:bg-[#1c3b2b] transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
