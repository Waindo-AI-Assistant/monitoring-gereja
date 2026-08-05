"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DEFAULT_BASEMAP_ID, LAYERS, type LayerId } from "@/config/dashboard";
import {
  DEFAULT_FILTERS,
  desaOptions,
  filterRecords,
  formatArea,
  kecamatanOptions,
  layerPassesYear,
  summarize,
  type DesaStat,
  type Filters,
  type StatsFile,
} from "@/lib/stats";
import type { MapHandle, MapTool, MeasureResult } from "@/components/map/MapView";
import MapControls from "@/components/ui/MapControls";
import SummaryCards from "./SummaryCards";
import FilterBar from "./FilterBar";
import LayerControl from "./LayerControl";
import ChartsPanel from "./ChartsPanel";
import SearchBox from "./SearchBox";

// Leaflet menyentuh `window` saat modul dievaluasi, jadi peta tidak boleh
// ikut render di server.
const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

const DEFAULT_VISIBLE = Object.fromEntries(
  LAYERS.map((l) => [l.id, l.defaultVisible]),
) as Record<LayerId, boolean>;

/** Di bawah lebar ini panel menutupi peta, jadi lebih baik mulai tertutup. */
const WIDE_SCREEN_QUERY = "(min-width: 1024px)";

/**
 * Berlangganan ke media query lewat useSyncExternalStore, bukan setState di
 * dalam useEffect: lebar layar adalah state milik browser, jadi React cukup
 * membacanya. Cara ini juga bebas hydration mismatch — server memakai snapshot
 * "layar lebar" dan client menyesuaikan sendiri setelah hydrate.
 */
function useIsWideScreen(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(WIDE_SCREEN_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE_SCREEN_QUERY).matches,
    () => true,
  );
}

export default function DashboardShell() {
  const mapRef = useRef<MapHandle | null>(null);

  const [stats, setStats] = useState<StatsFile | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerId, boolean>>(DEFAULT_VISIBLE);
  const [basemapId, setBasemapId] = useState(DEFAULT_BASEMAP_ID);
  const [activeTool, setActiveTool] = useState<MapTool>(null);
  const [measure, setMeasure] = useState<MeasureResult>(null);
  const [layerLoading, setLayerLoading] = useState(false);
  // null = pengguna belum memutuskan, ikuti default per ukuran layar.
  const [sidebarToggled, setSidebarToggled] = useState<boolean | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<{
    properties: Record<string, any>;
    layerLabel: string;
  } | null>(null);

  const isWideScreen = useIsWideScreen();
  const sidebarOpen = sidebarToggled ?? isWideScreen;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/stats.json");
        if (!res.ok) throw new Error("gagal memuat statistik");
        const data = (await res.json()) as StatsFile;
        if (!cancelled) setStats(data);
      } catch (error) {
        if (!cancelled) {
          setStatsError(error instanceof Error ? error.message : "Statistik gagal dimuat.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allRecords: DesaStat[] = useMemo(() => stats?.desa ?? [], [stats]);
  const records = useMemo(() => filterRecords(allRecords, filters), [allRecords, filters]);
  const summary = useMemo(() => summarize(records), [records]);

  const kecamatanList = useMemo(() => kecamatanOptions(allRecords), [allRecords]);
  const desaList = useMemo(
    () => desaOptions(allRecords, filters.kecamatan),
    [allRecords, filters.kecamatan],
  );

  const penutupLahanAktif = layerPassesYear(2020, filters.year);
  const kehutananAktif = layerPassesYear(2021, filters.year);
  // Layer detail hanya ada di Desa Bayan; kalau filter menyempit ke luar sana,
  // angka nol harus dibaca "belum ada data", bukan "tidak ada objek".
  const detailKosong = summary.jumlahPersil === 0 && summary.jumlahPoi === 0;

  const handleFiltersChange = useCallback((next: Filters) => {
    setFilters(next);
    mapRef.current?.fitTo(next.kecamatan, next.desa);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActiveTool(null);
    setVisibleLayers(DEFAULT_VISIBLE);
    setSelectedFeature(null);
    mapRef.current?.resetView();
  }, []);

  const handleToggleLayer = useCallback((id: LayerId, visible: boolean) => {
    setVisibleLayers((prev) => ({ ...prev, [id]: visible }));
  }, []);

  const handleToolFinished = useCallback(() => setActiveTool(null), []);

  // Layer yang tersingkir filter tahun tidak boleh ikut dikirim ke peta,
  // walau checkbox-nya masih tercentang.
  const effectiveLayers = useMemo(() => {
    const out = {} as Record<LayerId, boolean>;
    for (const layer of LAYERS) {
      out[layer.id] = visibleLayers[layer.id] && layerPassesYear(layer.year, filters.year);
    }
    return out;
  }, [visibleLayers, filters.year]);

  if (statsError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-semibold text-red-600">Data dashboard gagal dimuat</p>
        <p className="max-w-sm text-xs text-slate-500">{statsError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      {/* ------------------------------------------------------------ header */}
      <header className="z-30 flex shrink-0 items-center gap-3 bg-blue-950 px-3 py-2 text-white shadow-md">
        <Link
          href="/"
          title="Kembali ke halaman utama"
          aria-label="Kembali ke halaman utama"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </Link>

        <button
          type="button"
          onClick={() => setSidebarToggled(!sidebarOpen)}
          title={sidebarOpen ? "Sembunyikan panel — perlebar peta" : "Tampilkan panel layer & grafik"}
          aria-label="Tampilkan atau sembunyikan panel"
          aria-expanded={sidebarOpen}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold leading-tight">
            Dashboard Geospasial Monitoring Gereja
          </h1>
          <p className="truncate text-[10px] text-slate-300">Pemetaan &amp; Analisis Spasial Jemaat</p>
        </div>

        <div className="ml-auto w-40 shrink-0 sm:w-56 lg:w-72">
          <SearchBox
            records={allRecords}
            onSelect={(hit) =>
              handleFiltersChange({ ...filters, kecamatan: hit.kecamatan, desa: hit.desa })
            }
          />
        </div>
      </header>

      {/* Satu deret: pilihan pengguna (filter & Web 3D) lalu angka ringkasannya. */}
      <div className="z-20 flex shrink-0 flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2 shadow-sm">
        <FilterBar
          filters={filters}
          onChange={handleFiltersChange}
          kecamatanList={kecamatanList}
          desaList={desaList}
          onReset={handleReset}
        />
        <SummaryCards
          summary={summary}
          penutupLahanAktif={penutupLahanAktif}
          kehutananAktif={kehutananAktif}
          detailKosong={detailKosong}
        />
      </div>

      {/* ------------------------------------------------------------- konten */}
      <div className="relative flex min-h-0 flex-1">
        {/* Panel tunggal: layer + legenda/komposisi. Bisa ditutup agar peta
            memakai lebar penuh. */}
        {sidebarOpen ? (
          <aside className="absolute inset-y-0 left-0 z-[1100] w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 shadow-xl thin-scroll lg:static lg:shadow-none">
            <LayerControl
              visibleLayers={visibleLayers}
              onToggleLayer={handleToggleLayer}
              basemapId={basemapId}
              onBasemapChange={setBasemapId}
              filters={filters}
            />

            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Legenda &amp; Komposisi
              </p>
              {stats ? (
                <ChartsPanel
                  records={records}
                  filters={filters}
                  visibleLayers={effectiveLayers}
                />
              ) : (
                <p className="text-xs text-slate-400">Memuat statistik…</p>
              )}
            </div>
          </aside>
        ) : null}

        {/* peta */}
        <main className="relative min-w-0 flex-1">
          <MapView
            ref={mapRef}
            basemapId={basemapId}
            visibleLayers={effectiveLayers}
            filters={filters}
            activeTool={activeTool}
            onToolFinished={handleToolFinished}
            onMeasureChange={setMeasure}
            onLoadingChange={setLayerLoading}
            onFeatureSelect={(props, label) => {
              if (props) {
                setSelectedFeature({ properties: props, layerLabel: label });
              } else {
                setSelectedFeature(null);
              }
            }}
          />

          <div className="pointer-events-none absolute inset-0">
            <div className="pointer-events-auto absolute left-3 top-3 z-[400]">
              <MapControls
                onZoomIn={() => mapRef.current?.zoomIn()}
                onZoomOut={() => mapRef.current?.zoomOut()}
                onReset={handleReset}
                activeTool={activeTool}
                onToolChange={setActiveTool}
              />
            </div>

            {layerLoading ? (
              <div className="pointer-events-none absolute left-1/2 top-3 z-[400] -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm shadow-blue-900/10">
                Memuat layer…
              </div>
            ) : null}

            {activeTool === "zoombox" ? (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-[400] -translate-x-1/2 rounded-2xl bg-white px-4 py-2 shadow-sm shadow-blue-900/10">
                <p className="text-[11px] text-slate-500">
                  Tarik kotak di peta untuk memperbesar ke area tersebut.
                </p>
              </div>
            ) : null}

            {activeTool === "measure" ? (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-[400] -translate-x-1/2 rounded-2xl bg-white px-4 py-2 shadow-sm shadow-blue-900/10">
                {measure && measure.points > 0 ? (
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-slate-500">
                      Jarak{" "}
                      <strong className="font-mono text-slate-800">
                        {formatArea(measure.distanceM / 1000)} km
                      </strong>
                    </span>
                    {measure.points >= 3 ? (
                      <span className="text-[11px] text-slate-500">
                        Luas{" "}
                        <strong className="font-mono text-slate-800">
                          {formatArea(measure.areaM2 / 10000)} ha
                        </strong>
                      </span>
                    ) : null}
                    <span className="text-[10px] text-slate-400">
                      Klik kanan: undo
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTool(null)}
                      className="pointer-events-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Selesai
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Klik titik-titik di peta untuk mengukur jarak &amp; luas. Double-klik untuk menyelesaikan.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </main>

        {/* backdrop panel saat menutupi peta di layar sempit */}
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Tutup panel"
            onClick={() => setSidebarToggled(false)}
            className="absolute inset-0 z-[1050] bg-slate-900/20 lg:hidden"
          />
        ) : null}

        {/* ------------------------------------------------------------- DRAWER DETAIL KANAN */}
        <div
          className={`fixed top-0 right-0 bottom-0 z-[1200] w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            selectedFeature ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedFeature ? (
            <>
              {/* Header Laci */}
              <div className="flex items-center justify-between bg-blue-950 p-4 text-white">
                <div className="min-w-0">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-300">
                    {selectedFeature.layerLabel}
                  </span>
                  <h2 className="text-sm font-bold truncate">
                    {selectedFeature.properties.name || selectedFeature.properties.nama || "Detail Objek"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFeature(null)}
                  aria-label="Tutup Detail"
                  className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Foto Detail & Avatar Pendeta */}
              {(() => {
                const imgKey = Object.keys(selectedFeature.properties).find((k) =>
                  ["foto", "photo", "image", "gambar", "image_url", "url_foto"].includes(k.toLowerCase())
                );
                const imageUrl = imgKey ? String(selectedFeature.properties[imgKey]) : null;

                const pastorImgKey = Object.keys(selectedFeature.properties).find((k) =>
                  ["foto_pendeta", "photo_pendeta", "foto_pastor", "photo_pastor", "pastor_photo", "pastor_image"].includes(k.toLowerCase())
                );
                const pastorImageUrl = pastorImgKey ? String(selectedFeature.properties[pastorImgKey]) : null;

                const pastorNameKey = Object.keys(selectedFeature.properties).find((k) =>
                  ["pendeta", "nama_pendeta", "pastor", "nama_pastor", "priest", "pimpinan"].includes(k.toLowerCase())
                );
                const pastorName = pastorNameKey ? String(selectedFeature.properties[pastorNameKey]) : null;

                if (!imageUrl && !pastorImageUrl) return null;

                return (
                  <div className="relative w-full h-48 bg-slate-100 border-b border-slate-200">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="Foto Detail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    )}

                    {pastorImageUrl && (
                      <div 
                        className="absolute bottom-0 right-6 transform translate-y-1/2 z-20"
                        title={pastorName ? `Pendeta: ${pastorName}` : "Pendeta"}
                      >
                        <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200">
                          <img
                            src={pastorImageUrl}
                            alt={pastorName || "Foto Pendeta"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const parent = (e.target as HTMLElement).parentElement;
                              if (parent) parent.style.display = "none";
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Konten Detail */}
              <div className="flex-1 overflow-y-auto p-4 pt-10 space-y-4 thin-scroll">
                {/* Info Pendeta (Jika Ada) */}
                {(() => {
                  const pastorNameKey = Object.keys(selectedFeature.properties).find((k) =>
                    ["pendeta", "nama_pendeta", "pastor", "nama_pastor", "priest", "pimpinan"].includes(k.toLowerCase())
                  );
                  const pastorName = pastorNameKey ? String(selectedFeature.properties[pastorNameKey]) : null;

                  if (!pastorName) return null;

                  return (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex-1">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                          Pimpinan / Pendeta
                        </span>
                        <p className="text-xs font-bold text-slate-800">{pastorName}</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Atribut Geodatabase
                  </h3>
                  <table className="w-full border-collapse">
                    <tbody>
                      {Object.entries(selectedFeature.properties)
                        .filter(([k, v]) => 
                          !["foto", "photo", "image", "gambar", "image_url", "url_foto"].includes(k.toLowerCase()) &&
                          !["foto_pendeta", "photo_pendeta", "foto_pastor", "photo_pastor", "pastor_photo", "pastor_image"].includes(k.toLowerCase()) &&
                          !["pendeta", "nama_pendeta", "pastor", "nama_pastor", "priest", "pimpinan"].includes(k.toLowerCase()) &&
                          !["name", "nama", "title", "judul"].includes(k.toLowerCase()) &&
                          v !== null && v !== undefined && v !== ""
                        )
                        .map(([k, v]) => {
                          const label = k.replace(/_/g, " ");
                          return (
                            <tr key={k} className="border-b border-slate-100 last:border-0">
                              <td className="py-2 pr-3 text-[10px] font-medium uppercase text-slate-400 align-top">
                                {label}
                              </td>
                              <td className="py-2 text-xs font-semibold text-slate-800 text-right">
                                {typeof v === "number" ? new Intl.NumberFormat("id-ID").format(v) : String(v)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p className="text-xs">Pilih titik pada peta untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
