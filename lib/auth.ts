import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { normalizeRole, type Role } from "@/lib/roles";
export { jwt, createSessionToken, verifySessionToken, hashPassword, verifyPassword, needsRehash } from "@/lib/session";
import crypto from "crypto";
import { hashPassword } from "@/lib/session";

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: Role;
  createdAt: string;
}

export type SafeUser = Omit<User, "passwordHash" | "salt">;

const USERS_FILE_PATH = path.join(process.cwd(), "data", "users.json");

/** Ensure users data exists and return user list from PostgreSQL or JSON fallback */
export async function getUsers(): Promise<User[]> {
  try {
    // 1. Coba baca dari PostgreSQL via Prisma
    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (dbUsers) {
      return dbUsers.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        passwordHash: u.passwordHash,
        salt: u.salt,
        role: normalizeRole(u.role),
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
      const users: User[] = JSON.parse(content);
      return users.map((user) => ({ ...user, role: normalizeRole(user.role) }));
    } catch {
      // First-run account: password from INITIAL_SUPERADMIN_PASSWORD, or a random one printed once to the server log.
      const initialPassword = process.env.INITIAL_SUPERADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");
      if (!process.env.INITIAL_SUPERADMIN_PASSWORD) {
        console.warn(`[auth] Akun awal dibuat: superadmin / ${initialPassword} — segera ganti password ini.`);
      }
      const { hash, salt } = hashPassword(initialPassword);
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

/** Replace one user's password hash in both PostgreSQL and the JSON fallback */
export async function updateStoredPassword(userId: string, password: string): Promise<void> {
  const { hash, salt } = hashPassword(password);
  try {
    await prisma.user.updateMany({ where: { id: userId }, data: { passwordHash: hash, salt } });
  } catch (e) {
    console.warn("Prisma password update sync warning:", e);
  }
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  user.passwordHash = hash;
  user.salt = salt;
  await saveUsers(users);
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
