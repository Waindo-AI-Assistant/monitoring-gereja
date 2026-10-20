import source from "@/content/history/benih-yang-tumbuh.json";

export type HistoryBlock = {
  kind: "paragraph" | "heading" | "entry" | "figure" | "caption";
  text: string;
  bookPage: number;
  pdfPage: number;
  endBookPage?: number;
  endPdfPage?: number;
  src?: string;
  width?: number;
  height?: number;
};

export type HistoryChapter = {
  slug: string;
  year: number;
  title: string;
  location: string;
  summary: string;
  number: number;
  firstPage: number;
  lastPage: number;
  pdfPage: number;
  readingMinutes: number;
  blocks: HistoryBlock[];
};

export type HistoryChapterSummary = Omit<HistoryChapter, "blocks">;

export const historySource = source;
export const historyChapters = source.chapters as HistoryChapter[];
export const historySummaries: HistoryChapterSummary[] = historyChapters.map(({ blocks: _blocks, ...chapter }) => chapter);

export function findHistoryChapter(slug: string) {
  return historyChapters.find((chapter) => chapter.slug === slug);
}

export function sourcePageUrl(pdfPage: number) {
  return `${historySource.sourceUrl}#page=${pdfPage}`;
}
