import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-session";
import { parseJsonValue } from "@/lib/content";
import {
  inferDbProductType,
  normalizeProductMeta,
  type DbProductType,
  type ProductMeta,
} from "@/lib/product-meta";

const META_SETTINGS_KEY = "product_catalog_meta";
const VALID_DB_TYPES: DbProductType[] = ["course", "workshop", "vip", "bundle"];

async function auth(req: NextRequest) {
  return isAdminRequest(req);
}

async function readMetaMap(): Promise<Record<string, ProductMeta>> {
  try {
    const { data } = await admin
      .from("settings")
      .select("value")
      .eq("key", META_SETTINGS_KEY)
      .maybeSingle();
    const parsed = parseJsonValue(data?.value);
    return parsed as Record<string, ProductMeta>;
  } catch {
    return {};
  }
}

async function writeMetaMap(map: Record<string, ProductMeta>) {
  await admin
    .from("settings")
    .upsert({ key: META_SETTINGS_KEY, value: JSON.stringify(map) }, { onConflict: "key" });
}

function resolveDbType(body: any): DbProductType {
  if (typeof body?.product_type === "string" && VALID_DB_TYPES.includes(body.product_type as DbProductType)) {
    return body.product_type as DbProductType;
  }
  const cat = typeof body?.meta?.category === "string" ? body.meta.category : "";
  return inferDbProductType(cat, "course");
}

export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type");
  let query = admin
    .from("classes")
    .select(
      "id,slug,title,description,price,annual_price,lifetime_price,payment_options,product_type,is_published,sort_order,cover_image,trailer_youtube_id,member_cross_sell_price,workshop_meet_url,workshop_replay_url,early_bird_price,early_bird_until,early_bird_quota,bump_class_id,bump_price,bump_title,bump_active",
    )
    .order("sort_order")
    .order("title");
  if (type) query = query.eq("product_type", type);

  const [{ data, error }, metaMap] = await Promise.all([query, readMetaMap()]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (data ?? []).map((row) => ({
    ...row,
    meta: normalizeProductMeta(metaMap[row.id] ?? metaMap[row.slug], row.product_type),
  }));

  return NextResponse.json({ data: enriched });
}

export async function PATCH(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id || !body.title || !body.slug) {
    return NextResponse.json({ error: "Data produk tidak lengkap" }, { status: 400 });
  }

  const productType = resolveDbType(body);
  const update = {
    slug: String(body.slug).trim().toLowerCase(),
    title: String(body.title).trim(),
    description: body.description || null,
    cover_image: body.cover_image ? String(body.cover_image).trim() : null,
    price: body.price === "" || body.price == null ? null : Number(body.price),
    annual_price: body.annual_price === "" || body.annual_price == null ? null : Number(body.annual_price),
    lifetime_price: body.lifetime_price === "" || body.lifetime_price == null ? null : Number(body.lifetime_price),
    payment_options:
      Array.isArray(body.payment_options) && body.payment_options.length
        ? body.payment_options.filter((x: unknown) => x === "annual" || x === "lifetime")
        : ["lifetime"],
    product_type: productType,
    is_published: Boolean(body.is_published),
    sort_order: Number(body.sort_order || 0),
    trailer_youtube_id: body.trailer_youtube_id || null,
    member_cross_sell_price:
      body.member_cross_sell_price === "" || body.member_cross_sell_price == null
        ? null
        : Number(body.member_cross_sell_price),
    workshop_meet_url: body.workshop_meet_url || null,
    workshop_replay_url: body.workshop_replay_url || null,
    early_bird_price:
      body.early_bird_price === "" || body.early_bird_price == null
        ? null
        : Number(body.early_bird_price),
    early_bird_until: body.early_bird_until || null,
    early_bird_quota:
      body.early_bird_quota === "" || body.early_bird_quota == null
        ? null
        : Number(body.early_bird_quota),
    bump_class_id: body.bump_class_id || null,
    bump_price:
      body.bump_price === "" || body.bump_price == null ? null : Number(body.bump_price),
    bump_title: body.bump_title ? String(body.bump_title).trim() : null,
    bump_active: Boolean(body.bump_active),
  };

  const { data, error } = await admin
    .from("classes")
    .update(update)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const normalizedMeta = normalizeProductMeta(body.meta, productType);
  if (body.meta) {
    const metaMap = await readMetaMap();
    metaMap[data.id] = normalizedMeta;
    await writeMetaMap(metaMap);
  }

  return NextResponse.json({ data: { ...data, meta: normalizedMeta } });
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.slug) {
    return NextResponse.json({ error: "Judul dan slug wajib diisi" }, { status: 400 });
  }

  const productType = resolveDbType(body);
  const { data, error } = await admin
    .from("classes")
    .insert({
      slug: String(body.slug).trim().toLowerCase(),
      title: String(body.title).trim(),
      description: body.description || null,
      price: body.price === "" || body.price == null ? null : Number(body.price),
      annual_price: body.annual_price === "" || body.annual_price == null ? null : Number(body.annual_price),
      lifetime_price: body.lifetime_price === "" || body.lifetime_price == null ? null : Number(body.lifetime_price),
      payment_options:
        Array.isArray(body.payment_options) && body.payment_options.length
          ? body.payment_options.filter((x: unknown) => x === "annual" || x === "lifetime")
          : ["lifetime"],
      product_type: productType,
      is_published: Boolean(body.is_published),
      sort_order: Number(body.sort_order || 0),
      cover_image: body.cover_image ? String(body.cover_image).trim() : null,
      trailer_youtube_id: body.trailer_youtube_id || null,
      member_cross_sell_price:
        body.member_cross_sell_price === "" || body.member_cross_sell_price == null
          ? null
          : Number(body.member_cross_sell_price),
      workshop_meet_url: body.workshop_meet_url || null,
      workshop_replay_url: body.workshop_replay_url || null,
      early_bird_price:
        body.early_bird_price === "" || body.early_bird_price == null
          ? null
          : Number(body.early_bird_price),
      early_bird_until: body.early_bird_until || null,
      early_bird_quota:
        body.early_bird_quota === "" || body.early_bird_quota == null
          ? null
          : Number(body.early_bird_quota),
      bump_class_id: body.bump_class_id || null,
      bump_price:
        body.bump_price === "" || body.bump_price == null ? null : Number(body.bump_price),
      bump_title: body.bump_title ? String(body.bump_title).trim() : null,
      bump_active: Boolean(body.bump_active),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const normalizedMeta = normalizeProductMeta(body.meta, productType);
  const metaMap = await readMetaMap();
  metaMap[data.id] = normalizedMeta;
  await writeMetaMap(metaMap);

  return NextResponse.json({ data: { ...data, meta: normalizedMeta } }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const { data: cls, error: classError } = await admin
    .from("classes")
    .select("id,slug")
    .eq("id", id)
    .maybeSingle();
  if (classError) return NextResponse.json({ error: classError.message }, { status: 500 });
  if (!cls) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

  const { data: sales, error: salesError } = await admin
    .from("orders")
    .select("id")
    .or(`class_id.eq.${id},product.eq.${cls.slug}`)
    .in("status", ["pending", "paid"]);
  if (salesError && !/column .*class_id.*does not exist/i.test(salesError.message)) {
    return NextResponse.json({ error: salesError.message }, { status: 500 });
  }
  if (sales?.length) {
    const { data, error } = await admin
      .from("classes")
      .update({ is_published: false })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({
      data,
      archived: true,
      message: "Produk pernah memiliki transaksi; diarsipkan.",
    });
  }

  const { error } = await admin.from("classes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const metaMap = await readMetaMap();
  if (id in metaMap) {
    delete metaMap[id];
    await writeMetaMap(metaMap);
  }

  return NextResponse.json({ deleted: true });
}
