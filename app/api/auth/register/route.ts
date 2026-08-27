import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Registrasi publik telah dinonaktifkan. Pembuatan akun baru hanya dapat dilakukan oleh Administrator melalui Panel Manajemen Pengguna.",
    },
    { status: 403 }
  );
}
