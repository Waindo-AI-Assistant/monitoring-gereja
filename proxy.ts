import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

// Next.js 16 calls middleware "proxy". API handlers also check the current account.
export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = req.cookies.get("admin_session")?.value;
  const user = token ? verifySessionToken(token) : null;

  // /admin hosts the existing login form and must remain reachable without a session.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  if (!user) {
    const login = new URL("/admin", req.url);
    login.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
    const response = NextResponse.redirect(login);
    response.cookies.delete("admin_session");
    return response;
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
