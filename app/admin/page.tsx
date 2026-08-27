"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatValue } from "@/config/dashboard";
import EditChurchModal from "@/components/dashboard/EditChurchModal";

type SafeUser = {
  id: string;
  name: string;
  username: string;
  role: string;
  createdAt?: string;
};

export default function AdminPage() {
  // ------------------------------------------------------------- STATE AUTH
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Form Login
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<"churches" | "users">("churches");

  // ------------------------------------------------------------- STATE DATA GEREJA
  const [churches, setChurches] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMada, setFilterMada] = useState("ALL");
  const [filterMawil, setFilterMawil] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals & Action States
  const [editingChurch, setEditingChurch] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Church Form State
  const [newChurch, setNewChurch] = useState({
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
    x: "",
    y: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // ------------------------------------------------------------- STATE MANAJEMEN USER
  const [usersList, setUsersList] = useState<SafeUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    username: "",
    password: "",
    role: "admin" as "admin" | "superadmin",
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState("");

  // ------------------------------------------------------------- INITIAL AUTH CHECK
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkSession();
  }, []);

  // Fetch church records when authenticated
  useEffect(() => {
    if (!currentUser) return;

    async function loadChurches() {
      setLoadingData(true);
      try {
        const res = await fetch("/api/admin/churches");
        if (res.ok) {
          const data = await res.json();
          setChurches(data.features || []);
        }
      } catch (err) {
        console.error("Load churches failed:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadChurches();
  }, [currentUser]);

  // Fetch users list when tab is 'users'
  useEffect(() => {
    if (!currentUser || activeTab !== "users") return;

    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsersList(data.users || []);
        }
      } catch (err) {
        console.error("Load users failed:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, [currentUser, activeTab]);

  // Show toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ------------------------------------------------------------- AUTH HANDLERS
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login gagal.");
      }

      setCurrentUser(data.user);
      showToast(`Selamat datang kembali, ${data.user.name}!`);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setChurches([]);
      setUsersList([]);
      showToast("Anda telah keluar dari sesi Admin.");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ------------------------------------------------------------- CHURCH CRUD HANDLERS
  const handleAddChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);

    try {
      const res = await fetch("/api/admin/churches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChurch),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan data.");
      }

      setChurches((prev) => [data.feature, ...prev]);
      setIsAddModalOpen(false);
      setNewChurch({
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
        x: "",
        y: "",
      });
      showToast("Data gereja baru berhasil ditambahkan ke database!");
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteChurch = async (fid: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/churches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus data.");
      }

      setChurches((prev) => prev.filter((f) => f.properties?.fid !== fid));
      showToast(`Data "${name}" berhasil dihapus.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveEditSuccess = (updatedProperties: any) => {
    setChurches((prev) =>
      prev.map((f) => {
        if (
          f.properties &&
          (f.properties.fid === updatedProperties.fid || f.properties.name === updatedProperties.name)
        ) {
          return {
            ...f,
            properties: { ...f.properties, ...updatedProperties },
          };
        }
        return f;
      })
    );
    showToast("Data gereja berhasil diperbarui!");
  };

  // ------------------------------------------------------------- USER MANAGEMENT HANDLERS
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError("");
    setAddUserLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat pengguna baru.");
      }

      setUsersList((prev) => [...prev, data.user]);
      setIsAddUserModalOpen(false);
      setNewUserData({
        name: "",
        username: "",
        password: "",
        role: "admin",
      });
      showToast(data.message || "Pengguna baru berhasil ditambahkan!");
    } catch (err: any) {
      setAddUserError(err.message);
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Hapus akun pengguna "${username}"? Akun ini tidak akan bisa login lagi.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus pengguna.");
      }

      setUsersList((prev) => prev.filter((u) => u.id !== userId));
      showToast(`Akun "${username}" berhasil dihapus.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ------------------------------------------------------------- FILTERED & PAGINATED LIST
  const madaList = useMemo(() => {
    const set = new Set<string>();
    churches.forEach((f) => {
      if (f.properties?.nama_mada) set.add(String(f.properties.nama_mada).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [churches]);

  const mawilList = useMemo(() => {
    const set = new Set<string>();
    churches.forEach((f) => {
      if (filterMada !== "ALL" && f.properties?.nama_mada !== filterMada) return;
      if (f.properties?.mawil) set.add(String(f.properties.mawil).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [churches, filterMada]);

  const filteredChurches = useMemo(() => {
    return churches.filter((f) => {
      const p = f.properties || {};
      if (filterMada !== "ALL" && p.nama_mada !== filterMada) return false;
      if (filterMawil !== "ALL" && p.mawil !== filterMawil) return false;
      if (filterStatus !== "ALL" && p.status !== filterStatus) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const name = String(p.name || "").toLowerCase();
        const pastor = String(p.nama_pendeta || "").toLowerCase();
        const address = String(p.alamat_gereja || "").toLowerCase();
        return name.includes(q) || pastor.includes(q) || address.includes(q);
      }
      return true;
    });
  }, [churches, filterMada, filterMawil, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredChurches.length / itemsPerPage) || 1;
  const paginatedChurches = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredChurches.slice(start, start + itemsPerPage);
  }, [filteredChurches, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMada, filterMawil, filterStatus]);

  // Loading screen during initial session check
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: LOGIN FORM (AUTH REQUIRED)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4 font-sans text-slate-800">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 rounded-2xl bg-blue-600 text-white px-5 py-3 shadow-xl text-sm font-semibold flex items-center gap-2 animate-bounce">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.74-5.25Z" clipRule="evenodd" />
            </svg>
            {toastMessage}
          </div>
        )}

        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 transition-transform hover:scale-105">
              <div className="relative h-14 w-14 drop-shadow-md">
                <img
                  src="/images/Logo GGP2.png"
                  alt="Logo GGP"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left">
                <h1 className="text-lg font-black tracking-tight text-blue-950">GEREJA GERAKAN PENTAKOSTA</h1>
                <p className="text-xs font-semibold text-slate-500">Sistem Informasi Geospasial</p>
              </div>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Login Administrator</h2>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan akun kredensial Anda untuk mengakses panel manajemen.
              </p>
            </div>

            {loginError && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPass ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPass ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full h-11 mt-2 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-600/25 hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <span>Masuk ke Panel</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1 font-medium">
                <span>← Kembali ke Peta</span>
              </Link>
              <span className="text-[11px] text-slate-400">GGP Monitoring v2.0</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: AUTHENTICATED ADMIN DASHBOARD (LIGHT THEME)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-blue-600 text-white px-5 py-3 shadow-xl text-sm font-semibold flex items-center gap-2 animate-bounce">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.74-5.25Z" clipRule="evenodd" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10">
              <img
                src="/images/Logo GGP2.png"
                alt="Logo GGP"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-blue-950 tracking-tight">PANEL ADMIN GGP</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Sistem Monitoring Persebaran Gereja</p>
            </div>
          </Link>
        </div>

        {/* Tab Navigation & User Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("churches")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "churches"
                  ? "bg-white text-blue-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0018 9H6a1.5 1.5 0 00-1.5 1.5V21" />
              </svg>
              <span>Master Data Gereja</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "users"
                  ? "bg-white text-blue-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>Manajemen Pengguna</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500">@{currentUser.username}</p>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <span>Buka Peta</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* =========================================================================
            TAB 1: MASTER DATA GEREJA
        ========================================================================= */}
        {activeTab === "churches" && (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Gereja Terdata</p>
                <p className="text-2xl font-black text-blue-950 mt-1">{churches.length}</p>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                  Database Aktif
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Daerah (Mada)</p>
                <p className="text-2xl font-black text-blue-950 mt-1">{madaList.length}</p>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                  Wilayah Pelayanan
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Mawil</p>
                <p className="text-2xl font-black text-blue-950 mt-1">{mawilList.length}</p>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                  Majelis Wilayah
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hasil Filter</p>
                <p className="text-2xl font-black text-blue-950 mt-1">{filteredChurches.length}</p>
                <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full mt-2 inline-block">
                  Baris Ditampilkan
                </span>
              </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                {/* Search Bar */}
                <div className="relative min-w-[220px] max-w-sm flex-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama jemaat, pendeta, alamat..."
                    className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-all"
                  />
                </div>

                {/* Filter Mada */}
                <select
                  value={filterMada}
                  onChange={(e) => {
                    setFilterMada(e.target.value);
                    setFilterMawil("ALL");
                  }}
                  className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value="ALL">Semua Mada (Daerah)</option>
                  {madaList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* Filter Mawil */}
                <select
                  value={filterMawil}
                  onChange={(e) => setFilterMawil(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value="ALL">Semua Mawil</option>
                  {mawilList.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>

                {/* Filter Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Milik Sendiri">Milik Sendiri</option>
                  <option value="Pinjam">Pinjam</option>
                  <option value="Sewa">Sewa</option>
                  <option value="Nomaden">Nomaden</option>
                </select>

                {(searchQuery || filterMada !== "ALL" || filterMawil !== "ALL" || filterStatus !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterMada("ALL");
                      setFilterMawil("ALL");
                      setFilterStatus("ALL");
                    }}
                    className="h-9 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Action: Tambah Gereja Baru */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="h-9 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Tambah Gereja Baru</span>
              </button>
            </div>

            {/* Master Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3.5 px-4">No</th>
                      <th className="py-3.5 px-4">Nama Gereja / Pos PI</th>
                      <th className="py-3.5 px-4">Gembala Sidang</th>
                      <th className="py-3.5 px-4">Mada / Mawil</th>
                      <th className="py-3.5 px-4">Alamat</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Jemaat</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingData ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                            <span>Memuat data gereja...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedChurches.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          Tidak ada data gereja yang sesuai dengan kriteria pencarian.
                        </td>
                      </tr>
                    ) : (
                      paginatedChurches.map((feature, idx) => {
                        const p = feature.properties || {};
                        const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                        return (
                          <tr key={p.fid || p.name || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{rowNumber}</td>
                            <td className="py-3 px-4 font-bold text-blue-950">
                              {p.name || p.nama || "-"}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {p.nama_pendeta || p.pendeta || "-"}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{p.nama_mada || "-"}</div>
                              <div className="text-[10px] text-slate-500">{p.mawil || "-"}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={p.alamat_gereja || p.alamat || ""}>
                              {p.alamat_gereja || p.alamat || "-"}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === "Milik Sendiri"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : p.status === "Sewa"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : p.status === "Pinjam"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}>
                                {p.status || "Milik Sendiri"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                              {formatValue(p.jumlah_jemaat, "jumlah_jemaat")}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingChurch(p)}
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 transition-all"
                                  title="Edit Data Gereja"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChurch(p.fid, p.name || p.nama)}
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 transition-all"
                                  title="Hapus Data"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Menampilkan <strong>{paginatedChurches.length}</strong> dari <strong>{filteredChurches.length}</strong> data gereja
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-3 font-bold text-slate-800">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
            TAB 2: MANAJEMEN PENGGUNA (USER MANAGEMENT)
        ========================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Header & Actions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Kelola Akun Administrator</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar akun yang memiliki hak akses untuk mengubah data geodatabase jemaat GGP.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 flex items-center gap-2 transition-all cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                <span>Tambah Pengguna Baru</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Pengguna</th>
                      <th className="py-3.5 px-4">Username</th>
                      <th className="py-3.5 px-4">Peran (Role)</th>
                      <th className="py-3.5 px-4">Tanggal Dibuat</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                            <span>Memuat daftar akun pengguna...</span>
                          </div>
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          Belum ada pengguna terdaftar.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => {
                        const isSelf = u.id === currentUser.id;
                        const isPrimarySuperadmin = u.username === "admin" && u.role === "superadmin";

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">
                                  {u.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {isSelf && (
                                      <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                                        Anda
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-mono">{u.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                              @{u.username}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                u.role === "superadmin"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                                {u.role === "superadmin" ? "Super Admin" : "Administrator"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-mono">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }) : "-"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isSelf || isPrimarySuperadmin ? (
                                <span className="text-[11px] font-medium text-slate-400 italic">
                                  {isSelf ? "Akun Anda" : "Akun Utama"}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                                  title="Hapus Akun Pengguna"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                  </svg>
                                  <span>Hapus</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: EDIT DATA GEREJA
      ========================================================================= */}
      {editingChurch && (
        <EditChurchModal
          isOpen={Boolean(editingChurch)}
          churchData={editingChurch}
          onClose={() => setEditingChurch(null)}
          onSaveSuccess={handleSaveEditSuccess}
        />
      )}

      {/* =========================================================================
          MODAL: TAMBAH GEREJA BARU
      ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tambah Data Gereja Baru</h3>
                <p className="text-xs text-slate-500 mt-0.5">Lengkapi data gereja atau pos PI baru ke dalam geodatabase.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddChurch} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Gereja / Pos PI *</label>
                  <input
                    type="text"
                    required
                    value={newChurch.name}
                    onChange={(e) => setNewChurch({ ...newChurch, name: e.target.value })}
                    placeholder="Contoh: GGP Jemaat Anugerah"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gembala Sidang / Pendeta</label>
                  <input
                    type="text"
                    value={newChurch.nama_pendeta}
                    onChange={(e) => setNewChurch({ ...newChurch, nama_pendeta: e.target.value })}
                    placeholder="Pdt. Nama Pendeta"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Daerah (Mada) *</label>
                  <input
                    type="text"
                    required
                    value={newChurch.nama_mada}
                    onChange={(e) => setNewChurch({ ...newChurch, nama_mada: e.target.value })}
                    placeholder="Contoh: MADA JAWA BARAT"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Wilayah (Mawil)</label>
                  <input
                    type="text"
                    value={newChurch.mawil}
                    onChange={(e) => setNewChurch({ ...newChurch, mawil: e.target.value })}
                    placeholder="Contoh: MAWIL BANDUNG RAYA"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Kepemilikan</label>
                  <select
                    value={newChurch.status}
                    onChange={(e) => setNewChurch({ ...newChurch, status: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  >
                    <option value="Milik Sendiri">Milik Sendiri</option>
                    <option value="Pinjam">Pinjam</option>
                    <option value="Sewa">Sewa</option>
                    <option value="Nomaden">Nomaden</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jumlah Jemaat</label>
                  <input
                    type="number"
                    value={newChurch.jumlah_jemaat}
                    onChange={(e) => setNewChurch({ ...newChurch, jumlah_jemaat: e.target.value })}
                    placeholder="Contoh: 150"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Koordinat Longitude (X) *</label>
                  <input
                    type="text"
                    required
                    value={newChurch.x}
                    onChange={(e) => setNewChurch({ ...newChurch, x: e.target.value })}
                    placeholder="Contoh: 107.6191"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Koordinat Latitude (Y) *</label>
                  <input
                    type="text"
                    required
                    value={newChurch.y}
                    onChange={(e) => setNewChurch({ ...newChurch, y: e.target.value })}
                    placeholder="Contoh: -6.9175"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat Lengkap Gereja</label>
                <textarea
                  rows={2}
                  value={newChurch.alamat_gereja}
                  onChange={(e) => setNewChurch({ ...newChurch, alamat_gereja: e.target.value })}
                  placeholder="Jl. Nama Jalan No. XX, Kelurahan, Kecamatan..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50"
                >
                  {addLoading ? "Menyimpan..." : "Simpan Data Gereja"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TAMBAH PENGGUNA BARU (USER MANAGEMENT)
      ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Akun Pengguna</h3>
                <p className="text-xs text-slate-500 mt-0.5">Buat akun admin baru untuk mengelola sistem.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addUserError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {addUserError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="Contoh: Bpk. John Doe"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value.toLowerCase().trim() })}
                  placeholder="admin_jabar"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Minimal 5 karakter"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Peran / Role *</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as any })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value="admin">Administrator (Kelola Data Gereja)</option>
                  <option value="superadmin">Super Administrator (Akses Penuh)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50"
                >
                  {addUserLoading ? "Membuat..." : "Buat Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
