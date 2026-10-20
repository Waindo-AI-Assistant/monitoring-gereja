# Bacaan Sejarah GGP

Koleksi pertama adalah alih media Bab XII buku *Benih yang Tumbuh*, dari PDF
51 halaman yang diberikan pengguna. Nomor cetak sumber adalah 137–187;
nomor dalam nama unggahan bukan nomor cetak buku.

- Data artikel: `benih-yang-tumbuh.json`.
- Aset: `public/history/benih-yang-tumbuh/`.
- Sumber asli disalin tanpa perubahan; `sourceSha256` dapat diperiksa dengan tes.
- Terdapat 16 bacaan: 15 Kongres/Sidang Raya dan Sidang Pelengkap Pusat 1978.
- Terdapat 43 gambar dokumentasi yang diekstrak dari sumber, tanpa membuat foto baru.
- `blocks` menyimpan teks, jenis blok, nomor halaman cetak, dan nomor halaman PDF.
- Narasi, penilaian penulis, variasi ejaan nama, serta susunan pengurus mengikuti
  konteks buku. Jangan menyamakan arsip ini dengan data kepengurusan aktif.
- Pemenggalan baris cetak disambung untuk keterbacaan. Rujukan PDF tetap tersedia
  untuk memeriksa tata letak, foto, atau kata yang ambigu.

## Penambahan dokumen bertahap

Periksa dokumen dan nomor halaman cetaknya sebelum menambah bacaan. Pertahankan
`slug` lama agar tautan dan penanda bacaan terakhir tidak rusak. Tambahkan metadata
sumber dan blok dengan halaman rujukan; jangan mengisi periode kosong berdasarkan
perkiraan. Jika dokumen membahas peristiwa yang sudah ada, cocokkan sumber dan
catat perbedaannya sebelum menggabungkan narasi. Koleksi sumber berikutnya bisa
mengikuti bentuk JSON ini dan didaftarkan di `lib/history.ts`.

Importer `scripts/import-ggp-history.py` khusus untuk potongan Bab XII yang telah
diperiksa, bukan pendeteksi universal semua dokumen. Ia membutuhkan `pdfplumber`
dan `pypdf`; pemisah bab telah dicocokkan dengan judul cetak buku. Jangan memakainya
pada PDF berikutnya tanpa meninjau batas bab dan pemetaan halaman.

```bash
python scripts/import-ggp-history.py /path/to/source.pdf
node --test tests/history.test.cjs
```

Fitur ini tidak memerlukan perubahan skema atau seed database. Halaman `/sejarah`
dan `/sejarah/[slug]` tersedia untuk umum. Menu dashboard tetap memakai proteksi
yang sudah ada. Sumber asli juga tersedia publik sebagai rujukan pembaca.

## Bahasa Indonesia dan Inggris

Tombol ID/EN di navbar mengubah koleksi, daftar bacaan, seluruh 16 artikel,
caption, dan navigasi pembaca. Pilihan bahasa tersimpan di browser. PDF sumber
tetap berbahasa Indonesia; terjemahan Inggris bukan pengganti dokumen asli.

`benih-yang-tumbuh.en.json` adalah data pendamping; teks Indonesia tidak ditimpa.
`scripts/build-history-english.py` menyimpan terjemahan narasi dan glosarium label
pengurus. Setelah sumber Indonesia berubah, periksa ulang terjemahan dan jalankan
script tersebut. Tes memeriksa hash teks sumber, kelengkapan blok, serta rujukan
halaman dan foto agar terjemahan tidak bergeser ke blok sumber yang salah.

Terjemahan Pengurus Pusat disimpan di `content/leadership/en.json`, dengan judul
jabatan mengambil `jabatanEn` bila tersedia. Deskripsi atau bidang khusus yang
diubah client dan belum memiliki padanan tetap menampilkan teks client, agar
tidak memakai terjemahan lama yang sudah tidak sesuai.
