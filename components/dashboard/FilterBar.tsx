"use client";

import { ALL, type Filters } from "@/lib/stats";

type FilterBarProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  daerahList: string[];
  kabupatenList: string[];
  desaList: string[];
  onReset: () => void;
};

const fieldClass =
  "flex h-9 w-auto shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 shadow-sm shadow-blue-900/10 transition-colors focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/15";
const labelClass = "shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400";
const selectClass =
  "w-auto max-w-[12rem] cursor-pointer truncate bg-transparent text-[10px] font-semibold uppercase tracking-wide text-blue-950 outline-none";

export default function FilterBar({
  filters,
  onChange,
  daerahList,
  kabupatenList,
  desaList,
  onReset,
}: FilterBarProps) {
  return (
    <>
      {/* Filter Daerah / Mada */}
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
              kabupaten: ALL,
              desa: ALL
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

      {/* Filter Kabupaten */}
      <div className={fieldClass}>
        <label htmlFor="filter-kabupaten" className={labelClass}>
          Kabupaten
        </label>
        <select
          id="filter-kabupaten"
          className={selectClass}
          value={filters.kabupaten}
          onChange={(e) => 
            onChange({ 
              ...filters, 
              kabupaten: e.target.value,
              desa: ALL
            })
          }
        >
          <option value={ALL}>Semua Kabupaten</option>
          {kabupatenList.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Desa */}
      <div className={fieldClass}>
        <label htmlFor="filter-desa" className={labelClass}>
          Desa
        </label>
        <select
          id="filter-desa"
          className={selectClass}
          value={filters.desa}
          onChange={(e) => onChange({ ...filters, desa: e.target.value })}
        >
          <option value={ALL}>Semua Desa</option>
          {desaList.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        title="Kembalikan filter ke tampilan awal"
        className="h-9 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm shadow-blue-900/10 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        Reset
      </button>
    </>
  );
}
