"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { restoreAppLanguage } from "@/lib/i18n";
import SiteNavbar from "@/components/layout/SiteNavbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { i18n } = useTranslation();
  useEffect(() => { void restoreAppLanguage(); }, []);
  useEffect(() => { document.documentElement.lang = i18n.language === "en" ? "en" : "id"; }, [i18n.language]);
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  return <div className={`site-layout${isDashboard ? " site-layout-map" : ""}`}><SiteNavbar /><div className="site-layout-content">{children}</div></div>;
}
