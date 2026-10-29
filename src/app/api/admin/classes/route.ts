import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-session";

async function auth(req: NextRequest) {
  return isAdminRequest(req);
}

export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type");
  let query = admin.from("classes").select("id,slug,title,description,price,annual_price,lifetime_price,payment_options,product_type,is_published,sort_order,cover_image,trailer_youtube_id,member_cross_sell_price,workshop_meet_url,workshop_replay_url,early_bird_price,early_bird_until,early_bird_quota").order("sort_order").order("title");
  if (type) query = query.eq("product_type", type);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id || !body.title || !body.slug || !["course", "workshop", "vip", "bundle"].includes(body.product_type)) return NextResponse.json({ error: "Data kelas tidak lengkap" }, { status: 400 });
  const update = { slug: String(body.slug).trim().toLowerCase(), title: String(body.title).trim(), description: body.description || null, cover_image: body.cover_image ? String(body.cover_image).trim() : null, price: body.price === "" ? null : Number(body.price), annual_price: body.annual_price === "" || body.annual_price == null ? null : Number(body.annual_price), lifetime_price: body.lifetime_price === "" || body.lifetime_price == null ? null : Number(body.lifetime_price), payment_options: Array.isArray(body.payment_options) && body.payment_options.length ? body.payment_options.filter((x: unknown) => x === "annual" || x === "lifetime") : ["lifetime"], product_type: body.product_type, is_published: Boolean(body.is_published), sort_order: Number(body.sort_order || 0), trailer_youtube_id: body.trailer_youtube_id || null, member_cross_sell_price: body.member_cross_sell_price === "" ? null : Number(body.member_cross_sell_price), workshop_meet_url: body.workshop_meet_url || null, workshop_replay_url: body.workshop_replay_url || null, early_bird_price: body.early_bird_price === "" || body.early_bird_price == null ? null : Number(body.early_bird_price), early_bird_until: body.early_bird_until || null, early_bird_quota: body.early_bird_quota === "" || body.early_bird_quota == null ? null : Number(body.early_bird_quota) };
  const { data, error } = await admin.from("classes").update(update).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.slug || !["course", "workshop", "vip", "bundle"].includes(body.product_type)) return NextResponse.json({ error: "Judul, slug, dan kategori wajib diisi" }, { status: 400 });
  const { data, error } = await admin.from("classes").insert({ slug: String(body.slug).trim().toLowerCase(), title: String(body.title).trim(), description: body.description || null, price: body.price === "" ? null : Number(body.price), annual_price: body.annual_price === "" || body.annual_price == null ? null : Number(body.annual_price), lifetime_price: body.lifetime_price === "" || body.lifetime_price == null ? null : Number(body.lifetime_price), payment_options: Array.isArray(body.payment_options) && body.payment_options.length ? body.payment_options.filter((x: unknown) => x === "annual" || x === "lifetime") : ["lifetime"], product_type: body.product_type, is_published: false, sort_order: Number(body.sort_order || 0), cover_image: body.cover_image ? String(body.cover_image).trim() : null, early_bird_price: body.early_bird_price === "" || body.early_bird_price == null ? null : Number(body.early_bird_price), early_bird_until: body.early_bird_until || null, early_bird_quota: body.early_bird_quota === "" || body.early_bird_quota == null ? null : Number(body.early_bird_quota) }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const { data: cls, error: classError } = await admin.from("classes").select("id,slug").eq("id", id).maybeSingle();
  if (classError) return NextResponse.json({ error: classError.message }, { status: 500 });
  if (!cls) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  const { data: sales, error: salesError } = await admin.from("orders").select("id").or(`class_id.eq.${id},product.eq.${cls.slug}`).in("status", ["pending", "paid"]);
  if (salesError && !/column .*class_id.*does not exist/i.test(salesError.message)) return NextResponse.json({ error: salesError.message }, { status: 500 });
  if (sales?.length) {
    const { data, error } = await admin.from("classes").update({ is_published: false }).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data, archived: true, message: "Produk pernah memiliki transaksi; diarsipkan." });
  }
  const { error } = await admin.from("classes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
