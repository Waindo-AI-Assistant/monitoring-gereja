"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AdminIcon } from "@/components/admin/AdminShell";
import { MONTHS, sumAmounts, validateIuran, type IuranRecord } from "@/lib/iuran";

type Props = {
  rows: IuranRecord[];
  year: number;
  canEdit: boolean;
  canDelete: boolean;
  blocked: boolean;
  wide: boolean;
  onWideChange: () => void;
  formatMoney: (value: string | null) => string;
  onDetails: (row: IuranRecord) => void;
  onDelete: (row: IuranRecord) => void;
  onSaved: (row: IuranRecord) => void;
  onDirtyChange: (dirty: boolean) => void;
};

export default function IuranGrid({ rows, year, canEdit, canDelete, blocked, wide, onWideChange, formatMoney, onDetails, onDelete, onSaved, onDirtyChange }: Props) {
  const [drafts, setDrafts] = useState<Record<string, IuranRecord>>({});
  const draftRef = useRef(drafts);
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState(1);
  const [showNotes, setShowNotes] = useState(true);
  const visibleMonths = MONTHS.map((month, index) => ({ month, index })).filter(({ index }) => period === 0 || Math.floor(index / 3) === period - 1);
  const dirtyCount = Object.keys(drafts).length;

  useEffect(() => {
    if (!dirtyCount) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const guardLink = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.origin !== window.location.origin || link.pathname === window.location.pathname) return;
      if (!window.confirm("Ada perubahan iuran yang belum disimpan. Tinggalkan halaman dan batalkan perubahan?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardLink, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", guardLink, true); };
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
      return index + 1 === month ? { ...existing, [field]: field === "amount" ? value || null : value } : existing;
    });
    const same = months.every((m) => {
      const original = row.months.find((original) => original.month === m.month);
      return m.amount === (original?.amount ?? null) && m.receiptNote === (original?.receiptNote ?? "");
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
      validateIuran(draft);
      setSaving(id);
      const response = await fetch("/api/admin/iuran", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menyimpan baris.");
      if (!result.record) throw new Error("Respons simpan tidak lengkap. Muat ulang untuk memeriksa hasil simpan.");
      onSaved(result.record);
      cancel(id);
    } catch (error) {
      setErrors((previous) => ({ ...previous, [id]: error instanceof Error ? error.message : "Gagal menyimpan baris." }));
    } finally { setSaving(null); }
  }
  function keyDown(event: KeyboardEvent<HTMLInputElement>, row: IuranRecord, column: string) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault(); void save(row.id); return;
    }
    if (event.key === "Escape") { event.preventDefault(); cancel(row.id); return; }
    if (!["Enter", "ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const cells = Array.from(event.currentTarget.closest("table")!.querySelectorAll<HTMLInputElement>(`input[data-grid-column="${column}"]:not(:disabled)`));
    const direction = event.key === "ArrowUp" || (event.key === "Enter" && event.shiftKey) ? -1 : 1;
    const next = cells[cells.indexOf(event.currentTarget) + direction];
    if (next) { next.focus(); next.select(); }
  }
  function total(row: IuranRecord) {
    try { return formatMoney(sumAmounts(row.months.map((m) => m.amount))); }
    catch { return "Periksa nominal"; }
  }
  const actionClass = "min-h-10 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

  return <>
    <div className="iuran-grid-toolbar">
      <div className="iuran-grid-options"><div className="iuran-periods" role="group" aria-label="Bulan yang ditampilkan">{["Setahun", "Jan–Mar", "Apr–Jun", "Jul–Sep", "Okt–Des"].map((label, index) => <button type="button" key={label} aria-pressed={period === index} onClick={() => setPeriod(index)}>{label}</button>)}</div><label><input type="checkbox" checked={showNotes} onChange={(event) => setShowNotes(event.target.checked)} />Tanggal / bank</label></div>
      <div className="iuran-grid-tools">{canEdit && <span role="status" className={`iuran-save-status${dirtyCount ? " iuran-save-status--dirty" : ""}`}>{dirtyCount ? `${dirtyCount} baris belum disimpan` : "Semua tersimpan"}</span>}<details className="iuran-grid-help"><summary>Panduan</summary><p>{canEdit ? "Klik sel untuk mengetik. Tab: sel berikutnya. Enter / ↑ ↓: pindah baris. Ctrl+S: simpan baris. Esc: batalkan baris. Filter dan halaman dikunci selama ada perubahan." : "Pilih rentang bulan untuk melihat penerimaan. Total tahun mencakup seluruh bulan."}</p></details><button className="text-slate-500" type="button" onClick={onWideChange} title={wide ? "Kembali ke tampilan normal" : "Perluas area kerja"} aria-label={wide ? "Tutup layar lebar" : "Layar lebar"}><AdminIcon name={wide ? "close" : "expand"} className="h-4 w-4" /></button></div>
    </div>
    <div className="iuran-grid-scroll" tabIndex={0} aria-label="Tabel iuran yang dapat diedit, geser untuk melihat semua bulan">
      <table className="iuran-grid-table">
        <caption className="sr-only">Iuran jemaat tahun {year}. Kolom bulanan berisi nominal rupiah dan tanggal / referensi penerimaan.</caption>
        <thead><tr>
          <th className="iuran-grid-identity left-0 z-30 md:sticky">Jemaat / Jenis</th>
          {visibleMonths.map(({ month }) => <th key={month} className="iuran-grid-month text-center">{month}<span>{showNotes ? "Nominal / Tanggal atau bank" : "Nominal (Rp)"}</span></th>)}
          <th className="iuran-grid-total text-right">Total Tahun</th>
          {(canEdit || canDelete) && <th className="iuran-grid-actions sticky right-0">Tindakan</th>}
        </tr></thead>
        <tbody>{rows.map((original) => {
          const row = drafts[original.id] || original;
          const dirty = !!drafts[row.id];
          const locked = blocked || saving === row.id;
          const bg = dirty ? "bg-amber-50" : "bg-white";
          return <tr key={row.id} className="align-top">
            <th scope="row" className={`iuran-grid-identity left-0 z-10 font-normal md:sticky ${bg}`}>
              <span className="block font-semibold text-slate-900">{row.churchName}</span>
              <span className="mt-1 block text-xs text-slate-600">{row.mada}{row.mawil ? ` / ${row.mawil}` : ""}</span>
              <span className="mt-2 block text-xs font-medium text-blue-800">{row.kind}</span>
              {row.pastorName && <span className="mt-1 block text-xs text-slate-600">{row.pastorName}</span>}
              {dirty && <span className="mt-2 block text-xs font-semibold text-amber-800">Belum disimpan</span>}
            </th>
            {visibleMonths.map(({ month, index }) => {
              const m = row.months.find((m) => m.month === index + 1);
              return <td key={month} className={`border-b border-r border-slate-200 p-0 ${bg}`}>
                {canEdit ? <>
                  <input aria-label={`${row.churchName}, ${row.kind}, ${month}, nominal rupiah`} data-grid-column={`${index}-amount`} className="block h-11 w-full min-w-44 bg-transparent px-3 text-right tabular-nums text-slate-900 outline-offset-[-2px] placeholder:text-slate-400 focus:bg-blue-50 focus:outline-2 focus:outline-blue-600 disabled:opacity-60" inputMode="decimal" value={m?.amount ?? ""} placeholder="—" disabled={locked} onFocus={(e) => e.currentTarget.select()} onChange={(e) => change(original, index + 1, "amount", e.target.value)} onKeyDown={(e) => keyDown(e, row, `${index}-amount`)} />
                  {showNotes && <input aria-label={`${row.churchName}, ${row.kind}, ${month}, tanggal atau referensi`} title={m?.receiptNote ?? ""} data-grid-column={`${index}-receiptNote`} className="block h-11 w-full min-w-44 border-t border-dashed border-slate-200 bg-transparent px-3 text-xs text-slate-600 outline-offset-[-2px] placeholder:text-slate-400 focus:bg-blue-50 focus:outline-2 focus:outline-blue-600 disabled:opacity-60" maxLength={250} value={m?.receiptNote ?? ""} placeholder="Tanggal / bank" disabled={locked} onFocus={(e) => e.currentTarget.select()} onChange={(e) => change(original, index + 1, "receiptNote", e.target.value)} onKeyDown={(e) => keyDown(e, row, `${index}-receiptNote`)} />}
                </> : <div className="p-3 text-right"><span className="whitespace-nowrap tabular-nums">{formatMoney(m?.amount ?? null)}</span>{showNotes && m?.receiptNote && <span className="mt-2 block max-w-48 break-words text-xs text-slate-500">{m.receiptNote}</span>}</div>}
              </td>;
            })}
            <td className={`iuran-grid-total whitespace-nowrap text-right font-semibold tabular-nums text-slate-900 ${bg}`}>{total(row)}{dirty && <span className="mt-1 block text-xs font-normal text-amber-800">Pratinjau</span>}</td>
            {(canEdit || canDelete) && <td className={`iuran-grid-actions sticky right-0 z-10 p-3 ${bg}`}>
              {dirty ? <div className="flex flex-col gap-2"><button className="min-h-10 rounded-md bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50" disabled={blocked || !!saving} onClick={() => void save(row.id)}>{saving === row.id ? "Menyimpan..." : "Simpan Baris"}</button><button className={actionClass} disabled={locked} onClick={() => cancel(row.id)}>Batal</button></div> : <div className="flex flex-col gap-2">{canEdit && <button className={actionClass} disabled={blocked || !!saving || !!dirtyCount} onClick={() => onDetails(original)}>Detail</button>}{canDelete && <button className={`${actionClass} text-rose-700`} disabled={blocked || !!saving || !!dirtyCount} onClick={() => onDelete(original)}>Hapus</button>}</div>}
              {errors[row.id] && <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{errors[row.id]}</p>}
            </td>}
          </tr>;
        })}</tbody>
      </table>
    </div>
    {!!dirtyCount && <p className="iuran-grid-pending">Total pada baris adalah pratinjau perubahan. Rekap dan ekspor memakai data yang sudah disimpan.</p>}
  </>;
}
