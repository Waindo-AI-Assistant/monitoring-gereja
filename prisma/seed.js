const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, s, 1000, 64, "sha512").toString("hex");
  return { hash, salt: s };
}

async function main() {
  console.log("🌱 Memulai seeding database...");

  // 1. Seed Master Admin User
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "superadmin" },
  });

  if (!existingAdmin) {
    const { hash, salt } = hashPassword("waindospecterra");
    await prisma.user.create({
      data: {
        name: "Administrator Majelis Pusat",
        username: "superadmin",
        passwordHash: hash,
        salt,
        role: "superadmin",
      },
    });
    console.log("✅ User superadmin default berhasil dibuat: username: superadmin / password: waindospecterra");
  } else {
    console.log("ℹ️ User superadmin sudah ada di database.");
  }

  // Legacy administrators are dashboard-only under the four-role policy.
  await prisma.user.updateMany({ where: { role: "admin" }, data: { role: "biasa" } });

  const digitalPassword = hashPassword("digitalggp");
  await prisma.user.upsert({
    where: { username: "digitalgpp" },
    update: { role: "biasa" },
    create: {
      name: "Digital GPP",
      username: "digitalgpp",
      passwordHash: digitalPassword.hash,
      salt: digitalPassword.salt,
      role: "biasa",
    },
  });
  console.log("✅ Akun digitalgpp tersedia dengan role biasa (akses dashboard).");

  // 2. Seed Churches from poi.geojson
  const churchCount = await prisma.church.count();
  if (churchCount === 0) {
    const geojsonPath = path.join(__dirname, "..", "public", "data", "poi.geojson");
    if (fs.existsSync(geojsonPath)) {
      const raw = fs.readFileSync(geojsonPath, "utf-8");
      const geojson = JSON.parse(raw);

      if (geojson.features && Array.isArray(geojson.features)) {
        console.log(`⏳ Mengimpor ${geojson.features.length} data gereja dari poi.geojson...`);

        for (const feature of geojson.features) {
          const p = feature.properties || {};
          await prisma.church.create({
            data: {
              fid: p.fid || null,
              name: p.name || "Gereja GGP",
              namaPendeta: p.nama_pendeta ? String(p.nama_pendeta).trim() : "",
              noHpWa: p.no_hp_wa ? String(p.no_hp_wa).trim() : "",
              alamatGereja: p.alamat_gereja ? String(p.alamat_gereja).trim() : "",
              tahunBerdiri: p.tahun_berdiri ? String(p.tahun_berdiri).trim() : "",
              jumlahJemaat: p.jumlah_jemaat ? String(p.jumlah_jemaat).trim() : "",
              jamOperasional: p.jam_operasional ? String(p.jam_operasional).trim() : "",
              status: p.status ? String(p.status).trim() : "Milik Sendiri",
              mawil: p.mawil ? String(p.mawil).trim() : "",
              kodeMada: p.kode_mada ? String(p.kode_mada).trim() : "",
              namaMada: p.nama_mada ? String(p.nama_mada).trim() : "",
              no: p.no || null,
              x: p.x ? Number(p.x) : 0,
              y: p.y ? Number(p.y) : 0,
              foto: p.foto || "",
              foto2: p.foto_2 || "",
              fotoPendeta: p.foto_pendeta || "",
              photos: Array.isArray(p.photos) ? JSON.stringify(p.photos) : "[]",
            },
          });
        }
        console.log(`✅ Berhasil mengimpor seluruh ${geojson.features.length} data gereja ke database!`);
      }
    }
  } else {
    console.log(`ℹ️ Tabel churches sudah berisi ${churchCount} data.`);
  }

  console.log("🎉 Seeding database selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
