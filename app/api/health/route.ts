import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";
  let userCount = 0;
  let churchCount = 0;
  let dbError: string | null = null;

  try {
    // 1. Check PostgreSQL Connection & Counts
    const users = await prisma.user.count();
    const churches = await prisma.church.count();
    userCount = users;
    churchCount = churches;
    dbStatus = "connected";
  } catch (err: any) {
    dbStatus = "error";
    dbError = err.message || "Database connection failed";
  }

  // 2. Check poi.geojson existence
  let geojsonStatus = "not_found";
  let geojsonFeatureCount = 0;
  try {
    const filePath = path.join(process.cwd(), "public", "data", "poi.geojson");
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);
    geojsonStatus = "ok";
    geojsonFeatureCount = Array.isArray(data.features) ? data.features.length : 0;
  } catch {
    geojsonStatus = "error_reading";
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    responseTime: `${responseTimeMs}ms`,
    database: {
      status: dbStatus,
      usersInDatabase: userCount,
      churchesInDatabase: churchCount,
      error: dbError,
    },
    geojson: {
      status: geojsonStatus,
      totalFeatures: geojsonFeatureCount,
    },
  });
}
