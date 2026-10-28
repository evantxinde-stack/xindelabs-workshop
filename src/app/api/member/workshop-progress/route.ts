import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { admin } from "@/lib/supabase/server";
import { billingAccess, ownsClass } from "@/app/learn/access";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b?.pre_session_id || !Array.isArray(b.completed_items)) {
    return Response.json({ error: "Data progress tidak lengkap" }, { status: 400 });
  }

  const token = (await cookies()).get("member_access_token")?.value;
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const auth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key"
  );
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const email = user.email.toLowerCase();
  const { data: member } = await admin.from("members").select("*").eq("email", email).maybeSingle();
  if (billingAccess(member) !== "active") return Response.json({ error: "Akses LMS belum aktif" }, { status: 403 });

  const { data: pre } = await admin.from("workshop_pre_sessions").select("id,class_id").eq("id", b.pre_session_id).maybeSingle();
  if (!pre) return Response.json({ error: "Pre-session tidak ditemukan" }, { status: 404 });
  const { data: cls } = await admin.from("classes").select("id,slug").eq("id", pre.class_id).maybeSingle();
  const { data: orders } = await admin.from("orders").select("class_id,product,status").eq("email", email).eq("status", "paid");
  if (!ownsClass(member, cls, orders ?? [])) return Response.json({ error: "Workshop ini tidak kamu miliki" }, { status: 403 });

  const { data, error } = await admin
    .from("workshop_pre_session_progress")
    .upsert(
      {
        member_id: member.id,
        pre_session_id: pre.id,
        completed_items: b.completed_items,
        completed_at: b.completed_items.length > 0 ? new Date().toISOString() : null,
      },
      { onConflict: "member_id,pre_session_id" }
    )
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ data });
}
