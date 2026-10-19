import { NextRequest, NextResponse } from "next/server";
import { getUsers, verifySessionToken, type SafeUser } from "@/lib/auth";
import { isSuperadmin } from "@/lib/roles";
import { getRolePermissions } from "@/lib/permission-store";
import { hasPermission, type Permission } from "@/lib/permissions";

/** Re-read the account so deleted users and changed roles take effect immediately. */
export async function getRequestUser(req: NextRequest): Promise<SafeUser | null> {
  const token = req.cookies.get("admin_session")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return getSessionUser(token);
}

export async function getSessionUser(token?: string): Promise<SafeUser | null> {
  const session = token ? verifySessionToken(token) : null;
  if (!session) return null;
  const user = (await getUsers()).find((item) => item.id === session.id);
  if (!user) return null;
  const { passwordHash: _hash, salt: _salt, ...safeUser } = user;
  return safeUser;
}

export async function requireSuperadmin(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Sesi tidak valid atau belum login." }, { status: 401 }) };
  }
  if (!isSuperadmin(user.role)) {
    return { user: null, error: NextResponse.json({ error: "Akses kelola hanya untuk superadmin." }, { status: 403 }) };
  }
  return { user, error: null };
}

export async function requirePermission(req: NextRequest, permission: Permission | Permission[]) {
  const user = await getRequestUser(req);
  if (!user) return { user: null, error: NextResponse.json({ error: "Sesi tidak valid atau belum login." }, { status: 401 }) };
  try {
    const permissions = await getRolePermissions(user.role);
    const required = Array.isArray(permission) ? permission : [permission];
    if (!required.some((key) => hasPermission(permissions, key))) {
      return { user: null, error: NextResponse.json({ error: "Role Anda tidak memiliki izin untuk tindakan ini." }, { status: 403 }) };
    }
    return { user, error: null };
  } catch (error) {
    console.error("Permission lookup failed:", error);
    return { user: null, error: NextResponse.json({ error: "Hak akses belum dapat diperiksa. Periksa koneksi dan skema database." }, { status: 503 }) };
  }
}
