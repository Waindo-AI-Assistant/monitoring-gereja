import os
import geopandas as gpd
import pyogrio

def main():
    # Gunakan path absolut relatif terhadap lokasi script ini (extract_gdb.py)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    gdb_path = os.path.join(project_root, "public", "data", "Data_Gereja.gdb")
    output_dir = os.path.join(project_root, "public", "data", "photos")
    geojson_path = os.path.join(project_root, "public", "data", "poi.geojson")

    # 1. Buat folder output foto jika belum ada
    os.makedirs(output_dir, exist_ok=True)
    print(f"Folder output disiapkan di: {output_dir}")

    # 2. Baca data spasial Gereja
    print("Membaca layer spasial 'Gereja'...")
    gdf = None
    use_existing_geojson = False
    
    try:
        # Gunakan fid_as_index=True agar indeks baris sesuai dengan FID/OBJECTID asli di GDB
        gdf = gpd.read_file(gdb_path, layer="Gereja", fid_as_index=True)
        print(f"Berhasil membaca {len(gdf)} titik dari layer 'Gereja'.")
    except Exception as e:
        print(f"Peringatan: Layer 'Gereja' tidak dapat dibuka ({e}).")
        print(f"Mencoba membaca data spasial dari {geojson_path}...")
        if os.path.exists(geojson_path):
            gdf = gpd.read_file(geojson_path)
            # Set index ke 'fid' agar mapping REL_OBJECTID -> fid berjalan lancar
            if 'fid' in gdf.columns:
                gdf = gdf.set_index('fid')
            use_existing_geojson = True
            print(f"Berhasil memuat {len(gdf)} titik dari {geojson_path}.")
        else:
            print(f"ERROR: Layer 'Gereja' tidak ditemukan di GDB dan berkas cadangan {geojson_path} juga tidak ada.")
            return

    # Proyeksikan ke WGS84 (EPSG:4326) untuk Leaflet jika belum
    if gdf.crs != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")
    
    # 3. Baca tabel lampiran (attachment) biner
    print("Membaca tabel lampiran 'Gereja__ATTACH'...")
    df_att = pyogrio.read_dataframe(gdb_path, layer="Gereja__ATTACH")

    # 4. Ekstrak file gambar biner (BLOB) dan simpan ke disk, kelompokkan berdasarkan REL_OBJECTID
    print("Mengekstrak file gambar biner dari Geodatabase...")
    attachments_by_id = {}
    for idx, row in df_att.iterrows():
        rel_obj_id = int(row['REL_OBJECTID'])
        att_name = row['ATT_NAME']
        binary_data = row['DATA']
        
        # Bersihkan nama file agar aman digunakan di URL
        clean_name = att_name.replace(" ", "_")
        file_path = os.path.join(output_dir, clean_name)
        
        # Tulis data biner ke file gambar
        try:
            with open(file_path, "wb") as f:
                f.write(binary_data)
            
            if rel_obj_id not in attachments_by_id:
                attachments_by_id[rel_obj_id] = []
            attachments_by_id[rel_obj_id].append(f"/data/photos/{clean_name}")
        except Exception as e:
            print(f"Gagal menulis file {att_name}: {e}")

    # 5. Petakan atribut baru dan foto hasil ekstraksi ke masing-masing objek spasial
    print("Menghubungkan titik spasial dengan foto & memetakan kolom atribut...")
    
    if use_existing_geojson:
        # Jika menggunakan GeoJSON cadangan, cukup perbarui kolom foto, foto_2, photos, dan foto_pendeta
        foto_paths = []
        foto_2_paths = []
        photos_list = []
        foto_pendeta_paths = []
        for fid in gdf.index:
            paths = attachments_by_id.get(int(fid), [])
            foto_paths.append(paths[0] if len(paths) > 0 else "")
            foto_2_paths.append(paths[1] if len(paths) > 1 else "")
            photos_list.append(paths)
            foto_pendeta_paths.append("")  # Selalu kosong karena tidak ada foto pendeta di GDB
            
        gdf['foto'] = foto_paths
        gdf['foto_2'] = foto_2_paths
        gdf['photos'] = photos_list
        gdf['foto_pendeta'] = foto_pendeta_paths

        if 'no' not in gdf.columns:
            gdf['no'] = None
        if 'x' not in gdf.columns:
            gdf['x'] = None
        if 'y' not in gdf.columns:
            gdf['y'] = None
            
        # Kembalikan kolom fid dari index
        gdf = gdf.reset_index()
        if 'index' in gdf.columns:
            gdf = gdf.rename(columns={'index': 'fid'})
    else:
        names = []
        nama_pendeta_list = []
        no_hp_wa_list = []
        alamat_gereja_list = []
        tahun_berdiri_list = []
        jumlah_jemaat_list = []
        jam_operasional_list = []
        status_list = []
        mawil_list = []
        kode_mada_list = []
        nama_mada_list = []
        no_list = []
        x_list = []
        y_list = []
        
        foto_paths = []
        foto_2_paths = []
        photos_list = []
        foto_pendeta_paths = []
        
        # Loop menggunakan indeks FID asli
        for fid in gdf.index:
            # Pemetaan Foto
            paths = attachments_by_id.get(int(fid), [])
            foto_paths.append(paths[0] if len(paths) > 0 else "")
            foto_2_paths.append(paths[1] if len(paths) > 1 else "")
            photos_list.append(paths)
            foto_pendeta_paths.append("")  # Selalu kosong karena tidak ada foto pendeta di GDB
                
            # Pemetaan Atribut Geodatabase
            names.append(str(gdf.loc[fid, 'NAMA_JEMAA']) if 'NAMA_JEMAA' in gdf.columns else "")
            nama_pendeta_list.append(str(gdf.loc[fid, 'NAMA_GEMBA']) if 'NAMA_GEMBA' in gdf.columns else "")
            no_hp_wa_list.append(str(gdf.loc[fid, 'NO_HP_WA_G']) if 'NO_HP_WA_G' in gdf.columns else "")
            alamat_gereja_list.append(str(gdf.loc[fid, 'ALAMAT_GER']) if 'ALAMAT_GER' in gdf.columns else "")
            
            # Pengecekan tipe data / kosong untuk kolom angka/nilai lain
            tahun_berdiri_list.append(gdf.loc[fid, 'Tahun_Berd'] if 'Tahun_Berd' in gdf.columns else None)
            jumlah_jemaat_list.append(gdf.loc[fid, 'Jumlah_Jem'] if 'Jumlah_Jem' in gdf.columns else None)
            jam_operasional_list.append(str(gdf.loc[fid, 'Jam_Operas']) if 'Jam_Operas' in gdf.columns else "")
            status_list.append(str(gdf.loc[fid, 'Status']) if 'Status' in gdf.columns else "")
            mawil_list.append(str(gdf.loc[fid, 'MAWIL']) if 'MAWIL' in gdf.columns else "")
            kode_mada_list.append(str(gdf.loc[fid, 'K_MADA']) if 'K_MADA' in gdf.columns else "")
            nama_mada_list.append(str(gdf.loc[fid, 'NAMA_MADA']) if 'NAMA_MADA' in gdf.columns else "")
            
            # Atribut tambahan NO, X, dan Y
            no_list.append(int(gdf.loc[fid, 'NO']) if 'NO' in gdf.columns and gdf.loc[fid, 'NO'] is not None else None)
            x_list.append(float(gdf.loc[fid, 'X']) if 'X' in gdf.columns and gdf.loc[fid, 'X'] is not None else None)
            y_list.append(float(gdf.loc[fid, 'Y']) if 'Y' in gdf.columns and gdf.loc[fid, 'Y'] is not None else None)

        # Masukkan kolom bersih ke GeoDataFrame
        gdf['name'] = names
        gdf['nama_pendeta'] = nama_pendeta_list
        gdf['no_hp_wa'] = no_hp_wa_list
        gdf['alamat_gereja'] = alamat_gereja_list
        gdf['tahun_berdiri'] = tahun_berdiri_list
        gdf['jumlah_jemaat'] = jumlah_jemaat_list
        gdf['jam_operasional'] = jam_operasional_list
        gdf['status'] = status_list
        gdf['mawil'] = mawil_list
        gdf['kode_mada'] = kode_mada_list
        gdf['nama_mada'] = nama_mada_list
        gdf['no'] = no_list
        gdf['x'] = x_list
        gdf['y'] = y_list
        
        gdf['foto'] = foto_paths
        gdf['foto_2'] = foto_2_paths
        gdf['photos'] = photos_list
        gdf['foto_pendeta'] = foto_pendeta_paths

        # Buang seluruh kolom mentah yang lama agar berkas GeoJSON tidak terlalu besar
        old_columns = [
            'ID', 'NAMA_MADA', 'MAWIL', 'K_MADA', 'NO', 'KODE', 'NAMA_JEMAA', 
            'NAMA_GEMBA', 'NO_HP_WA_G', 'ALAMAT_GER', 'Y', 'X', 'Tahun_Berd', 
            'Jumlah_Jem', 'Jam_Operas', 'Status', 'Path', 'Name', 'DateTime', 'Direction'
        ]
        for col in old_columns:
            if col in gdf.columns:
                gdf = gdf.drop(columns=[col])

        # Kembalikan kolom fid dari index
        gdf = gdf.reset_index()
        if 'index' in gdf.columns:
            gdf = gdf.rename(columns={'index': 'fid'})

    # 6. Simpan sebagai GeoJSON
    print(f"Menulis hasil ekspor ke {geojson_path}...")
    if os.path.exists(geojson_path):
        os.remove(geojson_path)
        
    gdf.to_file(geojson_path, driver="GeoJSON")
    print(f"Ekstraksi selesai! Berhasil mengekstrak {len(gdf)} titik dan foto.")

if __name__ == "__main__":
    main()
