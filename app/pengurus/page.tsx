"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import SiteFooter from "@/components/layout/SiteFooter";
import { useTranslation } from "react-i18next";
import { leadershipText, localizeLeadership } from "@/lib/leadership-language";
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
  const isEn = i18n.language === "en";
  const l = (text: string) => leadershipText(text, isEn);
  useEffect(() => { document.title = isEn ? "Central Leadership | GGP" : "Pengurus Pusat | GGP"; }, [isEn]);

  // Data & State
  const [data, setData] = useState<PengurusPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

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
    data.forEach((p) => map.set(p.id, localizeLeadership(p, isEn)));
    return map;
  }, [data, isEn]);

  const tableData = useMemo(() => data.filter((item) => item.id !== "sidang-raya"), [data]);

  // Helper render node for chart
  const renderChartBox = (id: string, customTitle?: string, customWidthClass?: string) => {
    const item = dataMap.get(id);
    if (!item) {
      return (
        <div className={`p-2.5 rounded-lg border text-center text-xs bg-slate-100 ${customWidthClass || "w-44"}`}>
          <span className="font-bold block uppercase">{customTitle || id}</span>
          <span className="text-[10px] text-slate-400 block mt-1">{l("(Belum Terdaftar)")}</span>
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
              <span className="font-normal text-xs text-slate-950 block leading-tight">
                {item.nama}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-medium text-slate-600/80 italic flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {l("(Belum Ada Data)")}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
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
            <span className="text-amber-400">{l("Majelis Pusat")}</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wider uppercase mb-5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {l("STRUKTUR ORGANISASI SINODE")}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-3 font-outfit uppercase">
            {l("Majelis Pusat Gereja Gerakan Pentakosta")}
          </h1>

          <div className="inline-block px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-sm font-bold tracking-wide mb-6">
            {l("Periode Pelayanan 2021 – 2026")}
          </div>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
            {l("Bagan hierarki kepengurusan dan tata kelola pelayanan Majelis Pusat Gereja Gerakan Pentakosta (GGP) di tingkat nasional.")}
          </p>

          {/* View mode */}
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
                <span>{l("Bagan Struktur Visual")}</span>
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
                <span>{l("Tabel & Direktori")} ({data.length})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* ==================== VIEW 1: EXACT 1:1 INTERACTIVE CHART VIEW ==================== */}
        {viewMode === "chart" && (
          <BaganStrukturOrganisasi dataMap={dataMap} />
        )}

        {/* ==================== VIEW 2: TABLE & DIRECTORY VIEW ==================== */}
        {viewMode === "table" && (
          <div className="space-y-6">
            {/* Table View */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
              {tableData.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-sm font-semibold text-slate-600">{isEn ? "No positions available." : "Belum ada data jabatan."}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4 w-12 text-center">No</th>
                        <th className="py-3.5 px-4">{l("Jabatan Struktur")}</th>
                        <th className="py-3.5 px-4">{l("Kategori & Naungan")}</th>
                        <th className="py-3.5 px-6">{l("Nama Pejabat")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tableData.map((sourceItem, idx) => {
                        const item = localizeLeadership(sourceItem, isEn);
                        const hasName = Boolean((item.nama || "").trim());

                        return (
                          <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                            <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {item.jabatan}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">
                              {item.kategori}
                            </td>
                            <td className="py-3.5 px-6">
                              {hasName ? (
                                <span className="font-normal text-slate-900 block whitespace-pre-line leading-relaxed">
                                  {item.nama}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  {l("(Belum Ada Data)")}
                                </span>
                              )}
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

        <div className="flex justify-center">
          <Link
            href="/sejarah"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            {t("nav.history")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>

      {/* ==================== FOOTER ==================== */}
      <SiteFooter />
    </div>
  );
}
