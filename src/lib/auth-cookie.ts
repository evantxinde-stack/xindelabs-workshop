import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export function authCookieOptions(hostname = process.env.NEXT_PUBLIC_APP_HOST || ""): Pick<ResponseCookie, "path" | "httpOnly" | "secure" | "sameSite" | "domain"> {
  const productionSubdomain = process.env.NODE_ENV === "production" && (hostname === "xindelabs.web.id" || hostname.endsWith(".xindelabs.web.id"));

  return {
    path: "/",
    httpOnly: true,
    secure: productionSubdomain,
    sameSite: "lax",
    ...(productionSubdomain ? { domain: ".xindelabs.web.id" } : {}),
  };
}
