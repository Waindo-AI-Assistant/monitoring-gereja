import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HistoryReader from "@/components/history/HistoryReader";
import { findHistoryChapter, historySource, historySummaries } from "@/lib/history";

export function generateStaticParams() { return historySummaries.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const chapter = findHistoryChapter((await params).slug);
  return { title: chapter ? `${chapter.title} ${chapter.year} | Sejarah GGP` : "Bacaan tidak ditemukan", description: chapter?.summary };
}

export default async function HistoryChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const chapter = findHistoryChapter((await params).slug);
  if (!chapter) notFound();
  const index = historySummaries.findIndex((item) => item.slug === chapter.slug);
  return <HistoryReader chapter={chapter} chapters={historySummaries} previous={historySummaries[index - 1]} next={historySummaries[index + 1]} sourceUrl={historySource.sourceUrl} />;
}
