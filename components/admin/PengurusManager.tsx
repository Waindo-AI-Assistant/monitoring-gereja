"use client";

import React, { useState, useEffect, useMemo } from "react";

export interface PengurusPosition {
  id: string;
  order: number;
  jabatan: string;
  jabatanEn?: string;
  kategori: string;
  subBidang?: string;
  warnaTag: string;
  nama: string;
  gelar?: string;
  noHpWa?: string;
  foto?: string;
  keterangan?: string;
  updatedAt?: string;
}

interface PengurusManagerProps {
  canEdit?: boolean;
  onShowToast: (message: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
  },
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  blue: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
  },
  yellow: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
  },
  amber: {
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-900 border-yellow-300",
  },
  white: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-300",
    badge: "bg-slate-100 text-slate-800 border-slate-300",
  },
};

export default function PengurusManager({ onShowToast, canEdit = false }: PengurusManagerProps) {
  const [data, setData] = useState<PengurusPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "FILLED" | "EMPTY">("ALL");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<PengurusPosition | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pengurus");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal memuat data pengurus.");
      }
      setData(json.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats calculation (excludes diagram label 'sidang-raya')
  const stats = useMemo(() => {
    const list = data.filter((item) => item.id !== "sidang-raya");
    const total = list.length;
    const filled = list.filter((item) => (item.nama || "").trim() !== "").length;
    const empty = total - filled;
    const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { total, filled, empty, percent };
  }, [data]);

  // Categories list for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      if (item.id !== "sidang-raya" && item.kategori) set.add(item.kategori);
    });
    return Array.from(set);
  }, [data]);

  // Filtered list
  const filteredData = useMemo(() => {
    return data
      .filter((item) => item.id !== "sidang-raya")
      .filter((item) => {
        // Filter kategori
        if (selectedKategori !== "ALL" && item.kategori !== selectedKategori) {
          return false;
        }

        // Filter status
        const hasName = Boolean((item.nama || "").trim());
        if (selectedStatus === "FILLED" && !hasName) return false;
        if (selectedStatus === "EMPTY" && hasName) return false;

        // Filter search
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          const j = (item.jabatan || "").toLowerCase();
          const n = (item.nama || "").toLowerCase();
          const k = (item.kategori || "").toLowerCase();
          const s = (item.subBidang || "").toLowerCase();
          return j.includes(q) || n.includes(q) || k.includes(q) || s.includes(q);
        }

        return true;
      });
  }, [data, selectedKategori, selectedStatus, searchQuery]);

  // Handle open edit modal
  const handleOpenEdit = (item: PengurusPosition) => {
    setEditingItem({ ...item });
    setModalError("");
    setIsEditModalOpen(true);
  };

  // Handle save edit modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSaving(true);
    setModalError("");

    try {
      const res = await fetch("/api/admin/pengurus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan perubahan.");
      }

      // Update local state
      setData((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...editingItem, updatedAt: new Date().toISOString() } : item))
      );

      setIsEditModalOpen(false);
      setEditingItem(null);
      onShowToast(`Nama pejabat "${editingItem.jabatan}" berhasil disimpan!`);
    } catch (err: any) {
      setModalError(err.message || "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  // Handle quick clear name
  const handleClearName = async (item: PengurusPosition) => {
    if (!window.confirm(`Kosongkan nama pejabat untuk jabatan "${item.jabatan}"?`)) {
      return;
    }

    try {
      const updated = { ...item, nama: "", gelar: "", foto: "", noHpWa: "" };
      const res = await fetch("/api/admin/pengurus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal mengosongkan nama.");
      }

      setData((prev) => prev.map((p) => (p.id === item.id ? updated : p)));
      onShowToast(`Nama pejabat untuk "${item.jabatan}" telah dikosongkan.`);
    } catch (err: any) {
      alert(err.message || "Gagal mengosongkan nama.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================= STATS HEADER ======================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Posisi</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Jabatan Struktur Sinode</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Sudah Terisi</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.filled}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Pejabat Aktif</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Masih Kosong</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.empty}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Menunggu Diisi</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Kelengkapan</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.percent}%</span>
              <span className="text-xs text-slate-500 font-medium">{stats.filled}/{stats.total} Posisi</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ======================= FILTER & ACTION BAR ======================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari jabatan, nama pejabat, atau bidang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer shrink-0"
            title="Muat ulang data"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Segarkan</span>
          </button>
        </div>

        {/* Filter Badges & Selects */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Filter:
          </span>

          {/* Filter Kategori */}
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Semua Kategori ({data.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({data.filter((d) => d.kategori === cat).length})
              </option>
            ))}
          </select>

          {/* Filter Status Pengisian */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("FILLED")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === "FILLED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Terisi ({stats.filled})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("EMPTY")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === "EMPTY"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Kosong ({stats.empty})
            </button>
          </div>

          <div className="ml-auto text-xs text-slate-400">
            Menampilkan <strong className="text-slate-700">{filteredData.length}</strong> jabatan
          </div>
        </div>
      </div>

      {/* ======================= ERROR OR EMPTY STATE ======================= */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button
            type="button"
            onClick={loadData}
            className="ml-auto text-xs underline font-bold"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* ======================= DATA TABLE & MOBILE CARDS ======================= */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-sm font-medium">Memuat struktur pengurus pusat...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-slate-600">Tidak ada jabatan yang sesuai filter.</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau reset filter kategori.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on mobile/tablet) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Jabatan Struktur</th>
                    <th className="py-3.5 px-4">Kategori & Naungan</th>
                    <th className="py-3.5 px-6">Nama Pejabat (Variabel CMS)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredData.map((item, idx) => {
                    const hasName = Boolean((item.nama || "").trim());
                    const colorStyle = CATEGORY_COLORS[item.warnaTag] || CATEGORY_COLORS.blue;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        {/* No */}
                        <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Jabatan */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {item.jabatan}
                            </span>
                            {item.jabatanEn && (
                              <span className="text-[11px] text-slate-400 italic">
                                {item.jabatanEn}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Kategori & SubBidang */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${colorStyle.badge}`}
                            >
                              {item.kategori}
                            </span>
                            {item.subBidang && (
                              <span className="text-[11px] text-slate-500">
                                {item.subBidang}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Nama Pejabat (Variabel CMS) */}
                        <td className="py-3.5 px-6">
                          {hasName ? (
                            <div className="min-w-0">
                              <span className="font-normal text-slate-900 block truncate" title={item.nama}>
                                {item.nama.replace(/\n/g, " • ")}
                              </span>
                              {item.keterangan && (
                                <span className="text-[11px] text-slate-400 truncate block max-w-xs">
                                  {item.keterangan}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Belum Diisi (Kosong)
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Status Terisi */}
                        <td className="py-3.5 px-4 text-center">
                          {hasName ? (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title="Terisi" />
                          ) : (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" title="Kosong" />
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button style={!canEdit ? { display: "none" } : undefined}
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                              title="Edit Pejabat"
                            >
                              Edit
                            </button>
                            {hasName && (
                              <button style={!canEdit ? { display: "none" } : undefined}
                                type="button"
                                onClick={() => handleClearName(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Kosongkan Nama"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card View (< lg) */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredData.map((item, idx) => {
                const hasName = Boolean((item.nama || "").trim());
                const colorStyle = CATEGORY_COLORS[item.warnaTag] || CATEGORY_COLORS.blue;

                return (
                  <div key={item.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                    {/* Header: No, Kategori & Jabatan */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">#{idx + 1}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${colorStyle.badge}`}>
                            {item.kategori}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                          {item.jabatan}
                        </h4>
                        {item.subBidang && (
                          <p className="text-[11px] text-slate-500">{item.subBidang}</p>
                        )}
                      </div>

                      {/* Edit Button */}
                      <button style={!canEdit ? { display: "none" } : undefined}
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Officer Details */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {hasName ? (
                          <>
                            <span className="font-normal text-sm text-slate-900 block truncate" title={item.nama}>
                              {item.nama.replace(/\n/g, " • ")}
                            </span>
                            {item.keterangan && (
                              <span className="text-[11px] text-slate-500 block truncate">
                                {item.keterangan}
                              </span>
                            )}
                          </>
                        ) : (
                          <div>
                            <span className="text-xs font-bold text-amber-700 block">
                              Belum Ada Nama
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {canEdit ? "Klik Edit untuk mengisi nama pejabat" : "Nama pejabat belum diisi"}
                            </span>
                          </div>
                        )}
                      </div>

                      {hasName && (
                        <button style={!canEdit ? { display: "none" } : undefined}
                          type="button"
                          onClick={() => handleClearName(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Kosongkan Nama"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ======================= EDIT MODAL ======================= */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#0f1d3d] text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {editingItem.kategori}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Edit Pejabat: {editingItem.jabatan}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/70 hover:text-white rounded-xl p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {modalError}
                </div>
              )}

              {/* Jabatan (Read-Only) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nama Jabatan (Tetap)
                </label>
                <input
                  type="text"
                  value={editingItem.jabatan}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-semibold cursor-not-allowed"
                />
              </div>

              {/* Nama Lengkap Pejabat (VARIABEL CMS UTAMA) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nama Lengkap Pejabat <span className="text-rose-500">*</span>
                </label>
                {(editingItem.nama || "").includes("\n") || editingItem.id === "dewan-pembina" || editingItem.id === "badan-pemeriksa-perbendaharaan" ? (
                  <textarea
                    rows={5}
                    placeholder="Nama pejabat / susunan dewan..."
                    value={editingItem.nama || ""}
                    onChange={(e) =>
                      setEditingItem((prev) => (prev ? { ...prev, nama: e.target.value } : null))
                    }
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold font-sans leading-relaxed"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: Pdt. Dicky Suwarta"
                    value={editingItem.nama || ""}
                    onChange={(e) =>
                      setEditingItem((prev) => (prev ? { ...prev, nama: e.target.value } : null))
                    }
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  />
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Variabel ini akan langsung tampil di halaman Pengurus Pusat. Kosongkan jika belum ditetapkan.
                </p>
              </div>

              {/* Keterangan / Deskripsi Tugas */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Keterangan / Deskripsi Tugas
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat peranan atau catatan pelayanan..."
                  value={editingItem.keterangan || ""}
                  onChange={(e) =>
                    setEditingItem((prev) => (prev ? { ...prev, keterangan: e.target.value } : null))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving && (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  )}
                  <span>{saving ? "Menyimpan..." : "Simpan Pejabat"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
