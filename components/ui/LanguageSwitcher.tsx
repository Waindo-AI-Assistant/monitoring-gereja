"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "@/lib/i18n";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "navbar" | "compact" | "drawer";
}

export default function LanguageSwitcher({
  className = "",
  variant = "navbar",
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [currentLang, setCurrentLang] = useState<string>("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentLang(i18n.language || "id");

    const handleLanguageChanged = (lng: string) => {
      setCurrentLang(lng);
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n]);

  const toggleLanguage = () => {
    const nextLang = currentLang === "id" ? "en" : "id";
    setAppLanguage(nextLang);
    setCurrentLang(nextLang);
  };

  const handleSelect = (lang: "id" | "en") => {
    if (lang !== currentLang) {
      setAppLanguage(lang);
      setCurrentLang(lang);
    }
  };

  if (!mounted) {
    // Avoid hydration mismatch by rendering a stable placeholder
    return (
      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/40 border border-amber-500/30 text-xs font-semibold text-white/80 ${className}`}>
        <span className="w-3.5 h-3.5 rounded-full bg-amber-400/40 animate-pulse" />
        <span>ID</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        title={currentLang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/80 border border-amber-400/30 hover:border-amber-400/60 text-xs font-bold text-slate-100 transition-all shadow-xs cursor-pointer ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="w-3.5 h-3.5 text-amber-400"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
        </svg>
        <span className="text-[11px] font-black tracking-wider text-amber-300">
          {currentLang.toUpperCase()}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl bg-slate-950/40 backdrop-blur-md border border-amber-400/30 shadow-xs shadow-black/20 ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => handleSelect("id")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          currentLang === "id"
            ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-xs shadow-amber-500/30 ring-1 ring-amber-300/40"
            : "text-slate-200 hover:text-white hover:bg-white/10"
        }`}
        title="Bahasa Indonesia"
      >
        <span>🇮🇩</span>
        <span className="text-[11px] font-bold">ID</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("en")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          currentLang === "en"
            ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-xs shadow-amber-500/30 ring-1 ring-amber-300/40"
            : "text-slate-200 hover:text-white hover:bg-white/10"
        }`}
        title="English"
      >
        <span>🇬🇧</span>
        <span className="text-[11px] font-bold">EN</span>
      </button>
    </div>
  );
}
