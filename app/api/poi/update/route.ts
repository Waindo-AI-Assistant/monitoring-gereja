import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

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
    const existingProps = geojsonData.features[foundIndex].properties;
    const mergedProps = {
      ...existingProps,
      ...updatedProperties,
      // Pastikan fid tidak hilang
      fid: existingProps.fid ?? fid,
    };

    geojsonData.features[foundIndex].properties = mergedProps;

    // 5. Tulis kembali ke file
    await fs.writeFile(filePath, JSON.stringify(geojsonData, null, 2), "utf-8");

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
