import { cookies } from "next/headers";
import { ADMIN_COOKIE, sessionToken } from "@/lib/admin-session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminPassword || body.password !== adminPassword) {
    return Response.json({ error: "Password salah" }, { status: 401 });
  }

  const token = await sessionToken(adminPassword);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });

  return Response.json({ ok: true });
}
