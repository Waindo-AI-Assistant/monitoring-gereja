import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { parseYear } from "@/lib/iuran";
import { readIuranWorkbook } from "@/lib/iuran-workbook";
import { importIuran, IuranConflict } from "@/lib/iuran-store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { user, error } = await requirePermission(req, "iuran.create");
  if (error) return error;
  let form: FormData, year: number, file: File;
  try {
    form = await req.formData();
    year = parseYear(form.get("year"));
    const upload = form.get("file");
    if (!(upload instanceof File) || !/\.xlsx$/i.test(upload.name) || !upload.size || upload.size > 10 * 1024 * 1024) throw new Error("Pilih file .xlsx, maksimal 10 MB.");
    file = upload;
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unggahan tidak valid." }, { status: 400 }); }
  let sheets;
  try { sheets = await readIuranWorkbook(await file.arrayBuffer()); }
  catch { return NextResponse.json({ error: "File Excel tidak dapat dibaca. Pastikan format .xlsx dan tidak diproteksi password." }, { status: 400 }); }
  if (form.get("action") !== "commit") {
    return NextResponse.json({ sheets: sheets.map(({ rows, ...sheet }) => ({ ...sheet, count: rows.length, sample: rows.slice(0, 3).map(({ churchName, kind, mawil }) => ({ churchName, kind, mawil })) })) });
  }
  let names: string[];
  try {
    names = JSON.parse(String(form.get("sheets")));
    if (!Array.isArray(names) || !names.length || names.some((name) => typeof name !== "string" || !sheets.some((sheet) => sheet.name === name))) throw new Error();
  } catch { return NextResponse.json({ error: "Pilih lembar sumber yang akan diimpor." }, { status: 400 }); }
  const selected = sheets.filter((sheet) => names.includes(sheet.name));
  if (selected.some((sheet) => sheet.errors.length || !sheet.rows.length)) return NextResponse.json({ error: "Lembar terpilih mengandung kesalahan atau tidak memiliki data. Perbaiki file sumber terlebih dahulu." }, { status: 400 });
  if (selected.some((sheet) => sheet.warnings.length || sheet.year !== year) && form.get("acknowledged") !== "true") return NextResponse.json({ error: "Periksa dan setujui catatan tahun / sumber sebelum impor." }, { status: 400 });
  try {
    const result = await importIuran(selected.flatMap((sheet) => sheet.rows.map((row) => ({ ...row, year, source: `${file.name} / ${sheet.name}` }))), user.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof IuranConflict) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Iuran import failed:", error);
    return NextResponse.json({ error: "Impor gagal dan tidak disimpan. Periksa koneksi / tabel database, lalu coba kembali." }, { status: 503 });
  }
}
