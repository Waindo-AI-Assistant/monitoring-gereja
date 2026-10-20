import { getRolePermissions } from "@/lib/permission-store";
import { NextRequest, NextResponse } from "next/server";
import { getUsers, verifyPassword, createSessionToken, needsRehash, updateStoredPassword, SafeUser } from "@/lib/auth";

// Simple in-memory brute-force guard: per client IP + username, reset on success or after the window.
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; firstAt: number }>();

function attemptKey(req: NextRequest, username: string): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return `${ip}|${username}`;
}

function isLockedOut(key: string): boolean {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(key: string) {
  const entry = failedAttempts.get(key);
  if (!entry || Date.now() - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstAt: Date.now() });
  } else {
    entry.count++;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim().toLowerCase();
    const key = attemptKey(req, normalizedUsername);
    if (isLockedOut(key)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit." },
        { status: 429 }
      );
    }

    const users = await getUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === normalizedUsername
    );

    if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
      recordFailure(key);
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }
    failedAttempts.delete(key);

    // Upgrade legacy hashes transparently now that the plaintext password is known.
    if (needsRehash(user.passwordHash)) {
      try {
        await updateStoredPassword(user.id, password);
      } catch (e) {
        console.warn("Password rehash skipped:", e);
      }
    }

    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    };

    const permissions = await getRolePermissions(user.role);
    const token = createSessionToken(safeUser);

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: safeUser,
      permissions,
      token,
    });

    // HTTP-only session cookie; marked secure whenever the request arrived over HTTPS (directly or via proxy).
    const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses login." },
      { status: 500 }
    );
  }
}
