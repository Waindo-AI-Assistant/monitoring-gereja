"use client";

import { YEARS } from "@/config/dashboard";
import { ALL, type Filters } from "@/lib/stats";

type FilterBarProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  kecamatanList: string[];
  desaList: string[];
  onReset: () => void;
};

// Label dan nilainya memakai ukuran serta keluarga font yang sama dan dirata
// tengah pada satu baris — kotak filter terbaca sebagai satu kesatuan, bukan
// dua teks bergaya berbeda yang ditumpuk.
// Lebar mengikuti isi (fit-content), bukan dipatok sama rata — label sepanjang
// "Kecamatan" tidak berdesakan dengan nilainya, dan field pendek seperti Tahun
// tidak menyisakan ruang kosong.
const fieldClass =
  "flex h-9 w-auto shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 shadow-sm shadow-blue-900/10 transition-colors focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/15";
const labelClass = "shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400";
// Select bawaan melebar mengikuti opsi terpanjangnya. max-w hanya jaring
// pengaman agar daftar desa tidak pernah meregangkan navbar: nama terpanjang di
// data ("Karangduwur (Bedono)", 20 karakter) butuh 144px, jadi 10rem menyisakan
// margin untuk nama baru yang sedikit lebih panjang.
const selectClass =
  "w-auto max-w-[10rem] cursor-pointer truncate bg-transparent text-[10px] font-semibold uppercase tracking-wide text-blue-950 outline-none";

export default function FilterBar({
  filters,
  onChange,
  kecamatanList,
  desaList,
  onReset,
}: FilterBarProps) {
  return (
    <>
      <div className={fieldClass}>
        <label htmlFor="filter-tahun" className={labelClass}>
          Tahun
        </label>
        <select
          id="filter-tahun"
          className={selectClass}
          value={filters.year}
          onChange={(e) => onChange({ ...filters, year: Number(e.target.value) })}
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className={fieldClass}>
        <label htmlFor="filter-kecamatan" className={labelClass}>
          Kecamatan
        </label>
        <select
          id="filter-kecamatan"
          className={selectClass}
          value={filters.kecamatan}
          onChange={(e) =>
            // Ganti kecamatan mereset desa: desa lama hampir pasti bukan
            // anggota kecamatan baru, dan kombinasi itu akan mengosongkan peta.
            onChange({ ...filters, kecamatan: e.target.value, desa: ALL })
          }
        >
          <option value={ALL}>Semua</option>
          {kecamatanList.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

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
          <option value={ALL}>Semua</option>
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
