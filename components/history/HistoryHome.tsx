"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { localizeHistory } from "@/lib/history-language";
import { historyText } from "@/lib/history-copy";
import type { HistoryChapterSummary } from "@/lib/history";
import HistoryLibrary from "@/components/history/HistoryLibrary";

export default function HistoryHome({ chapters: originalChapters, sourceTitle, sourceUrl }: { chapters: HistoryChapterSummary[]; sourceTitle: string; sourceUrl: string }) {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const l = (text: string) => historyText(text, isEn);
  const historySummaries = originalChapters.map((chapter) => localizeHistory(chapter, isEn));
  useEffect(() => { document.title = isEn ? "GGP History | Benih yang Tumbuh" : "Sejarah GGP | Benih yang Tumbuh"; }, [isEn]);
  return (
    <main id="history-main" className="history-index">
      <section className="history-hero" aria-labelledby="history-title">
        <div className="history-hero-copy"><p className="history-eyebrow">{l("RUANG BACA · SEJARAH GGP")}</p><h1 id="history-title">{l("Benih yang")}<br /><em>{l("terus bertumbuh.")}</em></h1><p>{l("Menelusuri perjalanan organisasi, pelayanan, dan orang-orang yang mengambil bagian dalam sejarah Gereja Gerakan Pentakosta.")}</p><div className="history-hero-actions"><Link href={`/sejarah/${historySummaries[0].slug}`} className="history-primary-link">{l("Mulai membaca")} <span aria-hidden="true">→</span></Link><a href="#daftar-bacaan" className="history-text-link">{l("Lihat daftar bacaan ↓")}</a></div><div className="history-hero-stats"><span><strong>1960–2021</strong>{l("Rentang kisah dalam sumber")}</span><span><strong>{historySummaries.length} {l("bacaan")}</strong>{l("Kongres & Sidang Raya")}</span></div></div>
        <figure className="history-hero-photo"><Image src="/history/benih-yang-tumbuh/page-149-07.jpg" alt={l("Foto bersama peserta Sidang Raya VI tahun 1980 dalam buku Benih yang Tumbuh")} width={528} height={363} priority sizes="(max-width: 800px) 100vw, 45vw" /><figcaption><span>{l("ARSIP DOKUMENTASI")}</span>{l("Peserta Sidang Raya VI, 1980")} <small>{l("Benih yang Tumbuh · Halaman 149")}</small></figcaption></figure>
      </section>
      <section className="history-collection-note" aria-label={l("Tentang koleksi")}><span className="history-collection-number">XII</span><div><p className="history-eyebrow">{l("KOLEKSI PERTAMA · BENIH YANG TUMBUH")}</p><h2>{l(sourceTitle)}</h2><p>{l("Alih media Bab XII, halaman 137–187. Koleksi ini berisi narasi, susunan pengurus, serta dokumentasi dari buku sumber dan dapat dilengkapi dengan dokumen sejarah berikutnya.")}</p></div><a href={sourceUrl} target="_blank" rel="noopener noreferrer">{l("Buka buku sumber ↗")}</a></section>
      <HistoryLibrary chapters={originalChapters} />
    </main>
  );
}
