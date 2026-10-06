import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fid, name, updatedProperties } = body;

    if (!updatedProperties) {
      return NextResponse.json(
        { error: "Data atribut yang diperbarui tidak ditemukan." },
        { status: 400 }
      );
    }

    // 2. Baca file poi.geojson
    const filePath = path.join(process.cwd(), "public", "data", "poi.geojson");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const geojsonData = JSON.parse(fileContent);

    if (!geojsonData.features || !Array.isArray(geojsonData.features)) {
      return NextResponse.json(
        { error: "Format file GeoJSON tidak valid." },
        { status: 500 }
      );
    }

    // 3. Cari feature berdasarkan fid atau name
    let foundIndex = -1;
    if (fid !== undefined && fid !== null) {
      foundIndex = geojsonData.features.findIndex(
        (f: any) => f.properties && f.properties.fid === fid
      );
    }

    if (foundIndex === -1 && name) {
      foundIndex = geojsonData.features.findIndex(
        (f: any) => f.properties && f.properties.name === name
      );
    }

    if (foundIndex === -1) {
      return NextResponse.json(
        { error: "Data gereja tidak ditemukan di basis data." },
        { status: 404 }
      );
    }

    // 4. Update properti
    const existingProps = geojsonData.features[foundIndex].properties || {};
    const mergedProps = {
      ...existingProps,
      ...updatedProperties,
      // Pastikan fid dan no tidak hilang
      fid: existingProps.fid ?? fid,
      no: existingProps.no ?? existingProps.fid ?? fid,
    };

    geojsonData.features[foundIndex].properties = mergedProps;

    // Sinkronisasi geometri koordinat jika x dan y tersedia
    if (mergedProps.x && mergedProps.y && Number(mergedProps.x) !== 0 && Number(mergedProps.y) !== 0) {
      geojsonData.features[foundIndex].geometry = {
        type: "Point",
        coordinates: [Number(mergedProps.x), Number(mergedProps.y)],
      };
    }

    // 5. Tulis kembali ke file GeoJSON
    await fs.writeFile(filePath, JSON.stringify(geojsonData, null, 2), "utf-8");

    // 6. Sinkronisasi ke PostgreSQL via Prisma jika terhubung
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
      console.warn("Sinkronisasi database Prisma dilewati:", prismaErr);
    }

    return NextResponse.json({
      success: true,
      message: "Data gereja berhasil diperbarui.",
      properties: mergedProps,
    });
  } catch (error) {
    console.error("Error updating POI:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menyimpan data.",
      },
      { status: 500 }
    );
  }
}
