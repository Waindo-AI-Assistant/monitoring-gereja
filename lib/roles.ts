export const ROLES = ["superadmin", "biasa", "kepengurusan", "harian_pusat"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Superadmin",
  biasa: "Biasa",
  kepengurusan: "Kepengurusan",
  harian_pusat: "Harian Pusat",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

// Old admin accounts get dashboard access only, as do unrecognized legacy roles.
export function normalizeRole(value: unknown): Role {
  return isRole(value) ? value : "biasa";
}

export function isSuperadmin(role: unknown): boolean {
  return role === "superadmin";
}
