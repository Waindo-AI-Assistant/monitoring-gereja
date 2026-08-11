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
import { ALL, DEFAULT_FILTERS, type Filters } from "@/lib/stats";

/** Alat peta yang aktif — hanya satu yang boleh hidup pada satu waktu. */
export type MapTool = "measure" | "zoombox" | null;

export type MeasureResult = { distanceM: number; areaM2: number; points: number } | null;

export type MapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitTo: (filters: Filters) => void;
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
  const nameKey = Object.keys(props).find((k) =>
    ["name", "nama", "title", "judul"].includes(k.toLowerCase()),
  );
  const titleText = nameKey ? String(props[nameKey]) : layer.label;

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

function findFeatureAt(latlng: { lat: number; lng: number }, geojson: any) {
  const x = latlng.lng;
  const y = latlng.lat;

  for (const feature of geojson.features) {
    const geom = feature.geometry;
    if (!geom) continue;

    // Hitung/ambil bbox untuk penyaringan cepat
    if (!feature.bbox) {
      let coords: [number, number][] = [];
      if (geom.type === "Polygon") {
        coords = geom.coordinates[0];
      } else if (geom.type === "MultiPolygon") {
        coords = geom.coordinates.flatMap((poly: any) => poly[0]);
      }
      if (coords.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of coords) {
          if (p[0] < minX) minX = p[0];
          if (p[1] < minY) minY = p[1];
          if (p[0] > maxX) maxX = p[0];
          if (p[1] > maxY) maxY = p[1];
        }
        feature.bbox = [minX, minY, maxX, maxY];
      }
    }

    if (feature.bbox) {
      const [minX, minY, maxX, maxY] = feature.bbox;
      if (x < minX || x > maxX || y < minY || y > maxY) continue;
    }

    if (geom.type === "Polygon") {
      const outerRing = geom.coordinates[0];
      if (pointInPolygon([x, y], outerRing)) {
        return feature;
      }
    } else if (geom.type === "MultiPolygon") {
      for (const polygon of geom.coordinates) {
        const outerRing = polygon[0];
        if (pointInPolygon([x, y], outerRing)) {
          return feature;
        }
      }
    }
  }
  return null;
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

      setTimeout(() => done(null, tile));
      return tile;
    },
  });

  return new CanvasGridLayer();
}

/* ─────────────── Komponen Utama MapView ─────────────── */

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
  const overlaysRef = useRef<Partial<Record<LayerId, any>>>({});
  const dataCacheRef = useRef<Partial<Record<LayerId, GeoJSON.FeatureCollection>>>({});
  const highlightLayerRef = useRef<any>(null);

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

        // Posisi default tengah Indonesia
        const [south, west, north, east] = INDONESIA_EXTENT;
        map.fitBounds([
          [south, west],
          [north, east],
        ]);

        map.on("mousemove", (e) => {
          if (!cancelled) setCursor(e.latlng);
        });

        mapRef.current = map;
        setMapReady(true);
      } catch (error) {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : "Inisialisasi Leaflet gagal.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

        const features = data.features.filter((f) => {
          const p = f.properties ?? {};
          if (layer.id === "batas_kabupaten") {
            const kabName = p.WADMKK || p.NAMOBJ;
            if (filters.kabupaten !== ALL && kabName !== filters.kabupaten) return false;
          }
          if (layer.id === "batas_desa") {
            const desaName = p.NAMOBJ;
            const kabName = p.WADMKK;
            if (filters.desa !== ALL && desaName !== filters.desa) return false;
            if (filters.kabupaten !== ALL && kabName !== filters.kabupaten) return false;
          }
          return true;
        });

        const clickedFeature = findFeatureAt(e.latlng, { type: "FeatureCollection", features });
        if (clickedFeature) {
          onFeatureSelect?.((clickedFeature.properties ?? {}) as Record<string, any>, layer.label);

          // Gambar garis seleksi (highlight)
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

        const features = data.features.filter((f) => {
          const p = f.properties ?? {};
          if (layer.id === "poi") {
            if (filters.daerah !== ALL && p.nama_mada !== filters.daerah) return false;
            if (filters.kabupaten !== ALL && p.kabupaten !== filters.kabupaten) return false;
            if (filters.desa !== ALL && p.desa !== filters.desa) return false;
          }
          if (layer.id === "batas_kabupaten") {
            const kabName = p.WADMKK || p.NAMOBJ;
            if (filters.kabupaten !== ALL) {
              if (kabName !== filters.kabupaten) return false;
            }
          }
          if (layer.id === "batas_desa") {
            const desaName = p.NAMOBJ;
            const kabName = p.WADMKK;
            if (filters.desa !== ALL) {
              if (desaName !== filters.desa) return false;
            } else if (filters.kabupaten !== ALL) {
              if (kabName !== filters.kabupaten) return false;
            }
          }
          return true;
        });

        if (layer.kind === "polygon") {
          // Canvas rendering berbasis geojson-vt agar super ringan di memori
          const vtLayer = createVectorTileLayer(L, { type: "FeatureCollection", features }, {
            color: layer.color,
            weight: layer.id === "batas_kabupaten" ? 2 : 1,
          });
          vtLayer.setZIndex(layer.id === "batas_kabupaten" ? 200 : 201);
          vtLayer.addTo(map);
          overlaysRef.current[layer.id] = vtLayer;
        } else {
          // DivIcon standar untuk POI Gereja
          const gj = L.geoJSON(
            { type: "FeatureCollection", features } as GeoJSON.FeatureCollection,
            {
              pointToLayer: (feature, latlng) => {
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
              },
              onEachFeature: (feature, lyr) => {
                lyr.bindPopup(popupHtml(layer, (feature.properties ?? {}) as Record<string, unknown>), {
                  maxWidth: 320,
                });
                lyr.on("click", () => {
                  onFeatureSelect?.((feature.properties ?? {}) as Record<string, any>, layer.label);
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
  }, [visibleLayers, filters, mapReady, onLoadingChange]);

  // -------------------------------------------------------------- alat ukur
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    if (activeTool !== "measure") {
      onMeasureChange(null);
      return;
    }

    let points: LeafletNamespace.LatLng[] = [];
    let markers: LeafletNamespace.Marker[] = [];
    let polyline: LeafletNamespace.Polyline | null = null;
    let polygon: LeafletNamespace.Polygon | null = null;

    const container = containerRef.current!;
    container.classList.add("tool-active");
    map.dragging.disable();

    let overlay: HTMLDivElement | null = null;

    import("leaflet").then(({ default: L }) => {
      overlay = document.createElement("div");
      overlay.className = "measure-overlay";
      overlay.innerText = "Klik pada peta untuk mulai mengukur";
      container.appendChild(overlay);

      map.on("click", onClick);
      map.on("mousemove", onMouseMove);
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
      if (points.length === 0) return;

      const current = e.latlng;
      const last = points[points.length - 1];
      const dist = last.distanceTo(current);

      let totalDist = 0;
      for (let i = 0; i < points.length - 1; i++) {
        totalDist += points[i].distanceTo(points[i + 1]);
      }
      totalDist += dist;

      if (points.length >= 2) {
        overlay.innerText = `Jarak total: ${(totalDist / 1000).toFixed(2)} km\nKlik untuk menambah titik`;
      } else {
        overlay.innerText = `Jarak: ${(dist / 1000).toFixed(2)} km\nKlik untuk menambah titik`;
      }
    }

    function updateStats() {
      let distanceM = 0;
      for (let i = 0; i < points.length - 1; i++) {
        distanceM += points[i].distanceTo(points[i + 1]);
      }
      const areaM2 = sphericalArea(points);
      onMeasureChange({ distanceM, areaM2, points: points.length });
    }

    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMouseMove);
      markers.forEach((m) => map.removeLayer(m));
      if (polyline) map.removeLayer(polyline);
      if (polygon) map.removeLayer(polygon);
      overlay?.remove();
      map.dragging.enable();
      container.classList.remove("tool-active");
    };
  }, [activeTool, mapReady, onMeasureChange]);

  // -------------------------------------------------------------- zoombox
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
      startPoint = map.mouseEventToContainerPoint(e.originalEvent);
      overlay = document.createElement("div");
      overlay.className = "zoombox-overlay";
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
  const fitTo = useCallback((filters: Filters) => {
    const map = mapRef.current;
    if (!map) return;

    // Bersihkan highlight lama jika filter direset
    if (filters.daerah === ALL && filters.kabupaten === ALL && filters.desa === ALL) {
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

    const matches = data.features.filter((f) => {
      const p = f.properties ?? {};
      if (filters.daerah !== ALL && p.nama_mada !== filters.daerah) return false;
      if (filters.kabupaten !== ALL && p.kabupaten !== filters.kabupaten) return false;
      if (filters.desa !== ALL && p.desa !== filters.desa) return false;
      return true;
    });
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
