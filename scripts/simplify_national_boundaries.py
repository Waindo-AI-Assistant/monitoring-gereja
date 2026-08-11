import os
import geopandas as gpd
import pandas as pd
import pyogrio

def simplify_large_file(input_path, output_path, tolerance=0.0015):
    print(f"Membaca info metadata dari {os.path.basename(input_path)}...")
    if not os.path.exists(input_path):
        print(f"ERROR: File {input_path} tidak ditemukan.")
        return False
        
    info = pyogrio.read_info(input_path)
    total_features = info['features']
    print(f"Total fitur: {total_features}")
    
    chunk_size = 5000
    chunks = []
    
    for skip in range(0, total_features, chunk_size):
        print(f"Membaca dan menyederhanakan data ke-{skip} sampai {min(skip + chunk_size, total_features)}...")
        df_chunk = pyogrio.read_dataframe(input_path, skip_features=skip, max_features=chunk_size)
        
        # Ubah ke GeoDataFrame
        gdf_chunk = gpd.GeoDataFrame(df_chunk, crs=info['crs'])
        
        # Lakukan simplifikasi geometri (Douglas-Peucker) untuk mengurangi jumlah vertex/titik
        gdf_chunk['geometry'] = gdf_chunk['geometry'].simplify(tolerance=tolerance, preserve_topology=True)
        
        chunks.append(gdf_chunk)
        
    print("Menggabungkan seluruh hasil simplifikasi menjadi satu berkas...")
    full_df = gpd.GeoDataFrame(pd.concat(chunks, ignore_index=True), crs=info['crs'])
    
    # Pastikan output dalam CRS WGS84 (EPSG:4326) untuk Leaflet
    if full_df.crs != "EPSG:4326":
        print("Mengubah sistem koordinat ke EPSG:4326...")
        full_df = full_df.to_crs("EPSG:4326")
        
    print(f"Menulis berkas yang telah dikompresi ke {output_path}...")
    if os.path.exists(output_path):
        os.remove(output_path)
        
    full_df.to_file(output_path, driver="GeoJSON")
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Selesai! Ukuran berkas baru: {size_mb:.2f} MB")
    return True

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    raw_kab_path = os.path.join(project_root, "public", "data", "Batas_Kabupaten.geojson")
    raw_prov_path = os.path.join(project_root, "public", "data", "Batas_Provinsi.geojson")
    
    out_kab_path = os.path.join(project_root, "public", "data", "Batas_Kabupaten_simplified.geojson")
    out_prov_path = os.path.join(project_root, "public", "data", "Batas_Provinsi_simplified.geojson")
    
    # Toleransi 0.0015 derajat (~150 meter) sangat pas untuk visualisasi nasional yang tajam dan ringan
    print("=== MEMPROSES BATAS KABUPATEN SE-INDONESIA ===")
    simplify_large_file(raw_kab_path, out_kab_path, tolerance=0.0015)
    
    print("\n=== MEMPROSES BATAS PROVINSI SE-INDONESIA ===")
    simplify_large_file(raw_prov_path, out_prov_path, tolerance=0.002)
    
    print("\nSeluruh proses kompresi batas wilayah nasional selesai!")

if __name__ == "__main__":
    main()
