// Konfigurasi dashboard geospasial Monitoring Gereja.
//
// Semua GeoJSON di /public/data dihasilkan oleh scripts/build_data.py dari
// shapefile sumber di luar repo. Data bersifat snapshot historis, jadi disajikan
// statis dari /public tanpa backend.

export type BasemapOption = {
  id: string;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
  /**
   * Zoom asli tertinggi yang benar-benar disajikan server. Di atas nilai ini
   * Leaflet memperbesar tile terakhir secara lokal alih-alih meminta tile baru
   * yang cuma hasil upscale/blur dari sisi server.
   */
  maxNativeZoom?: number;
};

// Dua penyedia peta dasar: OpenStreetMap (kartografi/jalan) dan Esri World
// Imagery (citra satelit). Keduanya tileLayer XYZ biasa, jadi tidak perlu
// mengganti library peta.
export const BASEMAPS: BasemapOption[] = [
  {
    id: "osm",
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 20,
  },
  {
    id: "esri-imagery",
    label: "Esri Imagery",
    // Endpoint tile ArcGIS REST memakai urutan {z}/{y}/{x} (level/row/col),
    // bukan urutan {z}/{x}/{y} standar XYZ.
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
    maxNativeZoom: 18,
  },
];

/** Citra satelit jadi default — konteks lapangan lebih terbaca untuk pengguna
 *  dibanding peta jalan. */
export const DEFAULT_BASEMAP_ID = "esri-imagery";

/** Extent Indonesia (WGS84) — dipakai untuk fitBounds awal & reset view. */
export const INDONESIA_EXTENT: [south: number, west: number, north: number, east: number] = [
  -11.0, 95.0, 6.0, 141.0,
];

/** Extent Desa Bayan — cakupan layer detail (persil, jalan, POI, bangunan). */
export const DESA_BAYAN_EXTENT: [south: number, west: number, north: number, east: number] = [
  -7.7235, 109.9348, -7.7103, 109.946,
];

export const MIN_ZOOM = 4;
export const MAX_ZOOM = 20;

export type LayerId =
  | "batas_kabupaten"
  | "batas_desa"
  | "poi";

export type LayerDef = {
  id: LayerId;
  label: string;
  file: string;
  kind: "polygon" | "point";
  /** Tahun snapshot data; null = tidak terikat tahun tertentu. */
  year: number | null;
  /** Properti GeoJSON yang dipakai untuk mewarnai & mengelompokkan fitur. */
  classField?: string;
  /** Warna tunggal untuk layer tanpa klasifikasi. */
  color: string;
  defaultVisible: boolean;
  /** Cakupan spasial sebenarnya — dipakai UI untuk memberi tahu pengguna. */
  coverage: "kabupaten" | "desa-bayan";
  note?: string;
};

// Batas wilayah nasional yang relevan dengan plotting gereja.
export const LAYERS: LayerDef[] = [
  {
    id: "batas_kabupaten",
    label: "Batas Wilayah",
    file: "/data/Batas_Kabupaten_simplified.geojson",
    kind: "polygon",
    year: null,
    color: "#4f46e5",
    defaultVisible: false,
    coverage: "kabupaten",
    note: "Batas wilayah seluruh kabupaten/kota Indonesia (Simplified)",
  },
  {
    id: "batas_desa",
    label: "Batas Desa",
    file: "/data/Batas_desa_simplified.geojson",
    kind: "polygon",
    year: null,
    color: "#0891b2",
    defaultVisible: false,
    coverage: "kabupaten",
    note: "Batas wilayah seluruh desa/kelurahan Indonesia (Simplified)",
  },
  {
    id: "poi",
    label: "Titik Gereja",
    file: "/data/poi.geojson",
    kind: "point",
    year: null,
    color: "#db2777",
    defaultVisible: true,
    coverage: "kabupaten",
    note: "Sebaran lokasi gereja",
  },
];

/** Tahun snapshot yang tersedia — diturunkan dari layer agar tidak bisa pincang. */
export const YEARS: number[] = Array.from(
  new Set(LAYERS.map((l) => l.year).filter((y): y is number => y !== null)),
).sort();

// Warna kelas penutup lahan (Penutup Lahan 2020 KLHK) — dipilih mendekati makna
// tutupannya: sawah/pertanian kehijauan, permukiman merah, air biru.
export const PENUTUP_LAHAN_COLORS: Record<string, string> = {
  Sawah: "#4ade80",
  "Pertanian Lahan Kering": "#a3e635",
  "Pertanian Lahan Kering Bercampur Semak": "#84cc16",
  "Hutan Tanaman": "#166534",
  "Semak/Belukar": "#a3a300",
  Permukiman: "#dc2626",
  "Tanah Terbuka": "#d97706",
  Tambak: "#22d3ee",
  Danau: "#2563eb",
};

// Fungsi kawasan hutan (kode F_KH pada data KLHK).
export const FUNGSI_KAWASAN_LABEL: Record<string, string> = {
  HL: "Hutan Lindung",
  HP: "Hutan Produksi Tetap",
  HPT: "Hutan Produksi Terbatas",
  HPK: "Hutan Produksi yang dapat Dikonversi",
  CA: "Cagar Alam",
  SM: "Suaka Margasatwa",
  TN: "Taman Nasional",
  TWA: "Taman Wisata Alam",
  APL: "Areal Penggunaan Lain",
};

export const FUNGSI_KAWASAN_COLORS: Record<string, string> = {
  HL: "#15803d",
  HP: "#65a30d",
  HPT: "#4d7c0f",
  HPK: "#a16207",
  CA: "#0f766e",
  SM: "#0891b2",
  TN: "#047857",
  TWA: "#059669",
  APL: "#94a3b8",
};

export const BANGUNAN_OSM_LABEL: Record<string, string> = {
  building: "Bangunan",
  fuel: "SPBU",
  pitch: "Lapangan Olahraga",
};

export const BANGUNAN_OSM_COLORS: Record<string, string> = {
  building: "#7c3aed",
  fuel: "#ea580c",
  pitch: "#16a34a",
};

export const DEFAULT_CLASS_COLOR = "#94a3b8";

/** Warna & label kelas untuk sebuah layer — dipakai peta, legenda, dan grafik. */
export function classColor(layerId: string, value: string): string {
  if (layerId === "penutup_lahan") return PENUTUP_LAHAN_COLORS[value] ?? DEFAULT_CLASS_COLOR;
  if (layerId === "kehutanan") return FUNGSI_KAWASAN_COLORS[value] ?? DEFAULT_CLASS_COLOR;
  if (layerId === "bangunan_osm") return BANGUNAN_OSM_COLORS[value] ?? DEFAULT_CLASS_COLOR;
  return DEFAULT_CLASS_COLOR;
}

export function classLabel(layerId: string, value: string): string {
  if (layerId === "kehutanan") return FUNGSI_KAWASAN_LABEL[value] ?? value;
  if (layerId === "bangunan_osm") return BANGUNAN_OSM_LABEL[value] ?? value;
  return value;
}

/** Label yang lebih enak dibaca untuk key atribut mentah di popup. */
export const ATTRIBUTE_LABELS: Record<string, string> = {
  provinsi: "Provinsi",
  kabupaten: "Kabupaten",
  kecamatan: "Kecamatan",
  desa: "Desa",
  luas_ha: "Luas (ha)",
  luas_m2: "Luas (m²)",
  panjang_m: "Panjang (m)",
  penutup_lahan: "Kelas Penutup Lahan",
  fungsi_kawasan: "Fungsi Kawasan",
  no_sk: "Nomor SK",
  tgl_sk: "Tanggal SK",
  kategori: "Kategori",
  osm_id: "OSM ID",
  osm_type: "Tipe OSM",
  name: "Nama Jemaah",
  amenity: "Fasilitas",
  leisure: "Rekreasi",
  building: "Bangunan",
  place: "Tempat",
  power: "Kelistrikan",
  railway: "Perkeretaapian",
  admin_leve: "Level Administrasi",
  nama_pendeta: "Nama Gembala",
  no_hp_wa: "No HP/WA",
  alamat_gereja: "Alamat Gereja",
  tahun_berdiri: "Tahun Berdiri",
  jumlah_jemaat: "Jumlah Jemaat",
  jam_operasional: "Jam Ibadah",
  status: "Status Kepemilikan",
  mawil: "Majelis Wilayah",
  kode_mada: "Kode Mada",
  nama_mada: "Nama Majelis Daerah",
  no: "NO",
  x: "X (Longitude)",
  y: "Y (Latitude)",
};

/** Atribut gereja terurut yang akan ditampilkan pada UI ketika diklik */
export const GEREJA_ORDERED_FIELDS = [
  "nama_mada",
  "mawil",
  "no",
  "name",
  "nama_pendeta",
  "no_hp_wa",
  "alamat_gereja",
  "y",
  "x",
  "tahun_berdiri",
  "jumlah_jemaat",
  "jam_operasional",
  "status"
];

