"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import "leaflet/dist/leaflet.css";
import type * as LeafletNamespace from "leaflet";
import {
  BASEMAPS,
  INDONESIA_EXTENT,
  LAYERS,
  MIN_ZOOM,
  MAX_ZOOM,
  ATTRIBUTE_LABELS,
  classColor,
  classLabel,
  type LayerDef,
  type LayerId,
} from "@/config/dashboard";
import { ALL, type Filters } from "@/lib/stats";

/** Alat peta yang aktif — hanya satu yang boleh hidup pada satu waktu. */
export type MapTool = "measure" | "zoombox" | null;

export type MeasureResult = { distanceM: number; areaM2: number; points: number } | null;

export type MapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitTo: (kecamatan: string | typeof ALL, desa: string | typeof ALL) => void;
};

type MapViewProps = {
  basemapId: string;
  visibleLayers: Record<LayerId, boolean>;
  filters: Filters;
  activeTool: MapTool;
  /** Dipanggil saat alat selesai sendiri (zoom box otomatis mati setelah dipakai). */
  onToolFinished: () => void;
  onMeasureChange: (result: MeasureResult) => void;
  onLoadingChange: (loading: boolean) => void;
  onFeatureSelect?: (properties: Record<string, any> | null, layerLabel: string) => void;
};

const EARTH_RADIUS_M = 6_378_137;
/** Geseran piksel maksimum yang masih dianggap klik, bukan drag peta. */
const CLICK_SLOP_PX = 8;

/** Luas poligon di bola bumi (shoelace bola) — cukup akurat pada skala desa. */
function sphericalArea(points: LeafletNamespace.LatLng[]): number {
  if (points.length < 3) return 0;
  const rad = (d: number) => (d * Math.PI) / 180;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    total += (rad(p2.lng) - rad(p1.lng)) * (2 + Math.sin(rad(p1.lat)) + Math.sin(rad(p2.lat)));
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

/** Susun tabel atribut untuk popup. Nilai kosong dibuang agar popup tetap ringkas. */
function popupHtml(layer: LayerDef, props: Record<string, unknown>): string {
  // Cari nama/label utama objek untuk dijadikan judul popup
  const nameKey = Object.keys(props).find((k) =>
    ["name", "nama", "title", "judul"].includes(k.toLowerCase()),
  );
  const titleText = nameKey ? String(props[nameKey]) : layer.label;

  // Cari properti foto/gambar dari geodatabase
  const imgKey = Object.keys(props).find((k) =>
    ["foto", "photo", "image", "gambar", "image_url", "url_foto"].includes(k.toLowerCase()),
  );
  const imageUrl = imgKey ? String(props[imgKey]) : null;

  const rows = Object.entries(props)
    .filter(([k, v]) => k !== imgKey && k !== nameKey && v !== null && v !== undefined && v !== "")
    .map(([k, v]) => {
      const label = ATTRIBUTE_LABELS[k] ?? k;
      let value = String(v);
      if (layer.classField === k) value = classLabel(layer.id, value);
      if (typeof v === "number") value = new Intl.NumberFormat("id-ID").format(v);
      return `<tr class="border-b border-slate-100 last:border-0">
        <td class="py-1.5 pr-3 align-top text-[11px] font-medium uppercase tracking-wide text-slate-500">${label}</td>
        <td class="py-1.5 text-right text-xs font-semibold text-slate-800">${value}</td>
      </tr>`;
    })
    .join("");

  const imageHtml = imageUrl
    ? `<div class="w-full h-36 overflow-hidden bg-slate-100 border-b border-slate-100">
        <img src="${imageUrl}" alt="Foto ${titleText}" class="w-full h-full object-cover" onerror="this.parentNode.style.display='none';" />
      </div>`
    : "";

  return `<div class="overflow-hidden rounded-xl bg-white shadow-sm max-w-[280px]">
    ${imageHtml}
    <div class="bg-blue-950 px-3 py-2 text-xs font-semibold text-white">${titleText}</div>
    <div class="max-h-56 overflow-y-auto px-3 py-1">
      <table class="w-full border-collapse">${rows || '<tr><td class="py-2 text-xs text-slate-500">Tidak ada atribut.</td></tr>'}</table>
    </div>
  </div>`;
}

const MapView = forwardRef<MapHandle, MapViewProps>(function MapView(
  {
    basemapId,
    visibleLayers,
    filters,
    activeTool,
    onToolFinished,
    onMeasureChange,
    onLoadingChange,
    onFeatureSelect,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNamespace.Map | null>(null);
  const basemapLayerRef = useRef<LeafletNamespace.TileLayer | null>(null);
  const overlaysRef = useRef<Partial<Record<LayerId, LeafletNamespace.GeoJSON>>>({});
  const dataCacheRef = useRef<Partial<Record<LayerId, GeoJSON.FeatureCollection>>>({});

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);

  // ---------------------------------------------------------------- init peta
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: true,
          preferCanvas: true,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
        });

        const [south, west, north, east] = INDONESIA_EXTENT;
        map.fitBounds([
          [south, west],
          [north, east],
        ]);

        map.on("mousemove", (e: LeafletNamespace.LeafletMouseEvent) =>
          setCursor({ lat: e.latlng.lat, lng: e.latlng.lng }),
        );
        map.on("mouseout", () => setCursor(null));
        map.on("popupclose", () => {
          onFeatureSelect?.(null, "");
        });

        mapRef.current = map;
        setMapReady(true);
      } catch (error) {
        if (!cancelled) {
          setMapError(
            error instanceof Error ? error.message : "Peta gagal dimuat. Coba muat ulang halaman.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Jaga ukuran peta tetap benar saat panel samping membuka/menutup.
  useEffect(() => {
    if (!mapReady || !containerRef.current) return;
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mapReady]);

  // -------------------------------------------------------------- basemap
  // Layer lama baru dilepas setelah yang baru terpasang, dan selalu didorong ke
  // belakang agar tidak menutupi overlay tematik.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const basemap = BASEMAPS.find((b) => b.id === basemapId) ?? BASEMAPS[0];
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      const previous = basemapLayerRef.current;
      const next = L.tileLayer(basemap.url, {
        attribution: basemap.attribution,
        maxZoom: basemap.maxZoom,
        maxNativeZoom: basemap.maxNativeZoom,
      });
      next.addTo(map);
      next.bringToBack();
      basemapLayerRef.current = next;
      if (previous) map.removeLayer(previous);
    })();

    return () => {
      cancelled = true;
    };
  }, [basemapId, mapReady]);

  // -------------------------------------------------------------- overlay
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      const needed = LAYERS.filter((l) => visibleLayers[l.id]);
      const missing = needed.filter((l) => !dataCacheRef.current[l.id]);

      if (missing.length > 0) {
        onLoadingChange(true);
        await Promise.all(
          missing.map(async (l) => {
            try {
              const res = await fetch(l.file);
              if (!res.ok) throw new Error(`gagal memuat ${l.label}`);
              dataCacheRef.current[l.id] = (await res.json()) as GeoJSON.FeatureCollection;
            } catch {
              // Layer yang gagal dibiarkan kosong; layer lain tetap tampil.
            }
          }),
        );
        onLoadingChange(false);
      }
      if (cancelled || !mapRef.current) return;

      for (const layer of LAYERS) {
        const existing = overlaysRef.current[layer.id];
        if (existing) {
          map.removeLayer(existing);
          delete overlaysRef.current[layer.id];
        }
        if (!visibleLayers[layer.id]) continue;

        const data = dataCacheRef.current[layer.id];
        if (!data) continue;

        // Filter wilayah dilakukan lewat atribut kecamatan/desa yang sudah
        // ditempelkan build_data.py — tidak perlu uji spasial di browser.
        const features = data.features.filter((f) => {
          const p = f.properties ?? {};
          if (filters.kecamatan !== ALL && p.kecamatan !== filters.kecamatan) return false;
          if (filters.desa !== ALL && p.desa !== filters.desa) return false;
          return true;
        });

        const gj = L.geoJSON(
          { type: "FeatureCollection", features } as GeoJSON.FeatureCollection,
          {
            style: (feature) => {
              const value = layer.classField
                ? String(feature?.properties?.[layer.classField] ?? "")
                : "";
              const color = layer.classField ? classColor(layer.id, value) : layer.color;
              // Batas desa sengaja hanya garis: ia bingkai konteks, bukan tema.
              if (layer.id === "desa") {
                return { color: layer.color, weight: 1, fill: false, opacity: 0.85 };
              }
              return { color, weight: 0.6, fillColor: color, fillOpacity: 0.55, opacity: 0.9 };
            },
            pointToLayer: (feature, latlng) => {
              if (layer.id === "poi") {
                const icon = L.divIcon({
                  className: "custom-pin-container",
                  html: `<div class="custom-pin-marker">
                    <div class="pin-drop">
                      <div class="pin-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="pin-cross-icon">
                          <path d="M12 5v14M8 9h8" />
                        </svg>
                      </div>
                    </div>
                    <div class="pin-shadow"></div>
                  </div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                  popupAnchor: [0, -32],
                });
                return L.marker(latlng, { icon });
              }
              return L.circleMarker(latlng, {
                radius: 6,
                color: "#ffffff",
                weight: 2,
                fillColor: layer.color,
                fillOpacity: 1,
              });
            },
            onEachFeature: (feature, lyr) => {
              lyr.bindPopup(popupHtml(layer, (feature.properties ?? {}) as Record<string, unknown>), {
                maxWidth: 320,
              });
              lyr.on("click", () => {
                onFeatureSelect?.((feature.properties ?? {}) as Record<string, any>, layer.label);
              });
            },
          },
        );

        gj.addTo(map);
        overlaysRef.current[layer.id] = gj;
      }

      // Urutan tumpuk: poligon tema di bawah, batas desa & titik di atas.
      overlaysRef.current.desa?.bringToFront();
      overlaysRef.current.poi?.bringToFront();
    })();

    return () => {
      cancelled = true;
    };
  }, [visibleLayers, filters, mapReady, onLoadingChange]);

  // -------------------------------------------------------------- alat ukur
  //
  // Klik ditangkap di container pada fase capture, bukan lewat map.on("click").
  // Alasannya: Leaflet menghentikan klik pada fitur yang kena — map hanya jadi
  // target kalau tidak ada layer di bawah kursor. Karena layer penggunaan lahan
  // menutupi seluruh kabupaten, map.on("click") praktis tidak pernah menyala dan
  // yang terjadi hanya popup terbuka. Menangkap lebih dulu di container membuat
  // alat ukur bekerja di atas layer apa pun, sekaligus menahan popup muncul.
  useEffect(() => {
    if (!mapReady || !mapRef.current || activeTool !== "measure") return;
    const map = mapRef.current;
    let cancelled = false;
    let cleanupFn: (() => void) | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      const container = map.getContainer();
      const points: LeafletNamespace.LatLng[] = [];
      const markers: LeafletNamespace.CircleMarker[] = [];
      const group = L.layerGroup().addTo(map);
      let line: LeafletNamespace.Polyline | null = null;
      let previewLine: LeafletNamespace.Polyline | null = null;
      let downAt: { x: number; y: number } | null = null;
      let lastClickTime = 0;

      map.closePopup();
      map.doubleClickZoom.disable();
      container.classList.add("tool-active");
      onMeasureChange({ distanceM: 0, areaM2: 0, points: 0 });

      function redraw() {
        line?.remove();
        if (points.length >= 2) {
          line = L.polyline(points, { color: "#e11d48", weight: 3, dashArray: "6 4" }).addTo(group);
        } else {
          line = null;
        }
        let distance = 0;
        for (let i = 1; i < points.length; i++) distance += points[i - 1].distanceTo(points[i]);
        onMeasureChange({
          distanceM: distance,
          areaM2: sphericalArea(points),
          points: points.length,
        });
      }

      function addPoint(latlng: LeafletNamespace.LatLng) {
        points.push(latlng);
        const marker = L.circleMarker(latlng, {
          radius: 5,
          color: "#e11d48",
          fillColor: "#fff",
          fillOpacity: 1,
          weight: 2,
        }).addTo(group);
        markers.push(marker);
        redraw();
      }

      function removeLastPoint() {
        if (points.length === 0) return;
        points.pop();
        const lastMarker = markers.pop();
        lastMarker?.remove();
        redraw();
      }

      function onMouseMove(e: MouseEvent) {
        if (points.length === 0) return;
        const latlng = map.mouseEventToLatLng(e);
        previewLine?.remove();
        previewLine = L.polyline([points[points.length - 1], latlng], {
          color: "#e11d48",
          weight: 2,
          dashArray: "4 6",
          opacity: 0.5,
        }).addTo(group);
      }

      function onDown(e: MouseEvent) {
        downAt = { x: e.clientX, y: e.clientY };
      }

      function onClick(e: MouseEvent) {
        // Biarkan kontrol bawaan Leaflet (atribusi dsb.) tetap bisa diklik.
        if ((e.target as HTMLElement).closest(".leaflet-control")) return;
        // Geser peta diakhiri dengan event click juga — jangan dihitung titik.
        if (
          downAt &&
          (Math.abs(e.clientX - downAt.x) > CLICK_SLOP_PX ||
            Math.abs(e.clientY - downAt.y) > CLICK_SLOP_PX)
        ) {
          return;
        }
        e.stopPropagation();
        e.preventDefault();

        // Deteksi double-click manual: dua klik < 350ms = selesai
        const now = Date.now();
        if (now - lastClickTime < 350 && points.length >= 2) {
          onToolFinished();
          return;
        }
        lastClickTime = now;

        const latlng = map.mouseEventToLatLng(e);
        addPoint(latlng);
      }

      function onContextMenu(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        removeLastPoint();
      }

      container.addEventListener("mousedown", onDown, true);
      container.addEventListener("click", onClick, true);
      container.addEventListener("contextmenu", onContextMenu, true);
      container.addEventListener("mousemove", onMouseMove);

      cleanupFn = () => {
        container.removeEventListener("mousedown", onDown, true);
        container.removeEventListener("click", onClick, true);
        container.removeEventListener("contextmenu", onContextMenu, true);
        container.removeEventListener("mousemove", onMouseMove);
        previewLine?.remove();
        group.remove();
        container.classList.remove("tool-active");
        map.doubleClickZoom.enable();
        onMeasureChange(null);
      };
    })();

    return () => {
      cancelled = true;
      cleanupFn?.();
    };
  }, [activeTool, mapReady, onMeasureChange, onToolFinished]);

  // -------------------------------------------------------------- zoom box
  useEffect(() => {
    if (!mapReady || !mapRef.current || activeTool !== "zoombox") return;
    const map = mapRef.current;
    const container = map.getContainer();
    let overlay: HTMLDivElement | null = null;
    let startPoint: LeafletNamespace.Point | null = null;

    map.dragging.disable();
    container.classList.add("tool-active");

    function onMouseDown(e: LeafletNamespace.LeafletMouseEvent) {
      startPoint = map.mouseEventToContainerPoint(e.originalEvent);
      overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.border = "2px dashed #2563eb";
      overlay.style.background = "rgba(37, 99, 235, 0.12)";
      overlay.style.zIndex = "1000";
      overlay.style.pointerEvents = "none";
      overlay.style.left = `${startPoint.x}px`;
      overlay.style.top = `${startPoint.y}px`;
      container.appendChild(overlay);
      map.on("mousemove", onMouseMove);
      map.on("mouseup", onMouseUp);
    }

    function onMouseMove(e: LeafletNamespace.LeafletMouseEvent) {
      if (!overlay || !startPoint) return;
      const current = map.mouseEventToContainerPoint(e.originalEvent);
      overlay.style.left = `${Math.min(current.x, startPoint.x)}px`;
      overlay.style.top = `${Math.min(current.y, startPoint.y)}px`;
      overlay.style.width = `${Math.abs(current.x - startPoint.x)}px`;
      overlay.style.height = `${Math.abs(current.y - startPoint.y)}px`;
    }

    function onMouseUp(e: LeafletNamespace.LeafletMouseEvent) {
      if (startPoint) {
        const current = map.mouseEventToContainerPoint(e.originalEvent);
        if (
          Math.abs(current.x - startPoint.x) > CLICK_SLOP_PX &&
          Math.abs(current.y - startPoint.y) > CLICK_SLOP_PX
        ) {
          const corner1 = map.containerPointToLatLng([
            Math.min(current.x, startPoint.x),
            Math.max(current.y, startPoint.y),
          ]);
          const corner2 = map.containerPointToLatLng([
            Math.max(current.x, startPoint.x),
            Math.min(current.y, startPoint.y),
          ]);
          map.fitBounds([
            [corner1.lat, corner1.lng],
            [corner2.lat, corner2.lng],
          ]);
        }
      }
      // Zoom box sekali pakai — setelah menggambar kotak, alat kembali mati.
      onToolFinished();
    }

    map.on("mousedown", onMouseDown);

    return () => {
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
      overlay?.remove();
      map.dragging.enable();
      container.classList.remove("tool-active");
    };
  }, [activeTool, mapReady, onToolFinished]);

  // -------------------------------------------------------------- handle
  const fitTo = useCallback((kecamatan: string | typeof ALL, desa: string | typeof ALL) => {
    const map = mapRef.current;
    if (!map) return;

    const data = dataCacheRef.current.desa;
    if (!data || (kecamatan === ALL && desa === ALL)) {
      const [south, west, north, east] = INDONESIA_EXTENT;
      map.fitBounds([
        [south, west],
        [north, east],
      ]);
      return;
    }

    const matches = data.features.filter((f) => {
      const p = f.properties ?? {};
      if (kecamatan !== ALL && p.kecamatan !== kecamatan) return false;
      if (desa !== ALL && p.desa !== desa) return false;
      return true;
    });
    if (matches.length === 0) return;

    import("leaflet").then(({ default: L }) => {
      const bounds = L.geoJSON({
        type: "FeatureCollection",
        features: matches,
      } as GeoJSON.FeatureCollection).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
      resetView: () => fitTo(ALL, ALL),
      fitTo,
    }),
    [fitTo],
  );

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="relative z-0 h-full w-full" />

      {!mapReady && !mapError ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">Memuat peta…</p>
        </div>
      ) : null}

      {mapError ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
          <p className="text-sm font-semibold text-red-600">Peta gagal dimuat</p>
          <p className="max-w-xs text-xs text-slate-500">{mapError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Muat Ulang
          </button>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-3 right-3 z-[400] rounded-full bg-white/90 px-3 py-1.5 font-mono text-xs font-medium text-slate-700 shadow-sm shadow-blue-900/10">
        {cursor ? `${cursor.lat.toFixed(5)}, ${cursor.lng.toFixed(5)}` : "Arahkan kursor ke peta"}
      </div>
    </div>
  );
});

export default MapView;
