import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { normalizeRole, type Role } from "@/lib/roles";
export { jwt, createSessionToken, verifySessionToken, hashPassword, verifyPassword } from "@/lib/session";
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
