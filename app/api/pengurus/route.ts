import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const PENGURUS_PATH = path.join(process.cwd(), "public", "data", "pengurus.json");

export async function GET() {
  try {
    const fileData = await fs.readFile(PENGURUS_PATH, "utf-8");
    const data = JSON.parse(fileData);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Gagal membaca pengurus.json:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat data pengurus", data: [] },
      { status: 500 }
    );
  }
}
