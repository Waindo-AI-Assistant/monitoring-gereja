"use client";

import { formatArea, formatInt, type Summary } from "@/lib/stats";

type SummaryCardsProps = {
  summary: Summary;
  /** Kartu bertahun diredupkan bila filter tahun menyingkirkan sumbernya. */
  penutupLahanAktif: boolean;
  kehutananAktif: boolean;
  /** True bila filter menyempit ke wilayah yang tidak punya data detail. */
  detailKosong: boolean;
};

type Card = {
  label: string;
  value: string;
  unit?: string;
  /** Catatan penting (estimasi / cakupan terbatas) — tampil sebagai tooltip. */
  hint?: string;
  muted?: boolean;
};

export default function SummaryCards({
  summary,
  penutupLahanAktif,
  kehutananAktif,
  detailKosong,
}: SummaryCardsProps) {
  // Label sengaja ringkas ("Desa", bukan "Jumlah Desa") supaya enam kartu muat
  // satu baris bersama filter tanpa terpotong; satuan di sebelah angka yang
  // menjaga maknanya tetap jelas.
  const cards: Card[] = [
    {
      label: "Desa",
      value: formatInt(summary.jumlahDesa),
    },
    {
      label: "Penggunaan Lahan",
      value: penutupLahanAktif ? formatArea(summary.luasPenggunaanLahanHa) : "—",
      unit: "ha",
      hint: penutupLahanAktif
        ? "Luas penggunaan lahan — sumber: Penutup Lahan 2020 (KLHK)"
        : "Snapshot 2020 — pilih Tahun 2020 untuk menampilkannya",
      muted: !penutupLahanAktif,
    },
    {
      label: "Jalan",
      value: formatArea(summary.panjangJalanKm),
      unit: "km",
      hint: detailKosong
        ? "Panjang jalan — data hanya tersedia untuk Desa Bayan, nol berarti datanya belum ada"
        : "Panjang jalan (estimasi: keliling poligon badan jalan dibagi dua)",
      muted: detailKosong,
    },
    {
      label: "POI",
      value: formatInt(summary.jumlahPoi),
      hint: detailKosong
        ? "Jumlah POI — data hanya tersedia untuk Desa Bayan, nol berarti datanya belum ada"
        : "Jumlah titik POI (OpenStreetMap)",
      muted: detailKosong,
    },
    {
      label: "Persil",
      value: formatInt(summary.jumlahPersil),
      hint: detailKosong
        ? "Jumlah persil — data hanya tersedia untuk Desa Bayan, nol berarti datanya belum ada"
        : "Jumlah persil",
      muted: detailKosong,
    },
    {
      label: "Kawasan Hutan",
      value: kehutananAktif ? formatArea(summary.luasKawasanHutanHa) : "—",
      unit: "ha",
      hint: kehutananAktif
        ? "Luas kawasan hutan — sumber: Kawasan Hutan 2021 (KLHK)"
        : "Snapshot 2021 — pilih Tahun 2021 untuk menampilkannya",
      muted: !kehutananAktif,
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <div
          key={card.label}
          title={card.hint}
          className={`flex h-9 w-auto shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm shadow-blue-900/10 transition-opacity ${
            card.muted ? "opacity-55" : ""
          }`}
        >
          {/* Lebar kartu mengikuti isinya — tanpa flex-1/truncate, label sepanjang
              "Kawasan Hutan" tampil utuh dan kartu pendek tidak melar. */}
          <div className="leading-tight">
            <p className="flex items-center gap-1">
              <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {card.label}
              </span>
              {/* Penanda bahwa angka ini punya catatan — detailnya di tooltip. */}
              {card.muted ? (
                <span className="h-1 w-1 shrink-0 rounded-full bg-amber-500" aria-hidden />
              ) : null}
            </p>
            <p className="flex items-baseline gap-1">
              <span className="whitespace-nowrap text-xs font-bold text-blue-950">{card.value}</span>
              {card.unit ? (
                <span className="shrink-0 text-[10px] font-medium text-slate-400">{card.unit}</span>
              ) : null}
            </p>
          </div>
        </div>
      ))}
    </>
  );
}
