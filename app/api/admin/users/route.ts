import { isRole } from "@/lib/roles";
import { requirePermission } from "@/lib/authorization";
import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, hashPassword, User, SafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";


export async function GET(req: NextRequest) {
  try {
    const { error: accessError } = await requirePermission(req, "users.view");
    if (accessError) return accessError;

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
    const { user: actor, error: accessError } = await requirePermission(req, "users.create");
    if (accessError) return accessError;

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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
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
    if (role !== undefined && !isRole(role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
    }
    const assignedRole = role ?? "biasa";
    if (actor.role !== "superadmin" && assignedRole !== "biasa") {
      return NextResponse.json({ error: "Penentuan role akun hanya untuk superadmin." }, { status: 403 });
    }

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

    // Sinkronisasi ke PostgreSQL jika database aktif
    try {
      await prisma.user.upsert({
        where: { username: newUser.username },
        update: {
          name: newUser.name,
          passwordHash: newUser.passwordHash,
          salt: newUser.salt,
          role: newUser.role,
        },
        create: {
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          passwordHash: newUser.passwordHash,
          salt: newUser.salt,
          role: newUser.role,
        },
      });
    } catch (e) {
      console.warn("Prisma user sync warning:", e);
    }

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
    const { user: admin, error: accessError } = await requirePermission(req, "users.delete");
    if (accessError) return accessError;

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

    if (admin.role !== "superadmin" && users[userIndex].role === "superadmin") {
      return NextResponse.json({ error: "Akun superadmin hanya dapat dikelola superadmin." }, { status: 403 });
    }

    // Protection for primary superadmin
    if (users[userIndex].role === "superadmin" && users.filter((user) => user.role === "superadmin").length <= 1) {
      return NextResponse.json(
        { error: "Superadmin terakhir tidak boleh dihapus." },
        { status: 403 }
      );
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);
    await saveUsers(users);

    // Sinkronisasi hapus di PostgreSQL
    try {
      await prisma.user.deleteMany({
        where: {
          OR: [{ id: targetId }, { username: deletedUser.username }],
        },
      });
    } catch (e) {
      console.warn("Prisma user delete sync warning:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Pengguna "${deletedUser.name}" (@${deletedUser.username}) berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat menghapus pengguna." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user: actor, error: accessError } = await requirePermission(req, "users.update");
    if (accessError) return accessError;

    const { id, name, username, password, role } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID pengguna wajib disertakan." }, { status: 400 });
    }

    const users = await getUsers();
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const targetUser = { ...users[userIndex] };
    if (actor.role !== "superadmin" && (targetUser.role === "superadmin" || (role !== undefined && role !== targetUser.role))) {
      return NextResponse.json({ error: "Mengubah akun superadmin atau role akun hanya untuk superadmin." }, { status: 403 });
    }

    // Check if new username is already used by another account
    if (username && username.trim().toLowerCase() !== targetUser.username.toLowerCase()) {
      const duplicate = users.find(
        (u) => u.id !== id && u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          { error: "Username tersebut sudah digunakan oleh akun lain." },
          { status: 400 }
        );
      }
      targetUser.username = username.trim().toLowerCase();
    }

    if (name && name.trim()) {
      targetUser.name = name.trim();
    }

    if (role !== undefined) {
      if (!isRole(role)) {
        return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
      }
      if (targetUser.role === "superadmin" && role !== "superadmin" && users.filter((user) => user.role === "superadmin").length <= 1) {
        return NextResponse.json({ error: "Role superadmin terakhir tidak boleh diturunkan." }, { status: 400 });
      }
      targetUser.role = role;
    }

    // If new password provided, rehash
    let passwordUpdated = false;
    if (password && password.trim()) {
      if (password.length < 8) {
        return NextResponse.json({ error: "Password baru minimal 8 karakter." }, { status: 400 });
      }
      const { hash, salt } = hashPassword(password);
      targetUser.passwordHash = hash;
      targetUser.salt = salt;
      passwordUpdated = true;
    }

    users[userIndex] = targetUser;
    await saveUsers(users);

    // Sync update to PostgreSQL
    try {
      await prisma.user.updateMany({
        where: {
          OR: [{ id }, { username: targetUser.username }],
        },
        data: {
          name: targetUser.name,
          username: targetUser.username,
          role: targetUser.role,
          ...(passwordUpdated ? { passwordHash: targetUser.passwordHash, salt: targetUser.salt } : {}),
        },
      });
    } catch (e) {
      console.warn("Prisma user update sync warning:", e);
    }

    const safeUser: SafeUser = {
      id: targetUser.id,
      name: targetUser.name,
      username: targetUser.username,
      role: targetUser.role,
      createdAt: targetUser.createdAt,
    };

    return NextResponse.json({
      success: true,
      message: `Data pengguna "${safeUser.name}" (@${safeUser.username}) berhasil diperbarui.`,
      user: safeUser,
    });
  } catch (error: any) {
    console.error("PUT user error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat memperbarui pengguna." }, { status: 500 });
  }
}
