import HistoryHome from "@/components/history/HistoryHome";
import type { Metadata } from "next";
import { historySource, historySummaries } from "@/lib/history";

export const metadata: Metadata = { title: "Sejarah GGP | Benih yang Tumbuh", description: "Bacaan perjalanan organisasi GGP dari Kongres dan Sidang Raya, disertai dokumentasi dan rujukan buku Benih yang Tumbuh." };

export default function HistoryPage() {
  return <HistoryHome chapters={historySummaries} sourceTitle={historySource.title} sourceUrl={historySource.sourceUrl} />;
}
