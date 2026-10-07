"use client";

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
  return (
    <>
      {/* Pencarian Nama Jemaah */}
      <SearchBox pois={pois} onSelectPOI={onSelectPOI} />

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

      {/* Filter Wilayah (Wilayah Biasa) */}
      <div className={fieldClass}>
        <label htmlFor="filter-wilayah" className={labelClass}>
          Wilayah
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
          <option value={ALL}>Semua Wilayah</option>
          {wilayahList.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      {/* Pembatas Visual Antara Wilayah Biasa & Wilayah Khusus */}
      <div className="h-5 w-px bg-slate-200 shrink-0 mx-0.5" />

      {/* Filter Daerah Khusus */}
      <div className={fieldKhususClass}>
        <span className="flex h-2 w-2 rounded-full bg-amber-500 shrink-0" />
        <label htmlFor="filter-daerah-khusus" className={labelKhususClass}>
          Daerah Khusus
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
          <option value={ALL}>Semua (Tanpa Filter)</option>
          <option value={ALL_KHUSUS}>★ Semua Wilayah Khusus</option>
          {daerahKhususList.map((dk) => (
            <option key={dk} value={dk}>
              {dk}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Wilayah Khusus */}
      {wilayahKhususList.length > 0 && (
        <div className={fieldKhususClass}>
          <label htmlFor="filter-wilayah-khusus" className={labelKhususClass}>
            Wilayah Khusus
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
            <option value={ALL}>Semua Wilayah Khusus</option>
            {wilayahKhususList.map((wk) => (
              <option key={wk} value={wk}>
                {wk}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
