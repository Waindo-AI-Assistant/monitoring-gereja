import { canAccessAdmin, type Permissions } from "@/lib/permissions";

export type NavigationSession = { name: string; permissions: Permissions };
export const PUBLIC_NAVIGATION = [
  { href: "/", label: "nav.home" },
  { href: "/pengurus", label: "nav.leadership" },
  { href: "/sejarah", label: "nav.history" },
  { href: "/dashboard", label: "nav.dashboard" },
];

export function isActiveNavigation(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function getNavigationItems(session: NavigationSession | null) {
  const items = PUBLIC_NAVIGATION.filter((item) => item.href !== "/dashboard" || !session || session.permissions["dashboard.view"]);
  if (!session || canAccessAdmin(session.permissions)) {
    return [...items, { href: "/admin", label: session ? "nav.admin" : "nav.login" }];
  }
  return items;
}
