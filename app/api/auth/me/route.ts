import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("admin_session")?.value;
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    const token = cookieToken || authHeader;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = verifySessionToken(token);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
