"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

type SearchBoxProps = {
  pois: any[];
  onSelectPOI: (latlng: [number, number], properties: any) => void;
  className?: string;
};

export default function SearchBox({ pois, onSelectPOI, className = "relative w-full sm:w-64 shrink-0" }: SearchBoxProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter POIs based on the query (searching by properties.name)
  const suggestions = query.trim() === ""
    ? []
    : pois.filter((poi: any) => {
        const name = poi.properties?.name || "";
        return name.toLowerCase().includes(query.toLowerCase());
      }).slice(0, 8); // Limit to top 8 results

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        selectItem(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        selectItem(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const selectItem = (poi: any) => {
    const coords = poi.geometry?.coordinates; // [lng, lat]
    if (coords && coords.length >= 2) {
      const latlng: [number, number] = [coords[1], coords[0]];
      onSelectPOI(latlng, poi.properties);
      setQuery(poi.properties.name || "");
    }
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className={`${className} ${isOpen ? "relative z-[1300]" : "relative z-10"}`}>
      <div className="flex h-9 w-full shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 shadow-sm shadow-blue-900/10 transition-colors focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/15 text-slate-800">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-3.5 w-3.5 shrink-0 text-slate-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder={t("dashboard.search_placeholder") || "CARI NAMA GEREJA..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-[10px] font-semibold uppercase tracking-wide text-blue-950 outline-none placeholder:text-slate-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/5 text-slate-400 shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-[1350] mt-1.5 w-full min-w-[280px] sm:min-w-[340px] max-w-[calc(100vw-32px)] max-h-72 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/98 backdrop-blur-md py-1.5 shadow-2xl shadow-slate-900/25 ring-1 ring-slate-900/10 animate-fade-in thin-scroll">
          {suggestions.map((poi, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={poi.properties.id || idx}
                type="button"
                onClick={() => selectItem(poi)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full px-3.5 py-2.5 text-left text-xs transition-colors outline-none flex items-start gap-2.5 cursor-pointer ${
                  isActive ? "bg-blue-50 text-blue-900 font-semibold" : "text-slate-800 hover:bg-slate-50"
                }`}
              >
                <div className="mt-0.5 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate text-left text-slate-900">{poi.properties.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium truncate text-left mt-0.5">
                    {poi.properties.tipe_wilayah === "Wilayah Khusus" || poi.properties.daerah_khusus || poi.properties.wilayah_khusus || String(poi.properties.nama_mada || "").toUpperCase().includes("KHUSUS")
                      ? `${poi.properties.wilayah_khusus || (poi.properties.mawil && poi.properties.mawil !== " " ? poi.properties.mawil : "Wilayah Khusus")} \u2022 ${poi.properties.daerah_khusus || poi.properties.nama_mada || "Daerah Khusus"}`
                      : `${poi.properties.mawil || "Majelis Wilayah"} \u2022 ${poi.properties.nama_mada || "Mada"}`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query.trim() !== "" && suggestions.length === 0 && (
        <div className="absolute left-0 top-full z-[1350] mt-1.5 w-full min-w-[260px] sm:min-w-[300px] rounded-xl border border-slate-200 bg-white p-3 text-center text-xs text-slate-500 shadow-xl ring-1 ring-black/5 animate-fade-in">
          {t("dashboard.no_church_found") || "Tidak ada gereja ditemukan"}
        </div>
      )}
    </div>
  );
}
