import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HistoryLibrary from "@/components/history/HistoryLibrary";
import { historySource, historySummaries } from "@/lib/history";

export const metadata: Metadata = { title: "Sejarah GGP | Benih yang Tumbuh", description: "Bacaan perjalanan organisasi GGP dari Kongres dan Sidang Raya, disertai dokumentasi dan rujukan buku Benih yang Tumbuh." };

export default function HistoryPage() {
  return (
    <main id="history-main" className="history-index">
      <section className="history-hero" aria-labelledby="history-title">
        <div className="history-hero-copy"><p className="history-eyebrow">RUANG BACA · SEJARAH GGP</p><h1 id="history-title">Benih yang<br /><em>terus bertumbuh.</em></h1><p>Menelusuri perjalanan organisasi, pelayanan, dan orang-orang yang mengambil bagian dalam sejarah Gereja Gerakan Pentakosta.</p><div className="history-hero-actions"><Link href={`/sejarah/${historySummaries[0].slug}`} className="history-primary-link">Mulai membaca <span aria-hidden="true">→</span></Link><a href="#daftar-bacaan" className="history-text-link">Lihat daftar bacaan ↓</a></div><div className="history-hero-stats"><span><strong>1960–2021</strong>Rentang kisah dalam sumber</span><span><strong>{historySummaries.length} bacaan</strong>Kongres & Sidang Raya</span></div></div>
        <figure className="history-hero-photo"><Image src="/history/benih-yang-tumbuh/page-149-07.jpg" alt="Foto bersama peserta Sidang Raya VI tahun 1980 dalam buku Benih yang Tumbuh" width={528} height={363} priority sizes="(max-width: 800px) 100vw, 45vw" /><figcaption><span>ARSIP DOKUMENTASI</span>Peserta Sidang Raya VI, 1980 <small>Benih yang Tumbuh · Halaman 149</small></figcaption></figure>
      </section>
      <section className="history-collection-note" aria-label="Tentang koleksi"><span className="history-collection-number">XII</span><div><p className="history-eyebrow">KOLEKSI PERTAMA · BENIH YANG TUMBUH</p><h2>{historySource.title}</h2><p>Alih media Bab XII, halaman 137–187. Koleksi ini berisi narasi, susunan pengurus, serta dokumentasi dari buku sumber dan dapat dilengkapi dengan dokumen sejarah berikutnya.</p></div><a href={historySource.sourceUrl} target="_blank" rel="noopener noreferrer">Buka buku sumber ↗</a></section>
      <HistoryLibrary chapters={historySummaries} />
    </main>
  );
}
