"use client";

import { formatInt, type Summary } from "@/lib/stats";

type SummaryCardsProps = {
  summary: Summary;
};

type Card = {
  label: string;
  value: string;
  hint?: string;
};

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards: Card[] = [
    {
      label: "Total Mada",
      value: formatInt(summary.jumlahMada),
      hint: "Jumlah Majelis Daerah yang terdaftar",
    },
    {
      label: "Total Gereja",
      value: formatInt(summary.totalGereja),
      hint: "Total seluruh titik plot gereja di Geodatabase",
    },
    {
      label: "Gereja Terfilter",
      value: formatInt(summary.gerejaTerfilter),
      hint: "Jumlah titik gereja yang lolos filter aktif",
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <div
          key={card.label}
          title={card.hint}
          className="flex h-9 w-auto shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm shadow-blue-900/10 transition-opacity"
        >
          <div className="leading-tight">
            <p className="flex items-center gap-1">
              <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {card.label}
              </span>
            </p>
            <p className="flex items-baseline gap-1">
              <span className="whitespace-nowrap text-xs font-bold text-blue-950">{card.value}</span>
            </p>
          </div>
        </div>
      ))}
    </>
  );
}
