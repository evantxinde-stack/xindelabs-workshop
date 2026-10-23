import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = { matcher: ["/admin/:path*"] };

export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD || "";
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Basic ${Buffer.from("admin:" + password).toString("base64")}`;
  if (password && auth === expected) {
    return NextResponse.next();
  }
  // ponytail: Basic auth cukup untuk 1 admin; naik ke session auth saat ada tim
  return new NextResponse("Login required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}
