import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { admin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
  if (!slug) return Response.json({ error: "Slug wajib diisi" }, { status: 400 });
  const { data: cls } = await admin.from("classes").select("id,slug,price,product_type,is_published").eq("slug", slug).maybeSingle();
  if (!cls || !cls.is_published || Number(cls.price) !== 0 || !["course", "workshop"].includes(cls.product_type)) {
    return Response.json({ error: "Kelas gratis tidak tersedia" }, { status: 404 });
  }
  const token = (await cookies()).get("member_access_token")?.value;
  if (!token) return Response.json({ error: "Login diperlukan", login: true }, { status: 401 });
  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key");
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user?.email) return Response.json({ error: "Login diperlukan", login: true }, { status: 401 });
  const { data: member } = await admin.from("members").select("id,owned_classes").eq("email", user.email).maybeSingle();
  if (!member) return Response.json({ error: "Akun member belum aktif" }, { status: 403 });
  const owned = Array.isArray(member.owned_classes) ? member.owned_classes.map(String) : [];
  const next = [...new Set([...owned, cls.id, cls.slug])];
  const { error } = await admin.from("members").update({ owned_classes: next }).eq("id", member.id);
  if (error) return Response.json({ error: "Akses gratis gagal disimpan" }, { status: 500 });
  return Response.json({ ok: true, redirect: cls.product_type === "workshop" ? `/learn/workshop/${cls.slug}` : `/learn/course/${cls.slug}` });
}
