"use client";

import { BASEMAPS, LAYERS, type LayerId } from "@/config/dashboard";
import { ALL, type Filters } from "@/lib/stats";

type LayerControlProps = {
  visibleLayers: Record<LayerId, boolean>;
  onToggleLayer: (id: LayerId, visible: boolean) => void;
  basemapId: string;
  onBasemapChange: (id: string) => void;
  filters: Filters;
};

export default function LayerControl({
  visibleLayers,
  onToggleLayer,
  basemapId,
  onBasemapChange,
  filters,
}: LayerControlProps) {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Basemap
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {BASEMAPS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onBasemapChange(b.id)}
              aria-pressed={basemapId === b.id}
              className={`rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                basemapId === b.id
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-blue-50"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Layer
        </p>
        <ul className="flex flex-col gap-0.5">
          {LAYERS.map((layer) => {
            const checked = visibleLayers[layer.id];

            return (
              <li key={layer.id}>
                <label
                  className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-blue-50"
                  title={layer.note}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onToggleLayer(layer.id, e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-blue-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10"
                        style={{ backgroundColor: layer.color }}
                      />
                      <span className="truncate text-xs font-medium text-slate-700">{layer.label}</span>
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {filters.daerah !== ALL || filters.kabupaten !== ALL || filters.desa !== ALL ? (
        <p className="rounded-lg bg-blue-50 px-2.5 py-2 text-[10px] leading-relaxed text-blue-900">
          Layer disaring ke{" "}
          <strong>
            {filters.desa !== ALL
              ? `Desa ${filters.desa}`
              : filters.kabupaten !== ALL
              ? `Kab. ${filters.kabupaten}`
              : filters.daerah}
          </strong>
          .
        </p>
      ) : null}
    </div>
  );
}
