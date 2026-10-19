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

    // Validasi tipe berkas gambar
    const mime = file.type.toLowerCase();
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
    if (!validMimes.includes(mime)) {
      return NextResponse.json(
        { error: "Format berkas tidak didukung. Harap gunakan format JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Dapatkan ekstensi
    let ext = path.extname(file.name).toLowerCase();
    if (!ext) {
      ext = mime.includes("png") ? ".png" : mime.includes("webp") ? ".webp" : ".jpg";
    }

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
      { error: error.message || "Terjadi kesalahan saat mengunggah foto." },
      { status: 500 }
    );
  }
}
