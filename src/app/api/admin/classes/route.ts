import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { admin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try { requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const type = req.nextUrl.searchParams.get("type");
  let query = admin.from("classes").select("id,slug,title,description,price,product_type,is_published,sort_order,trailer_youtube_id,member_cross_sell_price,workshop_meet_url,workshop_replay_url").order("sort_order").order("title");
  if (type) query = query.eq("product_type", type);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  try { requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const body = await req.json().catch(() => null);
  if (!body?.id || !body.title || !body.slug || !["course", "workshop", "vip", "bundle"].includes(body.product_type)) return NextResponse.json({ error: "Data kelas tidak lengkap" }, { status: 400 });
  const update = { slug: String(body.slug).trim().toLowerCase(), title: String(body.title).trim(), description: body.description || null, price: body.price === "" ? null : Number(body.price), product_type: body.product_type, is_published: Boolean(body.is_published), sort_order: Number(body.sort_order || 0), trailer_youtube_id: body.trailer_youtube_id || null, member_cross_sell_price: body.member_cross_sell_price === "" ? null : Number(body.member_cross_sell_price), workshop_meet_url: body.workshop_meet_url || null, workshop_replay_url: body.workshop_replay_url || null };
  const { data, error } = await admin.from("classes").update(update).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  try { requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.slug || !["course", "workshop", "vip", "bundle"].includes(body.product_type)) return NextResponse.json({ error: "Judul, slug, dan kategori wajib diisi" }, { status: 400 });
  const { data, error } = await admin.from("classes").insert({ slug: String(body.slug).trim().toLowerCase(), title: String(body.title).trim(), description: body.description || null, price: body.price === "" ? null : Number(body.price), product_type: body.product_type, is_published: false, sort_order: Number(body.sort_order || 0) }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
