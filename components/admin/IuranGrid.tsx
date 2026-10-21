"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AdminIcon } from "@/components/admin/AdminShell";
import { MONTHS, sumAmounts, validateIuran, formatAmountDisplay, parseToRawAmount, type IuranRecord } from "@/lib/iuran";

export type ChurchGroup = {
  key: string;
  churchName: string;
  mada: string;
  mawil: string;
  pastorName: string;
  records: IuranRecord[];
};

type Props = {
  groups: ChurchGroup[];
  startNumber: number;
  year: number;
  canEdit: boolean;
  canDelete: boolean;
  canCreate?: boolean;
  blocked: boolean;
  wide: boolean;
  onWideChange: () => void;
  formatMoney: (value: string | null) => string;
  onDetails: (row: IuranRecord) => void;
  onDelete: (row: IuranRecord) => void;
  onSaved: (row: IuranRecord) => void;
  onDirtyChange: (dirty: boolean) => void;
  onAddKind?: (group: ChurchGroup) => void;
};

export default function IuranGrid({
  groups,
  startNumber,
  year,
  canEdit,
  canDelete,
  canCreate,
  blocked,
  wide,
  onWideChange,
  formatMoney,
  onDetails,
  onDelete,
  onSaved,
  onDirtyChange,
  onAddKind,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, IuranRecord>>({});
  const draftRef = useRef(drafts);
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const zoom = 90;
  const showNotes = true;
  const dirtyCount = Object.keys(drafts).length;

  useEffect(() => {
    if (!dirtyCount) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const guardLink = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.origin !== window.location.origin || link.pathname === window.location.pathname) return;
      if (!window.confirm("Ada perubahan iuran yang belum disimpan. Tinggalkan halaman dan batalkan perubahan?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardLink, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guardLink, true);
    };
  }, [dirtyCount]);

  function replaceDrafts(next: Record<string, IuranRecord>) {
    draftRef.current = next;
    setDrafts(next);
    onDirtyChange(Object.keys(next).length > 0);
  }

  function cancel(id: string) {
    const next = { ...draftRef.current };
    delete next[id];
    replaceDrafts(next);
    setErrors((previous) => ({ ...previous, [id]: "" }));
  }

  function change(row: IuranRecord, month: number, field: "amount" | "receiptNote", value: string) {
    const current = draftRef.current[row.id] || row;
    const months = MONTHS.map((_, index) => {
      const existing = current.months.find((m) => m.month === index + 1) || { month: index + 1, amount: null, receiptNote: "" };
      const nextVal = field === "amount" ? (value ? formatAmountDisplay(value) : null) : value;
      return index + 1 === month ? { ...existing, [field]: nextVal } : existing;
    });
    const same = months.every((m) => {
      const original = row.months.find((original) => original.month === m.month);
      const mAmount = m.amount ? parseToRawAmount(m.amount) : null;
      const origAmount = original?.amount ? parseToRawAmount(original.amount) : null;
      return mAmount === origAmount && m.receiptNote === (original?.receiptNote ?? "");
    });
    if (same) cancel(row.id);
    else {
      replaceDrafts({ ...draftRef.current, [row.id]: { ...current, months } });
      setErrors((previous) => ({ ...previous, [row.id]: "" }));
    }
  }

  async function save(id: string) {
    const draft = draftRef.current[id];
    if (!draft || saving) return;
    setErrors((previous) => ({ ...previous, [id]: "" }));
    try {
      const cleanDraft: IuranRecord = {
        ...draft,
        months: draft.months.map((m) => ({
          ...m,
          amount: m.amount ? parseToRawAmount(m.amount) : null,
        })),
      };
      validateIuran(cleanDraft);
      setSaving(id);
      const response = await fetch("/api/admin/iuran", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanDraft),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menyimpan baris.");
      if (!result.record) throw new Error("Respons simpan tidak lengkap. Muat ulang untuk memeriksa hasil simpan.");
      onSaved(result.record);
      cancel(id);
    } catch (error) {
      setErrors((previous) => ({ ...previous, [id]: error instanceof Error ? error.message : "Gagal menyimpan baris." }));
    } finally {
      setSaving(null);
    }
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>, row: IuranRecord, column: string) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void save(row.id);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancel(row.id);
      return;
    }
    if (!["Enter", "ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const cells = Array.from(event.currentTarget.closest("table")!.querySelectorAll<HTMLInputElement>(`input[data-grid-column="${column}"]:not(:disabled)`));
    const direction = event.key === "ArrowUp" || (event.key === "Enter" && event.shiftKey) ? -1 : 1;
    const next = cells[cells.indexOf(event.currentTarget) + direction];
    if (next) {
      next.focus();
      next.select();
    }
  }

  function total(row: IuranRecord) {
    try {
      const rawAmounts = row.months.map((m) => (m.amount ? parseToRawAmount(m.amount) : null));
      return formatAmountDisplay(sumAmounts(rawAmounts));
    } catch {
      return "Periksa nominal";
    }
  }

  const actionClass = "min-h-7 rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <>
      <div className="iuran-grid-toolbar">
        <div>
          {canEdit && (
            <span role="status" className={`iuran-save-status${dirtyCount ? " iuran-save-status--dirty" : ""}`}>
              {dirtyCount ? `${dirtyCount} baris belum disimpan` : "Semua tersimpan"}
            </span>
          )}
        </div>

        <div className="iuran-grid-tools">
          <details className="iuran-grid-help">
            <summary>Panduan</summary>
            <p>
              {canEdit
                ? "Satu nomor urut mencakup satu gereja beserta seluruh jenis iurannya (Iuran Wajib dan Perpuluhan Gembala). Klik sel untuk mengetik. Tab: sel berikutnya. Enter / ↑ ↓: pindah baris. Ctrl+S: simpan baris. Esc: batalkan."
                : "Tabel menampilkan 12 bulan per gereja dalam satu nomor urut. Gunakan kontrol Zoom untuk menyesuaikan skala."}
            </p>
          </details>
          <button
            className="text-slate-500 hover:text-slate-800"
            type="button"
            onClick={onWideChange}
            title={wide ? "Kembali ke tampilan normal" : "Perluas area kerja (layar penuh)"}
            aria-label={wide ? "Tutup layar lebar" : "Layar lebar"}
          >
            <AdminIcon name={wide ? "close" : "expand"} className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="iuran-grid-scroll"
        tabIndex={0}
        aria-label="Tabel iuran tahunan 12 bulan per gereja, dapat diedit selayaknya spreadsheet"
      >
        <table
          className="iuran-grid-table"
          style={{ zoom: `${zoom}%` }}
        >
          <colgroup>
            <col style={{ width: "42px", minWidth: "42px" }} />
            <col style={{ width: "230px", minWidth: "230px" }} />
            {MONTHS.map((month) => (
              <col key={month} style={{ width: "76px", minWidth: "76px" }} />
            ))}
            <col style={{ width: "95px", minWidth: "95px" }} />
            {(canEdit || canDelete) && <col style={{ width: "90px", minWidth: "90px" }} />}
          </colgroup>
          <caption className="sr-only">
            Iuran jemaat tahun {year} lengkap 12 bulan (Januari - Desember) dikelompokkan per gereja.
          </caption>
          <thead>
            <tr>
              <th className="iuran-grid-no left-0 z-30 sticky text-center">No</th>
              <th className="iuran-grid-identity left-[42px] z-30 sticky text-left">Jemaat / Wilayah</th>
              {MONTHS.map((month) => (
                <th key={month} className="iuran-grid-month text-center" title={month}>
                  <span className="font-semibold block">{month.slice(0, 3)}</span>
                  <span className="text-[9px] font-normal text-slate-400 block">
                    {showNotes ? "Rp / Tgl" : "Rp"}
                  </span>
                </th>
              ))}
              <th className="iuran-grid-total text-right">Total Tahun</th>
              {(canEdit || canDelete) && <th className="iuran-grid-actions sticky right-0">Tindakan</th>}
            </tr>
          </thead>
          <tbody>
            {groups.map((group, groupIdx) => {
              const churchNo = startNumber + groupIdx;
              const records = group.records;
              const hasPerpuluhan = records.some((r) => r.kind.includes("Perpuluhan"));

              return records.map((original, recordIdx) => {
                const row = drafts[original.id] || original;
                const dirty = !!drafts[row.id];
                const locked = blocked || saving === row.id;
                const bg = dirty ? "bg-amber-50" : "bg-white";
                const isFirst = recordIdx === 0;
                const isLast = recordIdx === records.length - 1;
                const borderBottom = isLast ? "border-b-2 border-slate-400" : "border-b border-dashed border-slate-300";
                const isWajib = row.kind.includes("wajib");

                return (
                  <tr key={row.id} className="align-top">
                    {/* Kolom 1: Nomor Urut (1 nomor untuk 1 gereja) */}
                    {isFirst && (
                      <td
                        rowSpan={records.length}
                        className="iuran-grid-no left-0 z-10 sticky text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-300 border-b-2 border-b-slate-400 p-2 align-middle text-xs select-none"
                      >
                        {churchNo}
                      </td>
                    )}

                    {/* Kolom 2: Jemaat / Wilayah & Jenis Iuran digabung */}
                    <th
                      scope="row"
                      className={`iuran-grid-identity left-[42px] z-10 sticky font-normal text-left ${bg} border-r-2 border-slate-400 ${borderBottom} p-2 align-middle shadow-[3px_0_6px_#17263f12]`}
                    >
                      {isFirst ? (
                        <>
                          <span
                            className="block font-semibold text-slate-900 text-xs leading-snug break-words"
                            title={group.churchName}
                          >
                            {group.churchName}
                          </span>
                          <span
                            className="block text-[10px] text-slate-500 leading-snug mt-0.5 break-words"
                            title={`${group.mada}${group.mawil ? ` / ${group.mawil}` : ""}`}
                          >
                            {group.mada}{group.mawil ? ` / ${group.mawil}` : ""}
                          </span>
                          {!isWajib && (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap bg-emerald-50 text-emerald-800 border border-emerald-200 mt-1"
                            >
                              {row.kind}
                            </span>
                          )}
                          {!isWajib && (group.pastorName || row.pastorName) && (
                            <span
                              className="block text-[10px] text-slate-600 font-medium leading-snug mt-0.5"
                              title={`Gembala: ${row.pastorName || group.pastorName}`}
                            >
                              Gembala: {row.pastorName || group.pastorName}
                            </span>
                          )}
                          {canCreate && isLast && !hasPerpuluhan && onAddKind && (
                            <button
                              type="button"
                              className="mt-1 block text-[9px] text-blue-700 hover:text-blue-900 font-semibold hover:underline cursor-pointer"
                              onClick={() => onAddKind(group)}
                              title="Tambah baris perpuluhan gembala untuk gereja ini"
                            >
                              + 50% Perpuluhan Gembala
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400 text-xs select-none">↳</span>
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap bg-emerald-50 text-emerald-800 border border-emerald-200"
                            >
                              {row.kind}
                            </span>
                          </div>
                          <span
                            className="block text-[10px] text-slate-700 font-medium leading-snug mt-0.5 pl-3 break-words"
                            title={row.pastorName || group.pastorName || "Perpuluhan Gembala"}
                          >
                            {row.pastorName || group.pastorName ? `Gembala: ${row.pastorName || group.pastorName}` : "Perpuluhan Gembala"}
                          </span>
                        </>
                      )}
                      {dirty && <span className="mt-0.5 block text-[9px] font-semibold text-amber-800">Ada perubahan</span>}
                    </th>

                    {/* Kolom Bulan 1..12 */}
                    {MONTHS.map((month, index) => {
                      const m = row.months.find((item) => item.month === index + 1);
                      return (
                        <td key={month} className={`border-r border-slate-300 ${borderBottom} p-0 ${bg}`}>
                          {canEdit ? (
                            <>
                              <input
                                aria-label={`${row.churchName}, ${row.kind}, ${month}, nominal rupiah`}
                                data-grid-column={`${index}-amount`}
                                className="block h-7 w-full bg-transparent px-1.5 py-0.5 text-right tabular-nums text-xs text-slate-900 outline-offset-[-2px] placeholder:text-slate-300 focus:bg-blue-50 focus:outline-2 focus:outline-blue-600 disabled:opacity-60"
                                inputMode="numeric"
                                value={formatAmountDisplay(m?.amount)}
                                placeholder="—"
                                disabled={locked}
                                onFocus={(e) => e.currentTarget.select()}
                                onChange={(e) => change(original, index + 1, "amount", e.target.value)}
                                onKeyDown={(e) => keyDown(e, row, `${index}-amount`)}
                              />
                              {showNotes && (
                                <input
                                  aria-label={`${row.churchName}, ${row.kind}, ${month}, tanggal atau referensi`}
                                  title={m?.receiptNote ?? ""}
                                  data-grid-column={`${index}-receiptNote`}
                                  className="block h-5 w-full border-t border-dashed border-slate-300 bg-transparent px-1.5 text-[9px] text-slate-600 outline-offset-[-2px] placeholder:text-slate-300 focus:bg-blue-50 focus:outline-2 focus:outline-blue-600 disabled:opacity-60"
                                  maxLength={250}
                                  value={m?.receiptNote ?? ""}
                                  placeholder="Tgl/bank"
                                  disabled={locked}
                                  onFocus={(e) => e.currentTarget.select()}
                                  onChange={(e) => change(original, index + 1, "receiptNote", e.target.value)}
                                  onKeyDown={(e) => keyDown(e, row, `${index}-receiptNote`)}
                                />
                              )}
                            </>
                          ) : (
                            <div className="px-1.5 py-1 text-right">
                              <span className="whitespace-nowrap tabular-nums text-xs">{formatAmountDisplay(m?.amount) || "—"}</span>
                              {showNotes && m?.receiptNote && (
                                <span className="mt-0.5 block max-w-20 truncate text-[9px] text-slate-500" title={m.receiptNote}>
                                  {m.receiptNote}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Kolom Total Tahun */}
                    <td className={`iuran-grid-total whitespace-nowrap text-right font-semibold tabular-nums text-slate-900 border-l-2 border-r border-slate-300 ${borderBottom} ${bg}`}>
                      {total(row)}
                      {dirty && <span className="mt-0.5 block text-[9px] font-normal text-amber-800">Pratinjau</span>}
                    </td>

                    {/* Kolom Tindakan */}
                    {(canEdit || canDelete) && (
                      <td className={`iuran-grid-actions sticky right-0 z-10 p-1.5 border-l-2 border-slate-300 ${borderBottom} ${bg}`}>
                        {dirty ? (
                          <div className="flex flex-col gap-1">
                            <button
                              className="min-h-6 rounded bg-blue-700 px-2 text-[10px] font-semibold text-white hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                              disabled={blocked || !!saving}
                              onClick={() => void save(row.id)}
                            >
                              {saving === row.id ? "..." : "Simpan"}
                            </button>
                            <button className={actionClass} disabled={locked} onClick={() => cancel(row.id)}>
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {canEdit && (
                              <button
                                className={actionClass}
                                disabled={blocked || !!saving || !!dirtyCount}
                                onClick={() => onDetails(original)}
                              >
                                Detail
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className={`${actionClass} text-rose-700 hover:bg-rose-50`}
                                disabled={blocked || !!saving || !!dirtyCount}
                                onClick={() => onDelete(original)}
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        )}
                        {errors[row.id] && (
                          <p role="alert" className="mt-1 whitespace-normal text-[9px] text-rose-700">
                            {errors[row.id]}
                          </p>
                        )}
                      </td>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
      {!!dirtyCount && (
        <p className="iuran-grid-pending">
          Total pada baris adalah pratinjau perubahan. Rekap dan ekspor memakai data yang sudah disimpan.
        </p>
      )}
    </>
  );
}
