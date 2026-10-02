"use client";

import { useState, useRef, useEffect } from "react";

type SearchBoxProps = {
  pois: any[];
  onSelectPOI: (latlng: [number, number], properties: any) => void;
};

export default function SearchBox({ pois, onSelectPOI }: SearchBoxProps) {
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
    <div ref={containerRef} className="relative w-64 shrink-0">
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
          placeholder="CARI NAMA GEREJA..."
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
        <div className="absolute left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg shadow-black/10 animate-fade-in">
          {suggestions.map((poi, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={poi.properties.id || idx}
                type="button"
                onClick={() => selectItem(poi)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full px-3 py-2 text-left text-[11px] transition-colors outline-none block truncate ${
                  isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="font-semibold truncate text-left">{poi.properties.name}</div>
                <div className="text-[9px] text-slate-400 truncate text-left">
                  {poi.properties.mawil || "Majelis Wilayah"} &bull; {poi.properties.nama_mada || "Mada"}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
