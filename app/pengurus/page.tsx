"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import BaganStrukturOrganisasi from "@/components/pengurus/BaganStrukturOrganisasi";

export interface PengurusPosition {
  id: string;
  order: number;
  jabatan: string;
  jabatanEn?: string;
  kategori: string;
  subBidang?: string;
  warnaTag: string;
  nama: string;
  gelar?: string;
  noHpWa?: string;
  foto?: string;
  keterangan?: string;
  updatedAt?: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; badge: string; boxBg: string }> = {
  purple: {
    bg: "bg-purple-900/90",
    text: "text-white",
    border: "border-purple-700",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    boxBg: "bg-[#6d5b97] text-white border-[#55437d]",
  },
  green: {
    bg: "bg-[#48bca2]",
    text: "text-slate-900",
    border: "border-[#369f88]",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    boxBg: "bg-[#61c9b2] text-slate-900 border-[#3fa38d]",
  },
  blue: {
    bg: "bg-[#aee0fa]",
    text: "text-slate-900",
    border: "border-[#85c9ed]",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
    boxBg: "bg-[#bde8ff] text-slate-900 border-[#96d4f7]",
  },
  yellow: {
    bg: "bg-[#fff275]",
    text: "text-slate-900",
    border: "border-[#edd840]",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    boxBg: "bg-[#fff785] text-slate-900 border-[#e6d035]",
  },
  amber: {
    bg: "bg-[#fffae0]",
    text: "text-slate-900",
    border: "border-[#e0d696]",
    badge: "bg-yellow-100 text-yellow-900 border-yellow-300",
    boxBg: "bg-[#fffde8] text-slate-900 border-[#d9cc84]",
  },
  white: {
    bg: "bg-white",
    text: "text-slate-900",
    border: "border-slate-400",
    badge: "bg-slate-100 text-slate-800 border-slate-300",
    boxBg: "bg-white text-slate-900 border-slate-400",
  },
};

export default function PengurusPage() {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isEn = i18n.language === "en";

  // Data & State
  const [data, setData] = useState<PengurusPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("ALL");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/pengurus");
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setData(json.data);
            return;
          }
        }
        // Fallback directly to static json if API is unavailable
        const staticRes = await fetch("/data/pengurus.json");
        if (staticRes.ok) {
          const staticJson = await staticRes.json();
          setData(staticJson);
        }
      } catch (err) {
        console.error("Gagal memuat data pengurus:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Map of data by ID for quick chart lookups
  const dataMap = useMemo(() => {
    const map = new Map<string, PengurusPosition>();
    data.forEach((p) => map.set(p.id, p));
    return map;
  }, [data]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      if (item.kategori) set.add(item.kategori);
    });
    return Array.from(set);
  }, [data]);

  // Filtered list for table view
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedKategori !== "ALL" && item.kategori !== selectedKategori) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const j = (item.jabatan || "").toLowerCase();
        const n = (item.nama || "").toLowerCase();
        const s = (item.subBidang || "").toLowerCase();
        const k = (item.kategori || "").toLowerCase();
        return j.includes(q) || n.includes(q) || s.includes(q) || k.includes(q);
      }
      return true;
    });
  }, [data, selectedKategori, searchQuery]);

  // Statistics
  const filledCount = useMemo(() => data.filter((p) => Boolean((p.nama || "").trim())).length, [data]);

  // Helper render node for chart
  const renderChartBox = (id: string, customTitle?: string, customWidthClass?: string) => {
    const item = dataMap.get(id);
    if (!item) {
      return (
        <div className={`p-2.5 rounded-lg border text-center text-xs bg-slate-100 ${customWidthClass || "w-44"}`}>
          <span className="font-bold block uppercase">{customTitle || id}</span>
          <span className="text-[10px] text-slate-400 block mt-1">(Belum Terdaftar)</span>
        </div>
      );
    }

    const hasName = Boolean((item.nama || "").trim());
    const style = CATEGORY_STYLES[item.warnaTag] || CATEGORY_STYLES.blue;

    return (
      <div
        className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 text-center flex flex-col justify-between shadow-xs hover:shadow-md ${style.boxBg} ${
          customWidthClass || "w-full max-w-[210px]"
        }`}
      >
        <div className="mb-1.5">
          <span className="font-extrabold text-[11px] sm:text-xs block uppercase tracking-tight leading-tight">
            {customTitle || item.jabatan}
          </span>
          {item.subBidang && (
            <span className="text-[9px] opacity-75 block truncate">
              {item.subBidang}
            </span>
          )}
        </div>

        <div className="pt-1.5 border-t border-black/10 min-h-[32px] flex items-center justify-center">
          {hasName ? (
            <div className="flex flex-col items-center">
              <span className="font-black text-xs text-slate-950 block leading-tight">
                {item.nama}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-medium text-slate-600/80 italic flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              (Belum Ada Data)
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* ==================== NAVBAR ==================== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2 sm:mr-4 group">
            <img
              src="/images/Logo GGP2.png"
              alt="Logo GGP"
              className="h-8 sm:h-10 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-extrabold text-xs sm:text-base tracking-tight text-slate-900 leading-tight truncate block">
                Gereja Gerakan Pentakosta
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide hidden sm:block truncate">
                Sinode Majelis Pusat (2021 – 2026)
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (lg+) */}
          <nav className="hidden lg:flex items-center gap-1 sm:gap-4 shrink-0">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
            >
              {t("nav.home")}
            </Link>
            <span className="px-3 py-1.5 rounded-lg text-sm font-bold text-blue-700 bg-blue-50">
              {t("nav.leadership")}
            </span>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
            >
              {t("nav.dashboard")}
            </Link>

            <div className="ml-2">
              <LanguageSwitcher variant="compact" />
            </div>
          </nav>

          {/* Mobile Hamburger Button (< lg) */}
          <div className="flex lg:hidden items-center shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileMenuOpen}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer border ${
                mobileMenuOpen
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50 border-blue-500"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-5 w-5">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop (< lg) */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-[1300] bg-slate-950/65 backdrop-blur-xs lg:hidden cursor-pointer animate-fade-in"
        />
      )}

      {/* Mobile Navigation Drawer (< lg) */}
      <div
        className={`fixed inset-y-0 right-0 z-[1310] w-[290px] max-w-[85vw] bg-[#0c1731] border-l border-white/10 shadow-2xl flex flex-col p-5 text-white transition-transform duration-300 ease-out lg:hidden overflow-y-auto thin-scroll ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img
              src="/images/Logo GGP2.png"
              alt="Logo GGP"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div>
              <span className="font-bold text-sm text-white block leading-tight">
                Gereja Gerakan Pentakosta
              </span>
              <span className="text-[10px] text-blue-300 block">
                Menu Navigasi
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Tutup menu navigasi"
            className="rounded-xl p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <div className="py-4 space-y-1.5 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-2">
            Menu Utama
          </span>

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-blue-400 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span>{t("nav.home")}</span>
          </Link>

          <Link
            href="/pengurus"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-md shadow-blue-600/30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-emerald-400 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span>{t("nav.leadership")}</span>
          </Link>

          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-blue-400 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <span>{t("nav.dashboard")}</span>
          </Link>

          <div className="pt-3 mt-3 border-t border-white/10 px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Bahasa / Language
            </span>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>
      </div>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f1d3d] via-slate-900 to-slate-900 text-white py-14 sm:py-18 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Breadcrumb */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-widest mb-3">
            <Link href="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-amber-400">Majelis Pusat</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wider uppercase mb-5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            STRUKTUR ORGANISASI SINODE
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-3 font-outfit uppercase">
            Majelis Pusat Gereja Gerakan Pentakosta
          </h1>

          <div className="inline-block px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-sm font-bold tracking-wide mb-6">
            Periode Pelayanan 2021 – 2026
          </div>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
            Bagan hierarki kepengurusan dan tata kelola pelayanan Majelis Pusat Gereja Gerakan Pentakosta (GGP) di tingkat nasional.
          </p>

          {/* Controls: Mode Switcher & Admin Link */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/20 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setViewMode("chart")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  viewMode === "chart"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span>Bagan Struktur Visual</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Tabel & Direktori ({data.length})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* ==================== LEGEND BAR (TABLE VIEW) ==================== */}
        {viewMode === "table" && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Keterangan Warna Hierarki Bagan
              </span>
              <span className="text-xs text-slate-500">
                Total <strong>{data.length}</strong> Posisi Jabatan • <strong>{filledCount}</strong> Terisi
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-[#9186b0] border border-slate-900 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Sidang Raya</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-[#74c8ae] border border-slate-900 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Majelis Harian Pusat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-[#aee0fa] border border-slate-900 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Majelis Lengkap</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-[#fffde8] border border-slate-900 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Dewan Pembina</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-[#fff736] border border-slate-900 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Sekretariat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-white border border-slate-900 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Badan Pengawas</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== VIEW 1: EXACT 1:1 INTERACTIVE CHART VIEW ==================== */}
        {viewMode === "chart" && (
          <BaganStrukturOrganisasi dataMap={dataMap} />
        )}

        {/* ==================== VIEW 2: TABLE & DIRECTORY VIEW ==================== */}
        {viewMode === "table" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari jabatan atau nama pejabat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">Semua Kategori ({data.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c} ({data.filter((d) => d.kategori === c).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Table View */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
              {filteredData.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-sm font-semibold text-slate-600">Tidak ada jabatan yang sesuai pencarian.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4 w-12 text-center">No</th>
                        <th className="py-3.5 px-4">Jabatan Struktur</th>
                        <th className="py-3.5 px-4">Kategori & Naungan</th>
                        <th className="py-3.5 px-6">Nama Pejabat</th>
                        <th className="py-3.5 px-4">Deskripsi / Peranan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredData.map((item, idx) => {
                        const hasName = Boolean((item.nama || "").trim());
                        const colorStyle = CATEGORY_STYLES[item.warnaTag] || CATEGORY_STYLES.blue;

                        return (
                          <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                            <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {item.jabatan}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${colorStyle.badge}`}>
                                {item.kategori}
                              </span>
                            </td>
                            <td className="py-3.5 px-6">
                              {hasName ? (
                                <span className="font-extrabold text-slate-900 block">
                                  {item.nama}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  (Belum Ada Data)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                              {item.keterangan || item.subBidang || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 mt-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <img src="/images/Logo GGP2.png" alt="Logo GGP" className="h-8 w-auto object-contain" />
            <span>&copy; {new Date().getFullYear()} PENTAKOSTA • Sinode Gereja Gerakan Pentakosta. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <Link href="/pengurus" className="text-blue-400 font-semibold">
              Pengurus Pusat
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard Peta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
