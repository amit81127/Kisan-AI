"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sprout,
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  X,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Inbox,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; phone?: string; location?: string }) => void;
  initialMode?: "login" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // References to the 6 individual OTP input boxes for automatic focus movement
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 45-Second countdown timer for Resend OTP button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus the first OTP box when OTP screen appears
  useEffect(() => {
    if (otpSent && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [otpSent]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const res = await api.requestOtp(
        cleanEmail,
        mode === "signup" ? (name.trim() || undefined) : undefined
      );

      setOtpSent(true);
      setOtpDigits(["", "", "", "", "", ""]);
      setCooldown(res.cooldown_seconds || 45);
      setStatusMsg(
        res.message || `Verification code sent to ${cleanEmail}. Please check your inbox (and spam folder).`
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send verification code. Please check your email address.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setIsResending(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const res = await api.resendOtp(cleanEmail);
      setOtpDigits(["", "", "", "", "", ""]);
      setCooldown(res.cooldown_seconds || 45);
      setStatusMsg(
        res.message || `A fresh 6-digit verification code has been dispatched to ${cleanEmail}.`
      );
      // Focus first digit
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend verification code. Please wait before retrying.");
    } finally {
      setIsResending(false);
    }
  };

  // Handle single digit input and auto-advance to next box
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    const digit = cleaned.slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    // Auto-advance to next input box
    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation between boxes
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle pasting full 6-digit code into any box
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtpDigits(updated);

    // Focus on the next empty box or the last box
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const fullOtp = otpDigits.join("").trim();

    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Verify 6-digit OTP code received via email
      const verifyRes = await api.verifyOtp(cleanEmail, fullOtp);

      // 2. If new farmer registration with custom name, update profile
      if (mode === "signup" && name.trim()) {
        try {
          const signupRes = await api.signup({
            name: name.trim(),
            email: cleanEmail,
            location: "India",
            preferred_language: "hi",
          });
          onLoginSuccess(signupRes.farmer);
          return;
        } catch {
          // verifyRes already authenticated farmer
        }
      }

      onLoginSuccess(verifyRes.farmer);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired verification code. Please check your email.");
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpComplete = otpDigits.join("").length === 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Modal Top Header with Lush Agro Glass banner */}
        <div className="bg-[#132b1e] p-6 text-white relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#58a447] text-[#132b1e]">
              <Sprout className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-base font-extrabold text-white tracking-tight">
              Kisan<span className="text-[#6ecb5a]">Rakshak</span> AI
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mt-1">
            {mode === "login" ? "Email Sign In (ईमेल द्वारा लॉगिन)" : "Farmer Sign Up (नया पंजीकरण)"}
          </h2>
          <p className="text-xs text-white/70 mt-1">
            {mode === "login"
              ? "We will send a 6-digit verification code to your registered email address."
              : "Register your name and email to receive your verification code."}
          </p>

          {/* Interactive Mode Switcher Tabs */}
          <div className="mt-4 flex rounded-full bg-black/35 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setOtpSent(false);
                setErrorMsg(null);
                setStatusMsg(null);
                setOtpDigits(["", "", "", "", "", ""]);
              }}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-[#58a447] text-white shadow-xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Email Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setOtpSent(false);
                setErrorMsg(null);
                setStatusMsg(null);
                setOtpDigits(["", "", "", "", "", ""]);
              }}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-[#58a447] text-white shadow-xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              New Register
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={otpSent ? handleVerify : handleSendOtp} className="p-6 space-y-4">
          {/* Error Alert */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Status Alert when code is sent */}
          {statusMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-[#eaf5e8] p-3.5 text-xs text-[#132b1e] border border-[#58a447]/30">
              <Inbox className="w-4 h-4 shrink-0 text-[#58a447] mt-0.5" />
              <div>
                <p className="font-semibold text-[#132b1e]">{statusMsg}</p>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  Valid for 5 minutes only. Please check your inbox and spam folder.
                </p>
              </div>
            </div>
          )}

          {/* SIGN UP NAME FIELD */}
          {mode === "signup" && !otpSent && (
            <div>
              <label className="block text-xs font-bold text-[#132b1e] mb-1">
                Full Name (किसान का पूरा नाम)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full text-xs rounded-xl bg-[#f4f7f4] border border-neutral-200 pl-9 pr-3 py-2.5 text-[#132b1e] font-medium focus:outline-none focus:ring-2 focus:ring-[#58a447]"
                />
              </div>
            </div>
          )}

          {/* EMAIL ADDRESS FIELD */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#132b1e]">
                Farmer Email Address (ईमेल पता)
              </label>
              {otpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpDigits(["", "", "", "", "", ""]);
                    setStatusMsg(null);
                    setErrorMsg(null);
                  }}
                  className="text-[11px] font-semibold text-[#58a447] hover:underline cursor-pointer"
                >
                  Change Email
                </button>
              )}
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                disabled={otpSent}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. farmer@example.com"
                className="w-full text-xs rounded-xl bg-[#f4f7f4] border border-neutral-200 pl-9 pr-3 py-2.5 text-[#132b1e] font-semibold focus:outline-none focus:ring-2 focus:ring-[#58a447] disabled:opacity-85"
              />
            </div>

            {!otpSent && (
              <p className="text-[11px] text-neutral-500 mt-1">
                A 6-digit OTP will be sent directly to this email address.
              </p>
            )}
          </div>

          {/* SIX-DIGIT OTP INPUT WITH AUTOMATIC FOCUS MOVEMENT */}
          {otpSent && (
            <div className="bg-[#f4f7f4] p-4 sm:p-5 rounded-2xl border border-neutral-200 space-y-3 animate-in fade-in duration-200">
              <div className="text-center">
                <label className="block text-xs font-bold text-[#132b1e]">
                  Enter 6-Digit Code (ईमेल पर आया 6-अंकों का कोड)
                </label>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Sent to <strong className="text-[#132b1e]">{email}</strong>
                </p>
              </div>

              {/* 6 Individual Digit Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 pt-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-extrabold text-[#132b1e] bg-white border-2 border-neutral-200 rounded-xl focus:border-[#58a447] focus:ring-2 focus:ring-[#58a447]/30 outline-none transition-all shadow-xs"
                  />
                ))}
              </div>

              {/* Countdown & Resend Button Row */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200/80">
                <span className="text-[11px] text-neutral-500">
                  ⏱️ Expires in 5 minutes
                </span>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isResending}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    cooldown > 0 || isResending
                      ? "text-neutral-400 cursor-not-allowed"
                      : "text-[#58a447] hover:text-[#428633] underline"
                  }`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
                  {isResending ? (
                    <span>Sending code...</span>
                  ) : cooldown > 0 ? (
                    <span>Resend OTP ({cooldown}s)</span>
                  ) : (
                    <span>Resend OTP (पुनः भेजें)</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            {!otpSent ? (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#58a447] py-3.5 text-xs font-bold text-white shadow-cta-glow hover:bg-[#4c923d] active:scale-98 transition-all disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code to Email...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code (ईमेल पर कोड भेजें)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || !isOtpComplete}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#132b1e] py-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#1c3b2b] active:scale-98 transition-all disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#6ecb5a]" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#6ecb5a]" />
                    <span>Verify & Continue (सत्यापित करें)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Privacy Note */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#58a447]" />
            <span>Secure 256-bit Encrypted Email Delivery • KisanRakshak AI</span>
          </div>
        </form>
      </div>
    </div>
  );
}
