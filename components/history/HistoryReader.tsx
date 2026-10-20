"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HistoryBlock, HistoryChapter, HistoryChapterSummary } from "@/lib/history";

type Props = {
  chapter: HistoryChapter;
  chapters: HistoryChapterSummary[];
  sourceUrl: string;
  previous?: HistoryChapterSummary;
  next?: HistoryChapterSummary;
};

function ReadingBlocks({ blocks, sourceUrl }: { blocks: HistoryBlock[]; sourceUrl: string }) {
  // Keep successive source roster/list lines together without inferring new roles or names.
  const groups: HistoryBlock[][] = [];
  for (const block of blocks) {
    const last = groups[groups.length - 1];
    if (block.kind === "entry" && last?.[0].kind === "entry") last.push(block);
    else groups.push([block]);
  }
  return groups.map((group, index) => {
    const block = group[0];
    if (block.kind === "entry") return <ul key={index} className="history-entries">{group.map((entry, entryIndex) => <li key={entryIndex} data-source-page={entry.bookPage}>{entry.text}</li>)}</ul>;
    if (block.kind === "heading") return <h2 key={index} data-source-page={block.bookPage}>{block.text}</h2>;
    if (block.kind === "figure" && block.src && block.width && block.height) return <figure key={index} className="history-document-photo">
      <a href={block.src} target="_blank" rel="noopener noreferrer" aria-label={`Buka foto dokumentasi halaman ${block.bookPage}`}>
        <Image src={block.src} width={block.width} height={block.height} sizes="(max-width: 800px) 100vw, 720px" alt={block.text} />
      </a>
      <figcaption><span>{block.text}</span><a href={`${sourceUrl}#page=${block.pdfPage}`} target="_blank" rel="noopener noreferrer">Lihat halaman asli ↗</a></figcaption>
    </figure>;
    return <p key={index} className={block.kind === "caption" ? "history-photo-caption" : undefined} data-source-page={block.bookPage}>{block.text}</p>;
  });
}

export default function HistoryReader({ chapter, chapters, previous, next, sourceUrl }: Props) {
  const [largeText, setLargeText] = useState(false);
  const [progress, setProgress] = useState(0);
  const article = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { localStorage.setItem("ggp-history-last-read", chapter.slug); } catch { /* Optional convenience. */ }
  }, [chapter.slug]);
  useEffect(() => {
    const update = () => {
      if (!article.current) return;
      const { top, height } = article.current.getBoundingClientRect();
      const readableHeight = height - window.innerHeight;
      setProgress(readableHeight <= 0 ? 100 : Math.max(0, Math.min(100, (-top / readableHeight) * 100)));
    };
    const resize = new ResizeObserver(update);
    if (article.current) resize.observe(article.current);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { resize.disconnect(); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [chapter.slug, largeText]);

  const contents = <ol className="history-toc-list">{chapters.map((item) => <li key={item.slug}><Link href={`/sejarah/${item.slug}`} aria-current={item.slug === chapter.slug ? "page" : undefined}><span>{item.year}</span><strong>{item.title}</strong></Link></li>)}</ol>;

  return (
    <div className="history-reading-layout">
      <aside className="history-sidebar" aria-label="Daftar bacaan"><div className="history-sidebar-sticky"><Link href="/sejarah" className="history-back">← Semua bacaan</Link><p className="history-eyebrow">PERJALANAN ORGANISASI</p>{contents}<p className="history-sidebar-source">Benih yang Tumbuh<br />Bab XII · Hal. 137–187</p></div></aside>
      <main className="history-reader" id="history-main">
        <div className="history-reader-toolbar"><Link href="/sejarah">← Daftar bacaan</Link><div role="group" aria-label="Ukuran teks bacaan"><button type="button" aria-label="Ukuran teks standar" aria-pressed={!largeText} onClick={() => setLargeText(false)}>A</button><button type="button" aria-label="Ukuran teks besar" aria-pressed={largeText} onClick={() => setLargeText(true)}>A<span className="history-visually-hidden"> besar</span><sup>+</sup></button></div><div className="history-reading-progress" role="progressbar" aria-label="Kemajuan bacaan" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div></div>
        <details className="history-mobile-toc"><summary>Pilih bacaan · {chapter.year}</summary>{contents}</details>
        <article>
          <header className="history-article-header"><p className="history-eyebrow">BACAAN {String(chapter.number).padStart(2, "0")} <span aria-hidden="true">/</span> {chapter.year}</p><h1>{chapter.title}<span>{chapter.year}</span></h1><p className="history-article-location">{chapter.location}</p><p className="history-article-intro">{chapter.summary}</p><div className="history-article-meta"><span>{chapter.readingMinutes} menit baca</span><span>Halaman buku {chapter.firstPage}–{chapter.lastPage}</span><a href={`${sourceUrl}#page=${chapter.pdfPage}`} target="_blank" rel="noopener noreferrer">Buka sumber PDF ↗</a></div></header>
          <div className="history-source-note"><strong>Dari buku Benih yang Tumbuh.</strong> Narasi, ejaan nama, dan penilaian dalam bacaan mengikuti buku sumber. Dokumentasi dan susunan pengurus merekam konteks periode masing-masing.</div>
          <div ref={article} className={`history-prose${largeText ? " history-prose-large" : ""}`}><ReadingBlocks blocks={chapter.blocks} sourceUrl={sourceUrl} /></div>
          <footer className="history-article-source"><p className="history-eyebrow">SUMBER BACAAN</p><p><cite>Benih yang Tumbuh</cite>, Bab XII: Perjalanan Organisasi GGP dari Sidang Raya ke Sidang Raya, halaman {chapter.firstPage}–{chapter.lastPage}.</p><a href={`${sourceUrl}#page=${chapter.pdfPage}`} target="_blank" rel="noopener noreferrer">Baca halaman sumber ↗</a></footer>
        </article>
        <nav className="history-reading-pagination" aria-label="Bacaan sebelum dan sesudah">{previous ? <Link href={`/sejarah/${previous.slug}`}><small>← Bacaan sebelumnya</small><strong>{previous.title} · {previous.year}</strong></Link> : <Link href="/sejarah"><small>← Kembali</small><strong>Semua bacaan</strong></Link>}{next ? <Link href={`/sejarah/${next.slug}`}><small>Bacaan berikutnya →</small><strong>{next.title} · {next.year}</strong></Link> : <Link href="/sejarah"><small>Selesai membaca</small><strong>Kembali ke daftar bacaan →</strong></Link>}</nav>
      </main>
    </div>
  );
}
