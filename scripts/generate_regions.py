import os
import json
import geopandas as gpd

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    batas_desa_path = os.path.join(project_root, "public", "data", "Batas_desa.geojson")
    batas_kab_path = os.path.join(project_root, "public", "data", "Batas_Kabupaten.geojson")
    output_hierarchy_path = os.path.join(project_root, "public", "data", "regions_hierarchy.json")
    
    print("Membaca data Batas Kabupaten untuk list kabupaten se-Indonesia...")
    if not os.path.exists(batas_kab_path):
        print(f"ERROR: File {batas_kab_path} tidak ditemukan.")
        return
        
    df_kab = gpd.read_file(batas_kab_path)
    kab_col = 'WADMKK' if 'WADMKK' in df_kab.columns else 'NAMOBJ'
    all_kabupatens = sorted(df_kab[kab_col].dropna().unique().tolist())
    
    print(f"Berhasil membaca {len(all_kabupatens)} kabupaten.")
    
    print("Membaca data Batas Desa untuk menyusun hierarki Kabupaten -> Desa...")
    if not os.path.exists(batas_desa_path):
        print(f"ERROR: File {batas_desa_path} tidak ditemukan.")
        return
        
    # Hanya baca kolom yang dibutuhkan untuk hemat memori
    df_desa = gpd.read_file(batas_desa_path)
    
    print("Menyusun hierarki Kabupaten -> Desa di memori...")
    hierarchy = {}
    
    # Inisialisasi semua kabupaten dengan list kosong agar semua kabupaten masuk di JSON
    for kab in all_kabupatens:
        hierarchy[kab] = []
        
    for idx, row in df_desa.iterrows():
        kab = row.get('WADMKK') or row.get('WADMKK') # fallback
        desa = row.get('NAMOBJ') or row.get('WADMKD')
        
        if kab and desa:
            kab_str = str(kab).strip()
            desa_str = str(desa).strip()
            if kab_str not in hierarchy:
                hierarchy[kab_str] = []
            hierarchy[kab_str].append(desa_str)
            
    print("Mengurutkan nama desa dan menghapus duplikat...")
    for kab in hierarchy:
        hierarchy[kab] = sorted(list(set(hierarchy[kab])))
        
    print(f"Menulis hierarki wilayah ke {output_hierarchy_path}...")
    if os.path.exists(output_hierarchy_path):
        os.remove(output_hierarchy_path)
        
    with open(output_hierarchy_path, 'w', encoding='utf-8') as f:
        json.dump(hierarchy, f, ensure_ascii=False, indent=2)
        
    print("Proses penyusunan hierarki selesai! Berhasil menyimpan data wilayah se-Indonesia.")

if __name__ == "__main__":
    main()
