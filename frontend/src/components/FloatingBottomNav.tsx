"use client";

import React from "react";
import { Home, Sprout, Plus, FileText, User } from "lucide-react";

export type NavTab = "home" | "fields" | "reports" | "profile";

interface FloatingBottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export function FloatingBottomNav({
  activeTab,
  onTabChange,
  onOpenScanner,
}: FloatingBottomNavProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-6 sm:gap-8 rounded-full glass-nav px-7 py-3 shadow-nav-glow max-w-md w-full">
        {/* Home */}
        <button
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "home"
              ? "text-[#6ecb5a] font-semibold scale-105"
              : "text-white/60 hover:text-white"
          }`}
          aria-label="Home"
        >
          <div className="relative">
            <Home className="w-5 h-5" />
            {activeTab === "home" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6ecb5a]" />
            )}
          </div>
          <span className="text-[10px] tracking-wide">Home</span>
        </button>

        {/* Fields */}
        <button
          onClick={() => onTabChange("fields")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "fields"
              ? "text-[#6ecb5a] font-semibold scale-105"
              : "text-white/60 hover:text-white"
          }`}
          aria-label="Fields"
        >
          <div className="relative">
            <Sprout className="w-5 h-5" />
            {activeTab === "fields" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6ecb5a]" />
            )}
          </div>
          <span className="text-[10px] tracking-wide">Fields</span>
        </button>

        {/* Center Floating Action Button (Scan / Add) */}
        <button
          onClick={onOpenScanner}
          className="relative -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#6ecb5a] text-[#132b1e] shadow-cta-glow transition-all hover:scale-110 active:scale-95 group focus:outline-none"
          aria-label="Scan Crop or Add Field"
          title="Scan Crop with AI"
        >
          <Plus className="w-7 h-7 stroke-[2.5] transition-transform group-hover:rotate-90 duration-300" />
          <span className="sr-only">Scan or Add</span>
        </button>

        {/* Reports / Document */}
        <button
          onClick={() => onTabChange("reports")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "reports"
              ? "text-[#6ecb5a] font-semibold scale-105"
              : "text-white/60 hover:text-white"
          }`}
          aria-label="Reports"
        >
          <div className="relative">
            <FileText className="w-5 h-5" />
            {activeTab === "reports" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6ecb5a]" />
            )}
          </div>
          <span className="text-[10px] tracking-wide">Reports</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onTabChange("profile")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "profile"
              ? "text-[#6ecb5a] font-semibold scale-105"
              : "text-white/60 hover:text-white"
          }`}
          aria-label="Profile"
        >
          <div className="relative">
            <User className="w-5 h-5" />
            {activeTab === "profile" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6ecb5a]" />
            )}
          </div>
          <span className="text-[10px] tracking-wide">Profile</span>
        </button>
      </nav>
    </div>
  );
}
