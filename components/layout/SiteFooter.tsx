"use client";

import { useTranslation } from "react-i18next";

const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Jl.+Kramat+Pulo+no.+22B,+Jakarta+Pusat+10450";

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

export default function SiteFooter() {
  const { t } = useTranslation();

  return (
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
                  <IconEmail className="landing-footer__svg-icon shrink-0" />
                  <span className="break-all">sekretariatmajelispusat@gmail.com</span>
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
  );
}
