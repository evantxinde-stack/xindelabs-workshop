import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-session";

const SLUG = /^[a-z0-9][a-z0-9-]{1,80}$/;
const COLUMNS = "id,slug,class_id,headline,subheadline,vsl_youtube_id,countdown_type,countdown_ends_at,countdown_duration_minutes,sales_notification_enabled,sales_notification_config,faq_items,is_default,is_published,updated_at";

function parse(body: any): { error: string } | { data: Record<string, unknown> } {
  if (!body || typeof body !== "object") return { error: "Data tidak valid" };
  const slug = String(body.slug || "").trim().toLowerCase();
  if (!SLUG.test(slug)) return { error: "Slug wajib huruf kecil/angka/tanda hubung, contoh: hermes-earlybird" };
  let faq = body.faq_items ?? [];
  if (typeof faq === "string") { try { faq = JSON.parse(faq); } catch { return { error: "FAQ JSON tidak valid" }; } }
  if (!Array.isArray(faq)) return { error: "FAQ harus berupa JSON array, contoh: [{\"question\":\"...\",\"answer\":\"...\"}]" };
  let notice = body.sales_notification_config ?? {};
  if (typeof notice === "string") { try { notice = JSON.parse(notice); } catch { return { error: "Notification JSON tidak valid" }; } }
  if (!notice || typeof notice !== "object" || Array.isArray(notice)) return { error: "Notification harus berupa JSON object" };
  return { data: {
    slug,
    class_id: body.class_id || null,
    headline: body.headline || null,
    subheadline: body.subheadline || null,
    vsl_youtube_id: body.vsl_youtube_id || null,
    countdown_type: ["fixed", "evergreen", "none"].includes(body.countdown_type) ? body.countdown_type : "evergreen",
    countdown_ends_at: body.countdown_ends_at || null,
    countdown_duration_minutes: Number(body.countdown_duration_minutes || 30),
    sales_notification_enabled: Boolean(body.sales_notification_enabled),
    sales_notification_config: notice,
    faq_items: faq,
    is_default: Boolean(body.is_default),
    is_published: body.is_published === undefined ? true : Boolean(body.is_published),
  } };
}

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await admin.from("sales_page_config").select(`${COLUMNS},classes(title,slug,product_type)`).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = parse(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  await promote(parsed.data);
  const { data, error } = await admin.from("sales_page_config").upsert(parsed.data, { onConflict: "slug" }).select(COLUMNS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const parsed = parse(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  await promote(parsed.data);
  const { data, error } = await admin.from("sales_page_config").update(parsed.data).eq("id", body.id).select(COLUMNS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const { error } = await admin.from("sales_page_config").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}

// Only one default page per produk (unique index backs this up).
async function promote(data: Record<string, unknown>) {
  if (data.is_default && data.class_id) await admin.from("sales_page_config").update({ is_default: false }).eq("class_id", data.class_id as string).neq("slug", data.slug as string);
}
