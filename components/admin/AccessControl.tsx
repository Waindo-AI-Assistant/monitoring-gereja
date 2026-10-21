"use client";

import { useEffect, useState } from "react";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";
import { PERMISSION_GROUPS, defaultMatrix, validateMatrix, type Permission, type PermissionMatrix } from "@/lib/permissions";

const ACTION_LABELS = { view: "Lihat", create: "Tambah", update: "Edit", delete: "Hapus" };

export default function AccessControl() {
  const [matrix, setMatrix] = useState<PermissionMatrix>(defaultMatrix);
  const [saved, setSaved] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dirty = saved !== null && JSON.stringify(matrix) !== JSON.stringify(saved);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/permissions", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal memuat hak akses.");
      if (!validateMatrix(result.permissions)) throw new Error("Data hak akses tidak valid.");
      setMatrix(result.permissions);
      setSaved(result.permissions);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal memuat hak akses.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function toggle(role: Role, key: Permission, checked: boolean) {
    if (role === "superadmin") return;
    setMessage("");
    setMatrix((previous) => {
      const next = { ...previous, [role]: { ...previous[role], [key]: checked } };
      const [feature, action] = key.split(".");
      if (checked && action !== "view") next[role][`${feature}.view` as Permission] = true;
      if (!checked && action === "view") {
        for (const permission of Object.keys(next[role]) as Permission[]) {
          if (permission.startsWith(`${feature}.`)) next[role][permission] = false;
        }
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/permissions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions: matrix }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menyimpan hak akses.");
      if (!validateMatrix(result.permissions)) throw new Error("Respons hak akses tidak valid. Muat ulang untuk memeriksa hasil simpan.");
      setMatrix(result.permissions);
      setSaved(result.permissions);
      setMessage("Hak akses tersimpan. Izin baru langsung diperiksa oleh server; muat ulang halaman pengguna untuk memperbarui menu.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan hak akses.");
    } finally { setSaving(false); }
  }

  return (
    <section className="space-y-5" aria-labelledby="access-control-title" aria-busy={loading || saving}>
      <div>
        <h1 id="access-control-title" className="text-xl font-bold text-slate-900">Kelola Hak Akses Role</h1>
        <p className="mt-1 text-sm text-slate-600">Centang izin untuk setiap role, lalu simpan. Perubahan berlaku untuk semua akun dengan role tersebut.</p>
      </div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}{!saved && !loading && <button type="button" onClick={load} className="ml-3 font-semibold underline">Coba lagi</button>}</div>}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}
      {loading ? <p role="status" className="p-6 text-sm text-slate-600">Memuat hak akses...</p> : saved && <>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Pengaturan hak akses fitur berdasarkan role pengguna</caption>
            <thead className="bg-slate-50 text-slate-700">
              <tr><th scope="col" className="p-4 font-semibold">Fitur / Tindakan</th>{ROLES.map((role) => <th key={role} scope="col" className="p-4 text-center font-semibold">{ROLE_LABELS[role]}{role === "superadmin" && <span className="mt-1 block text-xs font-normal text-slate-500">Akses tetap penuh</span>}</th>)}</tr>
            </thead>
            {PERMISSION_GROUPS.map((group) => <tbody key={group.key} className="divide-y divide-slate-100 border-t border-slate-200">
              {group.actions.map((action, index) => {
                const key = `${group.key}.${action}` as Permission;
                return <tr key={key} className="hover:bg-slate-50">
                  <th scope="row" className="px-4 py-3 font-medium text-slate-800">{index === 0 && <span className="mb-1 block font-bold">{group.label}</span>}<span className="text-xs text-slate-600">{ACTION_LABELS[action]}</span></th>
                  {ROLES.map((role) => <td key={role} className="px-4 py-2 text-center"><label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg focus-within:ring-2 focus-within:ring-blue-600"><input type="checkbox" checked={matrix[role][key]} disabled={role === "superadmin" || saving} onChange={(event) => toggle(role, key, event.target.checked)} aria-label={`${ROLE_LABELS[role]}: ${ACTION_LABELS[action]} ${group.label}`} className="h-5 w-5 accent-blue-700 disabled:cursor-not-allowed" /></label></td>)}
                </tr>;
              })}
            </tbody>)}
          </table>
        </div>
        <p className="text-sm text-slate-600">Menonaktifkan izin lihat juga menonaktifkan tindakan lain pada fitur itu. Pengaturan hak akses dan perubahan role akun tetap khusus superadmin.</p>
        <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <span role="status" className="text-sm text-slate-600">{dirty ? "Ada perubahan yang belum disimpan." : "Semua perubahan sudah tersimpan."}</span>
          <div className="flex gap-2">
            <button type="button" disabled={!dirty || saving} onClick={() => { setMatrix(saved); setError(""); setMessage(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Batalkan perubahan</button>
            <button type="button" disabled={!dirty || saving} onClick={save} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan Hak Akses"}</button>
          </div>
        </div>
      </>}
    </section>
  );
}
