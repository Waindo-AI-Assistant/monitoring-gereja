"use client";

import React, { useState, useEffect } from "react";

type EditChurchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  churchData: any | null;
  onSaveSuccess: (updatedProperties: any) => void;
};

export default function EditChurchModal({
  isOpen,
  onClose,
  churchData,
  onSaveSuccess,
}: EditChurchModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    nama_pendeta: "",
    no_hp_wa: "",
    alamat_gereja: "",
    tahun_berdiri: "",
    jumlah_jemaat: "",
    jam_operasional: "",
    status: "Milik Sendiri",
    mawil: "",
    nama_mada: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (churchData) {
      setFormData({
        name: churchData.name ? String(churchData.name).trim() : "",
        nama_pendeta: churchData.nama_pendeta ? String(churchData.nama_pendeta).trim() : "",
        no_hp_wa: churchData.no_hp_wa ? String(churchData.no_hp_wa).trim() : "",
        alamat_gereja: churchData.alamat_gereja ? String(churchData.alamat_gereja).trim() : "",
        tahun_berdiri: churchData.tahun_berdiri ? String(churchData.tahun_berdiri).trim() : "",
        jumlah_jemaat: churchData.jumlah_jemaat ? String(churchData.jumlah_jemaat).trim() : "",
        jam_operasional: churchData.jam_operasional ? String(churchData.jam_operasional).trim() : "",
        status: churchData.status ? String(churchData.status).trim() : "Milik Sendiri",
        mawil: churchData.mawil ? String(churchData.mawil).trim() : "",
        nama_mada: churchData.nama_mada ? String(churchData.nama_mada).trim() : "",
      });
      setErrorMsg("");
    }
  }, [churchData, isOpen]);

  if (!isOpen || !churchData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/poi/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: churchData.fid,
          name: churchData.name,
          updatedProperties: formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan perubahan.");
      }

      onSaveSuccess(data.properties);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Lengkapi / Edit Data Gereja</h2>
              <p className="text-[10px] text-slate-500 truncate max-w-[280px]">
                {churchData.name || "Detail Data Gereja"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2 animate-fade-in">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-red-500 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Nama Jemaah */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Nama Gereja</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: GGP FILADELFIA"
              />
            </div>

            {/* Nama Pendeta */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Nama Pendeta / Gembala</label>
              <input
                type="text"
                name="nama_pendeta"
                value={formData.nama_pendeta}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: Pdt. Yohanes, S.Th"
              />
            </div>

            {/* No HP / WhatsApp */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">No. HP / WhatsApp</label>
              <input
                type="text"
                name="no_hp_wa"
                value={formData.no_hp_wa}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: 08123456789"
              />
            </div>

            {/* Alamat Gereja */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Alamat Lengkap Gereja</label>
              <textarea
                name="alamat_gereja"
                value={formData.alamat_gereja}
                onChange={handleChange}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                placeholder="Nama jalan, nomor, RT/RW, kelurahan, kecamatan..."
              />
            </div>

            {/* Jumlah Jemaat */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Jumlah Jemaat (Jiwa)</label>
              <input
                type="text"
                name="jumlah_jemaat"
                value={formData.jumlah_jemaat}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: 150"
              />
            </div>

            {/* Tahun Berdiri */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Tahun Berdiri</label>
              <input
                type="text"
                name="tahun_berdiri"
                value={formData.tahun_berdiri}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: 1995"
              />
            </div>

            {/* Jam Operasional / Ibadah */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Jam Ibadah / Operasional</label>
              <input
                type="text"
                name="jam_operasional"
                value={formData.jam_operasional}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: Minggu 09.00 WIB"
              />
            </div>

            {/* Status Kepemilikan */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Status Kepemilikan</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="Milik Sendiri">Milik Sendiri</option>
                <option value="Pinjam">Pinjam</option>
                <option value="Sewa">Sewa</option>
                <option value="Nomaden">Nomaden</option>
              </select>
            </div>

            {/* Majelis Wilayah */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Majelis Wilayah (Mawil)</label>
              <input
                type="text"
                name="mawil"
                value={formData.mawil}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: Wilayah 1"
              />
            </div>

            {/* Majelis Daerah */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Majelis Daerah (Mada)</label>
              <input
                type="text"
                name="nama_mada"
                value={formData.nama_mada}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: SUMUT"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
