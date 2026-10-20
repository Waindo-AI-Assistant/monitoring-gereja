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

/** Read the signing key at call time so a missing secret fails loudly instead of using a guessable default. */
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET wajib diisi minimal 32 karakter acak (lihat .env.example).");
  }
  return secret;
}

// Hashes are stored as "pbkdf2_sha512$<iterations>$<hex>"; bare hex hashes are legacy 1000-iteration hashes.
const HASH_PREFIX = "pbkdf2_sha512";
const HASH_ITERATIONS = 210000;
const LEGACY_ITERATIONS = 1000;

function pbkdf2Hex(password: string, salt: string, iterations: number): string {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/** Hash password with PBKDF2 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString("hex");
  return { hash: `${HASH_PREFIX}$${HASH_ITERATIONS}$${pbkdf2Hex(password, s, HASH_ITERATIONS)}`, salt: s };
}

/** Verify password against current or legacy hash format */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const parts = hash.split("$");
  if (parts.length === 3 && parts[0] === HASH_PREFIX) {
    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 1) return false;
    return safeEqual(pbkdf2Hex(password, salt, iterations), parts[2]);
  }
  return safeEqual(pbkdf2Hex(password, salt, LEGACY_ITERATIONS), hash);
}

/** True when a stored hash should be upgraded to the current format after a successful login */
export function needsRehash(hash: string): boolean {
  return hash !== "" && !hash.startsWith(`${HASH_PREFIX}$${HASH_ITERATIONS}$`);
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
      .createHmac("sha256", getAuthSecret())
      .update(dataToSign)
      .digest("base64url");

    return `${dataToSign}.${signature}`;
  },

  /** Verify and decode a JWT token */
  verify(token: string): JWTPayload | null {
    // Outside the try so a misconfigured secret surfaces as an error, not as "logged out".
    const secret = getAuthSecret();
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      const dataToVerify = `${encodedHeader}.${encodedPayload}`;

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(dataToVerify)
        .digest("base64url");

      if (!safeEqual(signature, expectedSignature)) return null;

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
