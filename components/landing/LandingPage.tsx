"use client";

import Image from "next/image";
import SiteFooter from "@/components/layout/SiteFooter";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";



/* ─────────────── Inline SVG Icon Components ─────────────── */

function IconMapPin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalMada: 20,
    totalWilayah: 67,
    totalGereja: 579,
  });


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
                    {t("hero.stats_mp")}
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
                  {t("hero.stats_mp_val")}
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
      <SiteFooter />
    </div>
  );
}
