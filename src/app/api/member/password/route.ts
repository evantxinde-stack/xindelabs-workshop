import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { admin } from "@/lib/supabase/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key";

export async function POST(req: Request) {
  const { current, password } = await req.json().catch(() => ({} as any));
  if (typeof password !== "string" || password.length < 6) return Response.json({ error: "Password minimal 6 karakter." }, { status: 400 });
  const token = (await cookies()).get("member_access_token")?.value;
  if (!token) return Response.json({ error: "Belum login." }, { status: 401 });
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data: { user } } = await client.auth.getUser(token);
  if (!user?.email) return Response.json({ error: "Sesi tidak valid." }, { status: 401 });
  if (typeof current === "string" && current) {
    const { error } = await client.auth.signInWithPassword({ email: user.email, password: current });
    if (error) return Response.json({ error: "Password sekarang salah." }, { status: 400 });
  }
  const { error } = await admin.auth.admin.updateUserById(user.id, { password });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
