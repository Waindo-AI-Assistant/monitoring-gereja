import os
import json
import geopandas as gpd
import pandas as pd
import pyogrio

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    poi_path = os.path.join(project_root, "public", "data", "poi.geojson")
    batas_desa_path = os.path.join(project_root, "public", "data", "Batas_desa.geojson")
    batas_kab_path = os.path.join(project_root, "public", "data", "Batas_Kabupaten.geojson")
    
    output_poi_path = os.path.join(project_root, "public", "data", "poi.geojson")
    output_desa_active = os.path.join(project_root, "public", "data", "batas_desa_active.geojson")
    output_kab_active = os.path.join(project_root, "public", "data", "batas_kabupaten_active.geojson")
    
    print("Membaca data POI gereja...")
    poi = gpd.read_file(poi_path)
    poi_crs = poi.crs
    
    # ----------------------------------------------------
    # 1. Menjalankan Spatial Join Bertahap (Hemat Memori)
    # ----------------------------------------------------
    print("Membaca info metadata Batas Desa...")
    info_desa = pyogrio.read_info(batas_desa_path)
    total_desa = info_desa['features']
    print(f"Total features Batas Desa: {total_desa}")
    
    # Buat DataFrame kosong untuk menampung hasil pencocokan spasial
    matched_results = []
    
    # Kita baca Batas Desa per chunk 10.000 data agar RAM komputer aman
    chunk_size = 10000
    for skip in range(0, total_desa, chunk_size):
        print(f"Menyaring spasial desa {skip} sampai {min(skip + chunk_size, total_desa)}...")
        chunk = pyogrio.read_dataframe(
            batas_desa_path, 
            skip_features=skip, 
            max_features=chunk_size
        )
        # Ubah ke GeoDataFrame
        gdf_chunk = gpd.GeoDataFrame(chunk, crs=info_desa['crs'])
        
        # Pastikan CRS cocok dengan POI
        if poi.crs != gdf_chunk.crs:
            poi = poi.to_crs(gdf_chunk.crs)
            
        # Lakukan join spasial titik gereja yang masuk ke dalam polygon chunk ini
        joined = gpd.sjoin(poi, gdf_chunk[['geometry', 'NAMOBJ', 'WADMKC', 'WADMKK', 'WADMPR']], how='inner', predicate='intersects')
        
        if len(joined) > 0:
            matched_results.append(joined)
            
    print("Menggabungkan hasil pencocokan spasial...")
    if len(matched_results) > 0:
        full_joined = pd.concat(matched_results)
        # Buang duplikasi index (jika titik pas berada di perbatasan)
        full_joined = full_joined[~full_joined.index.duplicated(keep='first')]
        
        # Petakan kembali ke file POI
        poi['desa'] = poi.index.map(full_joined['NAMOBJ']).fillna('')
        poi['kecamatan'] = poi.index.map(full_joined['WADMKC']).fillna('')
        poi['kabupaten'] = poi.index.map(full_joined['WADMKK']).fillna('')
        poi['provinsi'] = poi.index.map(full_joined['WADMPR']).fillna('')
    else:
        print("PERINGATAN: Tidak ada titik gereja yang masuk dalam batas desa manapun.")
        poi['desa'] = ''
        poi['kecamatan'] = ''
        poi['kabupaten'] = ''
        poi['provinsi'] = ''

    # Kembalikan ke CRS asli (WGS84)
    if poi.crs != poi_crs:
        poi = poi.to_crs(poi_crs)
        
    print("Menulis kembali data POI gereja dengan info wilayah baru...")
    if os.path.exists(output_poi_path):
        os.remove(output_poi_path)
    poi.to_file(output_poi_path, driver="GeoJSON")
    
    # Ambil daftar kabupaten & desa aktif yang memiliki gereja
    unique_kabupatens = set(poi['kabupaten'].unique())
    unique_kabupatens.discard('')
    unique_desas = set(poi['desa'].unique())
    unique_desas.discard('')
    
    print(f"Kabupaten aktif: {len(unique_kabupatens)}, Desa aktif: {len(unique_desas)}")
    
    # ----------------------------------------------------
    # 2. Ekstrak Batas Kabupaten Aktif (Bertahap)
    # ----------------------------------------------------
    print("Membaca info metadata Batas Kabupaten...")
    info_kab = pyogrio.read_info(batas_kab_path)
    total_kab = info_kab['features']
    
    print("Memfilter Batas Kabupaten aktif...")
    kab_chunks = []
    for skip in range(0, total_kab, chunk_size):
        chunk = pyogrio.read_dataframe(batas_kab_path, skip_features=skip, max_features=chunk_size)
        kab_col = 'WADMKK' if 'WADMKK' in chunk.columns else 'NAMOBJ'
        # Ambil hanya yang memiliki gereja
        filtered_chunk = chunk[chunk[kab_col].isin(unique_kabupatens)]
        if len(filtered_chunk) > 0:
            kab_chunks.append(filtered_chunk)
            
    if len(kab_chunks) > 0:
        gdf_kab_active = gpd.GeoDataFrame(pd.concat(kab_chunks, ignore_index=True), crs=info_kab['crs'])
        if gdf_kab_active.crs != "EPSG:4326":
            gdf_kab_active = gdf_kab_active.to_crs("EPSG:4326")
        print(f"Menulis {len(gdf_kab_active)} batas kabupaten ke {output_kab_active}...")
        if os.path.exists(output_kab_active):
            os.remove(output_kab_active)
        gdf_kab_active.to_file(output_kab_active, driver="GeoJSON")
    else:
        print("Batas Kabupaten aktif kosong.")

    # ----------------------------------------------------
    # 3. Ekstrak Batas Desa Aktif (Bertahap)
    # ----------------------------------------------------
    print("Memfilter Batas Desa aktif...")
    desa_chunks = []
    for skip in range(0, total_desa, chunk_size):
        chunk = pyogrio.read_dataframe(batas_desa_path, skip_features=skip, max_features=chunk_size)
        filtered_chunk = chunk[chunk['NAMOBJ'].isin(unique_desas)]
        if len(filtered_chunk) > 0:
            desa_chunks.append(filtered_chunk)
            
    if len(desa_chunks) > 0:
        gdf_desa_active = gpd.GeoDataFrame(pd.concat(desa_chunks, ignore_index=True), crs=info_desa['crs'])
        if gdf_desa_active.crs != "EPSG:4326":
            gdf_desa_active = gdf_desa_active.to_crs("EPSG:4326")
        print(f"Menulis {len(gdf_desa_active)} batas desa ke {output_desa_active}...")
        if os.path.exists(output_desa_active):
            os.remove(output_desa_active)
        gdf_desa_active.to_file(output_desa_active, driver="GeoJSON")
    else:
        print("Batas Desa aktif kosong.")
        
    print("Proses pemotongan batas wilayah aktif selesai dengan aman!")

if __name__ == "__main__":
    main()
