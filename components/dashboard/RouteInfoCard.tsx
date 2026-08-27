"use client";

import React, { useState } from "react";
import type { RouteResult } from "@/lib/routing";
import { getGoogleMapsDirectionsUrl } from "@/lib/routing";

interface RouteInfoCardProps {
  readonly route: RouteResult;
  readonly churchName: string;
  readonly onClose: () => void;
}

export default function RouteInfoCard({
  route,
  churchName,
  onClose,
}: RouteInfoCardProps) {
  const [showSteps, setShowSteps] = useState(true);

  const googleMapsUrl = getGoogleMapsDirectionsUrl(
    route.endCoords[0],
    route.endCoords[1],
    route.startCoords[0],
    route.startCoords[1]
  );

  return (
    <div className="pointer-events-auto absolute bottom-5 left-4 z-1100 w-full max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all sm:left-6">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
              Navigasi Web Aktif
            </span>
          </div>
          <h3 className="mt-0.5 text-sm font-black text-blue-950 line-clamp-1">
            {churchName || "Gereja Tujuan"}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup rute"
          title="Tutup rute navigasi"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stats Badges: Jarak & Durasi */}
      <div className="grid grid-cols-2 gap-2.5 my-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-blue-50/80 p-2.5 border border-blue-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Estimasi Waktu
            </span>
            <span className="text-sm font-black text-blue-950">
              {route.durationFormatted}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-200/80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-white shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Jarak Tempuh
            </span>
            <span className="text-sm font-black text-blue-950 font-mono">
              {route.distanceFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Turn-by-turn Step List (Langsung di Web) */}
      {route.steps.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Panduan Belokan ({route.steps.length} Langkah):
            </span>
            <button
              type="button"
              onClick={() => setShowSteps(!showSteps)}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              {showSteps ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>

          {showSteps && (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 thin-scroll space-y-2 text-xs">
              <ol className="space-y-1.5 text-slate-700">
                {route.steps.map((step, idx) => (
                  <li key={`step-${idx}-${step.name}`} className="flex items-start gap-2 leading-tight">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <span className="text-slate-500 font-medium text-[11px]">{step.instruction} </span>
                      <span className="font-bold text-slate-900">{step.name}</span>
                      {step.distance > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono ml-1">
                          ({step.distance < 1000 ? `${Math.round(step.distance)} m` : `${(step.distance / 1000).toFixed(1)} km`})
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Auxiliary Google Maps Link */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">Rute ditampilkan langsung di peta web</span>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka navigasi suara di Google Maps"
          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          <span>Opsi Google Maps</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
}
