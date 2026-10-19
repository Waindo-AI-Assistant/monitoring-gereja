# Dashboard Geospasial Monitoring Gereja

> Sistem visualisasi data geospasial berbasis web untuk mendukung pemantauan dan analisis sebaran lokasi gereja serta wilayah pelayanan jemaat.

---

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Prasyarat](#prasyarat)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Deploy dengan Docker](#deploy-dengan-docker)
- [Persiapan Data](#persiapan-data)
- [Fitur Dashboard](#fitur-dashboard)
- [Konfigurasi](#konfigurasi)
- [Layer Data](#layer-data)
- [Catatan & Keterbatasan Data](#catatan--keterbatasan-data)
- [Pengembangan Selanjutnya](#pengembangan-selanjutnya)

---

## Gambaran Umum

Aplikasi ini adalah **dashboard geospasial statis** yang menyajikan data wilayah pelayanan gereja (menggunakan basis area Kabupaten Purworejo sebagai wilayah percontohan), meliputi:

- Batas administrasi wilayah dan jemaat (496 jemaat/desa, 16 wilayah/kecamatan)
- Penggunaan/penutup lahan (KLHK 2020)
- Kawasan hutan (KLHK 2021)
- Data detail Desa Bayan: persil tanah, jalan, bangunan, dan POI dari OpenStreetMap

Data disajikan **sepenuhnya dari file statis** di folder `public/data/` — tidak ada backend atau database. File GeoJSON dan statistik digenerate sekali dari shapefile sumber oleh script Python (`scripts/build_data.py`), lalu di-serve langsung oleh Next.js.

```
Landing Page (/)  ──►  Dashboard (/dashboard)
                            │
                   ┌────────┴────────┐
                   │                 │
              Peta Leaflet     Panel Samping
              (MapView)        (Filter, Layer,
                               Kartu, Grafik)
```

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI Library | [React 19](https://react.dev/) |
| Bahasa | TypeScript 5 |
| Peta | [Leaflet 1.9](https://leafletjs.com/) (via dynamic import, SSR off) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + CSS custom |
| Build tool data | Python 3 + GeoPandas, pyogrio, pandas |
| Containerisasi | Docker (multi-stage build) |

---

## Struktur Proyek

```
local-government/
├── app/
│   ├── layout.tsx           # Root layout (font, meta)
│   ├── page.tsx             # Halaman landing (/)
│   ├── globals.css          # Stylesheet global + CSS komponen
│   └── dashboard/
│       ├── layout.tsx       # Layout dashboard
│       └── page.tsx         # Halaman dashboard (/dashboard)
│
├── components/
│   ├── landing/
│   │   └── LandingPage.tsx  # Halaman landing: hero, fitur, footer kontak
│   ├── dashboard/
│   │   ├── DashboardShell.tsx   # Orkestrasi state utama dashboard
│   │   ├── SummaryCards.tsx     # Kartu ringkasan statistik
│   │   ├── FilterBar.tsx        # Dropdown filter tahun/kecamatan/desa
│   │   ├── LayerControl.tsx     # Toggle layer & basemap
│   │   ├── ChartsPanel.tsx      # Grafik komposisi & perbandingan wilayah
│   │   └── SearchBox.tsx        # Pencarian desa/kecamatan di peta
│   ├── map/
│   │   └── MapView.tsx      # Komponen peta Leaflet (SSR disabled)
│   └── ui/
│       └── MapControls.tsx  # Tombol zoom, reset, ukur, koordinat
│
├── config/
│   └── dashboard.ts         # Definisi layer, basemap, palet warna, label atribut
│
├── lib/
│   └── stats.ts             # Tipe data & fungsi agregasi statistik
│
├── scripts/
│   └── build_data.py        # Konversi shapefile → GeoJSON + stats.json
│
├── public/
│   └── data/                # Output script Python (tidak di-commit jika besar)
│       ├── desa.geojson
│       ├── penutup_lahan.geojson
│       ├── kehutanan.geojson
│       ├── persil.geojson
│       ├── jalan.geojson
│       ├── penggunaan_lahan.geojson
│       ├── poi.geojson
│       └── stats.json
│
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Prasyarat

- **Node.js** ≥ 20
- **npm** ≥ 10
- (Opsional, untuk regenerasi data) **Python** ≥ 3.10 dengan paket: `geopandas`, `pandas`, `pyogrio`
- (Opsional, untuk Docker) **Docker** & **Docker Compose**

---

## Menjalankan Secara Lokal

```bash
# 1. Install dependensi
npm install

# 2. Jalankan development server
npm run dev
# → Buka http://localhost:3000
```

> **Catatan:** Pastikan folder `public/data/` sudah berisi file GeoJSON dan `stats.json`.  
> Jika belum ada, jalankan script Python terlebih dahulu (lihat [Persiapan Data](#persiapan-data)).

### Perintah lain

```bash
npm run build   # Build production bundle
npm run start   # Jalankan production server (setelah build)
npm run lint    # Lint kode
```

---

## Deploy dengan Docker

Proyek ini sudah dilengkapi Dockerfile multi-stage dan docker-compose.

```bash
# Build image dan jalankan container
docker compose up --build -d

# Akses di http://localhost:3006
```

Konfigurasi docker-compose:

| Parameter | Nilai |
|---|---|
| Port | `3006:3006` |
| `NODE_ENV` | `production` |
| Restart policy | `unless-stopped` |

Untuk menghentikan:

```bash
docker compose down
```

---

## Persiapan Data

Data GeoJSON dan statistik **tidak ikut di-commit** karena file shapefile sumbernya berada di luar repo. Untuk meregenerasi data:

### 1. Siapkan Data Sumber

Letakkan shapefile sumber di direktori berikut (default: `C:\SEMESTER 4\Magang_Waindo\Local_Government\`):

```
Local_Government/
├── 00_Batas_Desa/         → Batas_Desa_Bayan.shp
├── 01_Data_Jalan_OSM/     → Jalan_AR.shp
├── 02_PODES_Batas_Desa/   → Batas_Administrasi.shp
├── 03_POI_OSM/            → POI_Bayan.shp
├── 05_Persil/             → Persil.shp
├── 06_Kehutanan/          → Kawasan_Hutan-2021.shp
│                          → Penutup_Lahan-2020.shp
└── 07_Penggunaan_Lahan_OSM/ → Penggunaan_Lahan_OSM.shp
```

> Jika lokasi direktori berbeda, ubah variabel `SOURCE_DIR` di `scripts/build_data.py`.

### 2. Install Dependensi Python

```bash
pip install geopandas pandas pyogrio
```

### 3. Jalankan Script

```bash
python scripts/build_data.py
```

Script akan menghasilkan file di `public/data/`:
- `desa.geojson` — Batas 496 desa (PODES, EPSG:4326)
- `penutup_lahan.geojson` — Penggunaan lahan 2020, clip ke Purworejo
- `kehutanan.geojson` — Kawasan hutan 2021, clip ke Purworejo
- `persil.geojson` — Data persil Desa Bayan
- `jalan.geojson` — Jalan OSM Desa Bayan
- `penggunaan_lahan.geojson` — Bangunan OSM Desa Bayan
- `poi.geojson` — POI OSM Desa Bayan
- `stats.json` — Statistik pre-computed per desa

**Proses yang dilakukan script:**
1. Meng-*clip* layer nasional ke extent Kabupaten Purworejo
2. Mereproject dari EPSG:23835 (DGN95 TM-3) → EPSG:4326 (WGS84)
3. Menandai setiap fitur dengan nama kecamatan & desa yang bersangkutan
4. Menghitung luas & panjang di EPSG:32749 (UTM 49S) — bukan di derajat
5. Menyimpan agregat per desa ke `stats.json`

---

## Fitur Dashboard

### Peta Interaktif
- **Basemap** dapat berganti antara **Esri World Imagery** (default, citra satelit) dan **OpenStreetMap** (kartografi/jalan)
- **Toggle layer** — nyala/mati per layer
- **Popup atribut** — klik objek di peta untuk melihat semua atributnya
- **Zoom ke extent kabupaten** (reset view)

### Alat Peta
| Alat | Fungsi |
|---|---|
| Search | Cari nama desa atau kecamatan, peta zoom ke wilayah tersebut |
| Zoom Kotak | Gambar area untuk zoom in |
| Ukur Jarak | Klik titik-titik untuk mengukur jarak |
| Ukur Luas | Gambar poligon untuk mengukur luas area |
| Koordinat | Tampilkan koordinat kursor secara real-time |

### Panel Statistik
- **Kartu Ringkasan** — Jumlah desa, luas penggunaan lahan (ha), panjang jalan (km), jumlah POI, jumlah persil, luas kawasan hutan (ha)
- **Grafik Komposisi** — Breakdown per kelas (misal: kelas penutup lahan, fungsi kawasan hutan) dengan warna sesuai peta
- **Grafik Perbandingan Wilayah** — 10 kecamatan/desa dengan metrik tertinggi

### Filter
| Filter | Keterangan |
|---|---|
| Tahun | Pilih snapshot data aktif (2020 atau 2021) |
| Kecamatan | Persempit ke satu kecamatan |
| Desa | Persempit ke satu desa |

Semua filter bersifat **reaktif** — kartu statistik, grafik, legenda, dan visibilitas layer di peta ikut diperbarui seketika.

> **Filter Tahun** selalu memilih **tepat satu tahun**. Setiap tahun mewakili satu survei berbeda (2020 = Penutup Lahan, 2021 = Kawasan Hutan), sehingga menggabungkan keduanya akan menghasilkan angka yang tidak bermakna.

### Panel Tersembunyi
Tombol di header memungkinkan panel samping disembunyikan agar peta menggunakan lebar layar penuh. Di layar sempit (< 1024px), panel mulai dalam keadaan tertutup.

---

## Konfigurasi

Semua konfigurasi utama ada di [`config/dashboard.ts`](config/dashboard.ts):

| Konstanta / Tipe | Fungsi |
|---|---|
| `BASEMAPS` | Daftar pilihan basemap (OSM, Esri Imagery) |
| `DEFAULT_BASEMAP_ID` | Basemap default saat pertama dibuka |
| `KABUPATEN_EXTENT` | Bounding box Kab. Purworejo untuk reset view |
| `DESA_BAYAN_EXTENT` | Bounding box Desa Bayan untuk layer detail |
| `LAYERS` | Definisi semua layer (id, label, file, warna, visibilitas default, cakupan) |
| `YEARS` | Diturunkan otomatis dari `LAYERS` |
| `PENUTUP_LAHAN_COLORS` | Palet warna kelas penutup lahan |
| `FUNGSI_KAWASAN_COLORS` | Palet warna fungsi kawasan hutan |
| `BANGUNAN_OSM_COLORS` | Palet warna kategori bangunan OSM |
| `ATTRIBUTE_LABELS` | Label ramah pengguna untuk atribut GeoJSON di popup |
| `classColor()` | Fungsi resolusi warna berdasarkan layer & nilai kelas |
| `classLabel()` | Fungsi resolusi label berdasarkan layer & nilai kelas |

### Menambah Layer Baru

1. Tambahkan entry di array `LAYERS` di `config/dashboard.ts`
2. Jika layer memiliki tahun, filter Tahun akan terisi otomatis
3. Jika layer memiliki klasifikasi, tambahkan palet warna & label yang sesuai

### Menambah Tahun Baru

Cukup tambahkan layer baru dengan field `year` diisi. Konstanta `YEARS` digenerate otomatis dari `LAYERS`.

---

## Layer Data

| Layer | Label UI | Sumber | Cakupan | Tahun | Tampil Default |
|---|---|---|---|---|---|
| `desa` | Batas Desa | PODES — Batas Administrasi | 496 desa / 16 kecamatan | — | ✅ |
| `penutup_lahan` | Penggunaan Lahan | Penutup Lahan KLHK | Kabupaten | 2020 | ✅ |
| `kehutanan` | Kehutanan | Kawasan Hutan KLHK | Kabupaten | 2021 | ❌ |
| `persil` | Persil | Data Persil | **Desa Bayan** | — | ❌ |
| `jalan` | Jalan OSM | OSM `Jalan_AR` | **Desa Bayan** | — | ❌ |
| `bangunan_osm` | Bangunan OSM | OSM `Penggunaan_Lahan_OSM` | **Desa Bayan** | — | ❌ |
| `poi` | POI OSM | OSM POI | **Desa Bayan** | — | ❌ |

> ⚠️ Layer bertanda **Desa Bayan** hanya memiliki data untuk desa tersebut. Angka nol di desa lain berarti **data belum tersedia**, bukan tidak ada objeknya.

---

## Catatan & Keterbatasan Data

Berikut adalah sifat data sumber yang bukan bug — sudah ditandai di UI agar tidak menimbulkan salah tafsir:

- **Cakupan tidak seragam.** Layer persil, jalan, bangunan, dan POI hanya tersedia untuk Desa Bayan. Di desa lain nilai statistiknya nol karena *data belum dikumpulkan*.

- **Snapshot, bukan data real-time.** Yang tersedia adalah snapshot tunggal (Penutup Lahan 2020, Kawasan Hutan 2021). Grafik menampilkan komposisi, bukan perubahan antar waktu. Struktur data sudah siap menerima snapshot baru.

- **Panjang jalan adalah estimasi.** `Jalan_AR` menyimpan poligon badan jalan, bukan garis sumbu. Panjang dihitung sebagai keliling/2 dari poligon utuh — akurat untuk poligon memanjang, kasar untuk persimpangan.

- **"Bangunan OSM" adalah layer `Penggunaan_Lahan_OSM`.** Layer ini tidak punya kolom `landuse` (342 dari 344 poligonnya `building=yes`), sehingga disajikan sebagai footprint bangunan.

- **Data 3D belum dipakai.** File `.skp`/`.kmz` dari folder `04_3D` tidak dapat dirender Leaflet. Layer 3D ditunda hingga ada sumber data ketinggian bangunan yang kompatibel.

- **Luas total desa ~108.936 ha** vs referensi BPS ~103.400 ha (selisih ~5%, wajar untuk generalisasi batas PODES).

- **Zoom animasi tidak bisa diuji otomatis.** Leaflet menjadwalkan animasi via `requestAnimationFrame`, yang tidak berjalan di tab browser tersembunyi. Perilaku zoom hanya dapat diverifikasi di browser nyata.

---

## Menjalankan dengan Docker & Database (Prisma ORM)

Aplikasi ini telah dilengkapi dengan konfigurasi **Docker** dan **PostgreSQL (Prisma ORM)**:

### 1. Menjalankan via Docker Compose (Rekomendasi Produksi)
```bash
# Build dan jalankan container Next.js + PostgreSQL di background
docker-compose up -d --build

# Inisialisasi skema database dan seed data 579 gereja
docker-compose exec web npx prisma db push
docker-compose exec web node prisma/seed.js
```
Aplikasi akan aktif di `http://localhost:3000` dan panel admin di `http://localhost:3000/admin`.

#### Login, role, dan hak akses

Dashboard `/dashboard` memerlukan login melalui `/admin`. Pada Next.js 16,
proteksi middleware berada di `proxy.ts`; halaman dan API juga memeriksa akun
serta role terbaru di server.

Pengaturan awal (sebelum diubah oleh superadmin):

| Role | Lihat dashboard | Kelola gereja, pengurus, pengguna |
|---|---|---|
| Superadmin (`superadmin`) | Ya | Ya |
| Biasa (`biasa`) | Ya | Tidak |
| Kepengurusan (`kepengurusan`) | Ya | Tidak |
| Harian Pusat (`harian_pusat`) | Ya | Tidak |

Superadmin memilih role akun melalui menu **Pengguna** dan mengatur izin setiap
role melalui menu **Hak Akses**. Centang izin lalu klik **Simpan Hak Akses**.
Pengaturan disimpan di tabel PostgreSQL `role_permissions` dan tidak direset oleh seed.

- Dashboard: lihat.
- Data gereja: lihat, tambah, edit, hapus.
- Pengurus pusat: lihat dan edit (termasuk mengosongkan nama pejabat).
- Pengguna: lihat, tambah, edit, hapus.

Izin tambah/edit/hapus membutuhkan izin lihat pada fitur yang sama. Panel otomatis
menyesuaikan menu dan tombol saat halaman dimuat ulang; API memeriksa izin terkini
pada setiap request, termasuk session yang masih aktif. Role tanpa izin dashboard
maupun panel diarahkan ke halaman akses ditolak. Halaman publik dan berkas data
publik tetap dapat diakses seperti sebelumnya.

Akses superadmin selalu penuh dan tidak dapat dimatikan. Pengaturan hak akses,
perubahan role akun, dan pengelolaan akun superadmin hanya untuk superadmin.
Jika pembuatan akun didelegasikan ke role lain, akun baru mendapat role `biasa`.
Role lama `admin` diperlakukan sebagai `biasa`.

Seed membuat akun `digitalgpp` dengan password awal `digitalggp` dan role `biasa`.
Jika akun sudah ada, seed memastikan role-nya `biasa` tanpa mereset password.
Akun superadmin yang sudah ada tetap tersedia. Izin role `biasa` mengikuti
pengaturan yang disimpan client; secara default hanya dashboard.

Setelah memperbarui source di laptop atau server:

```bash
docker compose up --build -d
docker compose exec web npx prisma db push
docker compose exec web npx prisma db seed
```

Di container `web`, `DATABASE_URL` harus menunjuk `db:5432`, misalnya
`postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public`.
Port host `POSTGRES_PORT` digunakan untuk koneksi dari luar container.

Jalankan pemeriksaan proteksi akses tanpa mengubah database:

```bash
node --test tests/auth.test.cjs
```

### 2. Menjalankan secara Lokal
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Jalankan server development
npm run dev
```

---

## Pengembangan Selanjutnya

Beberapa fitur yang dapat dikembangkan di iterasi berikutnya:

- [x] **Autentikasi Akun & JWT** — Login & registrasi admin terlindungi dengan JWT RFC 7519
- [x] **Panel Admin Khusus** — Tabel master data gereja dan form edit atribut
- [x] **Integrasi Prisma ORM & Docker** — Database terstruktur siap deploy multi-container
- [ ] **Cloud Media Storage** — Upload foto fisik gereja langsung ke S3/Supabase Storage bucket
- [ ] **Export Data Excel/CSV** — Unduh data jemaat terfilter dalam format spreadsheet

---

## Kontak

**Sekretariat Dashboard Monitoring Gereja**  
Jl. Kramat Pulo no. 22B, Jakarta Pusat 10450  
Telp: 021 2128302 | WA: 081322260088  
Email: sekretariatmajelispusat@gmail.com  

---

*© 2026 Dashboard Monitoring Gereja. Semua Hak Dilindungi.*
