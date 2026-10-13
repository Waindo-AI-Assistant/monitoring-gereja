"use client";

import { useTranslation } from "react-i18next";
import { formatInt, type Summary } from "@/lib/stats";

type SummaryCardsProps = {
  readonly summary: Summary;
};

type Card = {
  label: string;
  value: string;
  hint?: string;
};

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const { t } = useTranslation();

  const cards: Card[] = [
    {
      label: t("dashboard.stats_mada") || "Total Mada",
      value: formatInt(summary.jumlahMada),
      hint: t("dashboard.stats_hint_mada") || "Jumlah Majelis Daerah yang terdaftar",
    },
    {
      label: t("dashboard.stats_mawil") || "Total Mawil",
      value: formatInt(summary.jumlahWilayah),
      hint: t("dashboard.stats_hint_mawil") || "Jumlah Majelis Wilayah yang terdaftar pada Mada aktif",
    },
    {
      label: t("dashboard.stats_church") || "Total Gereja",
      value: formatInt(summary.totalGereja),
      hint: t("dashboard.stats_hint_church") || "Total seluruh titik plot gereja di Geodatabase",
    },
    {
      label: t("dashboard.stats_filtered") || "Gereja Terfilter",
      value: formatInt(summary.gerejaTerfilter),
      hint: t("dashboard.stats_hint_filtered") || "Jumlah titik gereja yang lolos filter aktif",
    },
  ];

  return (
    <div className="flex items-center gap-2 shrink-0">
      {cards.map((card) => (
        <div
          key={card.label}
          title={card.hint}
          className="flex h-9 w-auto shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 shadow-xs"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {card.label}:
          </span>
          <span className="text-xs font-black text-blue-950 font-mono">
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
}
