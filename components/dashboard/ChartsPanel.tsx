"use client";

import { LAYERS, classColor, classLabel, type LayerId } from "@/config/dashboard";
import {
  ALL,
  BREAKDOWN_FIELD,
  breakdown,
  byRegion,
  formatArea,
  layerPassesYear,
  type DesaStat,
  type Filters,
} from "@/lib/stats";

type ChartsPanelProps = {
  records: DesaStat[];
  filters: Filters;
  visibleLayers: Record<LayerId, boolean>;
};

const TOP_N = 10;

/**
 * Layer yang totalnya sudah tampil sebagai kartu ringkasan di atas. Panel
 * komposisinya tidak perlu mengulang angka yang sama — cukup rinciannya.
 * Bangunan OSM tidak punya kartu, jadi totalnya tetap ditampilkan di sini.
 */
const TOTAL_SUDAH_DI_KARTU = new Set<LayerId>(["penutup_lahan", "kehutanan"]);

type BarItem = { key: string; label: string; value: number; color: string };

/**
 * Bar chart horizontal sederhana.
 *
 * Dibuat sendiri alih-alih memakai library chart karena di kolom selebar 256px
 * label kelas yang panjang ("Pertanian Lahan Kering Bercampur Semak") terpotong
 * atau terlipat berantakan pada sumbu Y. Di sini label bebas melipat dan tiap
 * baris selalu membawa kotak warnanya — jadi grafik ini sekaligus berfungsi
 * sebagai legenda, tanpa perlu daftar swatch terpisah yang isinya sama.
 */
function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 0);

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-start gap-1.5">
            <span
              className="mt-[3px] h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 text-[11px] leading-tight text-slate-600">
              {item.label}
            </span>
            <span className="shrink-0 font-mono text-[11px] leading-tight text-slate-400">
              {formatArea(item.value)}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: max > 0 ? `${Math.max(2, (item.value / max) * 100)}%` : "0%",
                backgroundColor: item.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Panel({
  title,
  subtitle,
  total,
  children,
}: {
  title: string;
  subtitle?: string;
  total?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-blue-900/5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold text-blue-950">
          {title}
          {subtitle ? <span className="ml-1 font-normal text-slate-400">{subtitle}</span> : null}
        </p>
        {total !== undefined ? (
          <p className="shrink-0 font-mono text-[10px] text-slate-400">{formatArea(total)} ha</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function ChartsPanel({ records, filters, visibleLayers }: ChartsPanelProps) {
  // Tema tidak lagi dipilih lewat dropdown terpisah: layer yang dinyalakan di
  // panel Layer inilah temanya. Satu sumber kebenaran, tanpa dua kontrol yang
  // mengatur hal yang sama.
  const layerBerkelas = LAYERS.filter(
    (l) => l.classField && visibleLayers[l.id] && layerPassesYear(l.year, filters.year),
  );

  // Bila sudah menyaring ke satu kecamatan, perbandingan antar-kecamatan tidak
  // ada artinya — pengelompokan mengikuti tingkat filter yang aktif.
  const groupBy: "kecamatan" | "desa" = filters.kecamatan === ALL ? "kecamatan" : "desa";

  if (layerBerkelas.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] leading-relaxed text-slate-400">
        Aktifkan salah satu layer bertema (Penggunaan Lahan, Kehutanan, atau Bangunan OSM) untuk
        melihat legenda &amp; komposisinya.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {layerBerkelas.map((layer) => {
        const field = BREAKDOWN_FIELD[layer.id]!;

        const komposisi: BarItem[] = breakdown(records, field)
          .filter((e) => e.value > 0)
          .map((e) => ({
            key: e.key,
            label: classLabel(layer.id, e.key),
            value: e.value,
            color: classColor(layer.id, e.key),
          }));

        const wilayah: BarItem[] = byRegion(records, groupBy, (r: DesaStat) =>
          Object.values(r[field]).reduce((a, b) => a + b, 0),
        )
          .slice(0, TOP_N)
          .map((e) => ({ key: e.key, label: e.key, value: e.value, color: "#2563eb" }));

        const total = komposisi.reduce((a, b) => a + b.value, 0);

        return (
          <div key={layer.id} className="flex flex-col gap-2">
            <Panel
              title={layer.label}
              subtitle={layer.year ? String(layer.year) : undefined}
              total={
                komposisi.length > 0 && !TOTAL_SUDAH_DI_KARTU.has(layer.id) ? total : undefined
              }
            >
              {komposisi.length > 0 ? (
                <BarList items={komposisi} />
              ) : (
                <p className="text-[10px] leading-relaxed text-slate-500">
                  Tidak ada data pada wilayah terpilih.
                  {layer.coverage === "desa-bayan"
                    ? " Layer ini hanya tersedia untuk Desa Bayan."
                    : ""}
                </p>
              )}
            </Panel>

            {wilayah.length > 1 ? (
              <Panel
                title={`${TOP_N} ${groupBy === "kecamatan" ? "Kecamatan" : "Desa"} Terluas`}
                subtitle={`· ${layer.label}`}
              >
                <BarList items={wilayah} />
              </Panel>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
