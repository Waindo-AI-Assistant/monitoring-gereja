"""
Siapkan data GeoJSON + statistik untuk dashboard Local Government (Kab. Purworejo).

Sumber data shapefile ada di Local_Government/ (di luar repo ini, tidak ikut
di-commit). Script ini:
  1. Meng-clip layer berskala nasional (PODES, Kawasan Hutan, Penutup Lahan)
     ke batas Kabupaten Purworejo — kalau tidak, file mentahnya ratusan MB dan
     tidak mungkin dikirim ke browser.
  2. Mereproject layer lokal (EPSG:23835 / DGN95 TM-3 zona 49.1) ke EPSG:4326
     supaya Leaflet bisa memakainya langsung tanpa reproject di client.
  3. Menghitung statistik per desa sekali di sini (luas dihitung di EPSG:32749 /
     UTM 49S, bukan di derajat) lalu menyimpannya sebagai stats.json. Dashboard
     tinggal menjumlahkan angka per desa sesuai filter aktif — jadi kartu
     ringkasan dan grafik tetap responsif tanpa hitung geometri di browser.

Data historis & tidak berubah harian, jadi cukup dijalankan ulang saat sumbernya
diperbarui:
    python scripts/build_data.py
"""

from __future__ import annotations

import json
import os
from datetime import date

import geopandas as gpd
import pandas as pd
from pyogrio import read_dataframe

SOURCE_DIR = r"C:\SEMESTER 4\Magang_Waindo\Local_Government"
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data"
)

KABUPATEN = "PURWOREJO"

# CRS metrik untuk hitung luas/panjang. Purworejo ada di UTM zona 49S.
METRIC_CRS = "EPSG:32749"
WGS84 = "EPSG:4326"

# Toleransi simplifikasi (derajat) — dipilih per layer: batas desa & penutup
# lahan dipakai pada skala kabupaten sehingga boleh lebih kasar, sedangkan
# persil/jalan dilihat sampai skala meteran jadi hampir tidak disederhanakan.
SIMPLIFY_COARSE = 0.00005  # ~5 m
SIMPLIFY_FINE = 0.000005  # ~0.5 m

SRC = {
    "batas_desa": os.path.join(SOURCE_DIR, "00_Batas_Desa", "Batas_Desa_Bayan.shp"),
    "jalan": os.path.join(SOURCE_DIR, "01_Data_Jalan_OSM", "Jalan_AR.shp"),
    "podes": os.path.join(SOURCE_DIR, "02_PODES_Batas_Desa", "Batas_Administrasi.shp"),
    "poi": os.path.join(SOURCE_DIR, "03_POI_OSM", "POI_Bayan.shp"),
    "persil": os.path.join(SOURCE_DIR, "05_Persil", "Persil.shp"),
    "kawasan_hutan": os.path.join(SOURCE_DIR, "06_Kehutanan", "Kawasan_Hutan-2021.shp"),
    "penutup_lahan": os.path.join(SOURCE_DIR, "06_Kehutanan", "Penutup_Lahan-2020.shp"),
    "penggunaan_lahan": os.path.join(
        SOURCE_DIR, "07_Penggunaan_Lahan_OSM", "Penggunaan_Lahan_OSM.shp"
    ),
}


def log(msg: str) -> None:
    print(msg, flush=True)


def write_geojson(gdf: gpd.GeoDataFrame, name: str, simplify: float | None) -> None:
    """Tulis GeoDataFrame ke public/data/<name>.geojson dalam WGS84."""
    gdf = gdf.to_crs(WGS84)
    if simplify:
        gdf = gdf.copy()
        gdf["geometry"] = gdf.geometry.simplify(simplify, preserve_topology=True)
    gdf = gdf[~gdf.geometry.is_empty & gdf.geometry.notna()]

    path = os.path.join(OUTPUT_DIR, f"{name}.geojson")
    if os.path.exists(path):
        os.remove(path)
    gdf.to_file(path, driver="GeoJSON")
    size_kb = os.path.getsize(path) / 1024
    log(f"  -> {name}.geojson  {len(gdf)} fitur, {size_kb:,.0f} KB")


def drop_empty_columns(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Buang kolom yang seluruhnya kosong.

    Layer OSM membawa 77 kolom skema global; untuk Desa Bayan hampir semuanya
    NULL dan hanya bikin popup atribut penuh baris kosong.
    """
    keep = [c for c in gdf.columns if c == "geometry" or gdf[c].notna().any()]
    return gdf[keep]


def area_ha(gdf: gpd.GeoDataFrame) -> pd.Series:
    return gdf.to_crs(METRIC_CRS).geometry.area / 10_000


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ---------------------------------------------------------------- Batas desa
    log(f"[1/7] Batas desa PODES — clip ke Kab. {KABUPATEN}")
    desa = read_dataframe(
        SRC["podes"],
        columns=["PROVINSI", "KABKOT", "KECAMATAN", "DESA"],
        where=f"KABKOT = '{KABUPATEN}'",
    ).to_crs(WGS84)
    desa = desa.rename(
        columns={
            "PROVINSI": "provinsi",
            "KABKOT": "kabupaten",
            "KECAMATAN": "kecamatan",
            "DESA": "desa",
        }
    )
    desa["luas_ha"] = area_ha(desa).round(2)
    log(f"  {len(desa)} desa / {desa['kecamatan'].nunique()} kecamatan")
    write_geojson(desa, "desa", SIMPLIFY_COARSE)

    aoi = desa.union_all()
    aoi_bbox = desa.total_bounds

    # Kunci join spasial: setiap fitur layer lain dipetakan ke desa induknya.
    desa_join = desa[["kecamatan", "desa", "geometry"]]

    def tag_desa(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """Tempelkan kolom kecamatan/desa lewat titik perwakilan tiap fitur.

        Hanya untuk objek KECIL yang jelas milik satu desa (persil, POI, ruas
        jalan): satu fitur = satu desa, sehingga tidak ada dobel hitung.
        JANGAN dipakai untuk poligon luas — lihat clip_to_desa.
        """
        pts = gdf[["geometry"]].copy()
        pts["geometry"] = pts.geometry.representative_point()
        joined = gpd.sjoin(pts, desa_join, how="left", predicate="within")
        joined = joined[~joined.index.duplicated(keep="first")]
        out = gdf.copy()
        out["kecamatan"] = joined["kecamatan"]
        out["desa"] = joined["desa"]
        return out

    def clip_to_desa(gdf: gpd.GeoDataFrame, luas_col: str = "luas_ha") -> gpd.GeoDataFrame:
        """Potong poligon tepat di batas desa; satu fitur keluar = satu desa.

        Ini wajib untuk layer berskala kabupaten. Poligon Penutup Lahan
        rata-rata ~324 ha sementara desa terkecil hanya belasan hektar, jadi
        satu poligon bisa menutupi puluhan desa sekaligus. Menandainya ke satu
        desa lewat titik perwakilan membuat filter peta meleset total: saat
        difilter ke Desa Bayan (128 ha) tidak ada satu pun poligon yang titik
        perwakilannya jatuh di sana, sehingga layer-nya hilang dari peta padahal
        statistiknya jelas menyebut ada 128 ha penggunaan lahan di situ.

        Dengan dipotong, geometri yang digambar peta sama persis dengan yang
        dihitung statistik — keduanya bersumber dari frame yang sama.
        """
        parts = gpd.overlay(gdf, desa_join, how="intersection", keep_geom_type=True)
        parts = parts[~parts.geometry.is_empty & parts.geometry.notna()]
        # Luas dihitung ulang: nilai lama masih luas poligon utuh sebelum dipotong.
        parts[luas_col] = area_ha(parts).round(4)
        return parts[parts[luas_col] > 0].reset_index(drop=True)

    # ------------------------------------------------------------ Kawasan hutan
    log("[2/7] Kawasan Hutan 2021 — clip ke Purworejo")
    # fungsikws hanya berisi kode numerik (100100, 100300, ...); F_KH sudah
    # berupa singkatan resmi fungsi kawasan (HL, HP, HPT, CA, SM) jadi itu yang
    # dipakai, lalu dipanjangkan ke nama lengkap lewat FUNGSI_KAWASAN_LABEL.
    hutan = read_dataframe(
        SRC["kawasan_hutan"], columns=["F_KH", "noskkws", "tglskkws"], bbox=tuple(aoi_bbox)
    ).to_crs(WGS84)
    hutan = gpd.clip(hutan, aoi)
    hutan = hutan[~hutan.geometry.is_empty & hutan.geometry.notna()]
    hutan = hutan.rename(columns={"F_KH": "fungsi_kawasan", "noskkws": "no_sk", "tglskkws": "tgl_sk"})
    hutan = clip_to_desa(hutan)
    log(f"  {len(hutan)} potongan, fungsi: {sorted(hutan['fungsi_kawasan'].dropna().unique())}")
    write_geojson(hutan, "kehutanan", SIMPLIFY_COARSE)

    # ------------------------------------------------------------ Penutup lahan
    log("[3/7] Penutup Lahan 2020 — clip ke Purworejo (sumber ~950 MB, sabar)")
    pl = read_dataframe(
        SRC["penutup_lahan"], columns=["PL_2020"], bbox=tuple(aoi_bbox)
    ).to_crs(WGS84)
    pl = gpd.clip(pl, aoi)
    pl = pl[~pl.geometry.is_empty & pl.geometry.notna()]
    pl = pl.rename(columns={"PL_2020": "penutup_lahan"})
    log(f"  {len(pl)} poligon utuh (rata-rata {area_ha(pl).mean():.0f} ha) — dipotong per desa…")
    pl = clip_to_desa(pl)
    log(f"  {len(pl)} potongan, kelas: {sorted(pl['penutup_lahan'].dropna().unique())}")
    write_geojson(pl, "penutup_lahan", SIMPLIFY_COARSE)

    # ------------------------------------------- Layer detail (hanya Desa Bayan)
    log("[4/7] Jalan OSM (EPSG:23835 -> WGS84)")
    jalan = gpd.read_file(SRC["jalan"]).to_crs(WGS84)
    jalan = jalan[["geometry"]].copy()
    # Jalan_AR berupa poligon badan jalan, bukan garis sumbu. Untuk poligon
    # memanjang (lebar << panjang) keliling/2 ~= panjang jalan, jadi dipakai
    # sebagai estimasi panjang — ditandai eksplisit di UI sebagai estimasi.
    jalan_m = jalan.to_crs(METRIC_CRS)
    jalan["panjang_m"] = (jalan_m.geometry.length / 2).round(1)
    jalan["luas_m2"] = jalan_m.geometry.area.round(1)
    jalan = tag_desa(jalan)
    write_geojson(jalan, "jalan", SIMPLIFY_FINE)

    log("[5/7] POI OSM")
    poi = drop_empty_columns(gpd.read_file(SRC["poi"]).to_crs(WGS84))
    poi = tag_desa(poi)
    log(f"  kolom terpakai: {[c for c in poi.columns if c != 'geometry']}")
    write_geojson(poi, "poi", None)

    log("[6/7] Persil (EPSG:23835 -> WGS84)")
    persil = gpd.read_file(SRC["persil"]).to_crs(WGS84)
    persil = persil[["geometry"]].copy()
    persil["luas_m2"] = persil.to_crs(METRIC_CRS).geometry.area.round(1)
    persil = tag_desa(persil)
    write_geojson(persil, "persil", SIMPLIFY_FINE)

    log("[7/7] Penggunaan Lahan OSM")
    pgl = drop_empty_columns(gpd.read_file(SRC["penggunaan_lahan"]).to_crs(WGS84))
    # Layer ini tidak punya kolom `landuse` — isinya praktis footprint bangunan
    # (342 dari 344 poligon building=yes) ditambah segelintir objek lain. Kelas
    # dirakit dari building/amenity/leisure supaya legenda & popup tetap
    # informatif, tanpa mengaku-aku sebagai klasifikasi penggunaan lahan resmi.
    def osm_kategori(row) -> str:
        if pd.notna(row.get("amenity")):
            return str(row["amenity"])
        if pd.notna(row.get("leisure")):
            return str(row["leisure"])
        return "building"

    pgl["kategori"] = pgl.apply(osm_kategori, axis=1)
    pgl["luas_ha"] = area_ha(pgl).round(4)
    pgl = tag_desa(pgl)
    log(f"  kolom terpakai: {[c for c in pgl.columns if c != 'geometry']}")
    log(f"  kategori: {pgl['kategori'].value_counts().to_dict()}")
    write_geojson(pgl, "penggunaan_lahan", SIMPLIFY_FINE)

    # ------------------------------------------------------------------- Statistik
    log("\n[stats] agregasi per desa")

    # Statistik dihitung dari frame yang sama persis dengan yang ditulis ke
    # GeoJSON — bukan lewat overlay terpisah. Sebelumnya peta memakai tag titik
    # perwakilan sementara statistik memakai overlay sendiri; dua logika berbeda
    # itu membuat angka dan gambar bisa bertentangan (Desa Bayan melaporkan 128
    # ha penggunaan lahan padahal petanya kosong). Satu sumber, satu hasil.

    def count_by_desa(gdf: gpd.GeoDataFrame) -> pd.Series:
        """Jumlah fitur per desa, langsung dari tag desa tiap fitur."""
        return gdf.dropna(subset=["desa"]).groupby(["kecamatan", "desa"]).size()

    def sum_by_desa(gdf: gpd.GeoDataFrame, value_col: str, class_col: str | None = None):
        """Jumlahkan nilai per desa (opsional dirinci per kelas)."""
        keys = ["kecamatan", "desa"] + ([class_col] if class_col else [])
        return gdf.dropna(subset=["desa"]).groupby(keys)[value_col].sum()

    poi_count = count_by_desa(poi)
    persil_count = count_by_desa(persil)
    jalan_len = sum_by_desa(jalan, "panjang_m")
    pgl_area = sum_by_desa(pgl, "luas_ha", "kategori")
    hutan_area = sum_by_desa(hutan, "luas_ha", "fungsi_kawasan")
    pl_area = sum_by_desa(pl, "luas_ha", "penutup_lahan")

    def breakdown(series: pd.Series, kec: str, des: str) -> dict[str, float]:
        try:
            sub = series.loc[(kec, des)]
        except KeyError:
            return {}
        return {str(k): round(float(v), 4) for k, v in sub.items() if pd.notna(k) and v > 0}

    records = []
    for row in desa.itertuples():
        kec, des = row.kecamatan, row.desa
        pgl_b = breakdown(pgl_area, kec, des)
        hutan_b = breakdown(hutan_area, kec, des)
        pl_b = breakdown(pl_area, kec, des)
        records.append(
            {
                "kecamatan": kec,
                "desa": des,
                "luas_desa_ha": round(float(row.luas_ha), 2),
                "jumlah_poi": int(poi_count.get((kec, des), 0)),
                "jumlah_persil": int(persil_count.get((kec, des), 0)),
                "panjang_jalan_m": round(float(jalan_len.get((kec, des), 0.0)), 1),
                # Kartu "Luas Penggunaan Lahan" memakai Penutup Lahan 2020 —
                # satu-satunya sumber yang punya kelas penggunaan lahan asli
                # dan menutupi seluruh kabupaten.
                "luas_penggunaan_lahan_ha": round(sum(pl_b.values()), 4),
                "luas_kawasan_hutan_ha": round(sum(hutan_b.values()), 4),
                "luas_bangunan_osm_ha": round(sum(pgl_b.values()), 4),
                "penutup_lahan": pl_b,
                "kawasan_hutan": hutan_b,
                "bangunan_osm": pgl_b,
            }
        )

    stats = {
        "generated_at": date.today().isoformat(),
        "kabupaten": KABUPATEN,
        "sumber": {
            "batas_desa": "PODES — Batas Administrasi",
            "kawasan_hutan": "Kawasan Hutan 2021 (KLHK)",
            "penutup_lahan": "Penutup Lahan 2020 (KLHK)",
            "jalan": "OSM Jalan_AR (poligon badan jalan; panjang = estimasi keliling/2)",
            "poi": "OSM POI",
            "persil": "Persil",
            "bangunan_osm": "OSM Penggunaan Lahan (didominasi footprint bangunan)",
        },
        "desa": records,
    }

    stats_path = os.path.join(OUTPUT_DIR, "stats.json")
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, separators=(",", ":"))
    log(f"  -> stats.json  {len(records)} desa, {os.path.getsize(stats_path) / 1024:,.0f} KB")

    log("\nSelesai.")


if __name__ == "__main__":
    main()
