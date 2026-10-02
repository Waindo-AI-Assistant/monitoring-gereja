import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: "admin" | "superadmin";
  createdAt: string;
}

export type SafeUser = Omit<User, "passwordHash" | "salt">;

export interface JWTPayload {
  sub: string;
  id: string;
  username: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

const USERS_FILE_PATH = path.join(process.cwd(), "data", "users.json");
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
      if (payload.exp && now > payload.exp) {
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
  if (!payload) return null;

  return {
    id: payload.id,
    name: payload.name,
    username: payload.username,
    role: payload.role as "admin" | "superadmin",
    createdAt: "",
  };
}

/** Ensure users data exists and return user list from PostgreSQL or JSON fallback */
export async function getUsers(): Promise<User[]> {
  try {
    // 1. Coba baca dari PostgreSQL via Prisma
    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (dbUsers && dbUsers.length > 0) {
      return dbUsers.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        passwordHash: u.passwordHash,
        salt: u.salt,
        role: u.role as "admin" | "superadmin",
        createdAt: u.createdAt.toISOString(),
      }));
    }
  } catch (dbErr) {
    // Database error / not connected, fallback to JSON
  }

  try {
    const dir = path.dirname(USERS_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });

    try {
      const content = await fs.readFile(USERS_FILE_PATH, "utf-8");
      return JSON.parse(content);
    } catch {
      // Default fallback account: superadmin / waindospecterra
      const { hash, salt } = hashPassword("waindospecterra");
      const defaultUsers: User[] = [
        {
          id: "superadmin-default-1",
          name: "Administrator Majelis Pusat",
          username: "superadmin",
          passwordHash: hash,
          salt,
          role: "superadmin",
          createdAt: new Date().toISOString(),
        },
      ];

      await fs.writeFile(USERS_FILE_PATH, JSON.stringify(defaultUsers, null, 2), "utf-8");
      return defaultUsers;
    }
  } catch (err) {
    console.error("Error reading users file:", err);
    return [];
  }
}

/** Save users to database and file */
export async function saveUsers(users: User[]): Promise<void> {
  try {
    const dir = path.dirname(USERS_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.warn("Warning: Could not write users.json file (using PostgreSQL directly):", err);
  }
}
