export const ADMIN_COOKIE = "admin_session";

// Session token = SHA-256 dari password admin: stateless, tak bisa ditebak.
// ponytail: cukup 1 admin; ganti signed JWT (jose) saat multi-user.
export async function sessionToken(password: string) {
  const data = new TextEncoder().encode("xindelabs-admin-v1:" + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isAdminRequest(req: Request) {
  const password = process.env.ADMIN_PASSWORD || "";
  if (!password) return false;
  const token = await sessionToken(password);
  const cookie = req.headers.get("cookie") || "";
  return cookie.split(/;\s*/).includes(`${ADMIN_COOKIE}=${token}`);
}
