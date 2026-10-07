"use client";

import { useState } from "react";
import { ALL, ALL_KHUSUS, type Filters } from "@/lib/stats";
import SearchBox from "./SearchBox";

type FilterBarProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  daerahList: string[];
  wilayahList: string[];
  daerahKhususList: string[];
  wilayahKhususList: string[];
  pois: any[];
  onSelectPOI: (latlng: [number, number], properties: any) => void;
};

const fieldClass =
  "flex h-9 w-auto shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 shadow-sm shadow-blue-900/10 transition-colors focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/15";
const labelClass = "shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400";
const selectClass =
  "w-auto max-w-[12rem] cursor-pointer truncate bg-transparent text-[10px] font-semibold uppercase tracking-wide text-blue-950 outline-none";

const fieldKhususClass =
  "flex h-9 w-auto shrink-0 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/50 px-2.5 shadow-sm shadow-amber-900/5 transition-colors focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-500/20";
const labelKhususClass = "shrink-0 text-[10px] font-bold uppercase tracking-wide text-amber-700";
const selectKhususClass =
  "w-auto max-w-[13rem] cursor-pointer truncate bg-transparent text-[10px] font-bold uppercase tracking-wide text-amber-950 outline-none";

export default function FilterBar({
  filters,
  onChange,
  daerahList,
  wilayahList,
  daerahKhususList,
  wilayahKhususList,
  pois,
  onSelectPOI,
}: FilterBarProps) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const activeCount = [
    filters.daerah !== ALL,
    filters.wilayah !== ALL,
    filters.daerahKhusus !== ALL,
    filters.wilayahKhusus !== ALL,
  ].filter(Boolean).length;

  return (
    <>
      {/* Pencarian Nama Jemaah - Fleksibel di Mobile & Desktop */}
      <SearchBox
        pois={pois}
        onSelectPOI={onSelectPOI}
        className="relative flex-1 min-w-[140px] sm:w-64 sm:flex-initial shrink-0"
      />

      {/* Tombol Filter Khusus Mobile (< md) */}
      <div className="flex md:hidden items-center shrink-0">
        <button
          type="button"
          onClick={() => setIsMobileSheetOpen(true)}
          className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all cursor-pointer ${
            activeCount > 0
              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20"
              : "border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <span>Filter</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-extrabold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== DESKTOP HORIZONTAL FILTER (md+) */}
      <div className="hidden md:flex items-center gap-2.5">
        {/* Filter Daerah / Mada (Wilayah Biasa) */}
        <div className={fieldClass}>
          <label htmlFor="filter-daerah" className={labelClass}>
            Mada
          </label>
          <select
            id="filter-daerah"
            className={selectClass}
            value={filters.daerah}
            onChange={(e) =>
              onChange({
                ...filters,
                daerah: e.target.value,
                wilayah: ALL,
                daerahKhusus: ALL,
                wilayahKhusus: ALL,
                kabupaten: ALL,
                desa: ALL,
              })
            }
          >
            <option value={ALL}>Semua Mada</option>
            {daerahList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Wilayah / Mawil (Wilayah Biasa) */}
        <div className={fieldClass}>
          <label htmlFor="filter-wilayah" className={labelClass}>
            Mawil
          </label>
          <select
            id="filter-wilayah"
            className={selectClass}
            value={filters.wilayah}
            onChange={(e) =>
              onChange({
                ...filters,
                wilayah: e.target.value,
                daerahKhusus: ALL,
                wilayahKhusus: ALL,
                kabupaten: ALL,
                desa: ALL,
              })
            }
          >
            <option value={ALL}>Semua Mawil</option>
            {wilayahList.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Pembatas Visual Antara Wilayah Biasa & Wilayah Khusus */}
        <div className="h-5 w-px bg-slate-200 shrink-0 mx-0.5" />

        {/* Filter Mada Khusus / Daerah Khusus (KIRI) */}
        <div className={fieldKhususClass}>
          <span className="flex h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          <label htmlFor="filter-daerah-khusus" className={labelKhususClass}>
            Mada Khusus
          </label>
          <select
            id="filter-daerah-khusus"
            className={selectKhususClass}
            value={filters.daerahKhusus}
            onChange={(e) =>
              onChange({
                ...filters,
                daerahKhusus: e.target.value,
                wilayahKhusus: ALL,
                daerah: ALL,
                wilayah: ALL,
                kabupaten: ALL,
                desa: ALL,
              })
            }
          >
            <option value={ALL}>Semua Mada Khusus</option>
            {daerahKhususList.map((dk) => (
              <option key={dk} value={dk}>
                {dk}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Mawil Khusus / Wilayah Khusus (KANAN) */}
        <div className={fieldKhususClass}>
          <label htmlFor="filter-wilayah-khusus" className={labelKhususClass}>
            Mawil Khusus
          </label>
          <select
            id="filter-wilayah-khusus"
            className={selectKhususClass}
            value={filters.wilayahKhusus}
            onChange={(e) =>
              onChange({
                ...filters,
                wilayahKhusus: e.target.value,
                daerah: ALL,
                wilayah: ALL,
                kabupaten: ALL,
                desa: ALL,
              })
            }
          >
            <option value={ALL}>Semua Mawil Khusus</option>
            {wilayahKhususList.map((wk) => (
              <option key={wk} value={wk}>
                {wk}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ============================================================== MOBILE FILTER BOTTOM SHEET (< md) */}
      {isMobileSheetOpen && (
        <>
          <div
            onClick={() => setIsMobileSheetOpen(false)}
            className="fixed inset-0 z-1200 bg-slate-900/40 backdrop-blur-xs md:hidden"
          />

          <div className="fixed inset-x-0 bottom-0 z-1250 max-h-[85vh] rounded-t-3xl bg-white p-5 border-t border-slate-200 shadow-2xl flex flex-col space-y-4 animate-slide-up overflow-y-auto thin-scroll md:hidden">
            {/* Drag handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto shrink-0 -mt-1" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Filter Wilayah & Daerah</h3>
                <p className="text-[11px] text-slate-500">Saring sebaran data gereja pada peta</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bagian 1: Wilayah Biasa */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block">
                Kategori Wilayah Biasa
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Majelis Daerah (Mada)
                </label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-blue-950 focus:border-blue-600 outline-none"
                  value={filters.daerah}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      daerah: e.target.value,
                      wilayah: ALL,
                      daerahKhusus: ALL,
                      wilayahKhusus: ALL,
                      kabupaten: ALL,
                      desa: ALL,
                    })
                  }
                >
                  <option value={ALL}>Semua Mada (Daerah)</option>
                  {daerahList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Majelis Wilayah (Mawil)
                </label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-blue-950 focus:border-blue-600 outline-none"
                  value={filters.wilayah}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      wilayah: e.target.value,
                      daerahKhusus: ALL,
                      wilayahKhusus: ALL,
                      kabupaten: ALL,
                      desa: ALL,
                    })
                  }
                >
                  <option value={ALL}>Semua Mawil (Wilayah)</option>
                  {wilayahList.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bagian 2: Wilayah Khusus */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-300">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                Kategori Wilayah Khusus (Perintisan)
              </span>

              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Mada Khusus (Daerah Khusus)
                </label>
                <select
                  className="w-full h-10 px-3 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-amber-600 outline-none"
                  value={filters.daerahKhusus}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      daerahKhusus: e.target.value,
                      wilayahKhusus: ALL,
                      daerah: ALL,
                      wilayah: ALL,
                      kabupaten: ALL,
                      desa: ALL,
                    })
                  }
                >
                  <option value={ALL}>Semua Mada Khusus</option>
                  {daerahKhususList.map((dk) => (
                    <option key={dk} value={dk}>
                      {dk}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Mawil Khusus (Wilayah Khusus)
                </label>
                <select
                  className="w-full h-10 px-3 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-amber-600 outline-none"
                  value={filters.wilayahKhusus}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      wilayahKhusus: e.target.value,
                      daerah: ALL,
                      wilayah: ALL,
                      kabupaten: ALL,
                      desa: ALL,
                    })
                  }
                >
                  <option value={ALL}>Semua Mawil Khusus</option>
                  {wilayahKhususList.map((wk) => (
                    <option key={wk} value={wk}>
                      {wk}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aksi Selesai */}
            <div className="pt-2 flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      ...filters,
                      daerah: ALL,
                      wilayah: ALL,
                      daerahKhusus: ALL,
                      wilayahKhusus: ALL,
                      kabupaten: ALL,
                      desa: ALL,
                    });
                  }}
                  className="flex-1 h-11 rounded-xl border border-slate-200 bg-white font-bold text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Reset Filter
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="flex-1 h-11 rounded-xl bg-blue-600 font-bold text-xs text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-colors"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
