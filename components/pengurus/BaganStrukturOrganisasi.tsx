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
  const [selectedPosition, setSelectedPosition] = useState<PengurusPosition | null>(null);

  const getPosition = (id: string, fallbackTitle: string, defaultKategori: string = "Majelis Lengkap") => {
    let pos = dataMap.get(id);
    if (!pos) {
      if (id === "badan-pemeriksa-perbendaharaan") pos = dataMap.get("badan-pengawas-perbendaharaan");
      else if (id === "badan-pengawas-perbendaharaan") pos = dataMap.get("badan-pemeriksa-perbendaharaan");
      else if (id === "dept-organisasi-kelembagaan") pos = dataMap.get("dept-organisasi-keanggotaan");
      else if (id === "dept-organisasi-keanggotaan") pos = dataMap.get("dept-organisasi-kelembagaan");
      else if (id === "dept-hubungan-denominasi") pos = dataMap.get("dept-integrasi-denominasi");
      else if (id === "dept-integrasi-denominasi") pos = dataMap.get("dept-hubungan-denominasi");
      else if (id === "sekretaris-3") pos = dataMap.get("kominfo-1");
      else if (id === "sekretaris-4") pos = dataMap.get("kominfo-2");
    }
    return (
      pos || {
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
      isDashed?: boolean;
      compactText?: boolean;
      isLabelOnly?: boolean;
    } = {}
  ) => {
    if (options.isLabelOnly) {
      return (
        <div
          style={{
            backgroundColor: colorStyle.bg,
            borderColor: colorStyle.border,
            color: colorStyle.text,
          }}
          className={`w-full rounded-sm ${options.isDashed ? "border-[1.5px] border-dashed" : "border-[1.5px]"} shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex items-center justify-center text-center select-none px-3 py-2 ${
            options.minHeight || "min-h-[36px]"
          }`}
        >
          <span
            className={`font-black uppercase tracking-wider block leading-tight ${
              options.isHeader ? "text-xs sm:text-sm" : "text-[10px] sm:text-[10.5px]"
            }`}
          >
            {title}
          </span>
        </div>
      );
    }

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
        className={`w-full rounded-sm ${options.isDashed ? "border-[1.5px] border-dashed" : "border-[1.5px]"} shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 cursor-pointer hover:shadow-md hover:scale-[1.01] flex flex-col justify-center text-center select-none relative group px-2 py-1.5 ${
          options.minHeight || "min-h-[42px]"
        }`}
        title={`Klik untuk detail: ${item.jabatan}${hasName ? ` (${item.nama.replace(/\n/g, ', ')})` : " (Belum Ada Data)"}`}
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
            {item.nama.includes("\n") ? (
              <div className={`text-left ${options.compactText ? "space-y-0" : "space-y-0.5"} pt-0.5`}>
                {item.nama.split("\n").map((line, idx) => (
                  <span
                    key={idx}
                    className={`block font-normal text-slate-900 ${
                      options.compactText
                        ? "text-[8px] leading-tight"
                        : "text-[8.5px] leading-snug"
                    }`}
                  >
                    {line}
                  </span>
                ))}
              </div>
            ) : (
              <span
                className={`font-normal text-slate-950 block leading-tight ${
                  item.nama.length > 25
                    ? "text-[9px] sm:text-[9.5px] line-clamp-2"
                    : "text-[10px] sm:text-[10.5px] truncate"
                }`}
              >
                {item.nama}
              </span>
            )}
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
      {/* Main Diagram Canvas Area */}
      <div className="relative rounded-3xl bg-white border border-slate-200 shadow-sm overflow-auto p-4 sm:p-8 thin-scroll">
        <div
          style={{
            width: "1220px",
            height: "1000px",
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
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Masa Bakti 2021 - 2026
            </p>
          </div>

          {/* =========================================================================
              SVG CONNECTOR LINES (100% IDENTICAL SYMMETRICAL TREE WITH ORIGINAL)
          ========================================================================= */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 1220 1000"
          >
            {/* 1. Stem: Sidang Raya (bottom center 600, 136) -> Ketua Umum (top center 600, 160) */}
            <line x1="600" y1="136" x2="600" y2="160" stroke="#1e293b" strokeWidth="1.75" />

            {/* 2. Badan Pemeriksa Perbendaharaan -> Ketua Umum (Horizontal Dashed Line at y=183) */}
            <line
              x1="410"
              y1="183"
              x2="440"
              y2="183"
              stroke="#1e293b"
              strokeWidth="1.75"
              strokeDasharray="5 4"
            />

            {/* 3. Ketua Umum -> Dewan Pembina (Upper solid line & Lower dashed line) */}
            <line x1="760" y1="178" x2="790" y2="178" stroke="#1e293b" strokeWidth="1.75" />
            <line
              x1="760"
              y1="188"
              x2="790"
              y2="188"
              stroke="#1e293b"
              strokeWidth="1.75"
              strokeDasharray="5 4"
            />

            {/* 4. Ketua Umum (bottom center 600, 206) -> Down to T-branch (600, 288) */}
            <line x1="600" y1="206" x2="600" y2="288" stroke="#1e293b" strokeWidth="1.75" />

            {/* 5. T-branch to Sekretaris Umum (x=320) and Bendahara Umum (x=880) at y=288 */}
            <line x1="320" y1="288" x2="880" y2="288" stroke="#1e293b" strokeWidth="1.75" />
            {/* Drop into Sekretaris Umum */}
            <line x1="320" y1="288" x2="320" y2="305" stroke="#1e293b" strokeWidth="1.75" />
            {/* Drop into Bendahara Umum */}
            <line x1="880" y1="288" x2="880" y2="305" stroke="#1e293b" strokeWidth="1.75" />

            {/* 6. Central stem continues down through the middle (between Sekum & Bendum) */}
            <line x1="600" y1="288" x2="600" y2="365" stroke="#1e293b" strokeWidth="1.75" />

            {/* 7. Line from Sekretaris Umum ONLY to Sekretaris 1 */}
            <path
              d="M 230 326 L 133 326 L 133 385"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.75"
            />

            {/* 8. Line from Bendahara Umum ONLY to Bendahara */}
            <path
              d="M 970 326 L 1080 326 L 1080 385"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.75"
            />

            {/* 9. Horizontal bus bar across Ketua 1, Ketua 2, Ketua 3, Ketua 4 at y=365 */}
            <line x1="322" y1="365" x2="882" y2="365" stroke="#1e293b" strokeWidth="1.75" />
            {/* Drops into Ketua 1-4 */}
            <line x1="322" y1="365" x2="322" y2="385" stroke="#1e293b" strokeWidth="1.75" />
            <line x1="502" y1="365" x2="502" y2="385" stroke="#1e293b" strokeWidth="1.75" />
            <line x1="702" y1="365" x2="702" y2="385" stroke="#1e293b" strokeWidth="1.75" />
            <line x1="882" y1="365" x2="882" y2="385" stroke="#1e293b" strokeWidth="1.75" />

            {/* 10. Direct drops from each Ketua ONLY to their first department */}
            {/* Ketua 1 -> Dept. Pemberdayaan Pendeta */}
            <line x1="322" y1="427" x2="322" y2="445" stroke="#1e293b" strokeWidth="1.75" />
            {/* Ketua 2 -> Dept. Organisasi & Kelembagaan */}
            <line x1="502" y1="427" x2="502" y2="445" stroke="#1e293b" strokeWidth="1.75" />
            {/* Ketua 3 -> Dept. Perintisan Jemaat Pedesaan */}
            <line x1="702" y1="427" x2="702" y2="445" stroke="#1e293b" strokeWidth="1.75" />
            {/* Ketua 4 -> Dept. Anak */}
            <line x1="882" y1="427" x2="882" y2="445" stroke="#1e293b" strokeWidth="1.75" />
          </svg>

          {/* =========================================================================
              BOX 1: SIDANG RAYA (Purple Box at top center - Label Only)
          ========================================================================= */}
          <div className="absolute top-[102px] left-[450px] w-[300px] z-10">
            {renderBox(
              "sidang-raya",
              "SIDANG RAYA",
              COLORS.purple,
              { isHeader: true, minHeight: "36px", defaultKategori: "Sidang Raya", isLabelOnly: true }
            )}
          </div>

          {/* =========================================================================
              TOP ROW: BADAN PEMERIKSA (LEFT), KETUA UMUM (CENTER), DEWAN PEMBINA (RIGHT)
          ========================================================================= */}
          {/* BADAN PEMERIKSA PERBENDAHARAAN (Persis di samping kiri Ketua Umum) */}
          <div className="absolute top-[160px] left-[55px] w-[355px] z-10">
            {renderBox(
              "badan-pemeriksa-perbendaharaan",
              "BADAN PEMERIKSA PERBENDAHARAAN",
              COLORS.white,
              { isHeader: true, minHeight: "75px", defaultKategori: "Badan Pengawas", isDashed: true, compactText: true }
            )}
          </div>

          {/* KETUA UMUM (Mint Green Box at center) */}
          <div className="absolute top-[160px] left-[440px] w-[320px] z-10">
            {renderBox(
              "ketua-umum",
              "KETUA UMUM",
              COLORS.green,
              { isHeader: true, minHeight: "46px", defaultKategori: "Majelis Harian Pusat" }
            )}
          </div>

          {/* DEWAN PEMBINA (Persis di samping kanan Ketua Umum) */}
          <div className="absolute top-[160px] left-[790px] w-[365px] z-10">
            {renderBox(
              "dewan-pembina",
              "DEWAN PEMBINA",
              COLORS.yellowDewan,
              { isHeader: true, minHeight: "115px", defaultKategori: "Dewan Pembina", compactText: true }
            )}
          </div>

          {/* =========================================================================
              TIER 3: SEKRETARIS UMUM & BENDAHARA UMUM
          ========================================================================= */}
          {/* Sekretaris Umum */}
          <div className="absolute top-[305px] left-[230px] w-[180px] z-10">
            {renderBox(
              "sekretaris-umum",
              "SEKRETARIS UMUM",
              COLORS.green,
              { isHeader: true, minHeight: "42px", defaultKategori: "Majelis Harian Pusat" }
            )}
          </div>

          {/* Bendahara Umum */}
          <div className="absolute top-[305px] left-[790px] w-[180px] z-10">
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
          <div className="absolute top-[385px] left-[242px] w-[160px] z-10">
            {renderBox("ketua-1", "KETUA 1", COLORS.green, { defaultKategori: "Majelis Harian Pusat" })}
          </div>
          <div className="absolute top-[385px] left-[422px] w-[160px] z-10">
            {renderBox("ketua-2", "KETUA 2", COLORS.green, { defaultKategori: "Majelis Harian Pusat" })}
          </div>
          <div className="absolute top-[385px] left-[622px] w-[160px] z-10">
            {renderBox("ketua-3", "KETUA 3", COLORS.green, { defaultKategori: "Majelis Harian Pusat" })}
          </div>
          <div className="absolute top-[385px] left-[802px] w-[160px] z-10">
            {renderBox("ketua-4", "KETUA 4", COLORS.green, { defaultKategori: "Majelis Harian Pusat" })}
          </div>

          {/* =========================================================================
              TIER 5: 6 VERTICAL COLUMNS
          ========================================================================= */}

          {/* COLUMN 1: LEFT STACK (Under Sekretaris Umum) */}
          <div className="absolute top-[385px] left-[55px] w-[155px] space-y-2 z-10">
            {/* Majelis Lengkap - Biru */}
            {renderBox("sekretaris-1", "SEKRETARIS 1", COLORS.blue)}
            {renderBox("sekretaris-2", "SEKRETARIS 2", COLORS.blue)}
            {renderBox("sekretaris-3", "SEKRETARIS 3", COLORS.blue)}
            {renderBox("sekretaris-4", "SEKRETARIS 4", COLORS.blue)}

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
          <div className="absolute top-[445px] left-[250px] w-[145px] space-y-2 z-10">
            {renderBox("dept-pemberdayaan-pendeta", "DEPT. PEMBERDAYAAN PENDETA", COLORS.blue)}
            {renderBox("dept-pendidikan-teologi", "DEPT. PENDIDIKAN TEOLOGI", COLORS.blue)}
            {renderBox("dept-pembinaan", "DEPT. PEMBINAAN", COLORS.blue)}
            {renderBox("dept-persiapan-ht-perintisan", "DEPT. PERSIAPAN HT PERINTISAN", COLORS.blue)}
          </div>

          {/* COLUMN 3: UNDER KETUA 2 (4 Departemen - Biru) */}
          <div className="absolute top-[445px] left-[430px] w-[145px] space-y-2 z-10">
            {renderBox("dept-organisasi-kelembagaan", "DEPT. ORGANISASI & KELEMBAGAAN", COLORS.blue)}
            {renderBox("dept-penelitian-pengembangan", "DEPT. PENELITIAN & PENGEMBANGAN", COLORS.blue)}
            {renderBox("dept-hubungan-denominasi", "DEPT. HUBUNGAN DENOMINASI", COLORS.blue)}
            {renderBox("dept-advokasi", "DEPT. ADVOKASI", COLORS.blue)}
          </div>

          {/* COLUMN 4: UNDER KETUA 3 (7 Departemen - Biru) */}
          <div className="absolute top-[445px] left-[630px] w-[145px] space-y-2 z-10">
            {renderBox("dept-perintisan-jemaat-pedesaan", "DEPT. PERINTISAN JEMAAT PEDESAAN", COLORS.blue)}
            {renderBox("dept-perintisan-jemaat-perkotaan", "DEPT. PERINTISAN JEMAAT PERKOTAAN", COLORS.blue)}
            {renderBox("dept-perintisan-ggp-internasional", "DEPT. PERINTISAN GGP INTERNASIONAL", COLORS.blue)}
            {renderBox("dept-pengembangan-jemaat", "DEPT. PENGEMBANGAN JEMAAT", COLORS.blue)}
            {renderBox("dept-diakonia", "DEPT. DIAKONIA", COLORS.blue)}
            {renderBox("dept-sosial", "DEPT. SOSIAL", COLORS.blue)}
            {renderBox("dept-kemandirian-jemaat", "DEPT. KEMANDIRIAN JEMAAT", COLORS.blue)}
          </div>

          {/* COLUMN 5: UNDER KETUA 4 (7 Departemen - Biru) */}
          <div className="absolute top-[445px] left-[810px] w-[145px] space-y-2 z-10">
            {renderBox("dept-anak", "DEPT. ANAK", COLORS.blue)}
            {renderBox("dept-pemuda-remaja", "DEPT. PEMUDA REMAJA", COLORS.blue)}
            {renderBox("dept-pria", "DEPT. PRIA", COLORS.blue)}
            {renderBox("dept-wanita", "DEPT. WANITA", COLORS.blue)}
            {renderBox("dept-pemimpin-muda", "DEPT. PEMIMPIN MUDA", COLORS.blue)}
            {renderBox("dept-musik-dan-pujian", "DEPT. MUSIK DAN PUJIAN", COLORS.blue)}
            {renderBox("dept-doa", "DEPT. DOA", COLORS.blue)}
          </div>

          {/* COLUMN 6: UNDER BENDAHARA UMUM (3 Biro / Bidang - Biru) */}
          <div className="absolute top-[385px] left-[1005px] w-[150px] space-y-2 z-10">
            {renderBox("bendahara", "BENDAHARA", COLORS.blue)}
            {renderBox("kemitraan", "KEMITRAAN", COLORS.blue)}
            {renderBox("penganggaran", "PENGANGGARAN", COLORS.blue)}
          </div>

          {/* =========================================================================
              CANVAS LEGEND (HORIZONTAL ACROSS BOTTOM MATCHING OFFICIAL PDF 1:1)
          ========================================================================= */}
          <div className="absolute top-[960px] left-0 right-0 flex items-center justify-center gap-6 sm:gap-8 z-10 text-[11px] font-bold text-slate-800 uppercase tracking-tight select-none">
            <div className="flex items-center gap-2">
              <span className="w-5 h-3.5 rounded-xs border border-slate-900 bg-[#9186b0] shrink-0" />
              <span>Sidang Raya</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-3.5 rounded-xs border border-slate-900 bg-[#74c8ae] shrink-0" />
              <span>Majelis Harian Pusat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-3.5 rounded-xs border border-slate-900 bg-[#aee0fa] shrink-0" />
              <span>Majelis Lengkap</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-3.5 rounded-xs border border-slate-900 bg-[#fffde8] shrink-0" />
              <span>Dewan Pembina</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-3.5 rounded-xs border border-slate-900 bg-[#fff736] shrink-0" />
              <span>Staf Kantor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-3.5 flex items-center justify-center shrink-0">
                <span className="w-full border-t-[1.5px] border-dashed border-slate-900" />
              </span>
              <span>Garis Koordinasi</span>
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
                  <span className="text-sm font-normal text-slate-900 block whitespace-pre-line leading-relaxed">
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
