import { requirePermission } from "@/lib/authorization";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { error: accessError } = await requirePermission(req, ["churches.create", "churches.update", "pengurus.update"]);
    if (accessError) return accessError;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang diunggah." }, { status: 400 });
    }

    // Validasi ukuran berkas (maks 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tentukan ekstensi dari isi berkas, bukan dari nama/tipe kiriman klien (mencegah unggahan SVG/HTML berbahaya)
    const ext = detectImageExtension(buffer);
    if (!ext) {
      return NextResponse.json(
        { error: "Format berkas tidak didukung. Harap gunakan format JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const uniqueFileName = `church_${Date.now()}_${randomSuffix}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      message: "Foto berhasil diunggah.",
      url: publicUrl,
      fileName: uniqueFileName,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengunggah foto." },
      { status: 500 }
    );
  }
}

/** Kenali JPEG/PNG/WebP/GIF dari signature byte awal; null untuk format lain */
function detectImageExtension(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return ".webp";
  if (buf.length >= 6 && (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a")) return ".gif";
  return null;
}
