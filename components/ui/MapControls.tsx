"use client";

import { useTranslation } from "react-i18next";
import type { MapTool } from "@/components/map/MapView";

type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  activeTool: MapTool;
  onToolChange: (tool: MapTool) => void;
  onLocateUser?: () => void;
  isLocating?: boolean;
  userLocation?: [number, number] | null;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

const iconButtonBase =
  "flex h-10 w-10 items-center justify-center text-blue-950 transition-colors duration-200 hover:bg-blue-50 cursor-pointer";
const iconButtonActive = "bg-blue-600 text-white hover:bg-blue-700";

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
  activeTool,
  onToolChange,
  onLocateUser,
  isLocating,
  userLocation,
  sidebarOpen,
  onToggleSidebar,
}: MapControlsProps) {
  const { t } = useTranslation();

  /** Klik alat yang sedang aktif akan mematikannya. */
  const toggle = (tool: Exclude<MapTool, null>) =>
    onToolChange(activeTool === tool ? null : tool);

  return (
    <div className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm shadow-blue-900/10">
      <button
        type="button"
        onClick={onZoomIn}
        title={t("dashboard.zoom_in") || "Perbesar peta"}
        aria-label={t("dashboard.zoom_in") || "Perbesar peta"}
        className={iconButtonBase}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <div className="h-px bg-slate-100" />

      <button
        type="button"
        onClick={onZoomOut}
        title={t("dashboard.zoom_out") || "Perkecil peta"}
        aria-label={t("dashboard.zoom_out") || "Perkecil peta"}
        className={iconButtonBase}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </button>

      <div className="h-px bg-slate-100" />

      {/* Tombol Lokasi Saya (GPS Live Tracker) */}
      {onLocateUser && (
        <>
          <button
            type="button"
            onClick={onLocateUser}
            title={userLocation ? (t("dashboard.locate_me") || "Fokus ke lokasi saya saat ini") : (t("dashboard.locate_me_on") || "Aktifkan deteksi lokasi saya (GPS)")}
            aria-label={t("dashboard.locate_me") || "Lokasi Saya"}
            className={`${iconButtonBase} ${userLocation ? "text-blue-600 hover:bg-blue-50" : ""} ${
              isLocating ? "animate-pulse bg-blue-50 text-blue-600" : ""
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
              <circle cx="12" cy="12" r="3" fill={userLocation ? "currentColor" : "none"} />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              <circle cx="12" cy="12" r="7" />
            </svg>
          </button>
          <div className="h-px bg-slate-100" />
        </>
      )}

      {/* Tombol Panel Layer & Peta Dasar */}
      {onToggleSidebar && (
        <>
          <button
            type="button"
            onClick={onToggleSidebar}
            title={t("dashboard.layer_panel") || "Panel Layer & Peta Dasar"}
            aria-label={t("dashboard.layer_panel") || "Panel Layer & Peta Dasar"}
            aria-pressed={sidebarOpen}
            className={`${iconButtonBase} ${sidebarOpen ? iconButtonActive : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L21.75 16.5 12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
            </svg>
          </button>
          <div className="h-px bg-slate-100" />
        </>
      )}

      <button
        type="button"
        onClick={() => toggle("zoombox")}
        title={t("dashboard.zoombox_title") || "Zoom ke area: tarik kotak di peta"}
        aria-label={t("dashboard.zoombox_title") || "Zoom ke area (zoom kotak)"}
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
        title={t("dashboard.measure_title") || "Ukur jarak & luas"}
        aria-label={t("dashboard.measure_title") || "Alat ukur"}
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
        title={t("dashboard.reset_map") || "Reset ke tampilan awal"}
        aria-label={t("dashboard.reset_map") || "Reset tampilan peta"}
        className={iconButtonBase}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 11.5a8 8 0 0 1-13.7 5.6L3.5 14.5M4 12.5a8 8 0 0 1 13.7-5.6l2.8 2.6"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19.5v-5h5M20.5 4.5v5h-5" />
        </svg>
      </button>
    </div>
  );
}
