import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { admin } from "@/lib/supabase/server";
import { billingAccess } from "@/app/learn/access";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.class_id) return Response.json({ error: "class_id wajib" }, { status: 400 });
  const token = (await cookies()).get("member_access_token")?.value;
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key");
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data: member } = await admin.from("members").select("*").eq("email", user.email.toLowerCase()).maybeSingle();
  if (billingAccess(member) !== "active") return Response.json({ error: "Selesaikan renewal untuk klaim sertifikat" }, { status: 403 });
  const email = user.email.toLowerCase();
  const [{ count: total }, { count: completed }] = await Promise.all([
    admin.from("lessons").select("id", { count: "exact", head: true }).eq("class_id", body.class_id),
    admin.from("lesson_progress").select("id", { count: "exact", head: true }).eq("class_id", body.class_id).eq("email", email).eq("completed", true),
  ]);
  if (!total || completed !== total) return Response.json({ error: "Selesaikan semua lesson terlebih dahulu" }, { status: 409 });
  const { data: existing } = await admin.from("certificates").select("*").eq("email", email).eq("class_id", body.class_id).maybeSingle();
  if (existing) return Response.json({ data: existing });
  const certificateNumber = `XL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const { data, error } = await admin.from("certificates").insert({ email, class_id: body.class_id, certificate_number: certificateNumber }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ data });
}
