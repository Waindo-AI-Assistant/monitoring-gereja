"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const GOOGLE_MAPS_URL = "#";
const INSTAGRAM_URL = "#";
const WHATSAPP_URL = "#";


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

function IconInstagram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
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

function IconFax({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125H8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 7.281A48.497 48.497 0 0112 7.004a48.506 48.506 0 00-6.75.277" />
    </svg>
  );
}

function IconWhatsApp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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

/* ════════════════════════════════════════════════════════════ */

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
    title: "Peta Digital Interaktif",
    desc: "Jelajahi wilayah dengan peta digital yang responsif dan berbagai pilihan basemap sesuai kebutuhan.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L21.75 16.5 12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    ),
    title: "Multi-Layer Geospasial",
    desc: "Tampilkan berbagai data spasial seperti lahan, batas wilayah, jalan, persil, dan infrastruktur.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: "Filter Berdasarkan Wilayah & Daerah",
    desc: "Saring sebaran lokasi jemaat dan gereja secara dinamis berdasarkan Majelis Daerah (Mada), Majelis Wilayah (Wilayah), Kabupaten, dan Desa.",
  },

];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* ============================== NAVBAR ============================== */}
      <nav
        className={`landing-navbar ${scrolled ? "landing-navbar--scrolled" : ""}`}
      >
        <div className="landing-navbar__inner">
          <Link href="/" className="landing-navbar__brand flex items-center gap-3">
            <img
              src="/images/Logo GGP2.png?v=2"
              alt="Logo GGP"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div className="landing-navbar__text">
              <span className="landing-navbar__title">
                Gereja Gerakan Pentakosta
              </span>
              <span className="landing-navbar__subtitle">
                Dashboard Pemetaan Sebaran Data Gereja
              </span>
            </div>
          </Link>

          <div className="landing-navbar__links">
            <Link href="/" className="landing-navbar__link landing-navbar__link--active">
              Home
            </Link>
            <Link href="/dashboard" className="landing-navbar__link">
              Dashboard
            </Link>
            <a href="#kontak" className="landing-navbar__link">
              Kontak
            </a>
          </div>
        </div>
      </nav>

      {/* ============================== HERO ================================ */}
      <section className="landing-hero">
        {/* Background decorations */}
        <div className="landing-hero__bg-grid" />
        <div className="landing-hero__bg-glow landing-hero__bg-glow--1" />
        <div className="landing-hero__bg-glow landing-hero__bg-glow--2" />
        <div className="landing-hero__bg-glow landing-hero__bg-glow--3" />

        <div className="landing-hero__inner">
          <div className="landing-hero__content">
            {/* <div className="landing-hero__badge">
              <span className="landing-hero__badge-dot" />
              SISTEM GEOSPASIAL TEKNOLOGI KINI
            </div> */}

            <h1 className="landing-hero__heading">
              Pentakosta Geo{" "}
              <span className="landing-hero__heading-accent">
                Sebaran Data Gereja
              </span>
            </h1>

            <p className="landing-hero__desc">
              Akses informasi spasial jemaat, lokasi gereja, fasilitas pelayanan,
              dan data pendukung untuk mendukung pemantauan dan pelayanan gereja secara terpadu.
            </p>

            {/* CTA Group */}
            <div className="landing-hero__cta-group">
              <Link href="/dashboard" className="landing-hero__cta">
                <IconMapPin className="landing-hero__cta-icon" />
                Buka Dashboard
              </Link>
            </div>

            {/* Stats Row */}
            <div className="landing-hero__stats">
              <div className="landing-hero__stat">
                <span className="landing-hero__stat-value">16</span>
                <span className="landing-hero__stat-label">Wilayah</span>
              </div>
              <div className="landing-hero__stat-divider" />
              <div className="landing-hero__stat">
                <span className="landing-hero__stat-value">494</span>
                <span className="landing-hero__stat-label">Jemaat/Gereja</span>
              </div>
              <div className="landing-hero__stat-divider" />
              <div className="landing-hero__stat">
                <span className="landing-hero__stat-value">10+</span>
                <span className="landing-hero__stat-label">Layer Data</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="landing-hero__preview">
              <div className="landing-hero__preview-frame">
                <div className="landing-hero__preview-toolbar">
                  <span className="landing-hero__preview-dot" style={{ background: "#ff5f57" }} />
                  <span className="landing-hero__preview-dot" style={{ background: "#ffbd2e" }} />
                  <span className="landing-hero__preview-dot" style={{ background: "#28c840" }} />
                  <span className="landing-hero__preview-toolbar-title">
                    Dashboard Geospasial — Monitoring Gereja
                  </span>
                </div>
              <Image
                src="/images/hero-map.png?v=2"
                alt="Preview Peta Dashboard Geospasial"
                width={680}
                height={460}
                className="landing-hero__preview-img"
                priority
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================== FEATURES ============================ */}
      <section className="landing-features">
        <p className="landing-features__label">Fitur Utama</p>
        <h2 className="landing-features__title">
          Solusi Geospasial Lengkap
        </h2>
        <p className="landing-features__subtitle">
          Dilengkapi berbagai fitur untuk mendukung analisis dan perencanaan
          wilayah secara efektif
        </p>

        <div className="landing-features__grid">
          {FEATURES.map((f, i) => (
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
                  PENTAKOSTA GEO
                </p>
                <p className="landing-footer__brand-sub">
                  Sistem Informasi Spasial
                </p>
              </div>
            </div>
            <p className="landing-footer__brand-desc">
              Platform geospasial berbasis peta digital untuk mendukung pemantauan
              jemaat, analisis sebaran gereja, pelayanan jemaat, dan infrastruktur wilayah pelayanan.
            </p>
          </div>

          {/* Lokasi */}
          <div className="landing-footer__col">
            <h3 className="landing-footer__col-title">Lokasi Sekretariat</h3>
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
                    Jl. Jenderal Sudirman No. 12, Pusat Pelayanan Eklesia
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-footer__link"
                >
                  <IconInstagram className="landing-footer__svg-icon" />
                  <span>@monitoring.gereja</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Hubungi Kami */}
          <div className="landing-footer__col">
            <h3 className="landing-footer__col-title">Hubungi Kami</h3>
            <ul className="landing-footer__list">
              <li>
                <a href="tel:02112345678" className="landing-footer__link">
                  <IconPhone className="landing-footer__svg-icon" />
                  <span>021-12345678</span>
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-footer__link"
                >
                  <IconWhatsApp className="landing-footer__svg-icon" />
                  <span>WhatsApp Sekretariat</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@monitoringgereja.org"
                  className="landing-footer__link"
                >
                  <IconEmail className="landing-footer__svg-icon" />
                  <span>info@monitoringgereja.org</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="landing-footer__copy">
          <p>
            &copy; {new Date().getFullYear()} PENTAKOSTA GEO.
          </p>
        </div>
      </footer>
    </div>
  );
}
