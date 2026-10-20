import english from "@/content/history/benih-yang-tumbuh.en.json";
import type { HistoryChapter, HistoryChapterSummary } from "@/lib/history";

export function localizeHistory<T extends HistoryChapterSummary>(chapter: T, isEn: boolean): T {
  if (!isEn) return chapter;
  const translation = (english.chapters as Record<string, { title: string; location: string; summary: string; blocks: string[] }>)[chapter.slug];
  if (!translation) return chapter;
  const full = chapter as unknown as HistoryChapter;
  return {
    ...chapter,
    title: translation.title,
    location: translation.location,
    summary: translation.summary,
    ...(full.blocks ? { blocks: full.blocks.map((block, index) => ({ ...block, text: translation.blocks[index] ?? block.text })) } : {}),
  };
}
