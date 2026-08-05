// Agregasi statistik dashboard.
//
// stats.json berisi satu record per desa dengan angka yang sudah dihitung di
// CRS metrik oleh scripts/build_data.py. Semua kartu ringkasan & grafik cukup
// menjumlahkan record yang lolos filter — tidak ada hitungan geometri di
// browser, sehingga filter terasa seketika walau ada 496 desa.

import type { LayerId } from "@/config/dashboard";

export type DesaStat = {
  kecamatan: string;
  desa: string;
  luas_desa_ha: number;
  jumlah_poi: number;
  jumlah_persil: number;
  panjang_jalan_m: number;
  luas_penggunaan_lahan_ha: number;
  luas_kawasan_hutan_ha: number;
  luas_bangunan_osm_ha: number;
  penutup_lahan: Record<string, number>;
  kawasan_hutan: Record<string, number>;
  bangunan_osm: Record<string, number>;
};

export type StatsFile = {
  generated_at: string;
  kabupaten: string;
  sumber: Record<string, string>;
  desa: DesaStat[];
};

/** Nilai sentinel filter wilayah: tidak menyaring apa pun. */
export const ALL = "__all__";

export type Filters = {
  /**
   * Tahun snapshot aktif — selalu tepat satu. Tiap tahun mewakili satu sumber
   * data (2020 Penutup Lahan, 2021 Kawasan Hutan), jadi "semua tahun" akan
   * menumpuk dua survei berbeda dalam satu tampilan dan angkanya tidak bisa
   * dijumlahkan secara bermakna.
   */
  year: number;
  kecamatan: string | typeof ALL;
  desa: string | typeof ALL;
};

/** Default 2020: sejalan dengan tema awal (Penggunaan Lahan / Penutup Lahan 2020). */
export const DEFAULT_FILTERS: Filters = { year: 2020, kecamatan: ALL, desa: ALL };

export function filterRecords(records: DesaStat[], filters: Filters): DesaStat[] {
  return records.filter((r) => {
    if (filters.kecamatan !== ALL && r.kecamatan !== filters.kecamatan) return false;
    if (filters.desa !== ALL && r.desa !== filters.desa) return false;
    return true;
  });
}

export type Summary = {
  jumlahDesa: number;
  luasPenggunaanLahanHa: number;
  panjangJalanKm: number;
  jumlahPoi: number;
  jumlahPersil: number;
  luasKawasanHutanHa: number;
};

export function summarize(records: DesaStat[]): Summary {
  const sum = (fn: (r: DesaStat) => number) => records.reduce((acc, r) => acc + fn(r), 0);
  return {
    jumlahDesa: records.length,
    luasPenggunaanLahanHa: sum((r) => r.luas_penggunaan_lahan_ha),
    panjangJalanKm: sum((r) => r.panjang_jalan_m) / 1000,
    jumlahPoi: sum((r) => r.jumlah_poi),
    jumlahPersil: sum((r) => r.jumlah_persil),
    luasKawasanHutanHa: sum((r) => r.luas_kawasan_hutan_ha),
  };
}

export type BreakdownEntry = { key: string; value: number };

/** Jumlahkan salah satu rincian berkelas (mis. penutup_lahan) lintas desa. */
export function breakdown(
  records: DesaStat[],
  field: "penutup_lahan" | "kawasan_hutan" | "bangunan_osm",
): BreakdownEntry[] {
  const totals = new Map<string, number>();
  for (const r of records) {
    for (const [key, value] of Object.entries(r[field])) {
      totals.set(key, (totals.get(key) ?? 0) + value);
    }
  }
  return [...totals.entries()]
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
}

/** Rincian per kecamatan/desa untuk grafik batang perbandingan wilayah. */
export function byRegion(
  records: DesaStat[],
  groupBy: "kecamatan" | "desa",
  metric: (r: DesaStat) => number,
): BreakdownEntry[] {
  const totals = new Map<string, number>();
  for (const r of records) {
    totals.set(r[groupBy], (totals.get(r[groupBy]) ?? 0) + metric(r));
  }
  return [...totals.entries()]
    .map(([key, value]) => ({ key, value }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Daftar kecamatan unik, terurut — untuk isi dropdown filter. */
export function kecamatanOptions(records: DesaStat[]): string[] {
  return [...new Set(records.map((r) => r.kecamatan))].sort();
}

/** Desa yang tersedia, dipersempit oleh filter kecamatan yang aktif. */
export function desaOptions(records: DesaStat[], kecamatan: string | typeof ALL): string[] {
  const scoped = kecamatan === ALL ? records : records.filter((r) => r.kecamatan === kecamatan);
  return [...new Set(scoped.map((r) => r.desa))].sort();
}

/**
 * Layer mana yang lolos filter tahun. Layer tanpa tahun (persil, jalan, POI)
 * selalu lolos karena bukan snapshot periodik.
 */
export function layerPassesYear(layerYear: number | null, year: Filters["year"]): boolean {
  if (layerYear === null) return true;
  return layerYear === year;
}

const NUMBER_ID = new Intl.NumberFormat("id-ID");
const NUMBER_ID_2 = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatInt(value: number): string {
  return NUMBER_ID.format(Math.round(value));
}

export function formatArea(ha: number): string {
  return NUMBER_ID_2.format(ha);
}

/** Metrik yang dipakai kartu & grafik untuk tiap layer berkelas. */
export const BREAKDOWN_FIELD: Partial<Record<LayerId, "penutup_lahan" | "kawasan_hutan" | "bangunan_osm">> =
  {
    penutup_lahan: "penutup_lahan",
    kehutanan: "kawasan_hutan",
    bangunan_osm: "bangunan_osm",
  };
