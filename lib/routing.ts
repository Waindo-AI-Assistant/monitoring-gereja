/**
 * Utility untuk navigasi dan kalkulasi rute tercepat menggunakan OSRM Driving Engine
 */

export interface RouteStep {
  instruction: string;
  name: string;
  distance: number; // meters
  duration: number; // seconds
}

export interface RouteResult {
  coordinates: [number, number][]; // Array [lat, lng] untuk Leaflet polyline
  distanceKm: number;
  distanceM: number;
  durationMinutes: number;
  distanceFormatted: string;
  durationFormatted: string;
  steps: RouteStep[];
  startCoords: [number, number];
  endCoords: [number, number];
}

/**
 * Format jarak ke format yang ramah dibaca (meter atau kilometer)
 */
export function formatRouteDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format durasi detik ke format jam & menit
 */
export function formatRouteDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${Math.max(1, minutes)} mnt`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} jam`;
  }
  return `${hours} jam ${remainingMinutes} mnt`;
}

function translateManeuver(type: string, modifier?: string): string {
  const t = (type || "").toLowerCase();
  const m = (modifier || "").toLowerCase();

  if (t === "depart") return "Mulai dari lokasi Anda";
  if (t === "arrive") return "Tiba di gereja tujuan";
  if (t === "roundabout") return "Masuk ke bundaran jalan";

  if (m === "right" || m === "sharp right" || m === "slight right") {
    return "Belok kanan ke";
  }
  if (m === "left" || m === "sharp left" || m === "slight left") {
    return "Belok kiri ke";
  }
  if (m === "uturn") {
    return "Putar balik ke";
  }
  if (m === "straight") {
    return "Lurus terus di";
  }

  return "Lanjutkan perjalanan ke";
}

/**
 * Menghitung rute tercepat dari titik asal (start: [lat, lng]) ke titik tujuan (end: [lat, lng])
 */
export async function calculateRoute(
  start: [number, number],
  end: [number, number]
): Promise<RouteResult> {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gagal menghubungi server rute (${response.status})`);
  }

  const data = await response.json();
  if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
    throw new Error("Rute jalan tidak ditemukan untuk koordinat ini.");
  }

  const primaryRoute = data.routes[0];
  const geojsonCoords = primaryRoute.geometry.coordinates; // [lng, lat]

  // Konversi [lng, lat] GeoJSON ke [lat, lng] untuk Leaflet
  const leafletCoords: [number, number][] = geojsonCoords.map(
    (pt: [number, number]) => [pt[1], pt[0]]
  );

  const steps: RouteStep[] = [];
  if (primaryRoute.legs && primaryRoute.legs[0]?.steps) {
    for (const s of primaryRoute.legs[0].steps) {
      const name = s.name || s.ref || "Jalan Raya / Jalur Terdekat";
      const maneuverType = s.maneuver?.type || "turn";
      const modifier = s.maneuver?.modifier || "";
      const indonesianInstruction = translateManeuver(maneuverType, modifier);

      steps.push({
        instruction: indonesianInstruction,
        name,
        distance: s.distance,
        duration: s.duration,
      });
    }
  }

  const distanceM = primaryRoute.distance;
  const distanceKm = distanceM / 1000;
  const durationSec = primaryRoute.duration;
  const durationMinutes = Math.round(durationSec / 60);

  return {
    coordinates: leafletCoords,
    distanceM,
    distanceKm,
    durationMinutes,
    distanceFormatted: formatRouteDistance(distanceM),
    durationFormatted: formatRouteDuration(durationSec),
    steps,
    startCoords: start,
    endCoords: end,
  };
}

/**
 * Buat URL tautan navigasi langsung ke aplikasi Google Maps (opsional)
 */
export function getGoogleMapsDirectionsUrl(
  destLat: number,
  destLng: number,
  startLat?: number,
  startLng?: number
): string {
  if (startLat !== undefined && startLng !== undefined) {
    return `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
}
