"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatValue } from "@/config/dashboard";
import EditChurchModal from "@/components/dashboard/EditChurchModal";
import CoordinatePickerModal from "@/components/map/CoordinatePickerModal";
import ImageUploadInput from "@/components/ui/ImageUploadInput";
import { exportGeoJSON, exportCSV } from "@/lib/export";
import "@/lib/i18n";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import AccessControl from "@/components/admin/AccessControl";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";
import { defaultPermissions, hasPermission, canAccessAdmin, landingPath, type Permissions, type Permission } from "@/lib/permissions";
import PengurusManager from "@/components/admin/PengurusManager";

type SafeUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
  createdAt?: string;
};

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ------------------------------------------------------------- STATE AUTH
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const allowed = (permission: Permission) => hasPermission(permissions, permission);
  const initialTab = (granted: Permissions) => granted["churches.view"] ? "churches" : granted["pengurus.view"] ? "pengurus" : "users";

  // Form Login
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<"churches" | "users" | "pengurus" | "access">("churches");

  // ------------------------------------------------------------- STATE DATA GEREJA
  const [churches, setChurches] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMada, setFilterMada] = useState("ALL");
  const [filterMawil, setFilterMawil] = useState("ALL");
  const [filterWilayahKhusus, setFilterWilayahKhusus] = useState("ALL");
  const [filterMadaKhusus, setFilterMadaKhusus] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals & Action States
  const [editingChurch, setEditingChurch] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddMapPickerOpen, setIsAddMapPickerOpen] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<{ url: string; name: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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
    tipe_wilayah: "Wilayah Biasa",
    mawil: "",
    nama_mada: "",
    kode_mada: "",
    wilayah_khusus: "",
    daerah_khusus: "",
    x: "",
    y: "",
    foto: "",
    foto_2: "",
    foto_pendeta: "",
    ATTACH: "Tidak",
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
    role: "biasa" as Role,
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState("");

  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    username: string;
    role: Role;
    password: string;
  } | null>(null);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState("");

  // ------------------------------------------------------------- INITIAL AUTH CHECK
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            if (!canAccessAdmin(data.permissions)) {
              window.location.replace(landingPath(data.permissions));
              return;
            }
            setPermissions(data.permissions);
            setActiveTab(initialTab(data.permissions));
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
    if (!currentUser || !permissions["churches.view"]) return;

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
  }, [currentUser, permissions]);

  // Fetch users list when tab is 'users'
  useEffect(() => {
    if (!currentUser || activeTab !== "users" || !permissions["users.view"]) return;

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
  }, [currentUser, activeTab, permissions]);

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

      const destination = new URLSearchParams(window.location.search).get("next");
      if (!canAccessAdmin(data.permissions) || (destination?.startsWith("/dashboard") && data.permissions["dashboard.view"])) {
        window.location.assign(landingPath(data.permissions));
        return;
      }
      setPermissions(data.permissions);
      setActiveTab(initialTab(data.permissions));
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
      const hasPhoto = Boolean(newChurch.foto || newChurch.foto_2 || newChurch.foto_pendeta);
      const isKhusus = newChurch.tipe_wilayah === "Wilayah Khusus";

      const churchPayload = {
        ...newChurch,
        ATTACH: hasPhoto ? "Ada" : "Tidak",
        nama_mada: isKhusus ? (newChurch.daerah_khusus || newChurch.nama_mada) : newChurch.nama_mada,
        mawil: isKhusus ? (newChurch.wilayah_khusus || newChurch.mawil) : newChurch.mawil,
        daerah_khusus: isKhusus ? newChurch.daerah_khusus : "",
        wilayah_khusus: isKhusus ? newChurch.wilayah_khusus : "",
      };

      const res = await fetch("/api/admin/churches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(churchPayload),
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
        tipe_wilayah: "Wilayah Biasa",
        mawil: "",
        nama_mada: "",
        kode_mada: "",
        wilayah_khusus: "",
        daerah_khusus: "",
        x: "",
        y: "",
        foto: "",
        foto_2: "",
        foto_pendeta: "",
        ATTACH: "Tidak",
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
        role: "biasa",
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

  const handleOpenEditUser = (u: SafeUser) => {
    setEditingUser({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      password: "",
    });
    setEditUserError("");
    setIsEditUserModalOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserError("");
    setEditUserLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui data pengguna.");
      }

      setUsersList((prev) =>
        prev.map((u) => (u.id === editingUser.id ? data.user : u))
      );
      if (currentUser?.id === editingUser.id) {
        setCurrentUser(data.user);
      }

      setIsEditUserModalOpen(false);
      setEditingUser(null);
      showToast(data.message || "Data pengguna berhasil diperbarui!");
    } catch (err: any) {
      setEditUserError(err.message);
    } finally {
      setEditUserLoading(false);
    }
  };

  // ------------------------------------------------------------- FILTERED & PAGINATED LIST
  const madaList = useMemo(() => {
    const set = new Set<string>();
    churches.forEach((f) => {
      const p = f.properties || {};
      const isKhusus = p.tipe_wilayah === "Wilayah Khusus" || Boolean(p.daerah_khusus) || String(p.nama_mada || "").toUpperCase().includes("KHUSUS");
      if (!isKhusus && p.nama_mada) {
        set.add(String(p.nama_mada).trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [churches]);

  const mawilList = useMemo(() => {
    const set = new Set<string>();
    churches.forEach((f) => {
      const p = f.properties || {};
      const isKhusus = p.tipe_wilayah === "Wilayah Khusus" || Boolean(p.daerah_khusus) || String(p.nama_mada || "").toUpperCase().includes("KHUSUS");
      if (isKhusus) return;
      if (filterMada !== "ALL" && p.nama_mada !== filterMada) return;
      if (p.mawil) set.add(String(p.mawil).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [churches, filterMada]);

  // Wilayah Khusus (Mawil Khusus - Kiri)
  const wilayahKhususList = useMemo(() => {
    const set = new Set<string>();
    churches.forEach((f) => {
      const p = f.properties || {};
      const isKhusus = p.tipe_wilayah === "Wilayah Khusus" || Boolean(p.wilayah_khusus) || Boolean(p.daerah_khusus) || String(p.nama_mada || "").toUpperCase().includes("KHUSUS");
      if (isKhusus) {
        const val = p.wilayah_khusus || (String(p.nama_mada || "").toUpperCase().includes("MAWIL") ? p.nama_mada : "");
        if (val) set.add(String(val).trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [churches]);

  // Mada Khusus (Daerah Khusus - Kanan)
  const madaKhususList = useMemo(() => {
    const set = new Set<string>();
    churches.forEach((f) => {
      const p = f.properties || {};
      const isKhusus = p.tipe_wilayah === "Wilayah Khusus" && Boolean(p.daerah_khusus);
      if (isKhusus && p.daerah_khusus) {
        set.add(String(p.daerah_khusus).trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [churches]);

  const statsWilayahKhususCount = useMemo(() => {
    return churches.filter((f) => {
      const p = f.properties || {};
      return p.tipe_wilayah === "Wilayah Khusus" || Boolean(p.wilayah_khusus) || Boolean(p.daerah_khusus) || String(p.nama_mada || "").toUpperCase().includes("KHUSUS");
    }).length;
  }, [churches]);

  const statsWilayahBiasaCount = useMemo(() => {
    return churches.length - statsWilayahKhususCount;
  }, [churches, statsWilayahKhususCount]);

  const filteredChurches = useMemo(() => {
    return churches.filter((f) => {
      const p = f.properties || {};
      const isKhusus = p.tipe_wilayah === "Wilayah Khusus" || Boolean(p.wilayah_khusus) || Boolean(p.daerah_khusus) || String(p.nama_mada || "").toUpperCase().includes("KHUSUS");

      if (filterMada !== "ALL" && p.nama_mada !== filterMada) return false;
      if (filterMawil !== "ALL" && p.mawil !== filterMawil) return false;

      // Filter Wilayah Khusus (Mawil Khusus - Kiri)
      if (filterWilayahKhusus !== "ALL") {
        if (!isKhusus) return false;
        const wkVal = p.wilayah_khusus || (String(p.nama_mada || "").toUpperCase().includes("MAWIL") ? p.nama_mada : "");
        if (wkVal !== filterWilayahKhusus) return false;
      }

      // Filter Mada Khusus (Daerah Khusus - Kanan)
      if (filterMadaKhusus !== "ALL") {
        if (!isKhusus) return false;
        if (p.daerah_khusus !== filterMadaKhusus) return false;
      }

      if (filterStatus !== "ALL" && p.status !== filterStatus) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const name = String(p.name || "").toLowerCase();
        const pastor = String(p.nama_pendeta || "").toLowerCase();
        const address = String(p.alamat_gereja || "").toLowerCase();
        const daerahKhusus = String(p.daerah_khusus || "").toLowerCase();
        const wilayahKhusus = String(p.wilayah_khusus || "").toLowerCase();
        return (
          name.includes(q) ||
          pastor.includes(q) ||
          address.includes(q) ||
          daerahKhusus.includes(q) ||
          wilayahKhusus.includes(q)
        );
      }
      return true;
    });
  }, [churches, filterMada, filterMawil, filterWilayahKhusus, filterMadaKhusus, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredChurches.length / itemsPerPage) || 1;
  const activeAdminFilterCount = useMemo(() => {
    return [
      filterMada !== "ALL",
      filterMawil !== "ALL",
      filterWilayahKhusus !== "ALL",
      filterMadaKhusus !== "ALL",
      filterStatus !== "ALL",
    ].filter(Boolean).length;
  }, [filterMada, filterMawil, filterWilayahKhusus, filterMadaKhusus, filterStatus]);
  const paginatedChurches = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredChurches.slice(start, start + itemsPerPage);
  }, [filteredChurches, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMada, filterMawil, filterWilayahKhusus, filterMadaKhusus, filterStatus]);

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
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 rounded-2xl bg-blue-600 text-white px-5 py-3 shadow-xl text-sm font-semibold flex items-center gap-2 animate-bounce">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.74-5.25Z" clipRule="evenodd" />
            </svg>
            {toastMessage}
          </div>
        )}

        {/* Top Navbar Header */}
        <header className="h-16 sm:h-[72px] shrink-0 bg-[#0f1d3d] px-3 sm:px-6 flex items-center justify-between shadow-md sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2 sm:mr-4">
            <Link href="/" className="landing-navbar__brand min-w-0 flex-1">
              <div className="landing-navbar__logo-wrap h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                <img
                  src="/images/Logo GGP2.png"
                  alt="Logo GGP"
                  className="h-8 sm:h-10 w-auto object-contain shrink-0"
                />
              </div>
              <div className="landing-navbar__text min-w-0 flex-1">
                <span className="landing-navbar__title text-xs sm:text-base font-extrabold truncate block">
                  Gereja Gerakan Pentakosta
                </span>
                <span className="landing-navbar__subtitle hidden sm:block text-[10px] truncate">
                  {t("dashboard.subtitle") || "Dashboard Pemetaan Geospasial"}
                </span>
              </div>
            </Link>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center shrink-0">
            <LanguageSwitcher variant="compact" />
          </div>
        </header>

        {/* Center Content Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 my-auto">
          <div className="w-full max-w-md my-auto py-8">
            {/* Form Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    Administrator
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Login Akun</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Masuk untuk mengakses dashboard dan fitur sesuai hak akses akun.
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
                      <span>Masuk</span>
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
      <header className="h-16 sm:h-[72px] shrink-0 bg-[#0f1d3d] px-3 sm:px-6 flex items-center justify-between shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2 sm:mr-4">
          <Link href="/" className="landing-navbar__brand min-w-0 flex-1">
            <div className="landing-navbar__logo-wrap h-8 w-8 sm:h-10 sm:w-10 shrink-0">
              <img
                src="/images/Logo GGP2.png"
                alt="Logo GGP"
                className="h-8 sm:h-10 w-auto object-contain shrink-0"
              />
            </div>
            <div className="landing-navbar__text min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="landing-navbar__title text-xs sm:text-base font-extrabold truncate block">
                  Gereja Gerakan Pentakosta
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase bg-white/10 text-blue-200 border border-white/20 shrink-0">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
              <span className="landing-navbar__subtitle hidden sm:block text-[10px] truncate">
                {t("dashboard.subtitle") || "Dashboard Pemetaan Geospasial"}
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Controls (lg+) */}
        <div className="hidden lg:flex items-center gap-2 sm:gap-3 shrink-0">
          <div>
            <LanguageSwitcher variant="compact" />
          </div>

          <div className="h-6 w-px bg-white/20" />

          {/* Admin Tabs Switch */}
          <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15">
            <button style={!(allowed("churches.view")) ? { display: "none" } : undefined}
              type="button"
              onClick={() => setActiveTab("churches")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "churches"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0018 9H6a1.5 1.5 0 00-1.5 1.5V21" />
              </svg>
              <span>Master Data</span>
            </button>

            <button style={!(allowed("pengurus.view")) ? { display: "none" } : undefined}
              type="button"
              onClick={() => setActiveTab("pengurus")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "pengurus"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span>Pengurus Pusat</span>
            </button>

            <button style={!(allowed("users.view")) ? { display: "none" } : undefined}
              type="button"
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>Pengguna</span>
            </button>
            <button style={!(currentUser.role === "superadmin") ? { display: "none" } : undefined} type="button" onClick={() => setActiveTab("access")} aria-pressed={activeTab === "access"}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTab === "access" ? "bg-blue-600 text-white" : "text-white/70 hover:bg-white/10"}`}>
              Hak Akses
            </button>
          </div>

          <div className="h-6 w-px bg-white/20" />

          {/* User Profile */}
          <div className="text-right">
            <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
            <p className="text-[10px] text-slate-300 font-mono">@{currentUser.username}</p>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-200 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
          >
            <span>Keluar</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </button>
        </div>

        {/* Mobile Controls (< lg) */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Tab Switch */}
          <div className="flex items-center bg-white/10 p-0.5 rounded-xl border border-white/15">
            <button style={!(allowed("churches.view")) ? { display: "none" } : undefined}
              type="button"
              onClick={() => setActiveTab("churches")}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "churches"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title="Master Data Gereja"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0018 9H6a1.5 1.5 0 00-1.5 1.5V21" />
              </svg>
              <span className="hidden xs:inline">Data</span>
            </button>

            <button style={!(allowed("pengurus.view")) ? { display: "none" } : undefined}
              type="button"
              onClick={() => setActiveTab("pengurus")}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "pengurus"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title="Pengurus Pusat GGP"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span className="hidden xs:inline">Pengurus</span>
            </button>

            <button style={!(allowed("users.view")) ? { display: "none" } : undefined}
              type="button"
              onClick={() => setActiveTab("users")}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title="Kelola Pengguna"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span className="hidden xs:inline">User</span>
            </button>
            <button style={!(currentUser.role === "superadmin") ? { display: "none" } : undefined} type="button" onClick={() => setActiveTab("access")} aria-pressed={activeTab === "access"}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTab === "access" ? "bg-blue-600 text-white" : "text-white/70 hover:bg-white/10"}`}>
              Hak Akses
            </button>
          </div>

          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? "Tutup menu admin" : "Buka menu admin"}
            aria-expanded={mobileNavOpen}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer border ${
              mobileNavOpen
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50 border-blue-500"
                : "bg-white/10 text-white hover:bg-white/20 border-white/15"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-5 w-5">
              {mobileNavOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-[1300] bg-slate-950/65 backdrop-blur-xs lg:hidden cursor-pointer animate-fade-in"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-[1310] w-[300px] max-w-[85vw] bg-[#0c1731] border-l border-white/10 shadow-2xl flex flex-col p-5 text-white transition-transform duration-300 ease-out lg:hidden overflow-y-auto thin-scroll ${
          mobileNavOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img
              src="/images/Logo GGP2.png"
              alt="Logo GGP"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div>
              <span className="font-bold text-sm text-white block leading-tight">
                Gereja Gerakan Pentakosta
              </span>
              <span className="text-[10px] text-blue-300 block">
                Panel Administrasi
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Tutup menu navigasi"
            className="rounded-xl p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="my-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-inner">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white truncate block">{currentUser.name}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-blue-500/30 text-blue-300 border border-blue-400/30 shrink-0">
                {ROLE_LABELS[currentUser.role]}
              </span>
            </div>
            <span className="text-[11px] text-slate-300 font-mono truncate block">@{currentUser.username}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="space-y-1.5 pb-4 border-b border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1 mb-2">
            Modul Admin
          </span>
          <button style={!(allowed("churches.view")) ? { display: "none" } : undefined}
            type="button"
            onClick={() => {
              setActiveTab("churches");
              setMobileNavOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "churches"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0018 9H6a1.5 1.5 0 00-1.5 1.5V21" />
            </svg>
            <span>Master Data Gereja</span>
          </button>

          <button style={!(allowed("pengurus.view")) ? { display: "none" } : undefined}
            type="button"
            onClick={() => {
              setActiveTab("pengurus");
              setMobileNavOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "pengurus"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span>Pengurus Pusat GGP</span>
          </button>

          <button style={!(allowed("users.view")) ? { display: "none" } : undefined}
            type="button"
            onClick={() => {
              setActiveTab("users");
              setMobileNavOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span>Kelola Akun Pengguna</span>
          </button>
          <button style={!(currentUser.role === "superadmin") ? { display: "none" } : undefined} type="button" onClick={() => { setActiveTab("access"); setMobileNavOpen(false); }} aria-pressed={activeTab === "access"}
            className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold cursor-pointer ${activeTab === "access" ? "bg-blue-600 text-white" : "text-white/80 hover:bg-white/10"}`}>
            Hak Akses
          </button>
        </div>

        {/* Site Navigation Links */}
        {/* Language Switcher */}
        <div className="py-4 border-b border-white/10 px-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Bahasa / Language
          </span>
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Drawer Footer: Logout */}
        <div className="pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            <span>Keluar dari Sesi Admin</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 sm:p-6 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
        {/* =========================================================================
            TAB 1: MASTER DATA GEREJA
        ========================================================================= */}
        {activeTab === "churches" && allowed("churches.view") && (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Total Gereja</p>
                  <p className="text-xl sm:text-2xl font-black text-blue-950 mt-1">{churches.length}</p>
                </div>
                <span className="text-[9px] sm:text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full mt-2 inline-block border border-emerald-200 w-fit truncate">
                  Database Aktif
                </span>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Wilayah Biasa</p>
                  <p className="text-xl sm:text-2xl font-black text-blue-950 mt-1">{statsWilayahBiasaCount}</p>
                </div>
                <span className="text-[9px] sm:text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-full mt-2 inline-block border border-blue-200 w-fit truncate">
                  {madaList.length} Mada Terdata
                </span>
              </div>

              {/* Mada Khusus (Daerah Khusus - KIRI) */}
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-amber-300 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                <div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider truncate">Mada Khusus</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">{madaKhususList.length}</p>
                </div>
                <span className="text-[9px] sm:text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-full mt-2 inline-block border border-amber-200 w-fit truncate">
                  {madaKhususList.length} Mada Khusus
                </span>
              </div>

              {/* Mawil Khusus (Wilayah Khusus - KANAN) */}
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-amber-300 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                <div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider truncate">Mawil Khusus</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">{statsWilayahKhususCount}</p>
                </div>
                <span className="text-[9px] sm:text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-full mt-2 inline-block border border-amber-200 w-fit truncate">
                  {wilayahKhususList.length} Mawil Khusus
                </span>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Total Mawil</p>
                  <p className="text-xl sm:text-2xl font-black text-blue-950 mt-1">{mawilList.length}</p>
                </div>
                <span className="text-[9px] sm:text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 sm:px-2 py-0.5 rounded-full mt-2 inline-block border border-indigo-200 w-fit truncate">
                  Majelis Wilayah
                </span>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Hasil Filter</p>
                  <p className="text-xl sm:text-2xl font-black text-blue-950 mt-1">{filteredChurches.length}</p>
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-full mt-2 inline-block border border-slate-200 w-fit truncate">
                  Baris Ditampilkan
                </span>
              </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              {/* Row 1: Search Bar & Primary Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search Bar */}
                <div className="relative flex-1">
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

                {/* Mobile Filter Toggle & Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Mobile Filter Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className={`sm:hidden h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeAdminFilterCount > 0 || isMobileFilterOpen
                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500/20"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                    <span>Filter</span>
                    {activeAdminFilterCount > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                        {activeAdminFilterCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportGeoJSON(filteredChurches);
                      showToast(`Berhasil mengunduh ${filteredChurches.length} data dalam format GeoJSON.`);
                    }}
                    title="Unduh GeoJSON"
                    className="h-9 px-2 sm:px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-xs shadow-xs hover:bg-emerald-600 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span className="hidden xs:inline">GeoJSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportCSV(filteredChurches);
                      showToast(`Berhasil mengunduh ${filteredChurches.length} data dalam format CSV.`);
                    }}
                    title="Unduh CSV"
                    className="h-9 px-2 sm:px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs shadow-xs hover:bg-slate-100 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="hidden xs:inline">CSV</span>
                  </button>

                  <button style={!(allowed("churches.create")) ? { display: "none" } : undefined}
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-9 px-2.5 sm:px-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="hidden sm:inline">Tambah Gereja Baru</span>
                    <span className="sm:hidden">Tambah</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Dropdown Filters (Collapsible on Mobile, Inline on Desktop) */}
              <div className={`${isMobileFilterOpen ? "flex" : "hidden"} sm:flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 sm:border-0 sm:pt-0`}>
                {/* Filter Mada (Biasa) */}
                <select
                  value={filterMada}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterMada(val);
                    setFilterMawil("ALL");
                    if (val !== "ALL") {
                      setFilterWilayahKhusus("ALL");
                      setFilterMadaKhusus("ALL");
                    }
                  }}
                  className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="ALL">Semua Mada (Daerah)</option>
                  {madaList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* Filter Mawil (Biasa) */}
                <select
                  value={filterMawil}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterMawil(val);
                    if (val !== "ALL") {
                      setFilterWilayahKhusus("ALL");
                      setFilterMadaKhusus("ALL");
                    }
                  }}
                  className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="ALL">Semua Mawil</option>
                  {mawilList.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>

                <div className="h-5 w-px bg-slate-200 shrink-0 mx-0.5 hidden sm:block" />

                {/* Filter Mada Khusus / Daerah Khusus (KIRI) */}
                <select
                  value={filterMadaKhusus}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterMadaKhusus(val);
                    if (val !== "ALL") {
                      setFilterMada("ALL");
                      setFilterMawil("ALL");
                    }
                  }}
                  className="h-9 px-3 bg-amber-50/70 border border-amber-300 text-amber-950 font-bold rounded-xl text-xs focus:bg-white focus:border-amber-600 outline-none cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="ALL">Semua Mada Khusus</option>
                  {madaKhususList.map((mk) => (
                    <option key={mk} value={mk}>{mk}</option>
                  ))}
                </select>

                {/* Filter Mawil Khusus / Wilayah Khusus (KANAN) */}
                <select
                  value={filterWilayahKhusus}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterWilayahKhusus(val);
                    if (val !== "ALL") {
                      setFilterMada("ALL");
                      setFilterMawil("ALL");
                    }
                  }}
                  className="h-9 px-3 bg-amber-50/70 border border-amber-300 text-amber-950 font-bold rounded-xl text-xs focus:bg-white focus:border-amber-600 outline-none cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="ALL">Semua Mawil Khusus</option>
                  {wilayahKhususList.map((wk) => (
                    <option key={wk} value={wk}>{wk}</option>
                  ))}
                </select>

                <div className="h-5 w-px bg-slate-200 shrink-0 mx-0.5 hidden sm:block" />

                {/* Filter Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Milik Sendiri">Milik Sendiri</option>
                  <option value="Pinjam">Pinjam</option>
                  <option value="Sewa">Sewa</option>
                  <option value="Nomaden">Nomaden</option>
                </select>

                {(searchQuery || filterMada !== "ALL" || filterMawil !== "ALL" || filterWilayahKhusus !== "ALL" || filterMadaKhusus !== "ALL" || filterStatus !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterMada("ALL");
                      setFilterMawil("ALL");
                      setFilterWilayahKhusus("ALL");
                      setFilterMadaKhusus("ALL");
                      setFilterStatus("ALL");
                    }}
                    className="h-9 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer w-full sm:w-auto text-center"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Master Data Container (Responsive Table on Desktop, Card List on Mobile) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* ======================================== MOBILE CARD LIST (< md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {loadingData ? (
                  <div className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                      <span>Memuat data gereja...</span>
                    </div>
                  </div>
                ) : paginatedChurches.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    Tidak ada data gereja yang sesuai dengan kriteria pencarian.
                  </div>
                ) : (
                  paginatedChurches.map((feature, idx) => {
                    const p = feature.properties || {};
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                    const isKhusus = p.tipe_wilayah === "Wilayah Khusus" || p.daerah_khusus || p.wilayah_khusus || String(p.nama_mada || "").toUpperCase().includes("KHUSUS");

                    return (
                      <div key={p.fid || p.name || idx} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-xs text-slate-400 font-bold shrink-0 mt-0.5">#{rowNumber}</span>
                          {p.foto ? (
                            <button
                              type="button"
                              onClick={() => setPreviewModalImage({ url: p.foto, name: p.name || p.nama || "Foto Gereja" })}
                              className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50 cursor-pointer"
                            >
                              <img src={p.foto} alt={p.name || "Foto"} className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center shrink-0">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                              </svg>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-blue-950 line-clamp-2 leading-snug">
                              {p.name || p.nama || "-"}
                            </h4>
                            <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                              {p.nama_pendeta || p.pendeta || "-"}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
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
                              {p.jumlah_jemaat && (
                                <span className="text-[10px] font-bold font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                  {formatValue(p.jumlah_jemaat, "jumlah_jemaat")} Jemaat
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Info Wilayah & Alamat */}
                        <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Wilayah:</span>
                            <span className="font-bold text-slate-800 text-right">
                              {isKhusus
                                ? `${p.wilayah_khusus || "Wilayah Khusus"}${p.daerah_khusus ? ` • ${p.daerah_khusus}` : ""}`
                                : `${p.nama_mada || "-"}${p.mawil ? ` • ${p.mawil}` : ""}`}
                            </span>
                          </div>
                          {p.alamat_gereja && (
                            <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/50">
                              <span className="text-slate-400 font-medium shrink-0">Alamat:</span>
                              <span className="text-slate-700 text-right line-clamp-2 leading-tight break-words">{p.alamat_gereja}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button style={!(allowed("churches.update")) ? { display: "none" } : undefined}
                            type="button"
                            onClick={() => setEditingChurch(p)}
                            className="flex-1 h-9 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button style={!(allowed("churches.delete")) ? { display: "none" } : undefined}
                            type="button"
                            onClick={() => handleDeleteChurch(p.fid, p.name || p.nama)}
                            className="h-9 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ======================================== DESKTOP TABLE VIEW (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3.5 px-3 text-center">No</th>
                      <th className="py-3.5 px-3 text-center">Foto</th>
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
                        <td colSpan={9} className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                            <span>Memuat data gereja...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedChurches.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500">
                          Tidak ada data gereja yang sesuai dengan kriteria pencarian.
                        </td>
                      </tr>
                    ) : (
                      paginatedChurches.map((feature, idx) => {
                        const p = feature.properties || {};
                        const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                        return (
                          <tr key={p.fid || p.name || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 text-center font-mono text-slate-400 font-semibold">{rowNumber}</td>
                            <td className="py-2.5 px-3 text-center">
                              {p.foto ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewModalImage({ url: p.foto, name: p.name || p.nama || "Foto Gereja" })}
                                  className="group relative inline-block rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer bg-slate-50"
                                  title="Klik untuk melihat foto"
                                >
                                  <img
                                    src={p.foto}
                                    alt={p.name || "Foto"}
                                    className="w-10 h-10 object-cover group-hover:scale-105 transition-transform"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                </button>
                              ) : (
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-400 border border-slate-200/60" title="Belum ada foto">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                  </svg>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold text-blue-950">
                              {p.name || p.nama || "-"}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {p.nama_pendeta || p.pendeta || "-"}
                            </td>
                            <td className="py-3 px-4">
                              {p.tipe_wilayah === "Wilayah Khusus" || p.daerah_khusus || p.wilayah_khusus || String(p.nama_mada || "").toUpperCase().includes("KHUSUS") ? (
                                <div>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 mb-0.5">
                                    Wilayah Khusus
                                  </span>
                                  <div className="font-semibold text-slate-800">{p.wilayah_khusus || p.daerah_khusus || p.nama_mada || "-"}</div>
                                  {p.wilayah_khusus && (
                                    <div className="text-[10px] text-slate-500">{p.daerah_khusus || p.nama_mada || "-"}</div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <div className="font-semibold text-slate-800">{p.nama_mada || "-"}</div>
                                  <div className="text-[10px] text-slate-500">{p.mawil || "-"}</div>
                                </div>
                              )}
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
                                <button style={!(allowed("churches.update")) ? { display: "none" } : undefined}
                                  type="button"
                                  onClick={() => setEditingChurch(p)}
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 transition-all cursor-pointer"
                                  title="Edit Data Gereja"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                  </svg>
                                </button>
                                <button style={!(allowed("churches.delete")) ? { display: "none" } : undefined}
                                  type="button"
                                  onClick={() => handleDeleteChurch(p.fid, p.name || p.nama)}
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 transition-all cursor-pointer"
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
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600">
                <span className="text-center sm:text-left">
                  Menampilkan <strong>{paginatedChurches.length}</strong> dari <strong>{filteredChurches.length}</strong> data gereja
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
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
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
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
        {activeTab === "users" && allowed("users.view") && (
          <div className="space-y-6">
            {/* Header & Actions */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Kelola Akun Pengguna</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar akun yang memiliki hak akses untuk mengubah data geodatabase jemaat GGP.
                </p>
              </div>

              <button style={!(allowed("users.create")) ? { display: "none" } : undefined}
                type="button"
                onClick={() => setIsAddUserModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                <span>Tambah Pengguna Baru</span>
              </button>
            </div>

            {/* Users Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* ======================================== MOBILE USER CARDS (< sm) */}
              <div className="sm:hidden divide-y divide-slate-100">
                {loadingUsers ? (
                  <div className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                      <span>Memuat daftar akun pengguna...</span>
                    </div>
                  </div>
                ) : usersList.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    Belum ada pengguna terdaftar.
                  </div>
                ) : (
                  usersList.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    const isPrimarySuperadmin = (u.username === "superadmin" || u.username === "admin") && u.role === "superadmin";

                    return (
                      <div key={u.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                                    Anda
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-600 font-mono">@{u.username}</p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                            u.role === "superadmin"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {ROLE_LABELS[u.role]}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          <span>Dibuat: {u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }) : "-"}</span>

                          <div className="flex items-center gap-1.5">
                            <button style={!(allowed("users.update") && (currentUser.role === "superadmin" || u.role !== "superadmin")) ? { display: "none" } : undefined}
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 cursor-pointer"
                            >
                              Edit
                            </button>
                            {isSelf || isPrimarySuperadmin ? null : (
                              <button style={!(allowed("users.delete") && (currentUser.role === "superadmin" || u.role !== "superadmin")) ? { display: "none" } : undefined}
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 cursor-pointer"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ======================================== DESKTOP USER TABLE (sm+) */}
              <div className="hidden sm:block overflow-x-auto">
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
                        const isPrimarySuperadmin = (u.username === "superadmin" || u.username === "admin") && u.role === "superadmin";

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
                                {ROLE_LABELS[u.role]}
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
                              <div className="flex items-center justify-end gap-1.5">
                                <button style={!(allowed("users.update") && (currentUser.role === "superadmin" || u.role !== "superadmin")) ? { display: "none" } : undefined}
                                  type="button"
                                  onClick={() => handleOpenEditUser(u)}
                                  className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="Edit Data Pengguna"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                  </svg>
                                  <span>Edit</span>
                                </button>

                                {isSelf || isPrimarySuperadmin ? null : (
                                  <button style={!(allowed("users.delete") && (currentUser.role === "superadmin" || u.role !== "superadmin")) ? { display: "none" } : undefined}
                                    type="button"
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="Hapus Akun Pengguna"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                    <span>Hapus</span>
                                  </button>
                                )}
                              </div>
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

        {/* =========================================================================
            TAB 3: CMS STRUKTUR PENGURUS PUSAT (ORGANIZATIONAL CHART CMS)
        ========================================================================= */}
        {activeTab === "pengurus" && allowed("pengurus.view") && (
          <PengurusManager onShowToast={showToast} canEdit={allowed("pengurus.update")} />
        )}
        {currentUser.role === "superadmin" && <div className={activeTab === "access" ? "" : "hidden"}><AccessControl /></div>}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl p-4 sm:p-6 my-auto max-h-[92dvh] overflow-y-auto">
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

                {/* Pilihan Jenis Wilayah: Wilayah Biasa vs Wilayah Khusus */}
                <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Kategori Wilayah <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        newChurch.tipe_wilayah === "Wilayah Biasa"
                          ? "bg-blue-50/80 border-blue-500 text-blue-900 shadow-xs ring-1 ring-blue-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="add_tipe_wilayah"
                        value="Wilayah Biasa"
                        checked={newChurch.tipe_wilayah === "Wilayah Biasa"}
                        onChange={() => setNewChurch({ ...newChurch, tipe_wilayah: "Wilayah Biasa" })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <div>
                        <span className="text-xs font-bold block">Wilayah Biasa</span>
                        <span className="text-[10px] text-slate-500 block">Mada (Daerah) & Mawil (Wilayah)</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        newChurch.tipe_wilayah === "Wilayah Khusus"
                          ? "bg-amber-50/80 border-amber-500 text-amber-900 shadow-xs ring-1 ring-amber-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="add_tipe_wilayah"
                        value="Wilayah Khusus"
                        checked={newChurch.tipe_wilayah === "Wilayah Khusus"}
                        onChange={() => setNewChurch({ ...newChurch, tipe_wilayah: "Wilayah Khusus" })}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-slate-300"
                      />
                      <div>
                        <span className="text-xs font-bold block">Wilayah Khusus</span>
                        <span className="text-[10px] text-slate-500 block">Daerah Khusus & Wilayah Khusus</span>
                      </div>
                    </label>
                  </div>
                </div>

                {newChurch.tipe_wilayah === "Wilayah Biasa" ? (
                  <>
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Mada (Singkatan)</label>
                      <input
                        type="text"
                        value={newChurch.kode_mada}
                        onChange={(e) => setNewChurch({ ...newChurch, kode_mada: e.target.value })}
                        placeholder="Contoh: JABAR"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none uppercase"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Wilayah (Mawil)</label>
                      <input
                        type="text"
                        value={newChurch.mawil}
                        onChange={(e) => setNewChurch({ ...newChurch, mawil: e.target.value })}
                        placeholder="Contoh: MAWIL BANDUNG RAYA"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Mada Khusus (Daerah Khusus)
                      </label>
                      <input
                        type="text"
                        value={newChurch.daerah_khusus}
                        onChange={(e) => setNewChurch({ ...newChurch, daerah_khusus: e.target.value })}
                        placeholder="Contoh: Mada Khusus..."
                        className="w-full h-10 px-3 bg-amber-50/30 border border-amber-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Mawil Khusus (Wilayah Khusus) <span className="text-amber-600 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={newChurch.wilayah_khusus}
                        onChange={(e) => setNewChurch({ ...newChurch, wilayah_khusus: e.target.value })}
                        placeholder="Contoh: MAWIL KHUSUS BALI"
                        className="w-full h-10 px-3 bg-amber-50/30 border border-amber-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none font-semibold"
                      />
                    </div>
                  </>
                )}

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

                {/* Koordinat & Pilih dari Peta */}
                <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Titik Koordinat Lokasi Gereja *</span>
                      <p className="text-[10px] text-slate-500">Longitude (X) dan Latitude (Y) peta</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddMapPickerOpen(true)}
                      className="w-full sm:w-auto justify-center px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Pilih titik koordinat di peta secara visual"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-blue-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span>Pilih dari Peta (Select by Map)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude (X) *</label>
                      <input
                        type="text"
                        required
                        value={newChurch.x}
                        onChange={(e) => setNewChurch({ ...newChurch, x: e.target.value })}
                        placeholder="Contoh: 107.6191"
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:border-blue-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude (Y) *</label>
                      <input
                        type="text"
                        required
                        value={newChurch.y}
                        onChange={(e) => setNewChurch({ ...newChurch, y: e.target.value })}
                        placeholder="Contoh: -6.9175"
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>
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

              {/* Dokumentasi Foto Gedung & Profil Gembala */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-800">Dokumentasi Foto Gedung & Profil Gembala</span>
                  <p className="text-[10px] text-slate-500">Upload foto gedung gereja dan profil pendeta jemaat</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ImageUploadInput
                    label="Foto Utama Gedung"
                    value={newChurch.foto}
                    onChange={(url) => {
                      setNewChurch((prev) => ({
                        ...prev,
                        foto: url,
                        ATTACH: url || prev.foto_2 || prev.foto_pendeta ? "Ada" : prev.ATTACH,
                      }));
                    }}
                    helperText="Tampak depan gereja"
                  />
                  <ImageUploadInput
                    label="Foto Gedung 2"
                    value={newChurch.foto_2}
                    onChange={(url) => {
                      setNewChurch((prev) => ({
                        ...prev,
                        foto_2: url,
                        ATTACH: prev.foto || url || prev.foto_pendeta ? "Ada" : prev.ATTACH,
                      }));
                    }}
                    helperText="Ruang ibadah / samping"
                  />
                  <ImageUploadInput
                    label="Foto Gembala"
                    value={newChurch.foto_pendeta}
                    onChange={(url) => {
                      setNewChurch((prev) => ({
                        ...prev,
                        foto_pendeta: url,
                        ATTACH: prev.foto || prev.foto_2 || url ? "Ada" : prev.ATTACH,
                      }));
                    }}
                    helperText="Profil pendeta jemaat"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50 text-center flex items-center justify-center"
                >
                  {addLoading ? "Menyimpan..." : "Simpan Data Gereja"}
                </button>
              </div>
            </form>

            {/* Modal Pemilih Koordinat Peta untuk Tambah Gereja */}
            <CoordinatePickerModal
              isOpen={isAddMapPickerOpen}
              onClose={() => setIsAddMapPickerOpen(false)}
              churchName={newChurch.name || "Gereja Baru"}
              initialLat={newChurch.y}
              initialLng={newChurch.x}
              onSelect={(coords) => {
                setNewChurch((prev) => ({
                  ...prev,
                  y: String(coords.lat),
                  x: String(coords.lng),
                }));
              }}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TAMBAH PENGGUNA BARU (USER MANAGEMENT)
      ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-4 sm:p-6 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Akun Pengguna</h3>
                <p className="text-xs text-slate-500 mt-0.5">Buat akun dan tentukan role pengguna.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
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
                  disabled={currentUser.role !== "superadmin"}
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as Role })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                >
                  {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}{role === "superadmin" ? " (Akses Penuh)" : " (Sesuai Hak Akses)"}</option>)}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50 text-center cursor-pointer"
                >
                  {addUserLoading ? "Membuat..." : "Buat Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT PENGGUNA
      ========================================================================= */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-4 sm:p-6 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Edit Data Pengguna</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ubah profil atau perbarui password akun.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editUserError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {editUserError}
              </div>
            )}

            <form onSubmit={handleEditUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="Nama Lengkap"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().trim() })}
                  placeholder="username"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Password Baru <span className="text-slate-400 font-normal">(Kosongkan jika tidak ingin diubah)</span>
                </label>
                <input
                  type="password"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder="Minimal 5 karakter (opsional)"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Peran / Role *</label>
                <select
                  disabled={currentUser.role !== "superadmin"}
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                >
                  {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}{role === "superadmin" ? " (Akses Penuh)" : " (Sesuai Hak Akses)"}</option>)}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50 text-center cursor-pointer"
                >
                  {editUserLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Preview Foto */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <span className="font-bold text-xs text-slate-800 truncate pr-4">{previewModalImage.name}</span>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-slate-900 overflow-auto">
              <img
                src={previewModalImage.url}
                alt={previewModalImage.name}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <a
                href={previewModalImage.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                Buka di tab baru
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
