import crypto from "crypto";
import type { SafeUser } from "@/lib/auth";
import { isRole, normalizeRole } from "@/lib/roles";

export interface JWTPayload {
  sub: string;
  id: string;
  username: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

const AUTH_SECRET = process.env.AUTH_SECRET || "ggp-monitoring-jwt-secret-key-2026-auth-token";

/** Hash password with PBKDF2 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, s, 1000, 64, "sha512").toString("hex");
  return { hash, salt: s };
}

/** Verify password */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: calculatedHash } = hashPassword(password, salt);
  return calculatedHash === hash;
}

/**
 * Standard JSON Web Token (JWT) HS256 Implementation (RFC 7519)
 */
export const jwt = {
  /** Generate a signed JWT token */
  sign(payload: Omit<JWTPayload, "iat" | "exp">, expiresInSeconds: number = 7 * 24 * 60 * 60): string {
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(dataToSign)
      .digest("base64url");

    return `${dataToSign}.${signature}`;
  },

  /** Verify and decode a JWT token */
  verify(token: string): JWTPayload | null {
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      const dataToVerify = `${encodedHeader}.${encodedPayload}`;

      const expectedSignature = crypto
        .createHmac("sha256", AUTH_SECRET)
        .update(dataToVerify)
        .digest("base64url");

      if (signature !== expectedSignature) return null;

      const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString());
      if (header.alg !== "HS256" || header.typ !== "JWT") return null;

      const payload: JWTPayload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
      const now = Math.floor(Date.now() / 1000);

      // Check token expiration
      if (!Number.isFinite(payload.exp) || now >= payload.exp || !payload.id || !payload.username) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  },
};

/** Create signed session JWT token for user */
export function createSessionToken(user: SafeUser): string {
  return jwt.sign({
    sub: user.id,
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });
}

/** Verify session JWT token */
export function verifySessionToken(token: string): SafeUser | null {
  const payload = jwt.verify(token);
  if (!payload || (payload.role !== "admin" && !isRole(payload.role))) return null;

  return {
    id: payload.id,
    name: payload.name,
    username: payload.username,
    role: normalizeRole(payload.role),
    createdAt: "",
  };
}
