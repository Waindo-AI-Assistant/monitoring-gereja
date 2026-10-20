import { requirePermission } from "@/lib/authorization";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";


const PENGURUS_PATH = path.join(process.cwd(), "public", "data", "pengurus.json");

export async function GET(req: NextRequest) {
  try {
    const { error: accessError } = await requirePermission(req, "pengurus.view");
    if (accessError) return accessError;

    const fileData = await fs.readFile(PENGURUS_PATH, "utf-8");
    const data = JSON.parse(fileData);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Gagal membaca pengurus.json:", error);
    return NextResponse.json(
      { error: "Gagal memuat data pengurus." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { error: accessError } = await requirePermission(req, "pengurus.update");
    if (accessError) return accessError;

    const body = await req.json();
    const fileData = await fs.readFile(PENGURUS_PATH, "utf-8");
    let currentData = JSON.parse(fileData);

    // Support single item update or batch array update
    if (Array.isArray(body)) {
      // Batch update
      currentData = body;
    } else if (body && body.id) {
      // Single item update
      const index = currentData.findIndex((item: any) => item.id === body.id);
      if (index === -1) {
        return NextResponse.json(
          { error: `Jabatan dengan ID "${body.id}" tidak ditemukan.` },
          { status: 404 }
        );
      }
      currentData[index] = {
        ...currentData[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };
    } else {
      return NextResponse.json(
        { error: "Format payload tidak valid. Membutuhkan object dengan 'id' atau array." },
        { status: 400 }
      );
    }

    await fs.writeFile(PENGURUS_PATH, JSON.stringify(currentData, null, 2), "utf-8");
    return NextResponse.json({
      success: true,
      message: "Data pengurus berhasil diperbarui.",
      data: currentData,
    });
  } catch (error: any) {
    console.error("Gagal mengupdate pengurus.json:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan perubahan pengurus." },
      { status: 500 }
    );
  }
}
