"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { getNavigationItems, isActiveNavigation, type NavigationSession } from "@/lib/navigation";

export default function SiteNavbar() {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [session, setSession] = useState<NavigationSession | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let revision = 0;
    const refresh = async () => {
      const current = ++revision;
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store", signal: controller.signal });
        const data = response.ok ? await response.json() : null;
        if (!controller.signal.aborted && current === revision) {
          setSession(data?.authenticated && data.user && data.permissions ? { name: data.user.name, permissions: data.permissions } : null);
        }
      } catch {
        if (!controller.signal.aborted && current === revision) setSession(null);
      }
    };
    void refresh();
    window.addEventListener("ggp-session-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.removeEventListener("ggp-session-changed", refresh); window.removeEventListener("focus", refresh); };
  }, [pathname]);

  useEffect(() => { setOpen(false); setError(""); }, [pathname]);
  useEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnDesktop = () => { if (window.matchMedia("(min-width: 1100px)").matches) setOpen(false); };
    window.addEventListener("resize", closeOnDesktop);
    return () => { document.body.style.overflow = previous; window.removeEventListener("resize", closeOnDesktop); };
  }, [open]);

  async function logout() {
    setLoggingOut(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout");
      window.location.assign("/admin");
    } catch {
      setError(isEn ? "Sign out failed. Please try again." : "Gagal keluar. Silakan coba lagi.");
      setLoggingOut(false);
    }
  }

  const items = getNavigationItems(session);
  const links = (mobile = false) => items.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={isActiveNavigation(pathname, item.href) ? "page" : undefined} className={mobile ? "site-navbar-mobile-link" : "site-navbar-link"}>{t(item.label)}</Link>);
  const signOut = <button type="button" onClick={logout} disabled={loggingOut} className="site-navbar-logout">{loggingOut ? (isEn ? "Signing out…" : "Keluar…") : (isEn ? "Sign out" : "Keluar")}</button>;

  return (
    <>
      <header className="site-navbar" data-site-navbar>
        <div className="site-navbar-inner">
          <Link href="/" className="site-navbar-brand" onClick={() => setOpen(false)}><img src="/images/Logo GGP2.png" alt="Logo GGP" width={36} height={44} /><span><strong>{t("nav.title")}</strong><small>{t("nav.subtitle")}</small></span></Link>
          <nav className="site-navbar-desktop" aria-label={isEn ? "Main navigation" : "Navigasi utama"}>{links()}<LanguageSwitcher variant="compact" />{session && signOut}</nav>
          <button type="button" className="site-navbar-menu" aria-label={isEn ? "Open navigation menu" : "Buka menu navigasi"} aria-expanded={open} aria-controls="site-navigation-dialog" onClick={() => setOpen(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
        </div>
        {error && !open && <p role="alert" className="site-navbar-error">{error}</p>}
      </header>
      <dialog ref={dialog} id="site-navigation-dialog" className="site-navbar-dialog" aria-labelledby="site-navigation-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <div className="site-navbar-drawer">
          <div className="site-navbar-drawer-heading"><h2 id="site-navigation-title">{isEn ? "Navigation" : "Menu Navigasi"}</h2><button type="button" autoFocus onClick={() => setOpen(false)} aria-label={isEn ? "Close navigation menu" : "Tutup menu navigasi"}>×</button></div>
          <nav aria-label={isEn ? "Mobile navigation" : "Navigasi mobile"}>{links(true)}</nav>
          <div className="site-navbar-drawer-footer"><LanguageSwitcher variant="compact" />{session && <><p>{session.name}</p>{signOut}</>}{error && <p role="alert">{error}</p>}</div>
        </div>
      </dialog>
    </>
  );
}
