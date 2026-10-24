import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, sessionToken } from "@/lib/admin-session";

export const config = { matcher: ["/admin/:path*"] };

export async function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD || "";
  const token = await sessionToken(password);
  const authorized = Boolean(password) && req.cookies.get(ADMIN_COOKIE)?.value === token;

  // Form login sendiri selalu boleh dibuka; kalau sudah login, lempar ke dashboard
  if (req.nextUrl.pathname === "/admin/login") {
    return authorized ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }

  if (authorized) return NextResponse.next();

  // Belum login → form login (bukan popup Basic Auth)
  const loginUrl = new URL("/admin/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
