"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DEFAULT_BASEMAP_ID, LAYERS, ATTRIBUTE_LABELS, GEREJA_ORDERED_FIELDS, type LayerId } from "@/config/dashboard";
import {
  ALL,
  DEFAULT_FILTERS,
  formatArea,
  type Filters,
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

  const [poiFeatures, setPoiFeatures] = useState<any[]>([]);
  const [poiError, setPoiError] = useState<string | null>(null);
  const [regionsHierarchy, setRegionsHierarchy] = useState<Record<string, string[]> | null>(null);
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
  const [activePhotoModal, setActivePhotoModal] = useState<{
    urls: string[];
    currentIndex: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [coverIndex, setCoverIndex] = useState(0);

  const isWideScreen = useIsWideScreen();
  const sidebarOpen = sidebarToggled ?? isWideScreen;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/poi.geojson");
        if (!res.ok) throw new Error("gagal memuat data gereja");
        const data = await res.json();
        if (!cancelled) setPoiFeatures(data.features ?? []);
      } catch (error) {
        if (!cancelled) {
          setPoiError(error instanceof Error ? error.message : "Data gereja gagal dimuat.");
        }
      }
    })();

    (async () => {
      try {
        const res = await fetch("/data/regions_hierarchy.json");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setRegionsHierarchy(data);
        }
      } catch {
        // Fallback dinonaktifkan secara aman
      }
    })();

  }, []);

  // Slideshow Autoplay Effect
  useEffect(() => {
    if (!activePhotoModal || activePhotoModal.urls.length <= 1 || !isPlaying) return;

    const timer = setInterval(() => {
      setActivePhotoModal((prev) => {
        if (!prev) return null;
        const nextIndex = (prev.currentIndex + 1) % prev.urls.length;
        return { ...prev, currentIndex: nextIndex };
      });
    }, 3000); // Ganti foto setiap 3 detik

    return () => clearInterval(timer);
  }, [activePhotoModal, isPlaying]);

  // Reset cover index when selected jemaat changes
  useEffect(() => {
    setCoverIndex(0);
  }, [selectedFeature]);

  // Autoplay for the drawer cover image (mini-carousel)
  useEffect(() => {
    if (!selectedFeature) return;
    const photosRaw = selectedFeature.properties.photos;
    let photos: string[] = [];
    if (Array.isArray(photosRaw)) {
      photos = photosRaw;
    } else if (typeof photosRaw === "string" && photosRaw.trim() !== "") {
      try {
        photos = JSON.parse(photosRaw);
      } catch {
        photos = [photosRaw];
      }
    }

    if (photos.length <= 1) return;

    const timer = setInterval(() => {
      setCoverIndex((prev) => (prev + 1) % photos.length);
    }, 4000); // slide every 4 seconds in the drawer

    return () => clearInterval(timer);
  }, [selectedFeature]);

  const daerahList = useMemo(() => {
    const list = poiFeatures
      .map((f: any) => f.properties?.nama_mada)
      .filter((name: any) => name && name.trim() !== "");
    return [...new Set(list)].sort() as string[];
  }, [poiFeatures]);

  const wilayahList = useMemo(() => {
    let filtered = poiFeatures;
    if (filters.daerah !== ALL) {
      filtered = filtered.filter((f: any) => f.properties?.nama_mada === filters.daerah);
    }
    const list = filtered
      .map((f: any) => f.properties?.mawil)
      .filter((name: any) => name && name.trim() !== "");
    return [...new Set(list)].sort() as string[];
  }, [poiFeatures, filters.daerah]);

  const kabupatenList = useMemo(() => {
    if (regionsHierarchy) {
      return Object.keys(regionsHierarchy).sort();
    }
    let filtered = poiFeatures;
    if (filters.daerah !== ALL) {
      filtered = filtered.filter((f: any) => f.properties?.nama_mada === filters.daerah);
    }
    if (filters.wilayah !== ALL) {
      filtered = filtered.filter((f: any) => f.properties?.mawil === filters.wilayah);
    }
    const list = filtered
      .map((f: any) => f.properties?.kabupaten)
      .filter((name: any) => name && name.trim() !== "");
    return [...new Set(list)].sort() as string[];
  }, [poiFeatures, filters.daerah, filters.wilayah, regionsHierarchy]);

  const desaList = useMemo(() => {
    if (regionsHierarchy && filters.kabupaten !== ALL) {
      return regionsHierarchy[filters.kabupaten] ?? [];
    }
    let filtered = poiFeatures;
    if (filters.daerah !== ALL) {
      filtered = filtered.filter((f: any) => f.properties?.nama_mada === filters.daerah);
    }
    if (filters.wilayah !== ALL) {
      filtered = filtered.filter((f: any) => f.properties?.mawil === filters.wilayah);
    }
    if (filters.kabupaten !== ALL) {
      filtered = filtered.filter((f: any) => f.properties?.kabupaten === filters.kabupaten);
    }
    const list = filtered
      .map((f: any) => f.properties?.desa)
      .filter((name: any) => name && name.trim() !== "");
    return [...new Set(list)].sort() as string[];
  }, [poiFeatures, filters.daerah, filters.wilayah, filters.kabupaten, regionsHierarchy]);

  const summary = useMemo(() => {
    const total = poiFeatures.length;
    const filtered = poiFeatures.filter((f: any) => {
      const p = f.properties ?? {};
      if (filters.daerah !== ALL && p.nama_mada !== filters.daerah) return false;
      if (filters.wilayah !== ALL && p.mawil !== filters.wilayah) return false;
      if (filters.kabupaten !== ALL && p.kabupaten !== filters.kabupaten) return false;
      if (filters.desa !== ALL && p.desa !== filters.desa) return false;
      return true;
    });
    return {
      jumlahMada: daerahList.length,
      jumlahWilayah: wilayahList.length,
      totalGereja: total,
      gerejaTerfilter: filtered.length,
    };
  }, [poiFeatures, filters, daerahList, wilayahList]);

  const handleFiltersChange = useCallback((next: Filters) => {
    setFilters(next);
    mapRef.current?.fitTo(next);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActiveTool(null);
    setVisibleLayers(DEFAULT_VISIBLE);
    setSelectedFeature(null);
    mapRef.current?.resetView();
    mapRef.current?.closePopup();
  }, []);

  const handleToggleLayer = useCallback((id: LayerId, visible: boolean) => {
    setVisibleLayers((prev) => ({ ...prev, [id]: visible }));
  }, []);

  const handleToolFinished = useCallback(() => setActiveTool(null), []);

  // Layer yang tercentang dikirim ke peta.
  const effectiveLayers = useMemo(() => {
    const out = {} as Record<LayerId, boolean>;
    for (const layer of LAYERS) {
      out[layer.id] = visibleLayers[layer.id];
    }
    return out;
  }, [visibleLayers]);

  if (poiError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-semibold text-red-600">Data dashboard gagal dimuat</p>
        <p className="max-w-sm text-xs text-slate-500">{poiError}</p>
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

        <img
          src="/images/Logo GGP2.png?v=2"
          alt="Logo GGP"
          className="h-8 w-auto object-contain shrink-0"
        />

        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold leading-tight">
            Dashboard Geospasial Monitoring Gereja
          </h1>
          <p className="truncate text-[10px] text-slate-300">Pemetaan &amp; Analisis Spasial Jemaat</p>
        </div>

        {/* SearchBox dinonaktifkan karena Purworejo-specific */}
      </header>

      {/* Satu deret: pilihan pengguna (filter daerah & ringkasan) */}
      <div className="z-20 flex shrink-0 flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2 shadow-sm">
        <FilterBar
          filters={filters}
          onChange={handleFiltersChange}
          daerahList={daerahList}
          wilayahList={wilayahList}
          kabupatenList={kabupatenList}
          desaList={desaList}
        />
        <SummaryCards
          summary={summary}
        />
        <button
          type="button"
          onClick={handleReset}
          title="Kembalikan filter ke tampilan awal"
          className="h-9 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm shadow-blue-900/10 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Reset
        </button>
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

            {/* Legenda & Komposisi dinonaktifkan karena tidak ada layer bertema */}
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
            {/* Logo overlay di pojok kanan atas peta */}
            <div className="pointer-events-none absolute top-3 right-3 z-[400]">
              <img
                src="/images/Logo GGP2.png?v=2"
                alt="Logo GGP"
                className="h-16 w-auto object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              />
            </div>

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
                    Klik titik-titik di peta untuk mengukur jarak &amp; luas. Klik kanan untuk undo.
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
                   onClick={() => {
                     setSelectedFeature(null);
                     mapRef.current?.closePopup();
                   }}
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
                // Ambil daftar foto dinamis dari properti array 'photos'
                const photosRaw = selectedFeature.properties.photos;
                let photos: string[] = [];
                if (Array.isArray(photosRaw)) {
                  photos = photosRaw;
                } else if (typeof photosRaw === "string" && photosRaw.trim() !== "") {
                  try {
                    photos = JSON.parse(photosRaw);
                  } catch {
                    photos = [photosRaw];
                  }
                }
                
                // Fallback ke kolom single 'foto' atau 'foto_2' jika list kosong
                if (photos.length === 0) {
                  const imgKey = Object.keys(selectedFeature.properties).find((k) =>
                    ["foto", "photo", "image", "gambar", "image_url", "url_foto"].includes(k.toLowerCase())
                  );
                  if (imgKey && selectedFeature.properties[imgKey]) {
                    photos.push(String(selectedFeature.properties[imgKey]));
                  }
                  const img2Key = Object.keys(selectedFeature.properties).find((k) =>
                    ["foto_2", "photo_2", "image_2", "gambar_2"].includes(k.toLowerCase())
                  );
                  if (img2Key && selectedFeature.properties[img2Key]) {
                    photos.push(String(selectedFeature.properties[img2Key]));
                  }
                }

                const pastorImgKey = Object.keys(selectedFeature.properties).find((k) =>
                  ["foto_pendeta", "photo_pendeta", "foto_pastor", "photo_pastor", "pastor_photo", "pastor_image"].includes(k.toLowerCase())
                );
                const pastorImageUrl = pastorImgKey ? String(selectedFeature.properties[pastorImgKey]) : null;

                const pastorNameKey = Object.keys(selectedFeature.properties).find((k) =>
                  ["pendeta", "nama_pendeta", "pastor", "nama_pastor", "priest", "pimpinan"].includes(k.toLowerCase())
                );
                const pastorName = pastorNameKey ? String(selectedFeature.properties[pastorNameKey]) : null;

                if (photos.length === 0 && !pastorImageUrl && !pastorName) return null;

                return (
                  <div className="relative w-full h-48 bg-slate-100 border-b border-slate-200 group">
                    {photos.length > 0 && (
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Image */}
                        <img
                          src={photos[coverIndex]}
                          alt="Foto Detail"
                          className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform duration-500"
                          onClick={() => {
                            setActivePhotoModal({ urls: photos, currentIndex: coverIndex });
                            setIsPlaying(true);
                          }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />

                        {/* Navigation arrows (shown on hover/desktop) */}
                        {photos.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // prevent opening lightbox
                                setCoverIndex((prev) => (prev - 1 + photos.length) % photos.length);
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100 duration-300"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // prevent opening lightbox
                                setCoverIndex((prev) => (prev + 1) % photos.length);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100 duration-300"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                            </button>

                            {/* Slide Indicator Badge */}
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-[9px] text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                              </svg>
                              {coverIndex + 1} / {photos.length}
                            </div>
                            
                            {/* Bullet Indicators */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                              {photos.map((_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCoverIndex(i);
                                  }}
                                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                                    i === coverIndex ? "bg-white scale-125 shadow-sm" : "bg-white/50 hover:bg-white/80"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div 
                      className="absolute bottom-0 left-6 transform translate-y-1/2 z-20"
                      title={pastorName ? `Pendeta: ${pastorName}` : "Pendeta"}
                    >
                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                        {pastorImageUrl ? (
                          <img
                            src={pastorImageUrl}
                            alt={pastorName || "Foto Pendeta"}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => {
                              const urls = [...photos, pastorImageUrl];
                              setActivePhotoModal({ urls, currentIndex: urls.length - 1 });
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : (
                          <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Konten Detail */}
              <div className="flex-1 overflow-y-auto p-4 pt-16 space-y-4 thin-scroll">
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
                      {selectedFeature.layerLabel === "Titik Gereja" ? (
                        GEREJA_ORDERED_FIELDS.map((key) => {
                          const val = selectedFeature.properties[key];
                          const displayVal = (val === null || val === undefined || String(val).trim() === "")
                            ? "-"
                            : (typeof val === "number" ? new Intl.NumberFormat("id-ID").format(val) : String(val));
                          const label = ATTRIBUTE_LABELS[key] ?? key;
                          return (
                            <tr key={key} className="border-b border-slate-100 last:border-0 animate-fade-in">
                              <td className="py-2 pr-3 text-[10px] font-medium uppercase text-slate-400 align-top">
                                {label}
                              </td>
                              <td className="py-2 text-xs font-semibold text-slate-800 text-right">
                                {displayVal}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        Object.entries(selectedFeature.properties)
                          .filter(([k, v]) => 
                            !["foto", "photo", "image", "gambar", "image_url", "url_foto"].includes(k.toLowerCase()) &&
                            !["foto_pendeta", "photo_pendeta", "foto_pastor", "photo_pastor", "pastor_photo", "pastor_image"].includes(k.toLowerCase()) &&
                            !["pendeta", "nama_pendeta", "pastor", "nama_pastor", "priest", "pimpinan"].includes(k.toLowerCase()) &&
                            !["name", "nama", "title", "judul"].includes(k.toLowerCase()) &&
                            v !== null && v !== undefined && v !== ""
                          )
                          .map(([k, v]) => {
                            const label = ATTRIBUTE_LABELS[k] ?? k.replace(/_/g, " ");
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
                          })
                      )}
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
      {/* ------------------------------------------------------------- MODAL LIGHTBOX FOTO */}
      {activePhotoModal ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
          {/* Top controls (Play/Pause + Close) */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
            {activePhotoModal.urls.length > 1 && (
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Pause Autoplay" : "Play Autoplay"}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setActivePhotoModal(null)}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation left */}
          {activePhotoModal.urls.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false); // Pause autoplay saat navigasi manual
                setActivePhotoModal((prev) => {
                  if (!prev) return null;
                  const nextIndex = (prev.currentIndex - 1 + prev.urls.length) % prev.urls.length;
                  return { ...prev, currentIndex: nextIndex };
                });
              }}
              className="absolute left-4 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Image container */}
          <div className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl bg-slate-900 flex items-center justify-center">
            <img
              src={activePhotoModal.urls[activePhotoModal.currentIndex]}
              alt={`Foto ${activePhotoModal.currentIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain select-none"
            />
            {/* Slide indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              {activePhotoModal.currentIndex + 1} / {activePhotoModal.urls.length}
            </div>
          </div>

          {/* Navigation right */}
          {activePhotoModal.urls.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false); // Pause autoplay saat navigasi manual
                setActivePhotoModal((prev) => {
                  if (!prev) return null;
                  const nextIndex = (prev.currentIndex + 1) % prev.urls.length;
                  return { ...prev, currentIndex: nextIndex };
                });
              }}
              className="absolute right-4 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
