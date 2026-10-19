"use client";

import React, { useState } from "react";

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

interface BaganStrukturProps {
  dataMap: Map<string, PengurusPosition>;
}

export default function BaganStrukturOrganisasi({ dataMap }: BaganStrukturProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedPosition, setSelectedPosition] = useState<PengurusPosition | null>(null);

  const getPosition = (id: string, fallbackTitle: string, defaultKategori: string = "Majelis Lengkap") => {
    return (
      dataMap.get(id) || {
        id,
        order: 99,
        jabatan: fallbackTitle,
        kategori: defaultKategori,
        warnaTag: "blue",
        nama: "",
      }
    );
  };

  // Render individual card node in chart
  const renderBox = (
    id: string,
    title: string,
    colorStyle: { bg: string; border: string; text: string },
    options: {
      width?: string;
      minHeight?: string;
      isHeader?: boolean;
      defaultKategori?: string;
    } = {}
  ) => {
    const item = getPosition(id, title, options.defaultKategori);
    const hasName = Boolean((item.nama || "").trim());

    return (
      <div
        onClick={() => setSelectedPosition(item)}
        style={{
          backgroundColor: colorStyle.bg,
          borderColor: colorStyle.border,
          color: colorStyle.text,
        }}
        className={`w-full rounded-sm border-[1.5px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 cursor-pointer hover:shadow-md hover:scale-[1.02] flex flex-col justify-center text-center select-none relative group px-2 py-1.5 ${
          options.minHeight || "min-h-[42px]"
        }`}
        title={`Klik untuk detail: ${item.jabatan}${hasName ? ` (${item.nama})` : " (Belum Ada Data)"}`}
      >
        <span
          className={`font-black uppercase tracking-tight block leading-tight ${
            options.isHeader ? "text-xs sm:text-sm tracking-wide" : "text-[10px] sm:text-[10.5px]"
          }`}
        >
          {item.jabatan || title}
        </span>

        {hasName ? (
          <div className="mt-0.5 pt-0.5 border-t border-black/20">
            <span className="font-extrabold text-slate-950 text-[10.5px] block truncate">
              {item.nama}
            </span>
          </div>
        ) : (
          <span className="text-[8.5px] font-medium text-slate-700/60 italic mt-0.5 block">
            -
          </span>
        )}
      </div>
    );
  };

  // Color pallete exact 1:1 matching the original diagram
  const COLORS = {
    purple: { bg: "#9186b0", border: "#222222", text: "#ffffff" },
    green: { bg: "#74c8ae", border: "#222222", text: "#111827" },
    blue: { bg: "#aee0fa", border: "#222222", text: "#111827" },
    yellowSekretariat: { bg: "#fff736", border: "#222222", text: "#111827" },
    yellowDewan: { bg: "#fffde8", border: "#222222", text: "#111827" },
    white: { bg: "#ffffff", border: "#222222", text: "#111827" },
  };

  return (
    <div className="space-y-4">
      {/* Zoom and Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            Bagan Struktur Organisasi 1:1 Resmi Sinode GGP
          </span>
          <span className="hidden md:inline-block text-xs text-slate-400">
            • Klik pada kotak jabatan untuk melihat profil / mengisi nama di CMS
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
            title="Perkecil (-)"
          >
            -
          </button>
          <span className="w-14 text-center text-xs font-bold text-slate-700 font-mono">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(1.4, Number((prev + 0.1).toFixed(2))))}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
            title="Perbesar (+)"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="px-2.5 h-8 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer ml-1 shadow-xs"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Diagram Canvas Area */}
      <div className="relative rounded-3xl bg-white border border-slate-200 shadow-sm overflow-auto p-4 sm:p-8 thin-scroll">
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "top center",
            width: "1220px",
            height: "1060px",
            marginBottom: zoomLevel > 1 ? `${(zoomLevel - 1) * 1060}px` : "0px",
            transition: "transform 0.18s ease-out",
          }}
          className="relative mx-auto font-sans select-none"
        >
          {/* =========================================================================
              CANVAS TITLE (STRUKTUR ORGANISASI MAJELIS PUSAT GEREJA GERAKAN PENTAKOSTA)
          ========================================================================= */}
          <div className="absolute top-1 left-0 right-0 text-center pointer-events-none">
            <h2 className="text-xl font-black text-slate-900 tracking-wider uppercase font-outfit">
              STRUKTUR ORGANISASI
            </h2>
            <h3 className="text-base font-black text-slate-900 tracking-wide uppercase font-outfit mt-0.5">
              MAJELIS PUSAT GEREJA GERAKAN PENTAKOSTA
            </h3>
          </div>

          {/* =========================================================================
              SVG CONNECTOR LINES (100% IDENTICAL SYMMETRICAL TREE WITH ORIGINAL)
          ========================================================================= */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 1220 1060"
          >
            {/* 1. Stem: Sidang Raya (bottom center 600, 106) -> Ketua Umum (top center 600, 150) */}
            <line x1="600" y1="106" x2="600" y2="150" stroke="#1e293b" strokeWidth="1.75" />

            {/* 2. Dewan Pembina Connection (Solid upper line & Dashed lower line) */}
            {/* Solid line from stem (600, 122) to Dewan Pembina left edge (810, 122) */}
            <line x1="600" y1="122" x2="810" y2="122" stroke="#1e293b" strokeWidth="1.75" />
            {/* Dashed line directly underneath from stem (600, 134) to Dewan Pembina (810, 134) */}
            <line
              x1="600"
              y1="134"
              x2="810"
              y2="134"
              stroke="#1e293b"
              strokeWidth="1.75"
              strokeDasharray="5 4"
            />

            {/* 3. Badan Pengawas Perbendaharaan Connection (Dashed line) */}
            {/* Starts from Ketua Umum top-left at (425, 160) -> goes left to (210, 160) -> drops to (210, 175) */}
            <path
              d="M 425 160 L 210 160 L 210 175"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.75"
              strokeDasharray="5 4"
            />

            {/* 4. Ketua Umum (bottom center 600, 196) -> Down to T-branch (600, 222) */}
            <line x1="600" y1="196" x2="600" y2="222" stroke="#1e293b" strokeWidth="1.75" />

            {/* 5. T-branch to Sekretaris Umum (x=320) and Bendahara Umum (x=880) */}
            <line x1="320" y1="222" x2="880" y2="222" stroke="#1e293b" strokeWidth="1.75" />
            {/* Drop into Sekretaris Umum */}
            <line x1="320" y1="222" x2="320" y2="242" stroke="#1e293b" strokeWidth="1.75" />
            {/* Drop into Bendahara Umum */}
            <line x1="880" y1="222" x2="880" y2="242" stroke="#1e293b" strokeWidth="1.75" />

            {/* 6. Central stem continues down through the middle (between Sekum & Bendum) */}
            <line x1="600" y1="222" x2="600" y2="315" stroke="#1e293b" strokeWidth="1.75" />

            {/* 7. Horizontal bus bar across Ketua 1, Ketua 2, Ketua 3, Ketua 4 at y=315 */}
            <line x1="310" y1="315" x2="890" y2="315" stroke="#1e293b" strokeWidth="1.75" />
            {/* Drops into Ketua 1-4 */}
            <line x1="310" y1="315" x2="310" y2="335" stroke="#1e293b" strokeWidth="1.75" />
            <line x1="490" y1="315" x2="490" y2="335" stroke="#1e293b" strokeWidth="1.75" />
            <line x1="710" y1="315" x2="710" y2="335" stroke="#1e293b" strokeWidth="1.75" />
            <line x1="890" y1="315" x2="890" y2="335" stroke="#1e293b" strokeWidth="1.75" />

            {/* 8. Far Left Spine: exits left edge of Sekretaris Umum (230, 263) -> (40, 263) -> runs down to y=754 */}
            <path
              d="M 230 263 L 40 263 L 40 754"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.75"
            />
            {/* Ticks from Left Spine (x=40) to each of the 9 boxes in Col 1 (x=55) */}
            {[356, 406, 456, 506, 554, 604, 654, 704, 754].map((yTick, idx) => (
              <line key={`tick-col1-${idx}`} x1="40" y1={yTick} x2="55" y2={yTick} stroke="#1e293b" strokeWidth="1.75" />
            ))}

            {/* 9. Col 2: Vertical spine drops from bottom-left of Ketua 1 at (240, 377) -> down to y=559 */}
            <line x1="240" y1="377" x2="240" y2="559" stroke="#1e293b" strokeWidth="1.75" />
            {/* Ticks from spine (x=240) to Col 2 boxes left edge (x=250) */}
            {[415, 463, 511, 559].map((yTick, idx) => (
              <line key={`tick-col2-${idx}`} x1="240" y1={yTick} x2="250" y2={yTick} stroke="#1e293b" strokeWidth="1.75" />
            ))}

            {/* 10. Col 3: Vertical spine drops from bottom-left of Ketua 2 at (420, 377) -> down to y=559 */}
            <line x1="420" y1="377" x2="420" y2="559" stroke="#1e293b" strokeWidth="1.75" />
            {/* Ticks from spine (x=420) to Col 3 boxes left edge (x=430) */}
            {[415, 463, 511, 559].map((yTick, idx) => (
              <line key={`tick-col3-${idx}`} x1="420" y1={yTick} x2="430" y2={yTick} stroke="#1e293b" strokeWidth="1.75" />
            ))}

            {/* 11. Col 4: Vertical spine drops from bottom-right of Ketua 3 at (785, 377) -> down to y=703 */}
            <line x1="785" y1="377" x2="785" y2="703" stroke="#1e293b" strokeWidth="1.75" />
            {/* Ticks from Col 4 boxes right edge (x=775) to spine (x=785) */}
            {[415, 463, 511, 559, 607, 655, 703].map((yTick, idx) => (
              <line key={`tick-col4-${idx}`} x1="775" y1={yTick} x2="785" y2={yTick} stroke="#1e293b" strokeWidth="1.75" />
            ))}

            {/* 12. Col 5: Vertical spine drops from bottom-right of Ketua 4 at (965, 377) -> down to y=703 */}
            <line x1="965" y1="377" x2="965" y2="703" stroke="#1e293b" strokeWidth="1.75" />
            {/* Ticks from Col 5 boxes right edge (x=955) to spine (x=965) */}
            {[415, 463, 511, 559, 607, 655, 703].map((yTick, idx) => (
              <line key={`tick-col5-${idx}`} x1="955" y1={yTick} x2="965" y2={yTick} stroke="#1e293b" strokeWidth="1.75" />
            ))}

            {/* 13. Col 6: Far Right Spine: exits right edge of Bendahara Umum (970, 263) -> (1170, 263) -> down to y=451 */}
            <path
              d="M 970 263 L 1170 263 L 1170 451"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.75"
            />
            {/* Ticks from Col 6 boxes right edge (x=1155) to spine (x=1170) */}
            {[355, 403, 451].map((yTick, idx) => (
              <line key={`tick-col6-${idx}`} x1="1155" y1={yTick} x2="1170" y2={yTick} stroke="#1e293b" strokeWidth="1.75" />
            ))}
          </svg>

          {/* =========================================================================
              BOX 1: SIDANG RAYA (Purple Box at top center)
          ========================================================================= */}
          <div className="absolute top-[70px] left-[440px] w-[320px] z-10">
            {renderBox(
              "sidang-raya",
              "SIDANG RAYA",
              COLORS.purple,
              { isHeader: true, minHeight: "36px", defaultKategori: "Sidang Raya" }
            )}
          </div>

          {/* =========================================================================
              BOX 2: DEWAN PEMBINA (Large Pale Yellow Box on right)
          ========================================================================= */}
          <div className="absolute top-[100px] left-[810px] w-[330px] z-10">
            {renderBox(
              "dewan-pembina",
              "DEWAN PEMBINA",
              COLORS.yellowDewan,
              { isHeader: true, minHeight: "95px", defaultKategori: "Dewan Pembina" }
            )}
          </div>

          {/* =========================================================================
              BOX 3: BADAN PENGAWAS PERBENDAHARAAN (White Box on left)
          ========================================================================= */}
          <div className="absolute top-[175px] left-[50px] w-[240px] z-10">
            {renderBox(
              "badan-pengawas-perbendaharaan",
              "BADAN PENGAWAS PERBENDAHARAAN",
              COLORS.white,
              { isHeader: true, minHeight: "60px", defaultKategori: "Badan Pengawas" }
            )}
          </div>

          {/* =========================================================================
              BOX 4: KETUA UMUM (Mint Green Box at center)
          ========================================================================= */}
          <div className="absolute top-[150px] left-[425px] w-[350px] z-10">
            {renderBox(
              "ketua-umum",
              "KETUA UMUM",
              COLORS.green,
              { isHeader: true, minHeight: "46px", defaultKategori: "Majelis Harian Pusat" }
            )}
          </div>

          {/* =========================================================================
              TIER 3: SEKRETARIS UMUM & BENDAHARA UMUM
          ========================================================================= */}
          {/* Sekretaris Umum */}
          <div className="absolute top-[242px] left-[230px] w-[180px] z-10">
            {renderBox(
              "sekretaris-umum",
              "SEKRETARIS UMUM",
              COLORS.green,
              { isHeader: true, minHeight: "42px", defaultKategori: "Majelis Harian Pusat" }
            )}
          </div>

          {/* Bendahara Umum */}
          <div className="absolute top-[242px] left-[790px] w-[180px] z-10">
            {renderBox(
              "bendahara-umum",
              "BENDAHARA UMUM",
              COLORS.green,
              { isHeader: true, minHeight: "42px", defaultKategori: "Majelis Harian Pusat" }
            )}
          </div>

          {/* =========================================================================
              TIER 4: KETUA 1, 2, 3, 4 (ROW OF 4 GREEN BOXES)
          ========================================================================= */}
          <div className="absolute top-[335px] left-[230px] w-[160px] z-10">
            {renderBox("ketua-1", "KETUA 1", COLORS.green, { defaultKategori: "Majelis Harian Pusat" })}
          </div>
          <div className="absolute top-[335px] left-[410px] w-[160px] z-10">
            {renderBox("ketua-2", "KETUA 2", COLORS.green, { defaultKategori: "Majelis Harian Pusat" })}
          </div>
          <div className="absolute top-[335px] left-[630px] w-[160px] z-10">
            {renderBox("ketua-3", "KETUA 3", COLORS.green, { defaultKategori: "Majelis Harian Pusat" })}
          </div>
          <div className="absolute top-[335px] left-[810px] w-[160px] z-10">
            {renderBox("ketua-4", "KETUA 4", COLORS.green, { defaultKategori: "Majelis Harian Pusat" })}
          </div>

          {/* =========================================================================
              TIER 5: 6 VERTICAL COLUMNS
          ========================================================================= */}

          {/* COLUMN 1: LEFT STACK (Under Sekretaris Umum) */}
          <div className="absolute top-[335px] left-[55px] w-[155px] space-y-2 z-10">
            {/* Majelis Lengkap - Biru */}
            {renderBox("sekretaris-1", "SEKRETARIS 1", COLORS.blue)}
            {renderBox("sekretaris-2", "SEKRETARIS 2", COLORS.blue)}
            {renderBox("kominfo-1", "KOMINFO 1", COLORS.blue)}
            {renderBox("kominfo-2", "KOMINFO 2", COLORS.blue)}

            {/* Sekretariat - Kuning Terang */}
            <div className="pt-1 space-y-2">
              {renderBox("kepala-sekretariat", "KEPALA SEKRETARIAT", COLORS.yellowSekretariat, { defaultKategori: "Sekretariat" })}
              {renderBox("digitalisasi", "DIGITALISASI", COLORS.yellowSekretariat, { defaultKategori: "Sekretariat" })}
              {renderBox("multimedia", "MULTIMEDIA", COLORS.yellowSekretariat, { defaultKategori: "Sekretariat" })}
              {renderBox("data", "DATA", COLORS.yellowSekretariat, { defaultKategori: "Sekretariat" })}
              {renderBox("sarana-prasarana-kantor", "SARANA PRASARANA KANTOR", COLORS.yellowSekretariat, { defaultKategori: "Sekretariat" })}
            </div>
          </div>

          {/* COLUMN 2: UNDER KETUA 1 (4 Departemen - Biru) */}
          <div className="absolute top-[395px] left-[250px] w-[145px] space-y-2 z-10">
            {renderBox("dept-pemberdayaan-pendeta", "DEPT. PEMBERDAYAAN PENDETA", COLORS.blue)}
            {renderBox("dept-pendidikan-teologi", "DEPT. PENDIDIKAN TEOLOGI", COLORS.blue)}
            {renderBox("dept-pembinaan", "DEPT. PEMBINAAN", COLORS.blue)}
            {renderBox("dept-persiapan-ht-perintisan", "DEPT. PERSIAPAN HT PERINTISAN", COLORS.blue)}
          </div>

          {/* COLUMN 3: UNDER KETUA 2 (4 Departemen - Biru) */}
          <div className="absolute top-[395px] left-[430px] w-[145px] space-y-2 z-10">
            {renderBox("dept-organisasi-keanggotaan", "DEPT. ORGANISASI & KEANGGOTAAN", COLORS.blue)}
            {renderBox("dept-penelitian-pengembangan", "DEPT. PENELITIAN & PENGEMBANGAN", COLORS.blue)}
            {renderBox("dept-integrasi-denominasi", "DEPT. INTEGRASI DENOMINASI", COLORS.blue)}
            {renderBox("dept-advokasi", "DEPT. ADVOKASI", COLORS.blue)}
          </div>

          {/* COLUMN 4: UNDER KETUA 3 (7 Departemen - Biru) */}
          <div className="absolute top-[395px] left-[630px] w-[145px] space-y-2 z-10">
            {renderBox("dept-perintisan-jemaat-pedesaan", "DEPT. PERINTISAN JEMAAT PEDESAAN", COLORS.blue)}
            {renderBox("dept-perintisan-jemaat-perkotaan", "DEPT. PERINTISAN JEMAAT PERKOTAAN", COLORS.blue)}
            {renderBox("dept-perintisan-ggp-internasional", "DEPT. PERINTISAN GGP INTERNASIONAL", COLORS.blue)}
            {renderBox("dept-pengembangan-jemaat", "DEPT. PENGEMBANGAN JEMAAT", COLORS.blue)}
            {renderBox("dept-diakonia", "DEPT. DIAKONIA", COLORS.blue)}
            {renderBox("dept-sosial", "DEPT. SOSIAL", COLORS.blue)}
            {renderBox("dept-kemandirian-jemaat", "DEPT. KEMANDIRIAN JEMAAT", COLORS.blue)}
          </div>

          {/* COLUMN 5: UNDER KETUA 4 (7 Departemen - Biru) */}
          <div className="absolute top-[395px] left-[810px] w-[145px] space-y-2 z-10">
            {renderBox("dept-anak", "DEPT. ANAK", COLORS.blue)}
            {renderBox("dept-pemuda-remaja", "DEPT. PEMUDA REMAJA", COLORS.blue)}
            {renderBox("dept-pria", "DEPT. PRIA", COLORS.blue)}
            {renderBox("dept-wanita", "DEPT. WANITA", COLORS.blue)}
            {renderBox("dept-pemimpin-muda", "DEPT. PEMIMPIN MUDA", COLORS.blue)}
            {renderBox("dept-musik-dan-pujian", "DEPT. MUSIK DAN PUJIAN", COLORS.blue)}
            {renderBox("dept-doa", "DEPT. DOA", COLORS.blue)}
          </div>

          {/* COLUMN 6: UNDER BENDAHARA UMUM (3 Biro / Bidang - Biru) */}
          <div className="absolute top-[335px] left-[1005px] w-[150px] space-y-2 z-10">
            {renderBox("bendahara", "BENDAHARA", COLORS.blue)}
            {renderBox("kemitraan", "KEMITRAAN", COLORS.blue)}
            {renderBox("penganggaran", "PENGANGGARAN", COLORS.blue)}
          </div>

          {/* =========================================================================
              CANVAS LEGEND (EXACT COLOR BOXES AT BOTTOM LEFT MATCHING ORIGINAL)
          ========================================================================= */}
          <div className="absolute top-[840px] left-[55px] p-3.5 bg-white/95 rounded-xl border border-slate-300 shadow-xs space-y-2 z-10 text-[11px]">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-3.5 rounded-xs border border-slate-900 bg-[#9186b0] shrink-0" />
              <span className="font-bold text-slate-800 uppercase tracking-tight">SIDANG RAYA</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-3.5 rounded-xs border border-slate-900 bg-[#74c8ae] shrink-0" />
              <span className="font-bold text-slate-800 uppercase tracking-tight">MAJELIS HARIAN PUSAT</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-3.5 rounded-xs border border-slate-900 bg-[#aee0fa] shrink-0" />
              <span className="font-bold text-slate-800 uppercase tracking-tight">MAJELIS LENGKAP</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-3.5 rounded-xs border border-slate-900 bg-[#fffde8] shrink-0" />
              <span className="font-bold text-slate-800 uppercase tracking-tight">DEWAN PEMBINA</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-3.5 rounded-xs border border-slate-900 bg-[#fff736] shrink-0" />
              <span className="font-bold text-slate-800 uppercase tracking-tight">SEKRETARIAT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal / Drawer if clicked */}
      {selectedPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                  {selectedPosition.kategori}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedPosition.jabatan}
                </h3>
                {selectedPosition.subBidang && (
                  <p className="text-xs text-slate-500">{selectedPosition.subBidang}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPosition(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Pejabat Saat Ini
              </span>
              {selectedPosition.nama ? (
                <div>
                  <span className="text-base font-extrabold text-slate-900 block">
                    {selectedPosition.nama}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Belum Ada Pejabat Ditetapkan (Variabel Kosong)
                </div>
              )}
            </div>

            {selectedPosition.keterangan && (
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedPosition.keterangan}
              </p>
            )}

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedPosition(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
