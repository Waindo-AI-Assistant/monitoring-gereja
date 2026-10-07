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
  | "batas_provinsi"
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
    id: "batas_provinsi",
    label: "Batas Mada",
    file: "/data/Batas_Provinsi_simplified.geojson",
    kind: "polygon",
    year: null,
    color: "#0891b2",
    defaultVisible: false,
    coverage: "kabupaten",
    note: "Batas wilayah seluruh provinsi Indonesia (Simplified)",
  },
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
  mawil: "Majelis Wilayah (Mawil)",
  kode_mada: "Kode Mada",
  nama_mada: "Majelis Daerah (Mada)",
  tipe_wilayah: "Kategori Wilayah",
  daerah_khusus: "Mada Khusus (Daerah Khusus)",
  wilayah_khusus: "Mawil Khusus (Wilayah Khusus)",
  no: "NO",
  x: "X (Longitude)",
  y: "Y (Latitude)",

  // Atribut GIS Administrasi Batas Wilayah & Batas Mada
  WADMKK: "Kabupaten / Kota",
  WADMPR: "Provinsi",
  WADMKC: "Kecamatan",
  WADMKD: "Desa / Kelurahan",
  NAMOBJ: "Nama Wilayah / Objek",
  LUASWH: "Luas Wilayah (Ha)",
  KDPPUM: "Kode Provinsi",
  KDPKAB: "Kode Kabupaten",
  KDCPUM: "Kode Kecamatan",
  KDEPUM: "Kode Desa",
  REMARK: "Keterangan",
  METADATA: "Sumber Data / Metadata",
  SRS_ID: "Sistem Koordinat (SRS ID)",
  FCODE: "Kode Unsur (FCODE)",
  Shape_Leng: "Panjang Keliling (Derajat)",
  Shape_Area: "Luas Area (Derajat²)",
  OBJECTID: "ID Objek",
  UUPP: "Undang-Undang / Peraturan",
  TIPADM: "Tipe Administrasi",
  luas: "Luas Area (Km²)",
};

/** Atribut gereja terurut yang akan ditampilkan pada UI ketika diklik */
export const GEREJA_ORDERED_FIELDS = [
  "tipe_wilayah",
  "nama_mada",
  "mawil",
  "daerah_khusus",
  "wilayah_khusus",
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

/** Formats values nicely, standardizing phone numbers, preserving years/IDs, and converting scientific notations */
export function formatValue(v: unknown, fieldKey?: string): string {
  if (v === null || v === undefined) {
    return "-";
  }
  
  const strVal = String(v).trim();
  if (strVal === "") {
    return "-";
  }

  const keyLower = (fieldKey || "").toLowerCase();

  // 1. Khusus field nomor HP / WhatsApp / Telepon
  if (
    keyLower.includes("hp") ||
    keyLower.includes("wa") ||
    keyLower.includes("telp") ||
    keyLower.includes("telepon") ||
    keyLower.includes("phone")
  ) {
    // Bersihkan karakter non-digit
    let digits = strVal.replace(/\D/g, "");
    if (!digits) return "-";

    // Standarisasi awalan 0 (misal '81284418277' -> '081284418277' atau '6281284418277' -> '081284418277')
    if (digits.startsWith("628")) {
      digits = "08" + digits.slice(3);
    } else if (digits.startsWith("8") && digits.length >= 9 && digits.length <= 13) {
      digits = "0" + digits;
    }

    // Format dengan spasi yang mudah dibaca: misal 0813 1601 0980 atau 0812 8441 8277
    if (digits.startsWith("08") && digits.length >= 10) {
      if (digits.length === 10) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      } else if (digits.length === 11) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      } else if (digits.length === 12) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
      } else if (digits.length >= 13) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
      }
    }

    return digits;
  }

  // 2. Khusus field tahun / kode / id yang tidak boleh diformat dengan pemisah ribuan
  if (
    keyLower.includes("tahun") ||
    keyLower.includes("year") ||
    keyLower.includes("kode") ||
    keyLower.includes("fid") ||
    keyLower === "no" ||
    keyLower.includes("kd_") ||
    keyLower.includes("kategori")
  ) {
    return strVal;
  }

  // 3. Khusus koordinat x dan y (longitude & latitude)
  if (keyLower === "x" || keyLower === "y" || keyLower.includes("lat") || keyLower.includes("long")) {
    const num = Number(strVal);
    if (!Number.isNaN(num) && num !== 0) {
      return num.toFixed(6);
    }
    return strVal;
  }

  // 4. Jika murni angka bertipe number
  if (typeof v === "number") {
    if (Number.isNaN(v)) return "-";
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(v);
  }
  
  // 5. Cek apakah string numerik dengan notasi ilmiah (misal 3.8609e+03)
  if (/^-?\d+(\.\d+)?e[+-]?\d+$/i.test(strVal)) {
    const num = Number(strVal);
    if (!Number.isNaN(num)) {
      return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num);
    }
  }

  // 6. Jika field adalah kuantitatif (jumlah_jemaat / luas / area / panjang), format dengan pemisah ribuan jika murni angka
  if (
    keyLower.includes("jumlah") ||
    keyLower.includes("luas") ||
    keyLower.includes("area") ||
    keyLower.includes("leng") ||
    keyLower.includes("populasi") ||
    keyLower.includes("kapasitas")
  ) {
    const num = Number(strVal);
    if (!Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(strVal)) {
      return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num);
    }
  }
  
  return strVal;
}

