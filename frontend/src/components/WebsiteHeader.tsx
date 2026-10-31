"use client";

import React, { useState } from "react";
import {
  Sprout,
  Languages,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  ScanEye,
  History,
  LogOut,
  LogIn,
} from "lucide-react";
import { ALL_INDIA_LANGUAGES } from "./LanguageModal";
import { getT } from "@/lib/translations";

export type WebsiteTab = "scan" | "dashboard" | "history";

interface WebsiteHeaderProps {
  activeTab: WebsiteTab;
  onTabChange: (tab: WebsiteTab) => void;
  currentLanguage: string;
  onOpenLanguageModal: () => void;
  isLoggedIn: boolean;
  userName: string;
  userLocation: string;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenLocationModal?: () => void;
}

export function WebsiteHeader({
  activeTab,
  onTabChange,
  currentLanguage,
  onOpenLanguageModal,
  isLoggedIn,
  userName,
  userLocation,
  onOpenAuth,
  onLogout,
  onOpenLocationModal,
}: WebsiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const t = getT(currentLanguage);
  const selectedLangObj = ALL_INDIA_LANGUAGES.find((l) => l.code === currentLanguage);

  const handleTabClick = (tab: WebsiteTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#e2eae1] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-18">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-8">
            <div
              onClick={() => handleTabClick("scan")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#132b1e] text-[#6ecb5a] shadow-sm group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold tracking-tight text-[#132b1e]">
                    Kisan<span className="text-[#58a447]">Rakshak</span>
                  </span>
                  <span className="rounded-full bg-[#eaf5e8] px-2 py-0.5 text-[10px] font-bold text-[#58a447] border border-[#58a447]/30">
                    AI Doctor
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 font-medium">
                  {t.navBrandSubtitle}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links: ONLY Scan Crop, Dashboard, History */}
            {isLoggedIn && (
              <nav className="hidden md:flex items-center gap-1.5">
                {/* 1. Primary Landing: Scan Crop */}
                <button
                  onClick={() => handleTabClick("scan")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeTab === "scan"
                      ? "bg-[#58a447] text-white shadow-cta-glow"
                      : "text-neutral-700 hover:text-[#132b1e] hover:bg-[#eaf5e8]"
                  }`}
                >
                  <ScanEye className="w-4 h-4" />
                  <span>{t.navScan}</span>
                </button>

                {/* 2. Dashboard */}
                <button
                  onClick={() => handleTabClick("dashboard")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeTab === "dashboard"
                      ? "bg-[#132b1e] text-white shadow-sm"
                      : "text-neutral-700 hover:text-[#132b1e] hover:bg-[#f4f7f4]"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t.navDashboard}</span>
                </button>

                {/* 3. History */}
                <button
                  onClick={() => handleTabClick("history")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeTab === "history"
                      ? "bg-[#132b1e] text-white shadow-sm"
                      : "text-neutral-700 hover:text-[#132b1e] hover:bg-[#f4f7f4]"
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>{t.navHistory}</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right: All-India Language Trigger + User / Auth */}
          <div className="flex items-center gap-3">
            {/* All-India Language Modal Trigger */}
            <button
              onClick={onOpenLanguageModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-[#f4f7f4] transition-colors"
              title="Change Language for All India"
            >
              <Languages className="w-3.5 h-3.5 text-[#58a447]" />
              <span className="font-bold text-[#132b1e]">
                {selectedLangObj ? selectedLangObj.nativeName : "हिन्दी"}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {/* If logged in: User Profile dropdown */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 border-l border-neutral-200 focus:outline-none"
                >
                  <div className="w-9 h-9 rounded-full bg-[#132b1e] text-white flex items-center justify-center text-xs font-bold ring-2 ring-[#58a447]/40 shadow-xs">
                    <span>{userName.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#132b1e] leading-tight">
                      {userName}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLocationModal?.();
                      }}
                      className="text-[10px] text-[#58a447] font-semibold hover:underline flex items-center gap-0.5 truncate max-w-[120px]"
                      title="Click to update live location"
                    >
                      <span>📍 {userLocation}</span>
                    </button>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-lg border border-neutral-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-xs font-bold text-[#132b1e]">{userName}</p>
                      <p className="text-[10px] text-neutral-500">{userLocation}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 font-semibold hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t.navLogout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* If not logged in: Login Button */
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 rounded-full bg-[#132b1e] px-5 py-2 text-xs font-bold text-white hover:bg-[#1c3b2b] shadow-sm transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-[#6ecb5a]" />
                <span>{t.navLogin}</span>
              </button>
            )}

            {/* Mobile Navigation Menu Toggle */}
            {isLoggedIn && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 text-[#132b1e]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && isLoggedIn && (
          <div className="md:hidden py-3 border-t border-neutral-100 space-y-1">
            <button
              onClick={() => handleTabClick("scan")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === "scan" ? "bg-[#58a447] text-white" : "text-neutral-700"
              }`}
            >
              <ScanEye className="w-4 h-4" />
              <span>{t.navScan}</span>
            </button>
            <button
              onClick={() => handleTabClick("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === "dashboard" ? "bg-[#132b1e] text-white" : "text-neutral-700"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t.navDashboard}</span>
            </button>
            <button
              onClick={() => handleTabClick("history")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === "history" ? "bg-[#132b1e] text-white" : "text-neutral-700"
              }`}
            >
              <History className="w-4 h-4" />
              <span>{t.navHistory}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
