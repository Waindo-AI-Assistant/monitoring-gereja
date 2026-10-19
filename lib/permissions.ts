import { ROLES, type Role } from "@/lib/roles";

export const PERMISSION_GROUPS = [
  { label: "Dashboard", key: "dashboard", actions: ["view"] },
  { label: "Data gereja", key: "churches", actions: ["view", "create", "update", "delete"] },
  { label: "Pengurus pusat", key: "pengurus", actions: ["view", "update"] },
  { label: "Pengguna", key: "users", actions: ["view", "create", "update", "delete"] },
] as const;

export const PERMISSION_KEYS = [
  "dashboard.view", "churches.view", "churches.create", "churches.update", "churches.delete",
  "pengurus.view", "pengurus.update", "users.view", "users.create", "users.update", "users.delete",
] as const;
export type Permission = (typeof PERMISSION_KEYS)[number];
export type Permissions = Record<Permission, boolean>;
export type PermissionMatrix = Record<Role, Permissions>;

export function defaultPermissions(role?: Role): Permissions {
  return Object.fromEntries(PERMISSION_KEYS.map((key) => [key, role === "superadmin" || (role !== undefined && key === "dashboard.view")])) as Permissions;
}

export function defaultMatrix(): PermissionMatrix {
  return Object.fromEntries(ROLES.map((role) => [role, defaultPermissions(role)])) as PermissionMatrix;
}

export function hasPermission(permissions: Permissions, permission: Permission): boolean {
  const view = `${permission.split(".")[0]}.view` as Permission;
  return permissions[view] === true && permissions[permission] === true;
}

export function canAccessAdmin(permissions: Permissions): boolean {
  return ["churches.view", "pengurus.view", "users.view"].some((key) => hasPermission(permissions, key as Permission));
}

export function landingPath(permissions: Permissions): string {
  if (permissions["dashboard.view"]) return "/dashboard";
  return canAccessAdmin(permissions) ? "/admin" : "/access-denied";
}

export function validateMatrix(value: unknown): value is PermissionMatrix {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const matrix = value as Record<string, unknown>;
  if (Object.keys(matrix).length !== ROLES.length || ROLES.some((role) => !Object.hasOwn(matrix, role))) return false;
  return ROLES.every((role) => {
    const row = matrix[role];
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    const permissions = row as Permissions;
    if (Object.keys(row).length !== PERMISSION_KEYS.length) return false;
    return PERMISSION_KEYS.every((key) => {
      if (typeof permissions[key] !== "boolean") return false;
      if (role === "superadmin" && !permissions[key]) return false;
      const view = `${key.split(".")[0]}.view` as Permission;
      return key === view || !permissions[key] || permissions[view];
    });
  });
}

/** Stored rows grant only explicitly enabled, recognized permissions. */
export function readStoredPermissions(value: unknown): Permissions {
  const result = defaultPermissions();
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  const record = value as Record<string, unknown>;
  for (const key of PERMISSION_KEYS) result[key] = record[key] === true;
  for (const key of PERMISSION_KEYS) result[key] = hasPermission(result, key);
  return result;
}
