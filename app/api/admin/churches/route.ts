import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // 1. Coba baca dari PostgreSQL via Prisma
    try {
      const dbChurches = await prisma.church.findMany({
        orderBy: { fid: "asc" },
      });

      if (dbChurches && dbChurches.length > 0) {
        const features = dbChurches.map((c) => {
          let parsedPhotos: string[] = [];
          try {
            parsedPhotos = typeof c.photos === "string" ? JSON.parse(c.photos || "[]") : (c.photos || []);
          } catch {}

          return {
            type: "Feature",
            properties: {
              fid: c.fid,
              name: c.name,
              nama_pendeta: c.namaPendeta || "",
              no_hp_wa: c.noHpWa || "",
              alamat_gereja: c.alamatGereja || "",
              tahun_berdiri: c.tahunBerdiri || "",
              jumlah_jemaat: c.jumlahJemaat || "",
              jam_operasional: c.jamOperasional || "",
              status: c.status || "Milik Sendiri",
              mawil: c.mawil || "",
              kode_mada: c.kodeMada || "",
              nama_mada: c.namaMada || "",
              no: c.no || c.fid,
              x: c.x || 0,
              y: c.y || 0,
              foto: c.foto || "",
              foto_2: c.foto2 || "",
              foto_pendeta: c.fotoPendeta || "",
              photos: parsedPhotos,
            },
            geometry:
              c.x && c.y && Number(c.x) !== 0 && Number(c.y) !== 0
                ? {
                    type: "Point",
                    coordinates: [Number(c.x), Number(c.y)],
                  }
                : null,
          };
        });

        return NextResponse.json({
          success: true,
          features,
        });
      }
    } catch (dbErr) {
      // Fallback ke file poi.geojson jika DB kosong/error
    }

    // 2. Fallback baca dari poi.geojson
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

    const attachStatus = churchData.ATTACH || (churchData.foto || churchData.foto_2 || churchData.foto_pendeta ? "Ada" : "Tidak");
    const photoList = Array.isArray(churchData.photos)
      ? churchData.photos
      : [churchData.foto, churchData.foto_2].filter(Boolean);

    const newFeature = {
      type: "Feature",
      properties: {
        fid: newFid,
        ATTACH: attachStatus,
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
        foto: churchData.foto || "",
        foto_2: churchData.foto_2 || "",
        foto_pendeta: churchData.foto_pendeta || "",
        photos: photoList,
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

    // Sinkronisasi insert ke PostgreSQL via Prisma jika aktif
    try {
      await prisma.church.create({
        data: {
          fid: newFid,
          no: newFid,
          name: String(newFeature.properties.name).trim(),
          namaPendeta: newFeature.properties.nama_pendeta ? String(newFeature.properties.nama_pendeta).trim() : null,
          noHpWa: newFeature.properties.no_hp_wa ? String(newFeature.properties.no_hp_wa).trim() : null,
          alamatGereja: newFeature.properties.alamat_gereja ? String(newFeature.properties.alamat_gereja).trim() : null,
          tahunBerdiri: newFeature.properties.tahun_berdiri ? String(newFeature.properties.tahun_berdiri).trim() : null,
          jumlahJemaat: newFeature.properties.jumlah_jemaat ? String(newFeature.properties.jumlah_jemaat).trim() : null,
          jamOperasional: newFeature.properties.jam_operasional ? String(newFeature.properties.jam_operasional).trim() : null,
          status: newFeature.properties.status ? String(newFeature.properties.status).trim() : "Milik Sendiri",
          mawil: newFeature.properties.mawil ? String(newFeature.properties.mawil).trim() : null,
          kodeMada: newFeature.properties.kode_mada ? String(newFeature.properties.kode_mada).trim() : null,
          namaMada: newFeature.properties.nama_mada ? String(newFeature.properties.nama_mada).trim() : null,
          x: newFeature.properties.x || 0,
          y: newFeature.properties.y || 0,
          foto: newFeature.properties.foto ? String(newFeature.properties.foto).trim() : null,
          foto2: newFeature.properties.foto_2 ? String(newFeature.properties.foto_2).trim() : null,
          fotoPendeta: newFeature.properties.foto_pendeta ? String(newFeature.properties.foto_pendeta).trim() : null,
          photos: JSON.stringify(newFeature.properties.photos || []),
        },
      });
    } catch (prismaErr) {
      console.warn("Prisma insert church skipped:", prismaErr);
    }

    return NextResponse.json({
      success: true,
      message: "Data gereja baru berhasil ditambahkan.",
      feature: newFeature,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing church record
export async function PUT(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 401 });
    }

    const { fid, name, updatedProperties } = await req.json();
    if (!updatedProperties) {
      return NextResponse.json({ error: "Data pembaruan tidak ditemukan." }, { status: 400 });
    }

    const content = await fs.readFile(GEOJSON_PATH, "utf-8");
    const geojson = JSON.parse(content);

    let foundIndex = -1;
    if (fid !== undefined && fid !== null) {
      foundIndex = geojson.features.findIndex((f: any) => f.properties?.fid === fid);
    }
    if (foundIndex === -1 && name) {
      foundIndex = geojson.features.findIndex((f: any) => f.properties?.name === name);
    }

    if (foundIndex === -1) {
      return NextResponse.json({ error: "Data gereja tidak ditemukan." }, { status: 404 });
    }

    const existingProps = geojson.features[foundIndex].properties || {};
    const mergedProps = {
      ...existingProps,
      ...updatedProperties,
      fid: existingProps.fid ?? fid,
      no: existingProps.no ?? existingProps.fid ?? fid,
    };

    geojson.features[foundIndex].properties = mergedProps;
    if (mergedProps.x && mergedProps.y && Number(mergedProps.x) !== 0 && Number(mergedProps.y) !== 0) {
      geojson.features[foundIndex].geometry = {
        type: "Point",
        coordinates: [Number(mergedProps.x), Number(mergedProps.y)],
      };
    }

    await fs.writeFile(GEOJSON_PATH, JSON.stringify(geojson, null, 2), "utf-8");

    // Sinkronisasi ke PostgreSQL via Prisma jika aktif
    try {
      const fidNum = fid !== undefined && fid !== null ? Number(fid) : undefined;
      const xVal = mergedProps.x !== undefined && mergedProps.x !== "" ? Number(mergedProps.x) : undefined;
      const yVal = mergedProps.y !== undefined && mergedProps.y !== "" ? Number(mergedProps.y) : undefined;

      if (mergedProps.foto || mergedProps.foto_2 || mergedProps.foto_pendeta) {
        if (!mergedProps.ATTACH || mergedProps.ATTACH === "Tidak") {
          mergedProps.ATTACH = "Ada";
        }
      }

      const updatePayload: any = {
        name: String(mergedProps.name).trim(),
        namaPendeta: mergedProps.nama_pendeta ? String(mergedProps.nama_pendeta).trim() : null,
        noHpWa: mergedProps.no_hp_wa ? String(mergedProps.no_hp_wa).trim() : null,
        alamatGereja: mergedProps.alamat_gereja ? String(mergedProps.alamat_gereja).trim() : null,
        tahunBerdiri: mergedProps.tahun_berdiri ? String(mergedProps.tahun_berdiri).trim() : null,
        jumlahJemaat: mergedProps.jumlah_jemaat ? String(mergedProps.jumlah_jemaat).trim() : null,
        jamOperasional: mergedProps.jam_operasional ? String(mergedProps.jam_operasional).trim() : null,
        status: mergedProps.status ? String(mergedProps.status).trim() : "Milik Sendiri",
        mawil: mergedProps.mawil ? String(mergedProps.mawil).trim() : null,
        kodeMada: mergedProps.kode_mada ? String(mergedProps.kode_mada).trim() : null,
        namaMada: mergedProps.nama_mada ? String(mergedProps.nama_mada).trim() : null,
        foto: mergedProps.foto ? String(mergedProps.foto).trim() : null,
        foto2: mergedProps.foto_2 ? String(mergedProps.foto_2).trim() : null,
        fotoPendeta: mergedProps.foto_pendeta ? String(mergedProps.foto_pendeta).trim() : null,
        photos: mergedProps.photos
          ? (typeof mergedProps.photos === "string" ? mergedProps.photos : JSON.stringify(mergedProps.photos))
          : JSON.stringify([mergedProps.foto, mergedProps.foto_2].filter(Boolean)),
      };

      if (xVal !== undefined && !isNaN(xVal)) updatePayload.x = xVal;
      if (yVal !== undefined && !isNaN(yVal)) updatePayload.y = yVal;

      if (fidNum) {
        await prisma.church.updateMany({
          where: { fid: fidNum },
          data: updatePayload,
        });
      } else if (name) {
        await prisma.church.updateMany({
          where: { name: String(name).trim() },
          data: updatePayload,
        });
      }
    } catch (prismaErr) {
      console.warn("Prisma update church skipped:", prismaErr);
    }

    return NextResponse.json({
      success: true,
      message: "Data gereja berhasil diperbarui.",
      feature: geojson.features[foundIndex],
      properties: mergedProps,
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

    // Sinkronisasi delete ke PostgreSQL via Prisma jika aktif
    try {
      if (fid !== undefined && fid !== null) {
        await prisma.church.deleteMany({ where: { fid: Number(fid) } });
      } else if (name) {
        await prisma.church.deleteMany({ where: { name: String(name).trim() } });
      }
    } catch (prismaErr) {
      console.warn("Prisma delete church skipped:", prismaErr);
    }

    return NextResponse.json({
      success: true,
      message: "Data gereja berhasil dihapus.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
