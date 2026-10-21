"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminIcon } from "@/components/admin/AdminShell";
import IuranGrid, { type ChurchGroup } from "@/components/admin/IuranGrid";
import { hasPermission, type Permissions } from "@/lib/permissions";
import { IURAN_KINDS, MONTHS, sumAmounts, type IuranInput, type IuranRecord } from "@/lib/iuran";

const inputClass = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-2 focus:outline-blue-600";
const buttonClass = "min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = "min-h-11 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

function money(value: string | null) {
  if (value === null) return "—";
  const [whole, fraction = "00"] = value.split(".");
  return `Rp ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${fraction === "00" ? "" : `,${fraction}`}`;
}

function blank(year: number): IuranInput {
  return {
    year,
    mada: "",
    mawil: "",
    churchName: "",
    pastorName: "",
    kind: IURAN_KINDS[0],
    months: MONTHS.map((_, index) => ({ month: index + 1, amount: null, receiptNote: "" })),
  };
}

async function responseJson(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Permintaan gagal.");
  return data;
}

function exportCsv(rows: IuranRecord[], year: number) {
  const csvCell = (value: unknown) => {
    const text = String(value ?? "");
    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"`;
  };
  const header = [
    "Tahun",
    "MADA / Wilayah",
    "MAWIL",
    "Jemaat",
    "Gembala",
    "Jenis",
    ...MONTHS.flatMap((month) => [month, `${month} Tanggal / Referensi`]),
    "Total",
  ];
  const lines = rows.map((row) => [
    row.year,
    row.mada,
    row.mawil,
    row.churchName,
    row.pastorName,
    row.kind,
    ...MONTHS.flatMap((_, index) => {
      const m = row.months.find((m) => m.month === index + 1);
      return [m?.amount ?? "", m?.receiptNote ?? ""];
    }),
    sumAmounts(row.months.map((m) => m.amount)),
  ]);
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", [header, ...lines].map((line) => line.map(csvCell).join(";")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `iuran-jemaat-${year}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function IuranManager({
  permissions,
  onDirtyChange,
}: {
  permissions: Permissions;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<IuranRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [mada, setMada] = useState("");
  const [mawil, setMawil] = useState("");
  const [kind, setKind] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editor, setEditor] = useState<IuranInput | IuranRecord | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [gridDirty, setGridDirty] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [view, setView] = useState<"ledger" | "summary">("ledger");
  const [wide, setWide] = useState(false);
  const canCreate = hasPermission(permissions, "iuran.create");
  const canEdit = hasPermission(permissions, "iuran.update");
  const canDelete = hasPermission(permissions, "iuran.delete");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/iuran?year=${year}`, { signal: controller.signal, cache: "no-store" })
      .then(responseJson)
      .then((data) => {
        if (!controller.signal.aborted) setRecords(data.records);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [year, refresh]);

  const initialMadaSet = useRef(false);

  // Daftar seluruh MADA yang tersedia pada tahun ini
  const madaList = useMemo(() => {
    return [...new Set(records.map((row) => row.mada).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "id")
    );
  }, [records]);

  // Otomatis aktifkan tab MADA pertama saat data dimuat agar tidak membuka ratusan gereja sekaligus
  useEffect(() => {
    if (!initialMadaSet.current && madaList.length > 0) {
      setMada(madaList[0]);
      initialMadaSet.current = true;
    }
  }, [madaList]);

  // Reset inisialisasi jika tahun diubah
  useEffect(() => {
    initialMadaSet.current = false;
  }, [year]);

  // Daftar MAWIL spesifik untuk MADA yang sedang aktif
  const availableMawils = useMemo(() => {
    return [
      ...new Set(
        records
          .filter((r) => !mada || r.mada === mada)
          .map((row) => row.mawil)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "id"));
  }, [records, mada]);

  const filtered = useMemo(
    () =>
      records.filter(
        (row) =>
          (!mada || row.mada === mada) &&
          (!mawil || row.mawil === mawil) &&
          (!kind || row.kind === kind) &&
          `${row.churchName} ${row.pastorName} ${row.mada} ${row.mawil}`
            .toLocaleLowerCase("id")
            .includes(query.trim().toLocaleLowerCase("id"))
      ),
    [records, query, mada, mawil, kind]
  );

  const total = sumAmounts(filtered.flatMap((row) => row.months.map((m) => m.amount)));
  const churchKey = (row: IuranRecord) => JSON.stringify([row.mada, row.mawil, row.churchName]);

  // Kelompokkan data per gereja (1 gereja = 1 nomor urut)
  const groupedChurches = useMemo(() => {
    const groups: ChurchGroup[] = [];
    const map = new Map<string, ChurchGroup>();
    for (const row of filtered) {
      const key = `${row.mada}:::${row.mawil}:::${row.churchName}`;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          churchName: row.churchName,
          mada: row.mada,
          mawil: row.mawil,
          pastorName: row.pastorName || "",
          records: [],
        };
        map.set(key, g);
        groups.push(g);
      }
      if (!g.pastorName && row.pastorName) {
        g.pastorName = row.pastorName;
      }
      g.records.push(row);
    }
    // Urutkan jenis di dalam gereja: Iuran wajib 5% pertama, lalu perpuluhan gembala
    for (const g of groups) {
      g.records.sort((a, b) => {
        if (a.kind.includes("wajib") && !b.kind.includes("wajib")) return -1;
        if (!a.kind.includes("wajib") && b.kind.includes("wajib")) return 1;
        return a.kind.localeCompare(b.kind, "id");
      });
    }
    return groups;
  }, [filtered]);

  const churchCount = groupedChurches.length;
  const paidCount = new Set(
    filtered.filter((row) => row.months.some((m) => m.amount !== null && Number(m.amount) > 0)).map(churchKey)
  ).size;

  const pages = Math.max(1, Math.ceil(groupedChurches.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visibleGroups = groupedChurches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startNumber = (currentPage - 1) * pageSize + 1;

  const regionSummary = useMemo(
    () =>
      [...new Set(filtered.map((row) => row.mada))].sort().map((region) => {
        const rows = filtered.filter((row) => row.mada === region);
        return {
          region,
          churches: new Set(rows.map((row) => JSON.stringify([row.mawil, row.churchName]))).size,
          wajib: sumAmounts(
            rows.filter((row) => row.kind === IURAN_KINDS[0]).flatMap((row) => row.months.map((m) => m.amount))
          ),
          gembala: sumAmounts(
            rows.filter((row) => row.kind !== IURAN_KINDS[0]).flatMap((row) => row.months.map((m) => m.amount))
          ),
        };
      }),
    [filtered]
  );

  function reload() {
    setLoading(true);
    setError("");
    setRecords([]);
    setRefresh((value) => value + 1);
  }

  function saved(text: string) {
    setEditor(null);
    setImporting(false);
    setMessage(text);
    reload();
  }

  async function remove(row: IuranRecord) {
    if (!window.confirm(`Hapus ${row.kind} untuk ${row.churchName}, tahun ${year}, beserta seluruh catatan bulanannya?`))
      return;
    setDeleting(true);
    setError("");
    try {
      await responseJson(
        await fetch("/api/admin/iuran", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row.id, updatedAt: row.updatedAt }),
        })
      );
      saved("Catatan iuran dihapus.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menghapus.");
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = !!(query || mawil || (madaList.length > 0 && mada !== madaList[0]));

  function resetFilters() {
    setQuery("");
    setMawil("");
    setKind("");
    if (madaList.length > 0) {
      setMada(madaList[0]);
    } else {
      setMada("");
    }
    setPage(1);
  }

  function add() {
    setEditor(blank(year));
    setMessage("");
  }

  function openImport() {
    setImporting(true);
    setMessage("");
  }

  return (
    <section className={`iuran-workspace${wide ? " iuran-workspace--focus" : ""}`} aria-labelledby="iuran-title">
      <div className="iuran-header">
        <div>
          <h2 id="iuran-title">Penerimaan Iuran</h2>
          <p>Catat penerimaan jemaat dan perpuluhan gembala dalam satu buku tahunan.</p>
        </div>
        <div className="iuran-header-actions">
          <label>
            Tahun
            <select
              aria-label="Tahun iuran"
              value={year}
              disabled={!!editor || importing || gridDirty}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setMada("");
                setMawil("");
                setMessage("");
                setPage(1);
                setLoading(true);
                setError("");
                setRecords([]);
              }}
            >
              {Array.from({ length: 16 }, (_, i) => new Date().getFullYear() + 2 - i).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <button
            className="iuran-action"
            onClick={() => exportCsv(filtered, year)}
            disabled={loading || !filtered.length || gridDirty}
          >
            <AdminIcon name="download" />
            Ekspor
          </button>
          {canCreate && (
            <>
              <button
                className="iuran-action"
                disabled={!!editor || importing || gridDirty}
                onClick={openImport}
              >
                <AdminIcon name="upload" />
                Impor Excel
              </button>
              <button
                className="iuran-action iuran-action--primary"
                disabled={!!editor || importing || gridDirty}
                onClick={add}
              >
                <AdminIcon name="plus" />
                Tambah Catatan
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div role="status" className="iuran-message">
          <AdminIcon name="check" />
          <span>{message}</span>
          <button aria-label="Tutup pemberitahuan" onClick={() => setMessage("")}>
            <AdminIcon name="close" />
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="iuran-error">
          {error}
          <button className="ml-3 font-semibold underline" onClick={reload} disabled={gridDirty}>
            Coba lagi
          </button>
        </div>
      )}

      <div className="iuran-summary">
        <div className="iuran-stat">
          <p>Total penerimaan</p>
          <strong>{loading ? "—" : money(total)}</strong>
          <small>Tahun {year} · sesuai filter aktif</small>
        </div>
        <div className="iuran-stat">
          <p>Jemaat tercatat</p>
          <strong>{loading ? "—" : churchCount}</strong>
          <small>Jemaat unik dalam pilihan wilayah</small>
        </div>
        <div className="iuran-stat">
          <p>Jemaat dengan penerimaan</p>
          <strong>
            {loading ? "—" : paidCount}
            <span style={{ fontSize: "12px", fontWeight: 450, color: "#91a0b5" }}> / {churchCount}</span>
          </strong>
          <small>Memiliki nominal penerimaan lebih dari Rp 0</small>
        </div>
      </div>

      {editor && (
        <IuranEditor
          initial={editor}
          onCancel={() => setEditor(null)}
          onSaved={() => saved("Catatan iuran tersimpan. Isi nominal langsung di tabel.")}
        />
      )}

      {importing && <IuranImport key={year} year={year} onCancel={() => setImporting(false)} onSaved={saved} />}

      <div className="iuran-sheet" aria-busy={loading}>
        <div className="iuran-sheet-tabs">
          <div>
            <button
              type="button"
              aria-pressed={view === "ledger"}
              disabled={gridDirty}
              onClick={() => setView("ledger")}
            >
              Buku Iuran
            </button>
            <button
              type="button"
              aria-pressed={view === "summary"}
              disabled={gridDirty}
              onClick={() => setView("summary")}
            >
              Rekap Wilayah
            </button>
          </div>
          <span>
            {churchCount} gereja ({filtered.length} catatan) · {year}
          </span>
        </div>

        {/* Tab Sheet per MADA (Bergaya Excel) */}
        {madaList.length > 0 && (
          <div className="iuran-mada-tabs" role="tablist" aria-label="Pilih Majelis Daerah (MADA)">
            <button
              type="button"
              role="tab"
              aria-selected={mada === ""}
              disabled={gridDirty}
              onClick={() => {
                setMada("");
                setMawil("");
                setPage(1);
              }}
              className={`iuran-mada-tab${mada === "" ? " iuran-mada-tab--active" : ""}`}
              title="Buka seluruh wilayah Indonesia"
            >
              <span>🌐 Semua Wilayah</span>
              <span className="iuran-mada-badge">
                {new Set(records.map((r) => r.churchName)).size}
              </span>
            </button>
            {madaList.map((m) => {
              const active = mada === m;
              const churchesInMada = new Set(records.filter((r) => r.mada === m).map((r) => r.churchName)).size;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={gridDirty}
                  onClick={() => {
                    setMada(m);
                    setMawil("");
                    setPage(1);
                  }}
                  className={`iuran-mada-tab${active ? " iuran-mada-tab--active" : ""}`}
                  title={`Buka lembar ${m}`}
                >
                  <span>📑 {m}</span>
                  <span className="iuran-mada-badge">{churchesInMada}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-Filter: Pencarian Jemaat & Dropdown MAWIL */}
        <fieldset disabled={gridDirty} className="iuran-subfilters">
          <div className="iuran-subfilters-search">
            <input
              aria-label="Cari jemaat atau gembala"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={`Cari nama jemaat atau gembala di ${mada || "semua wilayah"}...`}
            />
          </div>

          {availableMawils.length > 0 && (
            <div className="iuran-subfilters-select">
              <select
                aria-label="Filter berdasarkan MAWIL"
                value={mawil}
                onChange={(e) => {
                  setMawil(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua MAWIL {mada ? `(${mada})` : ""}</option>
                {availableMawils.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(query || mawil) && (
            <button
              type="button"
              className="iuran-subfilters-reset"
              title="Reset pencarian dan MAWIL"
              onClick={() => {
                setQuery("");
                setMawil("");
                setPage(1);
              }}
            >
              Reset Filter
            </button>
          )}
        </fieldset>

        {loading ? (
          <div role="status" className="iuran-empty">
            <AdminIcon name="iuran" />
            <h3>Memuat buku iuran...</h3>
            <p>Menyiapkan catatan penerimaan tahun {year}.</p>
          </div>
        ) : !filtered.length ? (
          <div className="iuran-empty">
            <AdminIcon name={error ? "iuran" : "search"} />
            <h3>
              {error
                ? "Data belum dapat dimuat"
                : hasFilters
                ? "Tidak ada catatan yang sesuai"
                : `Buku iuran ${year} masih kosong`}
            </h3>
            <p>
              {error
                ? "Coba muat ulang setelah koneksi tersedia."
                : hasFilters
                ? "Coba nama lain atau reset filter untuk melihat semua jemaat."
                : "Mulai dari workbook Excel atau tambahkan identitas jemaat, lalu isi penerimaan langsung di tabel."}
            </p>
            <div>
              {error ? (
                <button className="iuran-action" onClick={reload}>
                  Muat ulang
                </button>
              ) : hasFilters ? (
                <button className="iuran-action" onClick={resetFilters}>
                  Reset Filter
                </button>
              ) : (
                canCreate && (
                  <>
                    <button className="iuran-action" onClick={openImport}>
                      Impor Excel
                    </button>
                    <button className="iuran-action iuran-action--primary" onClick={add}>
                      Tambah Catatan
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        ) : view === "summary" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Rekap penerimaan wilayah tahun {year}, sesuai filter</caption>
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {["MADA / Wilayah", "Jemaat", "Iuran Wajib", "Perpuluhan Gembala", "Total Penerimaan"].map(
                    (label) => (
                      <th key={label} className="whitespace-nowrap px-5 py-4 font-semibold">
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regionSummary.map((row) => (
                  <tr key={row.region} className="hover:bg-slate-50">
                    <th scope="row" className="px-5 py-4 text-xs font-semibold text-slate-700">
                      {row.region}
                    </th>
                    <td className="px-5 py-4 text-xs text-slate-500">{row.churches}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs tabular-nums">{money(row.wajib)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs tabular-nums">{money(row.gembala)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold tabular-nums text-blue-800">
                      {money(sumAmounts([row.wajib, row.gembala]))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <th colSpan={4} className="px-5 py-4 text-xs text-slate-600">
                    Total sesuai filter
                  </th>
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-blue-800">{money(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <>
            <IuranGrid
              groups={visibleGroups}
              startNumber={startNumber}
              year={year}
              canEdit={canEdit}
              canDelete={canDelete}
              canCreate={canCreate}
              blocked={!!editor || importing || deleting}
              formatMoney={money}
              wide={wide}
              onWideChange={() => setWide(!wide)}
              onDetails={setEditor}
              onDelete={remove}
              onDirtyChange={(dirty) => {
                setGridDirty(dirty);
                onDirtyChange?.(dirty);
              }}
              onSaved={(record) => {
                setRecords((previous) => previous.map((row) => (row.id === record.id ? record : row)));
                setMessage(`Iuran ${record.churchName} (${record.kind}) tersimpan.`);
              }}
              onAddKind={(group) => {
                setEditor({
                  year,
                  mada: group.mada,
                  mawil: group.mawil,
                  churchName: group.churchName,
                  pastorName: group.pastorName,
                  kind: "50% Perpuluhan Gembala",
                  months: MONTHS.map((_, index) => ({ month: index + 1, amount: null, receiptNote: "" })),
                });
                setMessage("");
              }}
            />
            <div className="iuran-pagination">
              <span>
                Menampilkan gereja ke-{startNumber}–{Math.min(currentPage * pageSize, groupedChurches.length)} dari{" "}
                {groupedChurches.length} gereja ({filtered.length} baris iuran)
              </span>
              <div>
                <label className="sr-only" htmlFor="iuran-page-size">
                  Gereja per halaman
                </label>
                <select
                  id="iuran-page-size"
                  value={pageSize}
                  disabled={gridDirty}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[20, 50, 100, 250].map((size) => (
                    <option key={size} value={size}>
                      {size} gereja / halaman
                    </option>
                  ))}
                </select>
                <button
                  disabled={currentPage === 1 || gridDirty}
                  onClick={() => setPage(currentPage - 1)}
                  aria-label="Halaman sebelumnya"
                >
                  ←
                </button>
                <span>
                  {currentPage} / {pages}
                </span>
                <button
                  disabled={currentPage === pages || gridDirty}
                  onClick={() => setPage(currentPage + 1)}
                  aria-label="Halaman berikutnya"
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <p className="iuran-footnote">
        Semua nominal dalam rupiah. Tanda — berarti belum dicatat; Rp 0 berarti nilai nol. Rekap dan total tahun
        mencakup Januari–Desember, sesuai data yang sudah disimpan.
      </p>
    </section>
  );
}

function IuranEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial: IuranInput | IuranRecord;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState(() => ({
    ...initial,
    months: MONTHS.map((_, index) => ({
      month: index + 1,
      amount: initial.months.find((m) => m.month === index + 1)?.amount ?? null,
      receiptNote: initial.months.find((m) => m.month === index + 1)?.receiptNote ?? "",
    })),
  }));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const editing = "id" in initial;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await responseJson(
        await fetch("/api/admin/iuran", {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      );
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="iuran-editor space-y-4 rounded-xl border border-blue-200 bg-white p-5" aria-label="Form catatan iuran">
      <h3 className="text-lg font-bold text-slate-900">
        {editing ? "Ubah Identitas Catatan" : "Tambah Catatan Iuran"} {data.year}
      </h3>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {([
          ["mada", "MADA / Wilayah", true],
          ["mawil", "MAWIL", false],
          ["churchName", "Nama jemaat", true],
          ["pastorName", "Nama gembala", false],
        ] as const).map(([key, label, required]) => (
          <label key={key} className="text-sm font-medium text-slate-700">
            {label}
            {required && " *"}
            <input
              autoFocus={key === "mada"}
              maxLength={250}
              required={required}
              className={`${inputClass} mt-1`}
              value={data[key]}
              onChange={(e) => setData({ ...data, [key]: e.target.value })}
            />
          </label>
        ))}
        <label className="text-sm font-medium text-slate-700">
          Jenis iuran
          <select className={`${inputClass} mt-1`} value={data.kind} onChange={(e) => setData({ ...data, kind: e.target.value })}>
            {IURAN_KINDS.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
        </label>
      </fieldset>
      <p className="text-xs text-slate-500">
        Isi nominal dan tanggal penerimaan langsung pada sel bulanan di buku iuran setelah catatan disimpan.
      </p>
      {"source" in initial && initial.source && <p className="text-xs text-slate-500">Sumber: {initial.source}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass} disabled={busy} onClick={onCancel}>
          Batal
        </button>
        <button className={primaryClass} disabled={busy}>
          {busy ? "Menyimpan..." : "Simpan Iuran"}
        </button>
      </div>
    </form>
  );
}

type PreviewSheet = {
  name: string;
  year: number | null;
  count: number;
  total: string;
  warnings: string[];
  errors: string[];
  sample: { churchName: string; kind: string; mawil: string }[];
};

function IuranImport({
  year,
  onCancel,
  onSaved,
}: {
  year: number;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [sheets, setSheets] = useState<PreviewSheet[]>([]),
    [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [acknowledged, setAcknowledged] = useState(false);
  const selectedSheets = sheets.filter((sheet) => selected.includes(sheet.name));
  const needsCheck = selectedSheets.some((sheet) => sheet.warnings.length || sheet.year !== year);

  async function send(commit: boolean) {
    if (!file) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("year", String(year));
    form.set("action", commit ? "commit" : "preview");
    form.set("sheets", JSON.stringify(selected));
    form.set("acknowledged", String(acknowledged));
    try {
      const result = await responseJson(await fetch("/api/admin/iuran/import", { method: "POST", body: form }));
      if (commit)
        onSaved(`Impor selesai: ${result.created} catatan ditambahkan, ${result.skipped} catatan yang sudah ada dilewati.`);
      else {
        setSheets(result.sheets);
        setSelected(
          result.sheets
            .filter((sheet: PreviewSheet) => sheet.count && !sheet.errors.length && sheet.year === year)
            .map((sheet: PreviewSheet) => sheet.name)
        );
        setAcknowledged(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal mengimpor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="iuran-import space-y-4 rounded-xl border border-blue-200 bg-white p-5" aria-label="Impor Excel iuran">
      <h3 className="text-lg font-bold text-slate-900">Impor Excel untuk tahun {year}</h3>
      <p className="text-sm text-slate-600">
        Mendukung workbook dengan kolom Januari–Desember serta baris Jumlah dan Tgl Terima. Pilih lembar pada pratinjau.
        Catatan yang sudah ada akan dilewati seluruhnya, termasuk nominal bulanannya.
      </p>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <label className="block text-sm font-medium text-slate-700">
        File Excel (.xlsx, maksimal 10 MB)
        <input
          className={`${inputClass} mt-2`}
          type="file"
          accept=".xlsx"
          disabled={busy}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setSheets([]);
            setSelected([]);
            setAcknowledged(false);
          }}
        />
      </label>
      <button className={buttonClass} disabled={!file || busy} onClick={() => send(false)}>
        {busy ? "Memproses..." : "Pratinjau File"}
      </button>
      {sheets.length > 0 && (
        <>
          <div className="max-h-[32rem] space-y-3 overflow-y-auto">
            {sheets.map((sheet) => (
              <div key={sheet.name} className="rounded-lg border border-slate-200 p-4">
                <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-900">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-blue-700"
                    disabled={busy || !sheet.count || !!sheet.errors.length}
                    checked={selected.includes(sheet.name)}
                    onChange={(e) => {
                      setSelected(
                        e.target.checked ? [...selected, sheet.name] : selected.filter((name) => name !== sheet.name)
                      );
                      setAcknowledged(false);
                    }}
                  />
                  {sheet.name} · {sheet.count} catatan · {money(sheet.total)}
                </label>
                <p className="text-xs text-slate-600">
                  Tahun judul: {sheet.year ?? "tidak tercantum"}. Tahun tujuan: {year}.
                </p>
                {sheet.year !== year && !!sheet.count && (
                  <p className="mt-1 text-xs font-medium text-amber-800">
                    Tahun sumber berbeda atau tidak tercantum. Pilih hanya jika data ini memang untuk {year}.
                  </p>
                )}
                {sheet.sample.map((row, i) => (
                  <p key={i} className="mt-1 text-xs text-slate-600">
                    {row.churchName} — {row.kind}
                    {row.mawil ? ` / ${row.mawil}` : ""}
                  </p>
                ))}
                {sheet.warnings.slice(0, 20).map((warning, i) => (
                  <p key={i} className="mt-1 text-xs text-amber-800">
                    {warning}
                  </p>
                ))}
                {sheet.warnings.length > 20 && (
                  <p className="text-xs text-amber-800">Dan {sheet.warnings.length - 20} catatan sumber lainnya.</p>
                )}
                {sheet.errors.slice(0, 20).map((error, i) => (
                  <p key={i} className="mt-1 text-xs text-rose-700">
                    {error}
                  </p>
                ))}
                {!!sheet.errors.length && (
                  <p className="mt-1 text-xs font-semibold text-rose-700">
                    {sheet.errors.length} kesalahan. Lembar ini belum dapat diimpor.
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {selectedSheets.length} lembar / {selectedSheets.reduce((n, s) => n + s.count, 0)} catatan terpilih. Total
            sumber: {money(sumAmounts(selectedSheets.map((s) => s.total)))}.
          </p>
          {needsCheck && (
            <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-5 w-5 accent-blue-700"
                checked={acknowledged}
                disabled={busy}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              Saya sudah memeriksa catatan sumber dan memastikan lembar terpilih merupakan data tahun {year}.
            </label>
          )}
        </>
      )}
      <div className="flex justify-end gap-2">
        <button className={buttonClass} disabled={busy} onClick={onCancel}>
          Tutup
        </button>
        <button
          className={primaryClass}
          disabled={busy || !selected.length || (needsCheck && !acknowledged)}
          onClick={() => send(true)}
        >
          {busy ? "Memproses..." : "Impor Lembar Terpilih"}
        </button>
      </div>
    </section>
  );
}
