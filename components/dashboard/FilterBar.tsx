"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
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

interface FilterContentProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  daerahList: string[];
  wilayahList: string[];
  daerahKhususList: string[];
  wilayahKhususList: string[];
  activeCount: number;
  onReset: () => void;
  onClose: () => void;
}

function FilterContent({
  filters,
  onChange,
  daerahList,
  wilayahList,
  daerahKhususList,
  wilayahKhususList,
  activeCount,
  onReset,
  onClose,
}: FilterContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-left">
      {/* Header Modal / Popover */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{t("dashboard.filter_title")}</h3>
          <p className="text-[11px] text-slate-500">{t("dashboard.filter_sub")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup filter"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4.5 w-4.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Bagian 1: Wilayah Reguler / Biasa */}
      <div className="space-y-3 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
            {t("dashboard.cat_reg")}
          </span>
          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
            {t("dashboard.cat_reg_badge")}
          </span>
        </div>

        {/* Majelis Daerah (MADA) */}
        <div>
          <label htmlFor="filter-mada" className="block text-xs font-semibold text-slate-600 mb-1">
            {t("dashboard.label_mada")}
          </label>
          <select
            id="filter-mada"
            className="w-full h-9.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-blue-950 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all cursor-pointer"
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
            <option value={ALL}>{t("dashboard.all_mada")}</option>
            {daerahList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Majelis Wilayah (MAWIL) */}
        <div>
          <label htmlFor="filter-mawil" className="block text-xs font-semibold text-slate-600 mb-1">
            {t("dashboard.label_mawil")}
          </label>
          <select
            id="filter-mawil"
            className="w-full h-9.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-blue-950 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all cursor-pointer"
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
            <option value={ALL}>{t("dashboard.all_mawil")}</option>
            {wilayahList.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bagian 2: Wilayah Khusus (Perintisan) */}
      <div className="space-y-3 rounded-2xl bg-amber-50/60 p-3.5 border border-amber-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {t("dashboard.cat_spec")}
          </span>
          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
            {t("dashboard.cat_spec_badge")}
          </span>
        </div>

        {/* Mada Khusus */}
        <div>
          <label htmlFor="filter-mada-khusus" className="block text-xs font-semibold text-amber-900 mb-1">
            {t("dashboard.label_mada_spec")}
          </label>
          <select
            id="filter-mada-khusus"
            className="w-full h-9.5 px-3 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer"
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
            <option value={ALL}>{t("dashboard.all_mada_spec")}</option>
            {daerahKhususList.map((dk) => (
              <option key={dk} value={dk}>
                {dk}
              </option>
            ))}
          </select>
        </div>

        {/* Mawil Khusus */}
        <div>
          <label htmlFor="filter-mawil-khusus" className="block text-xs font-semibold text-amber-900 mb-1">
            {t("dashboard.label_mawil_spec")}
          </label>
          <select
            id="filter-mawil-khusus"
            className="w-full h-9.5 px-3 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer"
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
            <option value={ALL}>{t("dashboard.all_mawil_spec")}</option>
            {wilayahKhususList.map((wk) => (
              <option key={wk} value={wk}>
                {wk}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tombol Aksi Bawah */}
      <div className="pt-1 flex items-center gap-2">
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex-1 h-10 rounded-xl border border-rose-200 bg-rose-50/50 font-bold text-xs text-rose-600 hover:bg-rose-100/60 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>{t("dashboard.reset_filter")}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-10 rounded-xl bg-blue-600 font-bold text-xs text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>{t("dashboard.apply_filter")}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

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
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeCount = [
    filters.daerah !== ALL,
    filters.wilayah !== ALL,
    filters.daerahKhusus !== ALL,
    filters.wilayahKhusus !== ALL,
  ].filter(Boolean).length;

  // Tutup popover desktop saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Tutup dengan tombol Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleResetFilters = () => {
    onChange({
      ...filters,
      daerah: ALL,
      wilayah: ALL,
      daerahKhusus: ALL,
      wilayahKhusus: ALL,
      kabupaten: ALL,
      desa: ALL,
    });
  };

  // Label dinamis pada tombol filter
  const getFilterLabel = () => {
    if (filters.wilayah !== ALL) return filters.wilayah;
    if (filters.daerah !== ALL) return filters.daerah;
    if (filters.wilayahKhusus !== ALL) return filters.wilayahKhusus;
    if (filters.daerahKhusus !== ALL) return filters.daerahKhusus;
    return t("dashboard.filter_btn") || "Filter Wilayah";
  };

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {/* 1. Pencarian Nama Gereja */}
      <SearchBox
        pois={pois}
        onSelectPOI={onSelectPOI}
        className="relative flex-1 min-w-[130px] sm:w-60 lg:w-64 sm:flex-initial shrink-0"
      />

      {/* 2. Tombol Popover Filter Wilayah (Desktop & Mobile) */}
      <div ref={containerRef} className={`relative shrink-0 ${isOpen ? "z-[1300]" : "z-10"}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={t("dashboard.filter_title") || "Filter Wilayah MADA & MAWIL"}
          title={t("dashboard.filter_title") || "Buka filter Mada & Mawil"}
          className={`flex h-9 items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 sm:px-3 text-xs font-bold transition-all cursor-pointer ${
            activeCount > 0
              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/25"
              : "border-slate-200 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <span className="truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[150px] md:max-w-[170px]">
            {getFilterLabel()}
          </span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-extrabold text-white shrink-0">
              {activeCount}
            </span>
          )}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`h-3.5 w-3.5 text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {/* ============================================================== DESKTOP FLOATING POPOVER (md+) */}
        {isOpen && (
          <div className="hidden md:block absolute left-0 top-full mt-2 z-[1350] w-[380px] rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xl animate-fade-in ring-1 ring-black/5">
            <FilterContent
              filters={filters}
              onChange={onChange}
              daerahList={daerahList}
              wilayahList={wilayahList}
              daerahKhususList={daerahKhususList}
              wilayahKhususList={wilayahKhususList}
              activeCount={activeCount}
              onReset={handleResetFilters}
              onClose={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>

      {/* ============================================================== MOBILE BOTTOM SHEET (< md) */}
      {isOpen && (
        <div className="md:hidden">
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[1200] bg-slate-900/40 backdrop-blur-xs cursor-pointer animate-fade-in"
          />

          <div className="fixed inset-x-0 bottom-0 z-[1250] max-h-[85vh] rounded-t-3xl bg-white p-5 border-t border-slate-200 shadow-2xl flex flex-col space-y-4 animate-slide-up overflow-y-auto thin-scroll">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto shrink-0 -mt-1" />
            <FilterContent
              filters={filters}
              onChange={onChange}
              daerahList={daerahList}
              wilayahList={wilayahList}
              daerahKhususList={daerahKhususList}
              wilayahKhususList={wilayahKhususList}
              activeCount={activeCount}
              onReset={handleResetFilters}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
