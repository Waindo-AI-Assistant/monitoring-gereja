"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

interface PengurusItem {
  readonly role: string;
  readonly roleEn: string;
  readonly name: string;
  readonly titleDesc?: string;
  readonly titleDescEn?: string;
  readonly badge?: string;
  readonly isPrimary?: boolean;
}

const BPH_LEADERS: readonly PengurusItem[] = [
  {
    role: "Ketua Umum",
    roleEn: "General Chairperson",
    name: "Pdt. Dicky Suwarta, M.Th.",
    titleDesc: "Pucuk Pimpinan Sinode Gereja Gerakan Pentakosta",
    titleDescEn: "Head of the Synod of the Pentecostal Movement Church",
    badge: "Pimpinan Utama",
    isPrimary: true,
  },
  {
    role: "Sekretaris Umum",
    roleEn: "General Secretary",
    name: "Pdt. Dr. Robertus Sela, M.Th.",
    titleDesc: "Tata Kelola Administrasi & Kesekretariatan Nasional",
    titleDescEn: "National Synod Administration & Secretariat Management",
    badge: "BPH",
  },
  {
    role: "Bendahara Umum",
    roleEn: "General Treasurer",
    name: "Pdt. Ir. Evi Suriawati Tamin",
    titleDesc: "Pengelolaan Keuangan & Perbendaharaan Sinode",
    titleDescEn: "Financial Management & Synod Treasury",
    badge: "BPH",
  },
  {
    role: "Ketua I",
    roleEn: "First Chairperson",
    name: "Pdt. Soelarto, M.Th.",
    titleDesc: "Bidang Organisasi, Hukum & Pembinaan Pelayan",
    titleDescEn: "Organization, Legal Affairs & Pastoral Ministry",
    badge: "BPH",
  },
  {
    role: "Ketua II",
    roleEn: "Second Chairperson",
    name: "Pdt. Andreas Gunawan, S.Th.",
    titleDesc: "Bidang Misi, Penginjilan & Perintisan Jemaat",
    titleDescEn: "Mission, Evangelism & Church Planting",
    badge: "BPH",
  },
  {
    role: "Ketua III",
    roleEn: "Third Chairperson",
    name: "Pdt. Hengli",
    titleDesc: "Bidang Kategorial, Kemasyarakatan & Pelayanan Kasih",
    titleDescEn: "Departmental Ministry, Community & Social Welfare",
    badge: "BPH",
  },
  {
    role: "Sekretaris I",
    roleEn: "First Secretary",
    name: "Pdt. Sanggam Marpaung, M.Th.",
    titleDesc: "Dukungan Kesekretariatan & Relasi Oikoumene",
    titleDescEn: "Secretariat Support & Ecumenical Relations",
    badge: "BPH",
  },
  {
    role: "Bendahara I",
    roleEn: "First Treasurer",
    name: "Pdp. James Mantak, SE",
    titleDesc: "Pengawasan Akuntabilitas & Anggaran Pelayanan",
    titleDescEn: "Accountability Oversight & Ministry Budget",
    badge: "BPH",
  },
];

interface DepartemenItem {
  readonly name: string;
  readonly nameEn: string;
  readonly desc: string;
  readonly descEn: string;
  readonly iconName: "digital" | "mission" | "theology" | "youth" | "women" | "men" | "children";
}

const DEPARTEMEN_LIST: readonly DepartemenItem[] = [
  {
    name: "Departemen Digitalisasi & Sistem Geospasial",
    nameEn: "Digitalization & Geospatial System Department",
    desc: "Pengembangan sistem digital, pemetaan geospasial sebaran jemaat, dan integrasi data nasional GGP.",
    descEn: "Development of digital platforms, congregation geospatial mapping, and national GGP data integration.",
    iconName: "digital",
  },
  {
    name: "Departemen Misi & Pekabaran Injil",
    nameEn: "Mission & Evangelism Department",
    desc: "Perintisan gereja lokal baru, pengutusan tenaga misi, dan penjangkauan wilayah-wilayah perintis.",
    descEn: "Planting new local churches, sending missionaries, and outreach to pioneer territories.",
    iconName: "mission",
  },
  {
    name: "Departemen Pembinaan & Teologi",
    nameEn: "Pastoral Training & Theology Department",
    desc: "Penguatan doktrin alkitabiah, pembinaan pendeta dan pekerja gereja, serta standarisasi kurikulum gerejawi.",
    descEn: "Strengthening biblical doctrine, pastoral training, and standardization of church curricula.",
    iconName: "theology",
  },
  {
    name: "Departemen Pelayanan Pemuda & Remaja (DPA)",
    nameEn: "Youth & Teens Ministry Department (DPA)",
    desc: "Pembinaan generasi muda gereja melalui persekutuan, kepemimpinan pemuda, dan pemuridan.",
    descEn: "Nurturing church youth generations through fellowship, youth leadership, and discipleship.",
    iconName: "youth",
  },
  {
    name: "Departemen Pelayanan Wanita (DPW)",
    nameEn: "Women's Ministry Department (DPW)",
    desc: "Pemberdayaan kaum wanita gereja dalam doa, pelayanan kasih, dan pembinaan keluarga kristiani.",
    descEn: "Empowerment of women in prayer, social care ministry, and Christian family development.",
    iconName: "women",
  },
  {
    name: "Departemen Pelayanan Pria (DPP)",
    nameEn: "Men's Ministry Department (DPP)",
    desc: "Penguatan kepemimpinan pria sebagai imam keluarga dan penggerak pelayanan di gereja lokal.",
    descEn: "Strengthening men's leadership as heads of families and active ministers in local churches.",
    iconName: "men",
  },
  {
    name: "Departemen Anak & Sekolah Minggu",
    nameEn: "Children & Sunday School Department",
    desc: "Pendidikan rohani anak-anak sejak usia dini dengan kurikulum pembinaan karakter kristiani.",
    descEn: "Early spiritual education for children with Christian character-building curriculum.",
    iconName: "children",
  },
];

function DeptIcon({ type }: { type: DepartemenItem["iconName"] }) {
  if (type === "digital") {
    return (
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    );
  }
  if (type === "mission") {
    return (
      <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === "theology") {
    return (
      <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }
  if (type === "youth") {
    return (
      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (type === "women") {
    return (
      <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  }
  if (type === "men") {
    return (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function PengurusPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* ==================== NAVBAR ==================== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/images/Logo GGP2.png"
              alt="Logo GGP"
              className="h-10 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                Gereja Gerakan Pentakosta
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                Sinode Majelis Pusat (2021 – 2026)
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-4">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
            >
              {t("nav.home")}
            </Link>
            <span className="px-3 py-1.5 rounded-lg text-sm font-bold text-blue-700 bg-blue-50">
              {t("nav.leadership")}
            </span>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
            >
              {t("nav.dashboard")}
            </Link>

            <div className="ml-2">
              <LanguageSwitcher variant="compact" />
            </div>
          </nav>
        </div>
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Breadcrumb */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-widest mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-amber-400">Majelis Pusat 2021 – 2026</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t("pengurus.badge")}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 font-outfit">
            {t("pengurus.title")}
          </h1>

          <div className="inline-block px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-sm font-bold tracking-wide mb-6">
            {t("pengurus.period")}
          </div>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed mb-8">
            {t("pengurus.subtitle")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-sm font-semibold text-white transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t("pengurus.back_home")}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {t("pengurus.open_dashboard")}
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== BPH SECTION ==================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-18 space-y-16">
        <div>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
              {t("pengurus.bph_title")}
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">
              {t("pengurus.bph_desc")}
            </p>
          </div>

          {/* Ketua Umum Card (Featured) */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 p-6 sm:p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 shrink-0">
                  <span className="font-outfit text-3xl sm:text-4xl font-extrabold tracking-wider">
                    DS
                  </span>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black uppercase tracking-wider mb-2">
                    <span>👑</span>
                    {isEn ? BPH_LEADERS[0].roleEn : BPH_LEADERS[0].role}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
                    {BPH_LEADERS[0].name}
                  </h3>
                  <p className="mt-1 text-slate-600 text-sm sm:text-base font-medium">
                    {isEn ? BPH_LEADERS[0].titleDescEn : BPH_LEADERS[0].titleDesc}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Masa Bakti: 2021 – 2026 • Mandat Sidang Raya Sinode GGP XV
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Anggota BPH Lainnya */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BPH_LEADERS.slice(1).map((leader) => (
              <div
                key={leader.role}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
                      {isEn ? leader.roleEn : leader.role}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      2021 – 2026
                    </span>
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900 font-outfit">
                    {leader.name}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium">
                    {isEn ? leader.titleDescEn : leader.titleDesc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Majelis Pusat GGP</span>
                  <span className="font-semibold text-blue-600">Terdaftar</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==================== DEPARTEMEN SECTION ==================== */}
        <div>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
              {t("pengurus.dept_title")}
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">
              {t("pengurus.dept_desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEPARTEMEN_LIST.map((dept) => (
              <div
                key={dept.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-lg hover:border-blue-400 transition-all flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 shrink-0">
                  <DeptIcon type={dept.iconName} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 font-outfit">
                  {isEn ? dept.nameEn : dept.name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed flex-1">
                  {isEn ? dept.descEn : dept.desc}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Pelayanan Sinode</span>
                  <span className="text-blue-600">Aktif</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==================== SEKRETARIAT & KONTAK ==================== */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
                🏛️ KANTOR PUSAT
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
                {t("pengurus.contact_title")}
              </h2>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                {t("pengurus.contact_desc")}
              </p>

              <div className="mt-6 space-y-3.5 text-sm">
                <div className="flex items-start gap-3 text-slate-700">
                  <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <span className="font-bold text-slate-900">Alamat Kantor:</span>
                    <p className="text-slate-600 mt-0.5">
                      Jl. Kramat Pulo No. 22B, RT.04/RW.03, Kramat, Kec. Senen, Kota Jakarta Pusat, DKI Jakarta 10450
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <span className="font-bold text-slate-900">Telepon:</span>{" "}
                    <a href="tel:0212128302" className="text-blue-600 hover:underline font-semibold">
                      021 2128302
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span className="font-bold text-slate-900">Email:</span>{" "}
                    <a href="mailto:sekretariatmajelispusat@gmail.com" className="text-blue-600 hover:underline font-semibold">
                      sekretariatmajelispusat@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 flex flex-col justify-center items-center text-center">
              <img
                src="/images/Logo GGP2.png"
                alt="Logo GGP"
                className="h-16 w-auto object-contain mb-4"
              />
              <h3 className="font-extrabold text-lg text-slate-900 font-outfit">
                Sistem Monitoring & Pemetaan GGP
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Lihat visualisasi interaktif data sebaran gereja, Majelis Daerah (MADA), dan Majelis Wilayah (MAWIL) se-Indonesia.
              </p>
              <Link
                href="/dashboard"
                className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-all hover:scale-105"
              >
                <span>🗺️</span>
                Buka Peta Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 mt-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <img src="/images/Logo GGP2.png" alt="Logo GGP" className="h-8 w-auto object-contain" />
            <span>&copy; {new Date().getFullYear()} PENTAKOSTA • Department Digitalisasi GGP. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <Link href="/pengurus" className="text-blue-400 font-semibold">
              Pengurus Pusat
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard Peta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
