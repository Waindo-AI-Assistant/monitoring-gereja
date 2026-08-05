"use client";

import type { MapTool } from "@/components/map/MapView";

type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  activeTool: MapTool;
  onToolChange: (tool: MapTool) => void;
};

const iconButtonBase =
  "flex h-10 w-10 items-center justify-center text-blue-950 transition-colors duration-200 hover:bg-blue-50";
const iconButtonActive = "bg-blue-600 text-white hover:bg-blue-700";

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
  activeTool,
  onToolChange,
}: MapControlsProps) {
  /** Klik alat yang sedang aktif akan mematikannya. */
  const toggle = (tool: Exclude<MapTool, null>) =>
    onToolChange(activeTool === tool ? null : tool);

  return (
    <div className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm shadow-blue-900/10">
      <button type="button" onClick={onZoomIn} title="Perbesar peta" aria-label="Perbesar peta" className={iconButtonBase}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <div className="h-px bg-slate-100" />

      <button type="button" onClick={onZoomOut} title="Perkecil peta" aria-label="Perkecil peta" className={iconButtonBase}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </button>

      <div className="h-px bg-slate-100" />

      <button
        type="button"
        onClick={() => toggle("zoombox")}
        title="Zoom ke area: tarik kotak di peta"
        aria-label="Zoom ke area (zoom kotak)"
        aria-pressed={activeTool === "zoombox"}
        className={`${iconButtonBase} ${activeTool === "zoombox" ? iconButtonActive : ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
          <rect x="3.5" y="3.5" width="12" height="12" rx="1.5" strokeDasharray="3 2" />
          <path strokeLinecap="round" d="M13.5 13.5L20.5 20.5" />
        </svg>
      </button>

      <div className="h-px bg-slate-100" />

      <button
        type="button"
        onClick={() => toggle("measure")}
        title="Ukur jarak & luas: klik titik-titik di peta"
        aria-label="Alat ukur"
        aria-pressed={activeTool === "measure"}
        className={`${iconButtonBase} ${activeTool === "measure" ? iconButtonActive : ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 16.5L16.5 2 22 7.5 7.5 22 2 16.5z" />
          <path strokeLinecap="round" d="M6 12.5l2 2M9.5 9l2 2M13 5.5l2 2" />
        </svg>
      </button>

      <div className="h-px bg-slate-100" />

      <button
        type="button"
        onClick={onReset}
        title="Reset ke tampilan awal"
        aria-label="Reset tampilan peta"
        className={iconButtonBase}
      >
        {/* Dua busur bercelah dengan mata panah — sengaja bukan lingkaran penuh
            supaya terbaca sebagai "putar ulang", bukan sekadar bulatan. */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 11.5a8 8 0 0 1-13.7 5.6L3.5 14.5M4 12.5a8 8 0 0 1 13.7-5.6l2.8 2.6"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19.5v-5h5M20.5 4.5v5h-5" />
        </svg>
      </button>

      <div className="h-px bg-slate-100" />
{/* 
      <a
        href="https://ion.cesium.com/stories/viewer/?id=3025c507-3cfe-4a47-a866-8e2f21bfe02e"
        target="_blank"
        rel="noopener noreferrer"
        title="Buka Peta 3D (Web 3D Viewer)"
        aria-label="Buka Peta 3D"
        className={`${iconButtonBase} text-blue-600 hover:bg-blue-50 font-bold`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      </a> */}
    </div>
  );
}
