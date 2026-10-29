import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, sessionToken } from "@/lib/admin-session";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function prefixedPath(prefix: string, pathname: string) {
  return pathname === "/" ? prefix : `${prefix}${pathname}`;
}

function isPreviewHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".vercel.app");
}

export async function middleware(req: NextRequest) {
  const { pathname, hostname, searchParams } = req.nextUrl;

  if (pathname === "/karyawan" || pathname === "/karyawan.html") {
    return NextResponse.redirect(new URL("/service", req.url), 308);
  }

  const password = process.env.ADMIN_PASSWORD || "";
  const token = await sessionToken(password);
  const authorized = Boolean(password) && req.cookies.get(ADMIN_COOKIE)?.value === token;

  if (pathname === "/admin/login") {
    return authorized ? NextResponse.redirect(new URL("/admin", req.url)) : routeByHost(req, hostname, pathname, searchParams);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!authorized) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return routeByHost(req, hostname, pathname, searchParams);
}

function routeByHost(
  req: NextRequest,
  hostname: string,
  pathname: string,
  searchParams: URLSearchParams,
) {
  if (pathname.startsWith("/api/") || pathname === "/api" || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  if (hostname === "learn.xindelabs.web.id") {
    return pathname.startsWith("/learn") ? NextResponse.next() : NextResponse.rewrite(new URL(prefixedPath("/learn", pathname), req.url));
  }

  if (hostname === "tutorial.xindelabs.web.id") {
    return pathname.startsWith("/tutorial") ? NextResponse.next() : NextResponse.rewrite(new URL(prefixedPath("/tutorial", pathname), req.url));
  }

  if (isPreviewHost(hostname)) {
    if (hostname.endsWith(".vercel.app") && pathname.startsWith("/learn")) {
      const review = new URL(req.url).searchParams.get("site");
      if (review !== "learn") {
        return NextResponse.redirect(new URL(`${pathname}${req.nextUrl.search}`, "https://learn.xindelabs.web.id"), 308);
      }
    }
    const site = searchParams.get("site");
    if (site === "learn" && !pathname.startsWith("/learn")) {
      const url = new URL(prefixedPath("/learn", pathname), req.url);
      url.searchParams.delete("site");
      return NextResponse.rewrite(url);
    }
    if (site === "tutorial" && !pathname.startsWith("/tutorial")) {
      const url = new URL(prefixedPath("/tutorial", pathname), req.url);
      url.searchParams.delete("site");
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
