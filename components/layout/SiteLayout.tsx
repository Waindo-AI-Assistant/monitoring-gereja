"use client";

import { usePathname } from "next/navigation";
import SiteNavbar from "@/components/layout/SiteNavbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  return <div className={`site-layout${isDashboard ? " site-layout-map" : ""}`}><SiteNavbar /><div className="site-layout-content">{children}</div></div>;
}
