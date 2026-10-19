import { getRolePermissions } from "@/lib/permission-store";
import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user,
      permissions: await getRolePermissions(user.role),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
