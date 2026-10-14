import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifySessionToken } from "@/lib/auth";

function authenticateAdmin(req: NextRequest) {
  const cookieToken = req.cookies.get("admin_session")?.value;
  const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
  const token = cookieToken || authHeader;
  if (!token) return null;
  return verifySessionToken(token);
}

const PENGURUS_PATH = path.join(process.cwd(), "public", "data", "pengurus.json");

export async function GET(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 401 });
    }

    const fileData = await fs.readFile(PENGURUS_PATH, "utf-8");
    const data = JSON.parse(fileData);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Gagal membaca pengurus.json:", error);
    return NextResponse.json(
      { error: "Gagal memuat data pengurus.", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 401 });
    }

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
      { error: "Gagal menyimpan perubahan pengurus.", details: error.message },
      { status: 500 }
    );
  }
}
