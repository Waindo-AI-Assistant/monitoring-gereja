export const HISTORY_ENGLISH: Record<string, string> = {
  "RUANG BACA · SEJARAH GGP": "READING ROOM · GGP HISTORY",
  "Benih yang": "Seeds that",
  "terus bertumbuh.": "keep growing.",
  "Menelusuri perjalanan organisasi, pelayanan, dan orang-orang yang mengambil bagian dalam sejarah Gereja Gerakan Pentakosta.": "Explore the organization, ministry, and people who shaped the history of Gereja Gerakan Pentakosta.",
  "Mulai membaca": "Start reading", "Lihat daftar bacaan ↓": "Browse the reading list ↓",
  "Rentang kisah dalam sumber": "Period covered by the source", "bacaan": "readings", "Kongres & Sidang Raya": "Congresses & General Assemblies",
  "Foto bersama peserta Sidang Raya VI tahun 1980 dalam buku Benih yang Tumbuh": "Participants at General Assembly VI in 1980, from Benih yang Tumbuh",
  "ARSIP DOKUMENTASI": "DOCUMENTARY ARCHIVE", "Peserta Sidang Raya VI, 1980": "General Assembly VI participants, 1980",
  "Benih yang Tumbuh · Halaman 149": "Benih yang Tumbuh · Page 149", "Tentang koleksi": "About the collection",
  "KOLEKSI PERTAMA · BENIH YANG TUMBUH": "FIRST COLLECTION · BENIH YANG TUMBUH",
  "Perjalanan Organisasi GGP dari Sidang Raya ke Sidang Raya": "GGP's Organizational Journey from One General Assembly to the Next",
  "Alih media Bab XII, halaman 137–187. Koleksi ini berisi narasi, susunan pengurus, serta dokumentasi dari buku sumber dan dapat dilengkapi dengan dokumen sejarah berikutnya.": "A digital edition of Chapter XII, pages 137–187. This collection brings together narratives, leadership rosters, and documentation from the source book, with room for further historical documents.",
  "Buka buku sumber ↗": "Open source book (Indonesian) ↗", "Terakhir dibuka": "Last opened", "Lanjut membaca": "Continue reading",
  "DAFTAR BACAAN": "READING LIST", "Dari satu masa ke masa berikutnya.": "From one era to the next.",
  "Ikuti urutan perjalanan, atau pilih periode yang ingin Anda baca.": "Follow the journey in order, or choose a period to read.",
  "Cari bacaan": "Search readings", "Tahun, Sidang Raya, atau tempat…": "Year, General Assembly, or location…",
  "Pilih dasawarsa": "Choose a decade", "Semua periode": "All periods", "BACAAN": "READING", "menit baca": "min read", "Hal.": "pp.",
  "Bacaan belum ditemukan": "No readings found", "Coba kata kunci atau periode lain.": "Try another keyword or period.", "Tampilkan semua bacaan": "Show all readings",
  "Daftar bacaan": "Reading list", "← Semua bacaan": "← All readings", "PERJALANAN ORGANISASI": "ORGANIZATIONAL JOURNEY",
  "Bab XII · Hal. 137–187": "Chapter XII · pp. 137–187", "← Daftar bacaan": "← Reading list",
  "Ukuran teks bacaan": "Reading text size", "Ukuran teks standar": "Standard text size", "Ukuran teks besar": "Large text size", "besar": "large",
  "Kemajuan bacaan": "Reading progress", "Pilih bacaan": "Choose a reading", "Halaman buku": "Book pages", "Buka sumber PDF ↗": "Open source PDF (Indonesian) ↗",
  "Dari buku Benih yang Tumbuh.": "From the book Benih yang Tumbuh.",
  "Narasi, ejaan nama, dan penilaian dalam bacaan mengikuti buku sumber. Dokumentasi dan susunan pengurus merekam konteks periode masing-masing.": "This English translation follows the source book's narrative, name spellings, and assessments. Photographs and leadership rosters reflect their historical periods. The original Indonesian PDF remains available for reference.",
  "SUMBER BACAAN": "READING SOURCE", "Bab XII: Perjalanan Organisasi GGP dari Sidang Raya ke Sidang Raya, halaman": "Chapter XII: GGP's Organizational Journey from One General Assembly to the Next, pages",
  "Baca halaman sumber ↗": "Read source page (Indonesian) ↗", "Lihat halaman asli ↗": "View original page (Indonesian) ↗", "Buka foto dokumentasi halaman": "Open documentary photograph from page",
  "Bacaan sebelum dan sesudah": "Previous and next readings", "← Bacaan sebelumnya": "← Previous reading", "← Kembali": "← Back", "Semua bacaan": "All readings", "Bacaan berikutnya →": "Next reading →", "Selesai membaca": "Reading complete", "Kembali ke daftar bacaan →": "Back to reading list →",
  "Merawat ingatan. Meneruskan pelayanan.": "Preserving memories. Continuing the ministry.",
};

export function historyText(text: string, isEn: boolean) {
  return isEn ? HISTORY_ENGLISH[text] ?? text : text;
}
