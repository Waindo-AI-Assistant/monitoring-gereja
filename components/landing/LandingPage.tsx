"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Jl.+Kramat+Pulo+no.+22B,+Jakarta+Pusat+10450";

/* ─────────────── Inline SVG Icon Components ─────────────── */

function IconMapPin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function IconLocation({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity={0.85} />
      <circle cx="12" cy="9" r="2.5" fill="white" />
    </svg>
  );
}

function IconPhone({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function IconEmail({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalMada: 20,
    totalWilayah: 67,
    totalGereja: 579,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await fetch("/data/poi.geojson");
        if (!res.ok) return;
        const data = await res.json();
        const features = data.features || [];

        const madaSet = new Set<string>();
        const mawilSet = new Set<string>();

        features.forEach((f: any) => {
          const p = f.properties || {};
          if (p.nama_mada && String(p.nama_mada).trim() !== "") {
            madaSet.add(String(p.nama_mada).trim());
          }
          const rawMawil = String(p.mawil || "").trim().replace(/^["']+|["']+$/g, "");
          if (rawMawil && rawMawil !== "-") {
            mawilSet.add(rawMawil);
          }
        });

        if (!cancelled && features.length > 0) {
          setStats({
            totalMada: madaSet.size || 20,
            totalWilayah: 67,
            totalGereja: features.length || 579,
          });
        }
      } catch (err) {
        console.error("Gagal memuat statistik dinamis:", err);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const featureItems = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
      title: t("features.f1_title"),
      desc: t("features.f1_desc"),
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L21.75 16.5 12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
        </svg>
      ),
      title: t("features.f2_title"),
      desc: t("features.f2_desc"),
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      ),
      title: t("features.f3_title"),
      desc: t("features.f3_desc"),
    },
  ];

  return (
    <div className="landing-page">
      {/* ============================== NAVBAR ============================== */}
      <nav
        className={`landing-navbar ${scrolled ? "landing-navbar--scrolled" : ""}`}
      >
        <div className="landing-navbar__inner px-4 sm:px-6">
          <Link href="/" className="landing-navbar__brand flex items-center gap-3">
            <img
              src="/images/Logo GGP2.png"
              alt="Logo GGP"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div className="landing-navbar__text">
              <span className="landing-navbar__title text-sm sm:text-base">
                {t("nav.title")}
              </span>
              <span className="landing-navbar__subtitle hidden sm:block text-[11px]">
                {t("nav.subtitle")}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (md+) */}
          <div className="landing-navbar__links hidden md:flex items-center gap-1 sm:gap-2">
            <Link href="/" className="landing-navbar__link landing-navbar__link--active">
              {t("nav.home")}
            </Link>
            <Link href="/pengurus" className="landing-navbar__link">
              {t("nav.leadership")}
            </Link>
            <Link href="/dashboard" className="landing-navbar__link">
              {t("nav.dashboard")}
            </Link>
            <a href="#kontak" className="landing-navbar__link">
              {t("nav.contact")}
            </a>

            {/* Multi-language Selector */}
            <div className="ml-1 sm:ml-2">
              <LanguageSwitcher variant="compact" />
            </div>
          </div>

          {/* Mobile Hamburger Button (< md) */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileMenuOpen}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                mobileMenuOpen
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50"
                  : "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-5 w-5">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-[1300] bg-slate-950/65 backdrop-blur-xs md:hidden cursor-pointer animate-fade-in"
          />
        )}

        {/* Mobile Navigation Drawer */}
        <div
          className={`fixed inset-y-0 right-0 z-[1310] w-[290px] max-w-[85vw] bg-[#0c1731] border-l border-white/10 shadow-2xl flex flex-col p-5 text-white transition-transform duration-300 ease-out md:hidden overflow-y-auto thin-scroll ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
        >
          {/* Header */}
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
                  Menu Navigasi
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Tutup menu navigasi"
              className="rounded-xl p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Links */}
          <div className="py-4 space-y-1.5 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-2">
              Menu Utama
            </span>

            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-md shadow-blue-600/30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-white shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span>{t("nav.home")}</span>
            </Link>

            <Link
              href="/pengurus"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-emerald-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span>{t("nav.leadership")}</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-blue-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <span>{t("nav.dashboard")}</span>
            </Link>

            <a
              href="#kontak"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-amber-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span>{t("nav.contact")}</span>
            </a>

            <div className="pt-3 mt-3 border-t border-white/10 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Bahasa / Language
              </span>
              <LanguageSwitcher variant="compact" />
            </div>
          </div>
        </div>
      </nav>

      {/* ============================== HERO ================================ */}
      <section className="landing-hero">
        <div className="landing-hero__inner">
          <div className="landing-hero__content">
            {/* <div className="landing-hero__badge">
              <span className="landing-hero__badge-dot" />
              SISTEM GEOSPASIAL TEKNOLOGI KINI
            </div> */}

            <h1 className="landing-hero__heading">
              {t("hero.title_line1")}
            </h1>

            <p className="landing-hero__desc">
              {t("hero.desc")}
            </p>

            {/* CTA Group */}
            {/* <div className="landing-hero__cta-group">
              <Link href="/dashboard" className="landing-hero__cta">
                <IconMapPin className="landing-hero__cta-icon" />
                {t("hero.open_dashboard")}
              </Link>
            </div> */}

            {/* Stats Row */}
            <div className="landing-hero__stats">
              <Link
                href="/pengurus"
                className="landing-hero__stat landing-hero__stat--link group"
                title="Klik untuk melihat Data Pengurus Majelis Pusat 2021 – 2026"
              >
                <div className="flex items-center justify-center gap-1.5 w-full">
                  <span className="landing-hero__stat-value landing-hero__stat-value--period group-hover:text-blue-700 transition-colors text-center">
                    {t("hero.stats_mp_val")}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-blue-500 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <span className="landing-hero__stat-label group-hover:text-blue-600 transition-colors text-center">
                  {t("hero.stats_mp")}
                </span>
              </Link>
              <div className="landing-hero__stat-divider" />
              <div className="landing-hero__stat">
                <span className="landing-hero__stat-value">{stats.totalMada}</span>
                <span className="landing-hero__stat-label">{t("hero.stats_mada")}</span>
              </div>
              <div className="landing-hero__stat-divider" />
              <div className="landing-hero__stat">
                <span className="landing-hero__stat-value">{stats.totalWilayah}</span>
                <span className="landing-hero__stat-label">{t("hero.stats_mawil")}</span>
              </div>
              <div className="landing-hero__stat-divider" />
              <div className="landing-hero__stat">
                <span className="landing-hero__stat-value">{stats.totalGereja}</span>
                <span className="landing-hero__stat-label">{t("hero.stats_gereja")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== DASHBOARD PREVIEW =================== */}
      <section className="landing-preview" aria-labelledby="dashboard-preview-heading">
        <div className="landing-preview__inner">
          <div className="landing-preview__copy">
            <p className="landing-preview__label">{t("preview.label")}</p>
            <h2 id="dashboard-preview-heading" className="landing-preview__heading">
              {t("hero.preview_title")}
            </h2>
            <p className="landing-preview__description">{t("preview.description")}</p>
          </div>
          <figure className="landing-preview__figure">
            <div className="landing-preview__frame">
              <Image
                src="/images/dashboard-indonesia.jpg"
                alt={t("preview.caption")}
                width={1920}
                height={1080}
                className="landing-preview__image"
                unoptimized
              />
            </div>
            <figcaption className="landing-preview__caption">{t("preview.caption")}</figcaption>
          </figure>
          <div className="landing-preview__cta">
            <Link href="/dashboard" className="landing-hero__cta">
              <IconMapPin className="landing-hero__cta-icon" />
              {t("hero.open_dashboard")}
            </Link>
            {/* <span className="landing-preview__hint">{t("preview.hint")}</span> */}
          </div>
        </div>
      </section>

      {/* ============================== FEATURES ============================ */}
      <section className="landing-features">
        <p className="landing-features__label">{t("features.label")}</p>
        <h2 className="landing-features__title">
          {t("features.title")}
        </h2>
        <p className="landing-features__subtitle">
          {t("features.subtitle")}
        </p>

        <div className="landing-features__grid">
          {featureItems.map((f, i) => (
            <div
              key={f.title}
              className="feature-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="feature-card__icon-wrap">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer id="kontak" className="landing-footer">
        <div className="landing-footer__inner">
          {/* Company info */}
          <div className="landing-footer__col landing-footer__col--brand">
            <div className="landing-footer__brand flex items-center gap-3">
              <img
                src="/images/Logo GGP2.png"
                alt="Logo GGP"
                className="h-12 w-auto object-contain shrink-0"
              />
              <div>
                <p className="landing-footer__brand-name">
                  {t("footer.brand_name")}
                </p>
                <p className="landing-footer__brand-sub">
                  {t("footer.brand_sub")}
                </p>
              </div>
            </div>
            <p className="landing-footer__brand-desc">
              {t("footer.brand_desc")}
            </p>
          </div>

          {/* Lokasi */}
          <div className="landing-footer__col">
            <h3 className="landing-footer__col-title">{t("footer.location_title")}</h3>
            <ul className="landing-footer__list">
              <li>
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-footer__link"
                >
                  <IconLocation className="landing-footer__svg-icon" />
                  <span>
                    Jl. Kramat Pulo no. 22B, Jakarta Pusat 10450
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Hubungi Kami */}
          <div className="landing-footer__col">
            <h3 className="landing-footer__col-title">{t("footer.contact_title")}</h3>
            <ul className="landing-footer__list">
              <li>
                <a href="tel:0212128302" className="landing-footer__link">
                  <IconPhone className="landing-footer__svg-icon" />
                  <span>{t("footer.phone_label")}: 021 2128302</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:sekretariatmajelispusat@gmail.com"
                  className="landing-footer__link"
                >
                  <IconEmail className="landing-footer__svg-icon" />
                  <span>sekretariatmajelispusat@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="landing-footer__copy">
          <p>
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
