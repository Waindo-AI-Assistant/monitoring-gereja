"use client";

import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface CoordinatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (coords: { lat: number; lng: number }) => void;
  initialLat?: number | string | null;
  initialLng?: number | string | null;
  churchName?: string;
}

export default function CoordinatePickerModal({
  isOpen,
  onClose,
  onSelect,
  initialLat,
  initialLng,
  churchName,
}: CoordinatePickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const basemapLayerRef = useRef<any>(null);

  // Parse valid coordinates
  const parsedLat = initialLat !== undefined && initialLat !== "" && !isNaN(Number(initialLat)) && Number(initialLat) !== 0
    ? Number(initialLat)
    : -6.1843; // Default Kramat Pulo, Jakarta
  const parsedLng = initialLng !== undefined && initialLng !== "" && !isNaN(Number(initialLng)) && Number(initialLng) !== 0
    ? Number(initialLng)
    : 106.8456;

  const [currentLat, setCurrentLat] = useState<number>(parsedLat);
  const [currentLng, setCurrentLng] = useState<number>(parsedLng);
  const [basemap, setBasemap] = useState<"osm" | "satellite">("osm");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState("");

  // Sync state when opening with new props
  useEffect(() => {
    if (isOpen) {
      const lat = initialLat !== undefined && initialLat !== "" && !isNaN(Number(initialLat)) && Number(initialLat) !== 0
        ? Number(initialLat)
        : -6.1843;
      const lng = initialLng !== undefined && initialLng !== "" && !isNaN(Number(initialLng)) && Number(initialLng) !== 0
        ? Number(initialLng)
        : 106.8456;
      setCurrentLat(lat);
      setCurrentLng(lng);
      setSearchQuery("");
      setSearchResults([]);
      setSearchError("");
    }
  }, [isOpen, initialLat, initialLng]);

  // Initialize and handle Leaflet map
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        basemapLayerRef.current = null;
      }
      return;
    }

    let isMounted = true;

    // Small delay to ensure modal container has DOM dimensions
    const timer = setTimeout(async () => {
      if (!mapContainerRef.current || !isMounted) return;

      const L = (await import("leaflet")).default;

      if (!mapInstanceRef.current) {
        const hasInitial = initialLat !== undefined && initialLat !== "" && !isNaN(Number(initialLat)) && Number(initialLat) !== 0;
        const initialZoom = hasInitial ? 16 : 6;
        const map = L.map(mapContainerRef.current, {
          center: [currentLat, currentLng],
          zoom: initialZoom,
          zoomControl: false,
        });

        // Add zoom control at bottom right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Basemap tile layer
        const tileUrl = basemap === "satellite"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

        const tileLayer = L.tileLayer(tileUrl, {
          maxZoom: 19,
          attribution: basemap === "satellite" ? "Esri World Imagery" : "&copy; OpenStreetMap contributors",
        }).addTo(map);
        basemapLayerRef.current = tileLayer;

        // Custom Pin Icon
        const pinIcon = L.divIcon({
          className: "custom-picker-pin",
          html: `
            <div style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); cursor: grab;">
              <svg viewBox="0 0 24 24" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" style="width: 38px; height: 38px;">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
        });

        const marker = L.marker([currentLat, currentLng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          const nextLat = Number(pos.lat.toFixed(6));
          const nextLng = Number(pos.lng.toFixed(6));
          setCurrentLat(nextLat);
          setCurrentLng(nextLng);
        });

        map.on("click", (e: any) => {
          const nextLat = Number(e.latlng.lat.toFixed(6));
          const nextLng = Number(e.latlng.lng.toFixed(6));
          marker.setLatLng([nextLat, nextLng]);
          setCurrentLat(nextLat);
          setCurrentLng(nextLng);
        });

        markerRef.current = marker;
        mapInstanceRef.current = map;
      }

      // Invalidate size to ensure crisp rendering
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Handle Basemap Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !basemapLayerRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      mapInstanceRef.current.removeLayer(basemapLayerRef.current);

      const tileUrl = basemap === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

      const nextLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: basemap === "satellite" ? "Esri World Imagery" : "&copy; OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current);
      nextLayer.bringToBack();
      basemapLayerRef.current = nextLayer;
    })();
  }, [basemap]);

  // Handle Geocoding Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery.trim()
      )}&countrycodes=id&limit=5`;

      const res = await fetch(endpoint, {
        headers: { "Accept-Language": "id,en" },
      });
      if (!res.ok) throw new Error("Gagal melakukan pencarian wilayah.");
      const data = await res.json();

      if (!data || data.length === 0) {
        setSearchError("Lokasi tidak ditemukan. Coba kata kunci lain.");
      } else {
        setSearchResults(data);
      }
    } catch (err: any) {
      setSearchError(err.message || "Gagal mencari lokasi.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = Number(parseFloat(item.lat).toFixed(6));
    const lng = Number(parseFloat(item.lon).toFixed(6));
    setCurrentLat(lat);
    setCurrentLng(lng);
    setSearchResults([]);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  // Handle GPS location
  const handleDetectGPS = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      alert("Browser tidak mendukung deteksi GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCurrentLat(lat);
        setCurrentLng(lng);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          markerRef.current.setLatLng([lat, lng]);
        }
      },
      (err) => {
        alert("Gagal mendeteksi lokasi GPS atau izin ditolak.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    onSelect({ lat: currentLat, lng: currentLng });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 animate-fade-in">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[750px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pilih Titik Koordinat di Peta</h3>
              <p className="text-[11px] text-slate-500">
                {churchName ? `Menentukan koordinat untuk ${churchName}` : "Klik pada peta atau geser penanda untuk menentukan lokasi persis gereja."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar & Search Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Search box */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <form onSubmit={handleSearch} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari jalan, desa, kecamatan, atau kota..."
                  className="w-full h-9 pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="h-9 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shrink-0 disabled:opacity-50"
              >
                {isSearching ? "Mencari..." : "Cari"}
              </button>
            </form>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-10 left-0 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 transition-colors flex items-start gap-2 text-slate-700"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span className="truncate">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            {searchError && (
              <div className="absolute top-10 left-0 right-0 z-50 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-[11px]">
                {searchError}
              </div>
            )}
          </div>

          {/* Quick Tools */}
          <div className="flex items-center gap-2">
            {/* Basemap Switcher */}
            <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBasemap("osm")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  basemap === "osm" ? "bg-white text-blue-600 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Peta Jalan
              </button>
              <button
                type="button"
                onClick={() => setBasemap("satellite")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  basemap === "satellite" ? "bg-white text-blue-600 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Satelit
              </button>
            </div>

            {/* GPS Locate Button */}
            <button
              type="button"
              onClick={handleDetectGPS}
              className="h-8 px-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Deteksi Lokasi GPS Saya"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-blue-600">
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
              <span>GPS Saya</span>
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 w-full bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Instructions Banner */}
          <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-[11px] font-medium text-slate-700 pointer-events-none flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            <span>Klik pada peta atau geser penanda merah untuk menentukan koordinat</span>
          </div>
        </div>

        {/* Footer & Coordinate Confirmation */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Active Coordinates Display */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs">
              <span className="text-slate-400 font-sans text-[10px] mr-1 uppercase">Latitude (Y):</span>
              <strong className="text-blue-900 font-bold">{currentLat.toFixed(6)}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs">
              <span className="text-slate-400 font-sans text-[10px] mr-1 uppercase">Longitude (X):</span>
              <strong className="text-blue-900 font-bold">{currentLng.toFixed(6)}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-all flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>Gunakan Koordinat Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
