import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { admin } from "@/lib/supabase/server";
import { billingAccess } from "@/app/learn/access";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.lesson_id || !body?.class_id) return Response.json({ error: "lesson_id dan class_id wajib" }, { status: 400 });
  const token = (await cookies()).get("member_access_token")?.value;
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key");
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data: member } = await admin.from("members").select("*").eq("email", user.email.toLowerCase()).maybeSingle();
  if (billingAccess(member) === "none") return Response.json({ error: "Akses LMS dicabut" }, { status: 403 });
  const { data: lesson } = await admin.from("lessons").select("id,class_id").eq("id", body.lesson_id).eq("class_id", body.class_id).maybeSingle();
  if (!lesson) return Response.json({ error: "Lesson tidak ditemukan" }, { status: 404 });
  const { data, error } = await admin.from("lesson_progress").upsert({ lesson_id: body.lesson_id, email: user.email.toLowerCase(), class_id: body.class_id, completed: Boolean(body.completed), completed_at: body.completed ? new Date().toISOString() : null }, { onConflict: "email,lesson_id" }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ data });
}
