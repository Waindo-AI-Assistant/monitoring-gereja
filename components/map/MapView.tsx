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
import geojsonvt from "geojson-vt";
import i18next from "i18next";
import {
  BASEMAPS,
  INDONESIA_EXTENT,
  LAYERS,
  MIN_ZOOM,
  MAX_ZOOM,
  ATTRIBUTE_LABELS,
  GEREJA_ORDERED_FIELDS,
  classLabel,
  formatValue,
  getAttributeLabel,
  type LayerDef,
  type LayerId,
} from "@/config/dashboard";
import { ALL, ALL_KHUSUS, DEFAULT_FILTERS, type Filters } from "@/lib/stats";
import type { RouteResult } from "@/lib/routing";

/** Alat peta yang aktif — hanya satu yang boleh hidup pada satu waktu. */
export type MapTool = "measure" | "zoombox" | null;

export type MeasureResult = { distanceM: number; areaM2: number; points: number } | null;

export type MapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitTo: (filters: Filters) => void;
  closePopup: () => void;
  focusPOI: (latlng: [number, number], properties: any) => void;
  flyToCoords: (coords: [number, number], zoom?: number) => void;
  invalidateSize: () => void;
};

type MapViewProps = {
  basemapId: string;
  visibleLayers: Record<LayerId, boolean>;
  filters: Filters;
  activeTool: MapTool;
  routeResult?: RouteResult | null;
  userLocation?: [number, number] | null;
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
  const isEn = i18next.language === "en";
  const nameKey = Object.keys(props).find((k) =>
    ["name", "nama", "title", "judul"].includes(k.toLowerCase()),
  );
  let defaultLayerLabel = layer.label;
  if (layer.id === "poi") defaultLayerLabel = isEn ? "Church Locations" : "Titik Gereja";
  if (layer.id === "batas_provinsi") defaultLayerLabel = isEn ? "Regional Boundaries (MADA)" : "Batas Mada";
  if (layer.id === "batas_kabupaten") defaultLayerLabel = isEn ? "District Boundaries (MAWIL)" : "Batas Wilayah";
  const titleText = nameKey ? String(props[nameKey]) : defaultLayerLabel;

  const imgKey = Object.keys(props).find((k) =>
    ["foto", "photo", "image", "gambar", "image_url", "url_foto"].includes(k.toLowerCase()),
  );
  const imageUrl = imgKey ? String(props[imgKey]) : null;

  let rows = "";
  if (layer.id === "poi") {
    const isKhusus =
      props.tipe_wilayah === "Wilayah Khusus" ||
      Boolean(props.daerah_khusus && String(props.daerah_khusus).trim() !== "") ||
      Boolean(props.wilayah_khusus && String(props.wilayah_khusus).trim() !== "") ||
      String(props.nama_mada || "").toUpperCase().includes("KHUSUS");

    const effectiveProps: Record<string, any> = {
      ...props,
      daerah_khusus: props.daerah_khusus || (isKhusus ? props.nama_mada : ""),
      wilayah_khusus: props.wilayah_khusus || (isKhusus && props.mawil && props.mawil !== " " ? props.mawil : ""),
    };

    const badgeTipe = `<tr class="border-b border-slate-100 last:border-0">
      <td class="py-1.5 pr-3 align-top text-[11px] font-medium uppercase tracking-wide text-slate-500">${isEn ? "Region Category" : "Tipe Wilayah"}</td>
      <td class="py-1.5 text-right text-xs font-bold ${isKhusus ? "text-amber-700" : "text-blue-700"}">
        ${isKhusus ? (isEn ? "Special Territory" : "Wilayah Khusus") : (isEn ? "Regular Territory" : "Wilayah Biasa")}
      </td>
    </tr>`;

    rows = badgeTipe + GEREJA_ORDERED_FIELDS.filter((k) => {
      if (k === "tipe_wilayah") return false;
      const v = effectiveProps[k];
      if (v === undefined || v === null || String(v).trim() === "" || String(v).trim() === '""') return false;

      if (isKhusus) {
        if (k === "nama_mada" || k === "mawil") return false;
      } else {
        if (k === "daerah_khusus" || k === "wilayah_khusus") return false;
      }
      return true;
    }).map((k) => {
      const v = effectiveProps[k];
      const value = formatValue(v, k);
      const label = getAttributeLabel(k, isEn);
      return `<tr class="border-b border-slate-100 last:border-0">
        <td class="py-1.5 pr-3 align-top text-[11px] font-medium uppercase tracking-wide text-slate-500">${label}</td>
        <td class="py-1.5 text-right text-xs font-semibold text-slate-800">${value}</td>
      </tr>`;
    }).join("");
  } else {
    rows = Object.entries(props)
      .filter(([k, v]) => k !== imgKey && k !== nameKey && v !== null && v !== undefined && v !== "")
      .map(([k, v]) => {
        const label = getAttributeLabel(k, isEn);
        let value = formatValue(v, k);
        if (layer.classField === k) value = classLabel(layer.id, value);
        return `<tr class="border-b border-slate-100 last:border-0">
          <td class="py-1.5 pr-3 align-top text-[11px] font-medium uppercase tracking-wide text-slate-500">${label}</td>
          <td class="py-1.5 text-right text-xs font-semibold text-slate-800">${value}</td>
        </tr>`;
      })
      .join("");
  }

  const imageHtml = imageUrl
    ? `<div class="w-full h-36 overflow-hidden bg-slate-100 border-b border-slate-100">
        <img src="${imageUrl}" alt="${isEn ? "Photo" : "Foto"} ${titleText}" class="w-full h-full object-cover" onerror="this.parentNode.style.display='none';" />
      </div>`
    : "";

  return `<div class="overflow-hidden rounded-xl bg-white shadow-sm max-w-70">
    ${imageHtml}
    <div class="bg-blue-950 px-3 py-2 text-xs font-semibold text-white">${titleText}</div>
    <div class="max-h-56 overflow-y-auto px-3 py-1">
      <table class="w-full border-collapse">${rows || (isEn ? '<tr><td class="py-2 text-xs text-slate-500">No attributes.</td></tr>' : '<tr><td class="py-2 text-xs text-slate-500">Tidak ada atribut.</td></tr>')}</table>
    </div>
  </div>`;
}

/* ─────────────── Algoritma Point in Polygon & Rendering Canvas ─────────────── */

function pointInPolygon(point: [number, number], vs: [number, number][]) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function computeBbox(geom: any): [number, number, number, number] | null {
  let coords: [number, number][] = [];
  if (geom.type === "Polygon") {
    coords = geom.coordinates[0];
  } else if (geom.type === "MultiPolygon") {
    coords = geom.coordinates.flatMap((poly: any) => poly[0]);
  }
  if (coords.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of coords) {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
  }
  return [minX, minY, maxX, maxY];
}

function checkGeomContainsPoint(geom: any, x: number, y: number): boolean {
  if (geom.type === "Polygon") {
    return pointInPolygon([x, y], geom.coordinates[0]);
  }
  if (geom.type === "MultiPolygon") {
    return geom.coordinates.some((polygon: any) => pointInPolygon([x, y], polygon[0]));
  }
  return false;
}

function findFeatureAt(latlng: { lat: number; lng: number }, geojson: any) {
  const x = latlng.lng;
  const y = latlng.lat;

  for (const feature of geojson.features) {
    const geom = feature.geometry;
    if (!geom) continue;

    if (!feature.bbox) {
      feature.bbox = computeBbox(geom);
    }

    if (feature.bbox) {
      const [minX, minY, maxX, maxY] = feature.bbox;
      if (x < minX || x > maxX || y < minY || y > maxY) continue;
    }

    if (checkGeomContainsPoint(geom, x, y)) {
      return feature;
    }
  }
  return null;
}

function drawTileFeature(ctx: CanvasRenderingContext2D, feature: any, size: { x: number; y: number }) {
  ctx.beginPath();
  for (const ring of feature.geometry) {
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i] as any;
      const x = (p[0] / 4096) * size.x;
      const y = (p[1] / 4096) * size.y;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    if (feature.type === 3) {
      ctx.closePath();
    }
  }
  ctx.stroke();
}

function createVectorTileLayer(L: any, geojsonData: any, options: { color: string; weight: number }) {
  const tileIndex = geojsonvt(geojsonData, {
    maxZoom: 18,
    tolerance: 3,
    extent: 4096,
    buffer: 64,
  });

  const CanvasGridLayer = L.GridLayer.extend({
    createTile: function (coords: any, done: any) {
      const tile = document.createElement("canvas");
      const size = this.getTileSize();
      tile.width = size.x;
      tile.height = size.y;

      const ctx = tile.getContext("2d");
      if (!ctx) {
        setTimeout(() => done(null, tile));
        return tile;
      }

      const tileData = tileIndex.getTile(coords.z, coords.x, coords.y);
      if (!tileData) {
        setTimeout(() => done(null, tile));
        return tile;
      }

      ctx.strokeStyle = options.color;
      ctx.lineWidth = options.weight;

      for (const feature of tileData.features) {
        drawTileFeature(ctx, feature, size);
      }

      setTimeout(() => done(null, tile));
      return tile;
    },
  });

  return new CanvasGridLayer();
}

function getLayerWeight(layerId: string): number {
  if (layerId === "batas_provinsi") return 3;
  if (layerId === "batas_kabupaten") return 2;
  return 1;
}

function getLayerZIndex(layerId: string): number {
  if (layerId === "batas_provinsi") return 201;
  if (layerId === "batas_kabupaten") return 200;
  return 199;
}

function filterFeatureByScope(f: any, layerId: string, filters: Filters): boolean {
  if (layerId !== "poi" && layerId !== "batas_kabupaten") return true;

  const p = f.properties ?? {};
  if (layerId === "batas_kabupaten") {
    const kabName = p.WADMKK || p.NAMOBJ;
    return filters.kabupaten === ALL || kabName === filters.kabupaten;
  }

  const matchDaerah = filters.daerah === ALL || p.nama_mada === filters.daerah;
  const matchWilayah = filters.wilayah === ALL || p.mawil === filters.wilayah;

  let matchDaerahKhusus = true;
  if (filters.daerahKhusus !== ALL) {
    if (filters.daerahKhusus === ALL_KHUSUS) {
      matchDaerahKhusus =
        p.tipe_wilayah === "Wilayah Khusus" ||
        Boolean(p.daerah_khusus) ||
        Boolean(p.wilayah_khusus) ||
        String(p.nama_mada || "").toUpperCase().includes("KHUSUS");
    } else {
      matchDaerahKhusus = p.daerah_khusus === filters.daerahKhusus;
    }
  }

  let matchWilayahKhusus = true;
  if (filters.wilayahKhusus !== ALL) {
    const wkVal = p.wilayah_khusus || (p.tipe_wilayah === "Wilayah Khusus" && String(p.nama_mada || "").toUpperCase().includes("MAWIL") ? p.nama_mada : "");
    matchWilayahKhusus = wkVal === filters.wilayahKhusus;
  }

  const matchKabupaten = filters.kabupaten === ALL || p.kabupaten === filters.kabupaten;
  const matchDesa = filters.desa === ALL || p.desa === filters.desa;

  return matchDaerah && matchWilayah && matchDaerahKhusus && matchWilayahKhusus && matchKabupaten && matchDesa;
}

function checkAnyPopupOpen(map: LeafletNamespace.Map): boolean {
  let open = false;
  map.eachLayer((layer: any) => {
    if (layer.getPopup?.()?.isOpen()) {
      open = true;
    }
  });
  return open;
}

function getZoomLevelClass(zoom: number): string {
  if (zoom < 8) return "map-zoom-low";
  if (zoom <= 12) return "map-zoom-medium";
  if (zoom <= 15) return "map-zoom-high";
  return "map-zoom-very-high";
}

function applyZoomClassToContainer(container: HTMLElement, zoom: number) {
  container.className = container.className
    .split(" ")
    .filter((c) => !c.startsWith("map-zoom-"))
    .join(" ");
  container.classList.add(getZoomLevelClass(zoom));
}

/* ─────────────── Komponen Utama MapView ─────────────── */

const MapView = forwardRef<MapHandle, MapViewProps>(function MapView(
  {
    basemapId,
    visibleLayers,
    filters,
    activeTool,
    routeResult,
    userLocation,
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
  const routeLayerRef = useRef<any>(null);
  const userLocationMarkerRef = useRef<any>(null);
  const overlaysRef = useRef<Partial<Record<LayerId, any>>>({});
  const dataCacheRef = useRef<Partial<Record<LayerId, GeoJSON.FeatureCollection>>>({});
  const highlightLayerRef = useRef<any>(null);
  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  const onFeatureSelectRef = useRef(onFeatureSelect);
  useEffect(() => {
    onFeatureSelectRef.current = onFeatureSelect;
  }, [onFeatureSelect]);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const coordsTextRef = useRef<HTMLSpanElement | null>(null);
  const coordsDotRef = useRef<HTMLSpanElement | null>(null);

  // ---------------------------------------------------------------- init peta
  useEffect(() => {
    let unmounted = false;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (unmounted || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: true,
          preferCanvas: true,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
        });

        // Posisi default tengah Indonesia
        const [south, west, north, east] = INDONESIA_EXTENT;
        map.fitBounds([
          [south, west],
          [north, east],
        ]);

        const updateCoords = (lat: number, lng: number) => {
          if (coordsTextRef.current) {
            coordsTextRef.current.textContent = `Lat: ${lat.toFixed(5)} | Long: ${lng.toFixed(5)}`;
          }
          if (coordsDotRef.current) {
            coordsDotRef.current.className = "h-2 w-2 rounded-full shrink-0 bg-emerald-500 animate-pulse";
          }
        };

        const clearCoords = () => {
          if (coordsTextRef.current) {
            coordsTextRef.current.textContent = "Arahkan kursor ke peta";
          }
          if (coordsDotRef.current) {
            coordsDotRef.current.className = "h-2 w-2 rounded-full shrink-0 bg-slate-400";
          }
        };

        map.on("mousemove", (e) => {
          if (e?.latlng) {
            updateCoords(e.latlng.lat, e.latlng.lng);
          }
        });
        map.on("mouseout", () => {
          clearCoords();
        });

        const mapContainer = containerRef.current!;
        const handleContainerMouseMove = (e: MouseEvent) => {
          if (!mapRef.current) return;
          try {
            const latlng = mapRef.current.mouseEventToLatLng(e);
            if (latlng) {
              updateCoords(latlng.lat, latlng.lng);
            }
          } catch {}
        };
        const handleContainerMouseLeave = () => {
          clearCoords();
        };

        mapContainer.addEventListener("mousemove", handleContainerMouseMove);
        mapContainer.addEventListener("mouseleave", handleContainerMouseLeave);

        map.on("popupclose", () => {
          setTimeout(() => {
            if (!mapRef.current) return;
            if (!checkAnyPopupOpen(mapRef.current)) {
              onFeatureSelectRef.current?.(null, "");
            }
          }, 50);
        });

        const handleZoomChange = () => {
          if (!mapRef.current) return;
          applyZoomClassToContainer(mapContainer, mapRef.current.getZoom());
        };

        map.on("zoomend", handleZoomChange);
        handleZoomChange();

        mapRef.current = map;
        setMapReady(true);
      } catch (error) {
        if (!unmounted) {
          setMapError(error instanceof Error ? error.message : "Inisialisasi Leaflet gagal.");
        }
      }
    })();

    return () => {
      unmounted = true;
    };
  }, []);

  // ---------------------------------------------------------------- resize observer
  useEffect(() => {
    if (!mapReady || !mapRef.current || !containerRef.current) return;
    const map = mapRef.current;
    const container = containerRef.current;

    const ro = new ResizeObserver(() => {
      // Invalidate map size so Leaflet recalculates dimensions immediately
      map.invalidateSize({ debounceMoveend: true });
    });

    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  }, [mapReady]);

  // ---------------------------------------------------------------- render rute navigasi
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    (async () => {
      const L = (await import("leaflet")).default;

      // Hapus layer rute sebelumnya jika ada
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }

      if (!routeResult || routeResult.coordinates.length === 0) return;

      const group = L.layerGroup();

      // Outer casing line untuk kontras kontur jalan
      const outerPolyline = L.polyline(routeResult.coordinates, {
        color: "#1e3a8a",
        weight: 8,
        opacity: 0.7,
        lineCap: "round",
        lineJoin: "round",
      });

      // Inner polyline rute utama
      const innerPolyline = L.polyline(routeResult.coordinates, {
        color: "#2563eb",
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      });

      outerPolyline.addTo(group);
      innerPolyline.addTo(group);

      // Start Marker (Posisi Pengguna Live GPS)
      const userMarkerHtml = `
        <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
          <span style="position:absolute; width:28px; height:28px; border-radius:50%; background:rgba(37,99,235,0.3); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
          <span style="position:relative; width:16px; height:16px; border-radius:50%; background:#2563eb; border:3px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></span>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userMarkerHtml,
        className: "custom-user-gps-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const startMarker = L.marker(routeResult.startCoords, {
        icon: userIcon,
        title: "Lokasi Anda",
      }).bindPopup("<b>📍 Lokasi Anda</b><br><span style='font-size:11px;color:#64748b;'>Titik Awal Keberangkatan</span>");

      startMarker.addTo(group);
      group.addTo(map);
      routeLayerRef.current = group;

      // Fit bounds ke seluruh panjang rute
      const bounds = L.latLngBounds(routeResult.coordinates);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    })();
  }, [routeResult, mapReady]);

  // ---------------------------------------------------------------- render lokasi pengguna GPS (Live Marker)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    (async () => {
      const L = (await import("leaflet")).default;

      if (userLocationMarkerRef.current) {
        map.removeLayer(userLocationMarkerRef.current);
        userLocationMarkerRef.current = null;
      }

      if (!userLocation) return;

      const userMarkerHtml = `
        <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
          <span style="position:absolute; width:28px; height:28px; border-radius:50%; background:rgba(37,99,235,0.35); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
          <span style="position:relative; width:16px; height:16px; border-radius:50%; background:#2563eb; border:3px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></span>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userMarkerHtml,
        className: "custom-user-gps-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(userLocation, {
        icon: userIcon,
        title: "Lokasi Anda Saat Ini",
        zIndexOffset: 1000,
      }).bindPopup("<b>📍 Lokasi Anda Saat Ini</b><br><span style='font-size:11px;color:#64748b;'>Posisi GPS Langsung Terdeteksi</span>");

      marker.addTo(map);
      userLocationMarkerRef.current = marker;
    })();
  }, [userLocation, mapReady]);

  // ---------------------------------------------------------------- basemap
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    let cancelled = false;

    const basemap = BASEMAPS.find((b) => b.id === basemapId);
    if (!basemap) return;

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

    // Tangkap klik pada canvas layer menggunakan titik koordinat
    const onMapClick = (e: LeafletNamespace.LeafletMouseEvent) => {
      for (const layer of LAYERS) {
        if (layer.kind !== "polygon" || !visibleLayers[layer.id]) continue;
        const data = dataCacheRef.current[layer.id];
        if (!data) continue;

        const features = data.features.filter((f) => filterFeatureByScope(f, layer.id, filters));

        const clickedFeature = findFeatureAt(e.latlng, { type: "FeatureCollection", features });
        if (clickedFeature) {
          onFeatureSelect?.((clickedFeature.properties ?? {}) as Record<string, any>, layer.label);

          if (highlightLayerRef.current) {
            map.removeLayer(highlightLayerRef.current);
          }
          import("leaflet").then(({ default: L }) => {
            const highlight = L.geoJSON(clickedFeature, {
              style: {
                color: "#f43f5e",
                weight: 3,
                fillColor: "#f43f5e",
                fillOpacity: 0.15,
              }
            });
            highlight.bindPopup(popupHtml(layer, (clickedFeature.properties ?? {}) as Record<string, unknown>), {
              maxWidth: 320,
            });
            highlight.addTo(map);
            highlight.openPopup(e.latlng);
            highlightLayerRef.current = highlight;
          });
          return;
        }
      }
    };

    map.on("click", onMapClick);

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
              dataCacheRef.current[l.id] = { type: "FeatureCollection", features: [] };
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

        const features = data.features.filter((f) => filterFeatureByScope(f, layer.id, filters));

        if (layer.kind === "polygon") {
          const vtLayer = createVectorTileLayer(
            L,
            { type: "FeatureCollection", features },
            {
              color: layer.color,
              weight: getLayerWeight(layer.id),
            }
          );
          vtLayer.setZIndex(getLayerZIndex(layer.id));
          vtLayer.addTo(map);
          overlaysRef.current[layer.id] = vtLayer;
        } else {
          const gj = L.geoJSON(
            { type: "FeatureCollection", features } as GeoJSON.FeatureCollection,
            {
              pointToLayer: (feature, latlng) => {
                const icon = L.divIcon({
                  className: "custom-image-pin",
                  html: `<img src="/images/pin gereja.png" alt="Pin Gereja" style="width: 48px; height: 48px; object-fit: contain;" />`,
                  iconSize: [48, 48],
                  iconAnchor: [24, 48],
                  popupAnchor: [0, -48],
                });
                return L.marker(latlng, { icon });
              },
              onEachFeature: (feature, lyr) => {
                lyr.bindPopup(popupHtml(layer, (feature.properties ?? {}) as Record<string, unknown>), {
                  maxWidth: 320,
                });
                lyr.on("click", (e: any) => {
                  if (activeToolRef.current === "measure") {
                    map.fire("click", { latlng: e.latlng, originalEvent: e.originalEvent });
                  } else {
                    onFeatureSelect?.((feature.properties ?? {}) as Record<string, any>, layer.label);
                  }
                });
                lyr.on("popupopen", () => {
                  if (activeToolRef.current === "measure") {
                    lyr.closePopup();
                  }
                });
              },
            }
          );
          gj.addTo(map);
          overlaysRef.current[layer.id] = gj;
        }
      }

      overlaysRef.current.poi?.bringToFront();
    })();

    return () => {
      cancelled = true;
      map.off("click", onMapClick);
    };
  }, [visibleLayers, filters, mapReady, onLoadingChange, onFeatureSelect]);

  // -------------------------------------------------------------- alat ukur
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    if (activeTool !== "measure") {
      onMeasureChange(null);
      return;
    }

    const points: LeafletNamespace.LatLng[] = [];
    const markers: LeafletNamespace.Marker[] = [];
    let polyline: LeafletNamespace.Polyline | null = null;
    let polygon: LeafletNamespace.Polygon | null = null;
    let tempPolyline: LeafletNamespace.Polyline | null = null;
    let tempPolygon: LeafletNamespace.Polygon | null = null;

    const container = containerRef.current!;
    container.classList.add("tool-active");
    map.dragging.disable();

    let overlay: HTMLDivElement | null = null;

    import("leaflet").then(({ default: L }) => {
      overlay = document.createElement("div");
      overlay.className = "measure-overlay";
      overlay.innerText = "Klik pada peta untuk mulai mengukur";
      overlay.style.left = "0px";
      overlay.style.top = "0px";
      container.appendChild(overlay);

      map.on("click", onClick);
      map.on("mousemove", onMouseMove);
      map.on("contextmenu", onRightClick);
    });

    function onClick(e: LeafletNamespace.LeafletMouseEvent) {
      import("leaflet").then(({ default: L }) => {
        const p = e.latlng;
        points.push(p);

        const marker = L.marker(p, {
          icon: L.divIcon({
            className: "measure-node",
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          }),
        }).addTo(map);
        markers.push(marker);

        if (points.length >= 2) {
          if (!polyline) {
            polyline = L.polyline(points, {
              color: "#3b82f6",
              weight: 2.5,
              dashArray: "5, 5",
            }).addTo(map);
          } else {
            polyline.setLatLngs(points);
          }
        }

        if (points.length >= 3) {
          if (!polygon) {
            polygon = L.polygon(points, {
              color: "#3b82f6",
              weight: 0,
              fillColor: "#3b82f6",
              fillOpacity: 0.12,
            }).addTo(map);
          } else {
            polygon.setLatLngs(points);
          }
        }

        updateStats();
      });
    }

    function onMouseMove(e: LeafletNamespace.LeafletMouseEvent) {
      if (!overlay) return;

      const containerPoint = map.mouseEventToContainerPoint(e.originalEvent);
      overlay.style.left = `${containerPoint.x + 16}px`;
      overlay.style.top = `${containerPoint.y + 16}px`;

      if (points.length === 0) {
        if (tempPolyline) {
          map.removeLayer(tempPolyline);
          tempPolyline = null;
        }
        if (tempPolygon) {
          map.removeLayer(tempPolygon);
          tempPolygon = null;
        }
        overlay.innerText = i18next.language === "en"
          ? "Click on the map to start measuring"
          : "Klik pada peta untuk mulai mengukur";
        return;
      }

      const current = e.latlng;
      const previewPoints = [...points, current];

      import("leaflet").then(({ default: L }) => {
        if (!tempPolyline) {
          tempPolyline = L.polyline(previewPoints, {
            color: "#3b82f6",
            weight: 2,
            dashArray: "4, 4",
            opacity: 0.7,
          }).addTo(map);
        } else {
          tempPolyline.setLatLngs(previewPoints);
        }

        if (previewPoints.length >= 3) {
          if (!tempPolygon) {
            tempPolygon = L.polygon(previewPoints, {
              color: "#3b82f6",
              weight: 0,
              fillColor: "#3b82f6",
              fillOpacity: 0.08,
            }).addTo(map);
          } else {
            tempPolygon.setLatLngs(previewPoints);
          }
        } else if (tempPolygon) {
          map.removeLayer(tempPolygon);
          tempPolygon = null;
        }
      });

      const last = points.at(-1)!;
      const dist = last.distanceTo(current);

      let totalDist = 0;
      for (let i = 0; i < points.length - 1; i++) {
        totalDist += points[i].distanceTo(points[i + 1]);
      }
      totalDist += dist;

      const isEn = i18next.language === "en";
      if (points.length >= 2) {
        overlay.innerText = isEn
          ? `Total distance: ${(totalDist / 1000).toFixed(2)} km\nClick to add point\nRight-click to undo`
          : `Jarak total: ${(totalDist / 1000).toFixed(2)} km\nKlik untuk menambah titik\nKlik kanan untuk undo`;
      } else {
        overlay.innerText = isEn
          ? `Distance: ${(dist / 1000).toFixed(2)} km\nClick to add point\nRight-click to undo`
          : `Jarak: ${(dist / 1000).toFixed(2)} km\nKlik untuk menambah titik\nKlik kanan untuk undo`;
      }
    }

    function onRightClick(e: LeafletNamespace.LeafletMouseEvent) {
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
      }

      if (points.length === 0) return;

      points.pop();
      const removedMarker = markers.pop();
      if (removedMarker) {
        map.removeLayer(removedMarker);
      }

      if (points.length < 2 && polyline) {
        map.removeLayer(polyline);
        polyline = null;
      } else if (polyline) {
        polyline.setLatLngs(points);
      }

      if (points.length < 3 && polygon) {
        map.removeLayer(polygon);
        polygon = null;
      } else if (polygon) {
        polygon.setLatLngs(points);
      }

      if (tempPolyline) {
        map.removeLayer(tempPolyline);
        tempPolyline = null;
      }
      if (tempPolygon) {
        map.removeLayer(tempPolygon);
        tempPolygon = null;
      }

      updateStats();

      if (overlay) {
        if (points.length === 0) {
          overlay.innerText = i18next.language === "en"
            ? "Click on the map to start measuring"
            : "Klik pada peta untuk mulai mengukur";
        } else {
          onMouseMove(e);
        }
      }
    }

    function updateStats() {
      if (points.length < 2) {
        onMeasureChange({ distanceM: 0, areaM2: 0, points: points.length });
        return;
      }
      let dist = 0;
      for (let i = 0; i < points.length - 1; i++) {
        dist += points[i].distanceTo(points[i + 1]);
      }
      const area = sphericalArea(points);
      onMeasureChange({ distanceM: dist, areaM2: area, points: points.length });
    }

    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMouseMove);
      map.off("contextmenu", onRightClick);
      overlay?.remove();
      markers.forEach((m) => map.removeLayer(m));
      if (polyline) map.removeLayer(polyline);
      if (polygon) map.removeLayer(polygon);
      if (tempPolyline) map.removeLayer(tempPolyline);
      if (tempPolygon) map.removeLayer(tempPolygon);
      map.dragging.enable();
      container.classList.remove("tool-active");
      onMeasureChange(null);
    };
  }, [activeTool, mapReady, onMeasureChange]);

  // ------------------------------------------------------------ kotak perbesar
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    if (activeTool !== "zoombox") return;

    const container = containerRef.current!;
    container.classList.add("tool-active");
    map.dragging.disable();

    let startPoint: LeafletNamespace.Point | null = null;
    let overlay: HTMLDivElement | null = null;

    function onMouseDown(e: LeafletNamespace.LeafletMouseEvent) {
      if (e.originalEvent.button !== 0) return;
      startPoint = map.mouseEventToContainerPoint(e.originalEvent);
      overlay = document.createElement("div");
      overlay.className = "zoombox-overlay";
      overlay.style.left = `${startPoint.x}px`;
      overlay.style.top = `${startPoint.y}px`;
      overlay.style.width = "0px";
      overlay.style.height = "0px";
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
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
      startPoint = null;
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
  const fitTo = useCallback((newFilters: Filters) => {
    const map = mapRef.current;
    if (!map) return;

    if (
      newFilters.daerah === ALL &&
      newFilters.wilayah === ALL &&
      newFilters.daerahKhusus === ALL &&
      newFilters.wilayahKhusus === ALL &&
      newFilters.kabupaten === ALL &&
      newFilters.desa === ALL
    ) {
      if (highlightLayerRef.current) {
        map.removeLayer(highlightLayerRef.current);
        highlightLayerRef.current = null;
      }
      const [south, west, north, east] = INDONESIA_EXTENT;
      map.fitBounds([
        [south, west],
        [north, east],
      ]);
      return;
    }

    const data = dataCacheRef.current.poi;
    if (!data) return;

    const matches = data.features.filter((f) => filterFeatureByScope(f, "poi", newFilters));
    if (matches.length === 0) return;

    import("leaflet").then(({ default: L }) => {
      const bounds = L.geoJSON({
        type: "FeatureCollection",
        features: matches,
      } as GeoJSON.FeatureCollection).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
      resetView: () => fitTo(DEFAULT_FILTERS),
      fitTo,
      closePopup: () => {
        mapRef.current?.closePopup();
        if (highlightLayerRef.current) {
          mapRef.current?.removeLayer(highlightLayerRef.current);
          highlightLayerRef.current = null;
        }
      },
      focusPOI: (latlng: [number, number], properties: any) => {
        if (!mapRef.current) return;
        
        mapRef.current.closePopup();
        if (highlightLayerRef.current) {
          mapRef.current.removeLayer(highlightLayerRef.current);
          highlightLayerRef.current = null;
        }

        mapRef.current.setView(latlng, 16);

        import("leaflet").then(({ default: L }) => {
          if (!mapRef.current) return;
          const poiLayerDef = LAYERS.find((l) => l.id === "poi");
          if (!poiLayerDef) return;
          
          L.popup({
            maxWidth: 320,
          })
            .setLatLng(latlng)
            .setContent(popupHtml(poiLayerDef, properties))
            .openOn(mapRef.current);
        });
      },
      flyToCoords: (coords: [number, number], zoom = 15) => {
        mapRef.current?.flyTo(coords, zoom, { duration: 1.2 });
      },
      invalidateSize: () => {
        mapRef.current?.invalidateSize({ debounceMoveend: true });
      },
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

      <div className="pointer-events-none absolute bottom-3 right-3 z-1000 flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-3.5 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm transition-opacity">
        <span ref={coordsDotRef} className="h-2 w-2 rounded-full shrink-0 bg-slate-400" />
        <span ref={coordsTextRef}>Arahkan kursor ke peta</span>
      </div>
    </div>
  );
});

export default MapView;
