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

const GEOJSON_PATH = path.join(process.cwd(), "public", "data", "poi.geojson");

// GET: Fetch all church records
export async function GET(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 401 });
    }

    const content = await fs.readFile(GEOJSON_PATH, "utf-8");
    const data = JSON.parse(content);

    return NextResponse.json({
      success: true,
      features: data.features || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add a new church record
export async function POST(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 401 });
    }

    const churchData = await req.json();
    if (!churchData.name) {
      return NextResponse.json({ error: "Nama Jemaah wajib diisi." }, { status: 400 });
    }

    const content = await fs.readFile(GEOJSON_PATH, "utf-8");
    const geojson = JSON.parse(content);

    // Calculate next fid & no
    const maxFid = geojson.features.reduce((max: number, f: any) => Math.max(max, f.properties?.fid || 0), 0);
    const newFid = maxFid + 1;

    const newFeature = {
      type: "Feature",
      properties: {
        fid: newFid,
        ATTACH: "Tidak",
        name: churchData.name,
        nama_pendeta: churchData.nama_pendeta || "",
        no_hp_wa: churchData.no_hp_wa || "",
        alamat_gereja: churchData.alamat_gereja || "",
        tahun_berdiri: churchData.tahun_berdiri || "",
        jumlah_jemaat: churchData.jumlah_jemaat || "",
        jam_operasional: churchData.jam_operasional || "",
        status: churchData.status || "Milik Sendiri",
        mawil: churchData.mawil || "",
        kode_mada: churchData.kode_mada || "",
        nama_mada: churchData.nama_mada || "",
        no: newFid,
        x: Number(churchData.x) || 0,
        y: Number(churchData.y) || 0,
        foto: "",
        foto_2: "",
        photos: [],
        foto_pendeta: "",
      },
      geometry:
        churchData.x && churchData.y && Number(churchData.x) !== 0 && Number(churchData.y) !== 0
          ? {
              type: "Point",
              coordinates: [Number(churchData.x), Number(churchData.y)],
            }
          : null,
    };

    geojson.features.unshift(newFeature);
    await fs.writeFile(GEOJSON_PATH, JSON.stringify(geojson, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Data gereja baru berhasil ditambahkan.",
      feature: newFeature,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a church record
export async function DELETE(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 401 });
    }

    const { fid, name } = await req.json();
    if (fid === undefined && !name) {
      return NextResponse.json({ error: "ID atau nama gereja wajib disertakan." }, { status: 400 });
    }

    const content = await fs.readFile(GEOJSON_PATH, "utf-8");
    const geojson = JSON.parse(content);

    const initialCount = geojson.features.length;
    geojson.features = geojson.features.filter((f: any) => {
      if (fid !== undefined && f.properties?.fid === fid) return false;
      if (name && f.properties?.name === name) return false;
      return true;
    });

    if (geojson.features.length === initialCount) {
      return NextResponse.json({ error: "Data gereja tidak ditemukan." }, { status: 404 });
    }

    await fs.writeFile(GEOJSON_PATH, JSON.stringify(geojson, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Data gereja berhasil dihapus.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
