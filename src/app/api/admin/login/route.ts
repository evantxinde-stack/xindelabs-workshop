import { cookies } from "next/headers";
import { ADMIN_COOKIE, sessionToken } from "@/lib/admin-session";
import { authCookieOptions } from "@/lib/auth-cookie";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminPassword || body.password !== adminPassword) {
    return Response.json({ error: "Password salah" }, { status: 401 });
  }

  const token = await sessionToken(adminPassword);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    ...authCookieOptions(req.headers.get("host")?.split(":")[0]),
    maxAge: 60 * 60 * 24 * 7,
  });

  return Response.json({ ok: true });
}
