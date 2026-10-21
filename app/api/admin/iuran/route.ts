import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { parseYear, validateIuran } from "@/lib/iuran";
import { listIuran, createIuran, updateIuran, deleteIuran, IuranConflict, isDuplicateIuran } from "@/lib/iuran-store";

function failure(error: unknown) {
  if (error instanceof IuranConflict) return NextResponse.json({ error: error.message }, { status: 409 });
  if (isDuplicateIuran(error)) return NextResponse.json({ error: "Jemaat dan jenis iuran untuk wilayah / tahun ini sudah ada. Edit catatan yang sudah ada." }, { status: 409 });
  console.error("Iuran operation failed:", error);
  return NextResponse.json({ error: "Data iuran belum dapat diakses. Periksa koneksi database dan jalankan prisma db push untuk tabel iuran." }, { status: 503 });
}

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "iuran.view");
  if (error) return error;
  let year: number;
  try { year = parseYear(req.nextUrl.searchParams.get("year")); } catch { return NextResponse.json({ error: "Tahun tidak valid." }, { status: 400 }); }
  try { return NextResponse.json({ records: await listIuran(year) }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return failure(error); }
}

async function write(req: NextRequest, update: boolean) {
  const { user, error } = await requirePermission(req, update ? "iuran.update" : "iuran.create");
  if (error) return error;
  let body, data;
  try {
    body = await req.json();
    data = validateIuran(body);
    if (update && (typeof body.id !== "string" || !body.id || typeof body.updatedAt !== "string" || Number.isNaN(Date.parse(body.updatedAt)))) throw new Error("Versi data tidak valid. Muat ulang halaman.");
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Data tidak valid." }, { status: 400 }); }
  try {
    if (update) return NextResponse.json({ success: true, record: await updateIuran(body.id, body.updatedAt, data, user.id) });
    await createIuran(data, user.id);
    return NextResponse.json({ success: true }, { status: update ? 200 : 201 });
  } catch (error) { return failure(error); }
}
export async function POST(req: NextRequest) { return write(req, false); }
export async function PUT(req: NextRequest) { return write(req, true); }

export async function DELETE(req: NextRequest) {
  const { error } = await requirePermission(req, "iuran.delete");
  if (error) return error;
  let body;
  try {
    body = await req.json();
    if (typeof body.id !== "string" || !body.id || typeof body.updatedAt !== "string" || Number.isNaN(Date.parse(body.updatedAt))) throw new Error();
  } catch { return NextResponse.json({ error: "ID / versi data tidak valid." }, { status: 400 }); }
  try { await deleteIuran(body.id, body.updatedAt); return NextResponse.json({ success: true }); } catch (error) { return failure(error); }
}
