"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { hasPermission, type Permissions } from "@/lib/permissions";
import "./admin-workspace.css";

export type AdminSection = "churches" | "pengurus" | "iuran" | "users" | "access";
type Props = { user: { name: string; role: Role }; permissions: Permissions; active: AdminSection; onNavigate: (section: AdminSection) => void; dirty: boolean; isEn: boolean; children: ReactNode };

export function AdminIcon({ name, className = "" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    churches: <><path d="m3 10 9-7 9 7v11H3V10Z" /><path d="M9 21v-7h6v7M12 5v5M10 7h4" /></>,
    pengurus: <><rect x="9" y="3" width="6" height="5" rx="1" /><path d="M12 8v4M5 16v-4h14v4" /><rect x="2" y="16" width="6" height="5" rx="1" /><rect x="16" y="16" width="6" height="5" rx="1" /></>,
    iuran: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 10h18M7 3v4M17 3v4M7 14h3M14 14h3M7 17h3" /></>,
    users: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2" /></>,
    access: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    collapse: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16m6-11-3 3 3 3" /></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" /></>,
    upload: <><path d="M12 16V3m-4 4 4-4 4 4M4 16v5h16v-5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.iuran}</svg>;
}

export default function AdminShell({ user, permissions, active, onNavigate, dirty, isEn, children }: Props) {
  const [collapsed, setCollapsed] = useState(active === "iuran");
  const sections = [
    { id: "churches", label: isEn ? "Churches" : "Data Gereja", group: "data", visible: hasPermission(permissions, "churches.view") },
    { id: "pengurus", label: isEn ? "Leadership" : "Pengurus Pusat", group: "data", visible: hasPermission(permissions, "pengurus.view") },
    { id: "iuran", label: isEn ? "Contributions" : "Iuran Jemaat", group: "finance", visible: hasPermission(permissions, "iuran.view") },
    { id: "users", label: isEn ? "User accounts" : "Akun Pengguna", group: "settings", visible: hasPermission(permissions, "users.view") },
    { id: "access", label: isEn ? "Role permissions" : "Hak Akses Role", group: "settings", visible: user.role === "superadmin" },
  ] as const;
  const current = sections.find((section) => section.id === active)!;
  const groups = [{ id: "data", label: isEn ? "CHURCH DATA" : "DATA & PELAYANAN" }, { id: "finance", label: isEn ? "FINANCE" : "KEUANGAN" }, { id: "settings", label: isEn ? "ADMINISTRATION" : "ADMINISTRASI" }];
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const navButton = (section: typeof sections[number]) => <button key={section.id} type="button" onClick={() => onNavigate(section.id)} aria-current={active === section.id ? "page" : undefined} className="admin-nav-item" title={collapsed ? section.label : undefined}><AdminIcon name={section.id} /><span>{section.label}</span>{section.id === "iuran" && dirty && <span className="admin-nav-dirty" aria-label="Perubahan belum disimpan" />}</button>;
  return <div className={`admin-shell${collapsed ? " admin-shell--collapsed" : ""}`}>
    <a className="admin-skip" href="#admin-main">{isEn ? "Skip to workspace" : "Langsung ke area kerja"}</a>
    <aside className="admin-sidebar" aria-label={isEn ? "Administration" : "Navigasi administrasi"}>
      <div className="admin-sidebar-brand"><span className="admin-brand-mark"><AdminIcon name="churches" /></span><div><strong>{isEn ? "Administration" : "Pengelolaan"}</strong><small>MAJELIS PUSAT GGP</small></div></div>
      <nav aria-label={isEn ? "Management menu" : "Menu pengelolaan"}>{groups.map((group) => {
        const items = sections.filter((section) => section.group === group.id && section.visible);
        return !!items.length && <div className="admin-nav-group" key={group.id}><p>{group.label}</p>{items.map(navButton)}</div>;
      })}</nav>
      <div className="admin-sidebar-bottom"><Link className="admin-public-link" href="/dashboard"><AdminIcon name="arrow" /><span>{isEn ? "Open map dashboard" : "Buka dashboard peta"}</span></Link><div className="admin-profile"><span className="admin-avatar" aria-hidden="true">{initials}</span><div><strong title={user.name}>{user.name}</strong><span>{ROLE_LABELS[user.role]}</span></div></div></div>
    </aside>
    <div className="admin-workspace">
      <header className="admin-context"><div className="admin-context-title"><button type="button" className="admin-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Perluas sidebar" : "Ringkas sidebar"} aria-expanded={!collapsed}><AdminIcon name="collapse" /></button><span className="admin-breadcrumb">{isEn ? "Management" : "Pengelolaan"}<span aria-hidden="true">/</span><h1>{current.label}</h1></span></div><div className="admin-context-account"><span>{ROLE_LABELS[user.role]}</span><span className="admin-avatar" aria-label={user.name}>{initials}</span></div></header>
      <div className="admin-mobile-nav"><label>{isEn ? "Workspace" : "Menu pengelolaan"}<select value={active} onChange={(event) => onNavigate(event.target.value as AdminSection)}>{sections.filter((section) => section.visible).map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}</select></label><span title={user.name}>{user.name}</span></div>
      <main id="admin-main" className="admin-main" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
