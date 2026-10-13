# ⛪ Ringkasan Proyek: Monitoring Geospasial Gereja Gerakan Pentakosta (GGP)

> **Sistem Informasi Geospasial Pemetaan & Monitoring Sebaran Gereja Berbasis Web**  
> Disusun oleh: **Department Digitalisasi GGP** bersama **PT Waindo Specterra / Terramitra**  
> Terakhir Diperbarui: **Oktober 2026**

---

## 📌 1. Pendahuluan & Latar Belakang

Sistem Monitoring Geospasial GGP adalah aplikasi berbasis web modern yang dikembangkan untuk memetakan, mengelola, menganalisis, dan memonitor seluruh sebaran aset gereja lokal, majelis daerah, majelis wilayah, serta data pendukung jemaat Gereja Gerakan Pentakosta di seluruh Indonesia.

### Tujuan Utama:
1. **Sentralisasi Data Wilayah**: Mengintegrasikan batas gerejawi (Majelis Daerah / MADA & Majelis Wilayah / MAWIL) dengan batas administrasi nasional (Provinsi, Kabupaten, Desa).
2. **Monitoring Digital Real-Time**: Memberikan visualisasi sebaran jemaat, status kepemilikan tanah/bangunan gereja, fasilitas pelayanan, dan data gembala jemaat/pendeta.
3. **Analisis Spasial & Navigasi**: Menyediakan alat ukur jarak/luas wilayah dan rute navigasi menuju gereja lokal.
4. **Manajemen Data Mandiri**: Portal administrasi untuk pembaruan data secara aman, sinkronisasi GeoJSON otomatis, dan manajemen pengguna.
5. **Dukungan Multi-Bahasa**: Memfasilitasi akses nasional maupun internasional dengan dukungan Bahasa Indonesia (ID) dan English (EN).

---

## 🏗️ 2. Arsitektur & Teknologi (Tech Stack)

```mermaid
graph TD
    User["Pengguna / Jemaat / Pimpinan"] -->|Browser| NextFrontend["Next.js 16 (React 19 / Turbopack)"]
    Admin["Admin Pengelola"] -->|Browser| AdminPanel["Admin Management (/admin)"]
    
    subgraph Frontend["Frontend & Web Mapping Layer"]
        NextFrontend --> LandingPage["Landing Page (/)"]
        NextFrontend --> MapDashboard["Interactive Dashboard (/dashboard)"]
        MapDashboard --> Leaflet["Leaflet 1.9 & React-Leaflet"]
        MapDashboard --> GeoJSONVT["GeoJSON Vector Tiling (geojson-vt)"]
        NextFrontend --> I18N["i18next / react-i18next (ID / EN)"]
    end
    
    subgraph Backend["API & Server Layer (Next.js App Router)"]
        AdminPanel --> APIRoutes["Next.js Route Handlers (/api/*)"]
        APIRoutes --> AuthSys["JWT Cookie Auth & Password Hashing"]
        APIRoutes --> UploadHandler["Local File Storage / Media Handler"]
        APIRoutes --> PrismaORM["Prisma ORM 6"]
    end
    
    subgraph DataStore["Data Storage & Geo Data"]
        PrismaORM --> PostgresDB[("PostgreSQL Database")]
        APIRoutes --> GeoJSONStatic["public/data/poi.geojson & Boundary Layers"]
        UploadHandler --> UploadsDir["public/uploads/ (Foto Gereja & Pendeta)"]
    end
```

### Rincian Teknologi:
| Komponen | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Framework Web** | Next.js 16.2.9 (App Router) | Mendukung SSR, ISR, dan Route Handlers berkecepatan tinggi dengan Turbopack |
| **UI Library** | React 19.2.4 | Pustaka rendering komponen antarmuka modern |
| **Bahasa Pemrograman** | TypeScript 5 | Type-safety penuh pada komponen, API, dan skema spasial |
| **Styling** | Tailwind CSS v4 & Vanilla CSS | Desain responsif, mobile-first, dan safe-area insets |
| **Engine Peta** | Leaflet 1.9.4 & `geojson-vt` | Rendering interaktif layer spasial titik, garis, dan poligon kompleks |
| **Multi-Language** | `i18next` 26 & `react-i18next` 17 | Alih bahasa instan (ID 🇮🇩 / EN 🇬🇧) dengan persistensi `localStorage` |
| **Database & ORM** | PostgreSQL & Prisma ORM 6.19 | Penyimpanan relasional terstruktur untuk entitas pengguna dan gereja |
| **Autentikasi** | Custom JWT + Crypto Salt/Hash | Pengamanan sesi login berbasis HTTP-only Cookie tanpa library pihak ketiga |

---

## 🗂️ 3. Struktur Direktori Proyek

```plaintext
monitoring-local-gereja/
├── app/
│   ├── admin/               # Portal dashboard admin (CRUD data gereja & user)
│   ├── api/                 # Endpoint REST API Next.js Route Handlers
│   │   ├── admin/churches/  # CRUD data gereja (GET, POST, PUT, DELETE)
│   │   ├── admin/users/     # Manajemen akun admin
│   │   ├── auth/            # Login, logout, me, session check
│   │   ├── health/          # Health check endpoint database & server
│   │   ├── poi/update/      # Sinkronisasi atribut spasial POI
│   │   └── upload/          # Upload foto gereja & pendeta
│   ├── dashboard/           # Halaman utama peta interaktif GIS
│   ├── globals.css          # Styling global, animasi glow, dan gradasi langit
│   ├── layout.tsx           # Root layout HTML & metadata sistem
│   └── page.tsx             # Halaman utama (Landing Page)
├── components/
│   ├── dashboard/           # Komponen dashboard GIS
│   │   ├── DashboardShell.tsx  # Kontainer utama dashboard & state peta
│   │   ├── EditChurchModal.tsx # Modal edit data gereja interaktif
│   │   ├── FilterBar.tsx       # Filter bertingkat MADA / MAWIL / Tipe
│   │   ├── LayerControl.tsx    # Pengendali layer peta & basemap
│   │   ├── RouteInfoCard.tsx   # Panel navigasi rute dan jarak tempuh
│   │   ├── SearchBox.tsx       # Pencarian nama gereja dengan auto-zoom
│   │   └── SummaryCards.tsx    # Ringkasan KPI dan statistik dinamis
│   ├── landing/             # Komponen landing page
│   │   └── LandingPage.tsx     # Hero banner, fitur, counter, dan footer
│   ├── map/                 # Modul engine Leaflet
│   │   ├── CoordinatePickerModal.tsx # Picker koordinat titik di peta
│   │   └── MapView.tsx         # Render peta Leaflet, pop-up, cluster, dan vector tile
│   └── ui/                  # Komponen UI umum
│       ├── ImageUploadInput.tsx# Input upload gambar drag-and-drop
│       ├── LanguageSwitcher.tsx# Tombol toggle bahasa (ID / EN)
│       └── MapControls.tsx     # Tombol zoom, locate me, dan ukur jarak
├── lib/
│   ├── auth.ts              # Utilitas autentikasi JWT, hash, dan salt
│   ├── export.ts            # Ekspor data gereja ke format CSV & GeoJSON
│   ├── i18n.ts              # Konfigurasi kamus penerjemahan Bahasa ID & EN
│   ├── prisma.ts            # Client singleton Prisma Database
│   ├── routing.ts           # Algoritma perhitungan rute & OSRM integration
│   └── stats.ts             # Kalkulasi statistik MADA, MAWIL, dan Gereja
├── prisma/
│   ├── schema.prisma        # Definisi skema database PostgreSQL
│   └── seed.js              # Script inisialisasi akun admin awal
└── public/
    ├── data/                # Dataset GeoJSON (Batas Desa, Kab, Prov, POI)
    ├── images/              # Logo resmi GGP, preview map, dan ikon
    └── uploads/             # Direktori penyimpanan file gambar upload
```

---

## 🗺️ 4. Hierarki Struktur Data Gerejawi (GGP)

Sistem mengadopsi hierarki organisasi struktural GGP:

```mermaid
graph TD
    MP["Majelis Pusat (MP)"] --> MADA["Majelis Daerah (MADA)"]
    MADA --> MAWIL["Majelis Wilayah (MAWIL)"]
    MAWIL --> GEREJA["Gereja Lokal / Pos PI / Jemaat"]
    
    subgraph WilayahKhusus["Kategori Khusus"]
        MADA -.-> W_Khusus["Wilayah Khusus (Luar Negeri / Misi Mandiri)"]
        W_Khusus -.-> G_Khusus["Gereja Wilayah Khusus"]
    end
```

* **Majelis Daerah (MADA)**: Membawahi beberapa wilayah administratif gerejawi (tercatat 20 MADA).
* **Majelis Wilayah (MAWIL)**: Unit wilayah di bawah naungan MADA (tercatat 63 MAWIL).
* **Gereja / Jemaat**: Unit titik lokasi fisik tempat ibadah dan pelayanan (570+ gereja terdata).
* **Tipe Wilayah**:
  * *Wilayah Biasa*: Gereja yang beroperasi di dalam naungan reguler MADA & MAWIL.
  * *Wilayah Khusus*: Melayani jemaat di daerah misi khusus, daerah perbatasan, atau cabang luar negeri.

---

## 🚀 5. Fitur-Fitur Utama Aplikasi

### A. Landing Page (`/`)
1. **Desain Atmosferik Langit**: Mengusung gradasi **Biru Muda Langit** (`#f0f9ff` ➔ `#bae6fd`) dipadukan ornamen halus *obsidian black* dan *warm gold*.
2. **Statistik Real-time**: Menampilkan jumlah MADA, MAWIL, dan Gereja yang dihitung secara dinamis dari GeoJSON aktif.
3. **Multi-Language Switcher**: Toggle kompak (`🌐 ID` / `🌐 EN`) terintegrasi langsung di navbar.
4. **Legal & Copyright**: Pengesahan resmi `© 2026 PENTAKOSTA • Department Digitalisasi GGP`.

### B. Dashboard Pemetaan Geospasial (`/dashboard`)
1. **Multi-Basemap Switching**: Pilihan peta dasar (OpenStreetMap Carto, Satelit Google/Esri, Topografis, dan Dark Canvas).
2. **Multi-Layer Geospasial**:
   - Batas Wilayah Administrasi (Provinsi, Kabupaten, Desa).
   - Layer Point of Interest (POI) sebaran gereja dengan clustering dinamis.
3. **Filter Geospasial Bertingkat**:
   - Filter berdasarkan MADA.
   - Filter berdasarkan MAWIL (otomatis menyesuaikan pilihan MADA).
   - Filter berdasarkan Status Kepemilikan (Milik Sendiri, Sewa, Pinjam, Nomaden).
4. **Pencarian Cepat & Auto-Pan**: Mencari nama gereja atau nama pendeta dengan efek *fly-to* halus ke koordinat target.
5. **Tool Analisis & Pengukuran Spasial**:
   - Pengukur Jarak (*Polyline Distance Measurement*).
   - Pengukur Luas Wilayah (*Polygon Area Measurement*).
   - Navigasi & Routing: Panduan rute dari titik pengguna / titik awal menuju lokasi gereja.
6. **Panel Detail & Galeri Multi-Foto**:
   - Informasi detail nama pendeta, kontak WhatsApp, jadwal ibadah, kapasitas jemaat, dan alamat lengkap.
   - Carousel foto bangunan gereja dan foto pendeta dengan modal layar penuh.
7. **Responsivitas Mobile Penuh**:
   - Drawer geser di mobile (*bottom sheet*), kontrol sentuh ergonomis, dan optimasi area aman (*safe-area insets*).

### C. Portal Administrasi (`/admin`)
1. **Autentikasi Aman**: Login berbasis sesi aman JWT dengan proteksi CSRF & Cookie.
2. **Manajemen Data Gereja (CRUD)**:
   - Tambah gereja baru dengan penentu koordinat interaktif (*Coordinate Picker Map*).
   - Ubah status, data pendeta, nomor kontak, jadwal, foto gereja, dan foto pendeta.
   - Upload banyak foto gereja langsung ke server lokal.
3. **Sinkronisasi Dua Arah**: Setiap pembaruan di database otomatis menyelaraskan berkas `public/data/poi.geojson` agar peta publik tetap cepat tanpa membebani database.
4. **Ekspor Data**: Download data seluruh sebaran gereja dalam format file **CSV** atau **GeoJSON**.

---

## 💾 6. Skema Database (Prisma ORM)

```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  username     String   @unique
  passwordHash String
  salt         String
  role         String   @default("admin")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}

model Church {
  id              String   @id @default(cuid())
  fid             Int?     @unique
  name            String
  namaPendeta     String?  @map("nama_pendeta")
  noHpWa          String?  @map("no_hp_wa")
  alamatGereja    String?  @map("alamat_gereja")
  tahunBerdiri    String?  @map("tahun_berdiri")
  jumlahJemaat    String?  @map("jumlah_jemaat")
  jamOperasional  String?  @map("jam_operasional")
  status          String?  @default("Milik Sendiri") // Milik Sendiri, Pinjam, Sewa, Nomaden
  mawil           String?  // Majelis Wilayah
  kodeMada        String?  @map("kode_mada")
  namaMada        String?  @map("nama_mada")
  tipeWilayah     String?  @default("Wilayah Biasa") @map("tipe_wilayah")
  wilayahKhusus   String?  @map("wilayah_khusus")
  daerahKhusus    String?  @map("daerah_khusus")
  no              Int?
  x               Float?   @default(0) // Longitude
  y               Float?   @default(0) // Latitude
  foto            String?
  foto2           String?  @map("foto_2")
  fotoPendeta     String?  @map("foto_pendeta")
  photos          String?  @default("[]") // JSON serialized array of photo URLs
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("churches")
}
```

---

## ⚙️ 7. Panduan Menjalankan & Deployment

### Persyaratan Sistem:
* Node.js versi 18.x atau 20.x ke atas.
* PostgreSQL Database (Lokal / Neon / Supabase).

### Langkah Instalasi:
```bash
# 1. Clone repositori
git clone <url-repo>
cd monitoring-local-gereja

# 2. Instal dependensi
npm install

# 3. Konfigurasi Environment Variable (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/monitoring_gereja?schema=public"
JWT_SECRET="kunci_rahasia_jwt_sangat_aman"

# 4. Sinkronisasi Database Prisma
npx prisma generate
npx prisma db push
node prisma/seed.js

# 5. Jalankan Development Server
npm run dev
```

### Build Produksi:
```bash
npm run build
npm run start
```

---

## 📈 8. Rencana Pengembangan Mendatang (Roadmap)
1. **Analisis Kepadatan Spasial (Heatmap)**: Visualisasi konsentrasi jemaat untuk perencanaan pembukaan pos PI baru.
2. **Integrasi WhatsApp Gateway**: Notifikasi otomatis jadwal ibadah dan pembaruan data jemaat.
3. **Offline PWA Support**: Kemampuan petugas lapangan melihat data gereja di wilayah pedalaman tanpa jaringan internet.
4. **Manajemen Aset Detail**: Inventarisasi fasilitas gedung gereja (kapasitas parkir, aula, ruang serbaguna).

---
*Dokumen ini merupakan ringkasan resmi sistem geospasial Monitoring Gereja Gerakan Pentakosta (GGP).*
