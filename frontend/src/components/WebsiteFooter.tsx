"use client";

import React from "react";
import { Sprout, ShieldCheck, Heart } from "lucide-react";

export function WebsiteFooter() {
  return (
    <footer className="w-full bg-[#0d1e15] text-white/70 border-t border-white/10 mt-16 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#58a447] text-[#132b1e]">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                Kisan<span className="text-[#6ecb5a]">Rakshak</span> AI
              </span>
            </div>
            <p className="text-white/60 text-xs leading-relaxed max-w-md">
              Evidence-grounded crop intelligence platform built for Indian farmers.
              Combining multimodal vision, regional speech recognition, real-time agro-meteorology,
              and official ICAR/KVK verified guidance.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#6ecb5a] font-medium pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Compliant with CIBRC Pesticide Safety Regulations</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#scanner" className="hover:text-white transition-colors">
                  AI Crop Diagnosis Studio
                </a>
              </li>
              <li>
                <a href="#fields" className="hover:text-white transition-colors">
                  Field GIS & Crop Analytics
                </a>
              </li>
              <li>
                <a href="#radar" className="hover:text-white transition-colors">
                  Proactive Agro-Weather Radar
                </a>
              </li>
              <li>
                <a href="#advisories" className="hover:text-white transition-colors">
                  Official Advisory Registry
                </a>
              </li>
            </ul>
          </div>

          {/* Emergency & Agronomy Contacts */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Farmer Support & KVK
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-white/80">Kisan Call Centre: 1800-180-1551</li>
              <li className="text-white/80">Language: Hindi, Marathi, Telugu, English</li>
              <li>
                <a
                  href="https://icar.org.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6ecb5a] hover:underline"
                >
                  ICAR Official Portal ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/50">
          <p>© 2026 KisanRakshak AI — Made with care for farmers across India.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Terms of Advisory</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Safety Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
