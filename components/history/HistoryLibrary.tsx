"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HistoryChapterSummary } from "@/lib/history";

export default function HistoryLibrary({ chapters }: { chapters: HistoryChapterSummary[] }) {
  const [query, setQuery] = useState("");
  const [decade, setDecade] = useState("all");
  const [lastRead, setLastRead] = useState<HistoryChapterSummary>();
  useEffect(() => {
    try {
      const slug = localStorage.getItem("ggp-history-last-read");
      setLastRead(chapters.find((chapter) => chapter.slug === slug));
    } catch { /* Reading remains available when local storage is disabled. */ }
  }, [chapters]);
  const decades = [...new Set(chapters.map((chapter) => Math.floor(chapter.year / 10) * 10))];
  const filtered = useMemo(() => chapters.filter((chapter) => {
    const haystack = `${chapter.title} ${chapter.year} ${chapter.location} ${chapter.summary}`.toLocaleLowerCase("id");
    return haystack.includes(query.trim().toLocaleLowerCase("id")) && (decade === "all" || Math.floor(chapter.year / 10) * 10 === Number(decade));
  }), [chapters, query, decade]);

  return (
    <section className="history-library" id="daftar-bacaan" aria-labelledby="library-title">
      {lastRead && <Link href={`/sejarah/${lastRead.slug}`} className="history-resume"><span>Terakhir dibuka <strong>{lastRead.title} · {lastRead.year}</strong></span><span>Lanjut membaca <span aria-hidden="true">→</span></span></Link>}
      <div className="history-section-heading"><div><p className="history-eyebrow">DAFTAR BACAAN</p><h2 id="library-title">Dari satu masa ke masa berikutnya.</h2></div><p>Ikuti urutan perjalanan, atau pilih periode yang ingin Anda baca.</p></div>
      <div className="history-filter-bar">
        <label htmlFor="history-search">Cari bacaan</label>
        <input id="history-search" type="search" placeholder="Tahun, Sidang Raya, atau tempat…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <span role="status" aria-live="polite">{filtered.length} bacaan</span>
      </div>
      <div className="history-decades" role="group" aria-label="Pilih dasawarsa">
        <button type="button" onClick={() => setDecade("all")} aria-pressed={decade === "all"}>Semua periode</button>
        {decades.map((year) => <button type="button" key={year} onClick={() => setDecade(String(year))} aria-pressed={decade === String(year)}>{year}-an</button>)}
      </div>
      <div className="history-chapter-list">
        {filtered.map((chapter) => <Link href={`/sejarah/${chapter.slug}`} key={chapter.slug} className="history-chapter-card">
          <span className="history-card-year">{chapter.year}<small>BACAAN {String(chapter.number).padStart(2, "0")}</small></span>
          <div><p className="history-card-location">{chapter.location}</p><h3>{chapter.title}</h3><p>{chapter.summary}</p><span className="history-card-meta">{chapter.readingMinutes} menit baca <span aria-hidden="true">·</span> Hal. {chapter.firstPage}–{chapter.lastPage}</span></div>
          <span className="history-card-arrow" aria-hidden="true">↗</span>
        </Link>)}
        {filtered.length === 0 && <div className="history-empty"><h3>Bacaan belum ditemukan</h3><p>Coba kata kunci atau periode lain.</p><button type="button" onClick={() => { setQuery(""); setDecade("all"); }}>Tampilkan semua bacaan</button></div>}
      </div>
    </section>
  );
}
