"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DesaStat } from "@/lib/stats";

type Hit = { kecamatan: string; desa: string };

type SearchBoxProps = {
  records: DesaStat[];
  onSelect: (hit: Hit) => void;
};

const MAX_HITS = 8;

export default function SearchBox({ records, onSelect }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return records
      .filter(
        (r) => r.desa.toLowerCase().includes(q) || r.kecamatan.toLowerCase().includes(q),
      )
      .slice(0, MAX_HITS)
      .map((r) => ({ kecamatan: r.kecamatan, desa: r.desa }));
  }, [query, records]);

  // Tutup daftar saran saat klik di luar kotak pencarian.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(hit: Hit) {
    onSelect(hit);
    setQuery(`${hit.desa}, ${hit.kecamatan}`);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          placeholder="Cari desa atau kecamatan…"
          aria-label="Cari lokasi"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hits.length > 0) choose(hits[0]);
            if (e.key === "Escape") setOpen(false);
          }}
          className="w-full rounded-lg border border-white/15 bg-white/10 py-1.5 pl-8 pr-2.5 text-xs text-white placeholder:text-slate-400 outline-none transition-colors focus:border-white/40 focus:bg-white/15"
        />
      </div>

      {open && hits.length > 0 ? (
        <ul className="absolute left-0 right-0 top-full z-[1200] mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {hits.map((hit) => (
            <li key={`${hit.kecamatan}-${hit.desa}`}>
              <button
                type="button"
                onClick={() => choose(hit)}
                className="flex w-full flex-col items-start px-3 py-1.5 text-left transition-colors hover:bg-blue-50"
              >
                <span className="text-xs font-semibold text-slate-800">{hit.desa}</span>
                <span className="text-[10px] text-slate-500">Kec. {hit.kecamatan}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open && query.trim().length >= 2 && hits.length === 0 ? (
        <div className="absolute left-0 right-0 top-full z-[1200] mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
          <p className="text-[11px] text-slate-500">Tidak ada desa/kecamatan yang cocok.</p>
        </div>
      ) : null}
    </div>
  );
}
