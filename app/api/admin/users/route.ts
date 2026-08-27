import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, hashPassword, verifySessionToken, User, SafeUser } from "@/lib/auth";
import crypto from "crypto";

function getAuthenticatedAdmin(req: NextRequest): SafeUser | null {
  const token =
    req.cookies.get("admin_session")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) return null;
  return verifySessionToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login." }, { status: 401 });
    }

    const users = await getUsers();
    const safeUsers: SafeUser[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error: any) {
    console.error("GET users error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar pengguna." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak. Sesi tidak valid." }, { status: 401 });
    }

    const { name, username, password, role } = await req.json();

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Nama lengkap, username, dan password wajib diisi." },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username minimal 3 karakter." },
        { status: 400 }
      );
    }

    if (password.length < 5) {
      return NextResponse.json(
        { error: "Password minimal 5 karakter." },
        { status: 400 }
      );
    }

    const users = await getUsers();
    const existingUser = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "Username ini sudah terdaftar. Silakan pilih username lain." },
        { status: 400 }
      );
    }

    const { hash, salt } = hashPassword(password);
    const assignedRole = role === "superadmin" ? "superadmin" : "admin";

    const newUser: User = {
      id: "user-" + crypto.randomBytes(6).toString("hex"),
      name: name.trim(),
      username: username.trim().toLowerCase(),
      passwordHash: hash,
      salt,
      role: assignedRole,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await saveUsers(users);

    const safeUser: SafeUser = {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json({
      success: true,
      message: `Akun "${safeUser.username}" (${safeUser.name}) berhasil dibuat.`,
      user: safeUser,
    });
  } catch (error: any) {
    console.error("POST user error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat membuat pengguna baru." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak. Sesi tidak valid." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("id");

    if (!targetId) {
      return NextResponse.json({ error: "ID pengguna wajib disertakan." }, { status: 400 });
    }

    // Do not allow deleting self
    if (admin.id === targetId) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun yang sedang Anda gunakan saat ini." },
        { status: 400 }
      );
    }

    const users = await getUsers();
    const userIndex = users.findIndex((u) => u.id === targetId);

    if (userIndex === -1) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    // Protection for primary superadmin
    if (users[userIndex].username === "admin" && users[userIndex].role === "superadmin") {
      return NextResponse.json(
        { error: "Akun Super Administrator utama sistem tidak boleh dihapus." },
        { status: 403 }
      );
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);
    await saveUsers(users);

    return NextResponse.json({
      success: true,
      message: `Akun pengguna "${deletedUser.username}" (${deletedUser.name}) berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat menghapus pengguna." }, { status: 500 });
  }
}
