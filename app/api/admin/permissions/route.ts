import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/authorization";
import { getPermissionMatrix, savePermissionMatrix } from "@/lib/permission-store";
import { validateMatrix } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const { error } = await requireSuperadmin(req);
  if (error) return error;
  try {
    return NextResponse.json({ permissions: await getPermissionMatrix() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Read permissions failed:", error);
    return NextResponse.json({ error: "Gagal memuat hak akses. Pastikan database aktif dan skema terbaru sudah diterapkan (prisma db push)." }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireSuperadmin(req);
  if (error) return error;
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
  }
  if (!validateMatrix(body?.permissions)) {
    return NextResponse.json({ error: "Izin tidak valid. Izin kelola membutuhkan izin lihat; akses superadmin harus tetap penuh." }, { status: 400 });
  }
  try {
    await savePermissionMatrix(body.permissions);
    return NextResponse.json({ success: true, permissions: body.permissions });
  } catch (error) {
    console.error("Save permissions failed:", error);
    return NextResponse.json({ error: "Hak akses belum tersimpan. Periksa koneksi database dan terapkan skema terbaru (prisma db push)." }, { status: 503 });
  }
}
