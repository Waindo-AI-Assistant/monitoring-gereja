import os
import geopandas as gpd
import pyogrio

def main():
    gdb_path = "public/data/Foto_Plot.gdb"
    output_dir = "public/data/photos"
    geojson_path = "public/data/poi.geojson"

    # 1. Buat folder output foto jika belum ada
    os.makedirs(output_dir, exist_ok=True)
    print(f"Folder output disiapkan di: {output_dir}")

    # 2. Baca data spasial Geotag
    print("Membaca layer spasial 'Geotag'...")
    gdf = gpd.read_file(gdb_path, layer="Geotag")
    
    # Proyeksikan ke WGS84 (EPSG:4326) untuk Leaflet
    gdf = gdf.to_crs("EPSG:4326")
    
    # 3. Baca tabel lampiran (attachment) biner
    print("Membaca tabel lampiran 'Geotag__ATTACH'...")
    df_att = pyogrio.read_dataframe(gdb_path, layer="Geotag__ATTACH")

    # 4. Ekstrak file gambar biner (BLOB) dan simpan ke disk
    print("Mengekstrak file gambar biner dari Geodatabase...")
    extracted_photos = {}
    for idx, row in df_att.iterrows():
        rel_obj_id = row['REL_OBJECTID']
        att_name = row['ATT_NAME']
        binary_data = row['DATA']
        
        # Bersihkan nama file agar aman digunakan di URL
        clean_name = att_name.replace(" ", "_")
        file_path = os.path.join(output_dir, clean_name)
        
        # Tulis data biner ke file gambar
        try:
            with open(file_path, "wb") as f:
                f.write(binary_data)
            extracted_photos[rel_obj_id] = f"/data/photos/{clean_name}"
        except Exception as e:
            print(f"Gagal menulis file {att_name}: {e}")

    # 5. Petakan foto hasil ekstraksi ke masing-masing objek spasial
    # Catatan: REL_OBJECTID bernilai 1-indexed, sedangkan GeoDataFrame index bernilai 0-indexed.
    # Kita buat pemetaan yang presisi berdasarkan baris.
    print("Menghubungkan titik spasial dengan foto...")
    
    foto_paths = []
    names = []
    
    for idx in range(len(gdf)):
        object_id = idx + 1
        path_url = extracted_photos.get(object_id, "")
        foto_paths.append(path_url)
        
        # Bersihkan nama untuk judul popup (contoh: "Titik 01.jpg" -> "Titik 01")
        raw_name = str(gdf.loc[idx, 'Name'])
        clean_title = os.path.splitext(raw_name)[0]
        names.append(clean_title)

    gdf['name'] = names
    gdf['foto'] = foto_paths
    
    # Tambahkan placeholder foto_pendeta jika nanti ingin dipisah di database
    # Saat ini kita gunakan foto yang sama sebagai perwakilan pendeta/pastor
    gdf['foto_pendeta'] = foto_paths
    gdf['nama_pendeta'] = [f"Pimpinan {name}" for name in names]

    # Hapus kolom 'Path' bawaan yang berisi path lokal E:\... agar GeoJSON bersih
    if 'Path' in gdf.columns:
        gdf = gdf.drop(columns=['Path'])

    # 6. Simpan sebagai GeoJSON
    print(f"Menulis hasil ekspor ke {geojson_path}...")
    if os.path.exists(geojson_path):
        os.remove(geojson_path)
        
    # Simplify atau simpan langsung (karena jumlah titik sedikit, simpan langsung tanpa simplifikasi)
    gdf.to_file(geojson_path, driver="GeoJSON")
    print(f"Ekstraksi selesai! Berhasil mengekstrak {len(gdf)} titik dan foto.")

if __name__ == "__main__":
    main()
