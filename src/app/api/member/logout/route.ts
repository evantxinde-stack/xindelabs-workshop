import { cookies } from "next/headers";
export async function POST() {
  (await cookies()).set("member_access_token", "", { path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}
