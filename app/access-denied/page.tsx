"use client";

import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Akses belum diberikan</h1>
        <p className="text-sm text-slate-600">Role akun Anda belum memiliki akses ke dashboard atau panel pengelolaan. Hubungi superadmin untuk meminta akses.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Beranda</Link>
          <button type="button" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" onClick={async () => {
            const response = await fetch("/api/auth/logout", { method: "POST" });
            if (response.ok) window.location.assign("/admin");
          }}>Keluar / Ganti akun</button>
        </div>
      </div>
    </main>
  );
}
