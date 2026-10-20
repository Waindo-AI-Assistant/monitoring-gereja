"use client";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { HistoryChapterSummary } from "@/lib/history";
import HistoryLibrary from "@/components/history/HistoryLibrary";

export default function HistoryHome({ chapters }: { chapters: HistoryChapterSummary[] }) {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  useEffect(() => { document.title = isEn ? "GGP History | Benih yang Tumbuh" : "Sejarah GGP | Benih yang Tumbuh"; }, [isEn]);
  return (
    <main id="history-main" className="history-index">
      <HistoryLibrary chapters={chapters} />
    </main>
  );
}
