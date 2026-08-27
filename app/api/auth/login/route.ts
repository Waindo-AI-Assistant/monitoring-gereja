import { NextRequest, NextResponse } from "next/server";
import { getUsers, verifyPassword, createSessionToken, SafeUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const users = await getUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    };

    const token = createSessionToken(safeUser);

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: safeUser,
      token,
    });

    // Set HTTP-only session cookie
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
