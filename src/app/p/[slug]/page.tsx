import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase/server";
import { SalesPageClient } from "./sales-page-client";

export const dynamic = "force-dynamic";

// A slug matches either a configured sales page or a product slug, so every
// product has a working detail page before marketing adds variants.
export default async function SalesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: configured } = await admin.from("sales_page_config").select("*").eq("slug", slug).maybeSingle();
  const { data: product } = configured?.class_id
    ? await admin.from("classes").select("*").eq("id", configured.class_id).maybeSingle()
    : await admin.from("classes").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!product) notFound();
  const config = configured ?? {
    slug, class_id: product.id, headline: product.title, subheadline: product.description,
    vsl_youtube_id: product.trailer_youtube_id, countdown_type: "none", countdown_ends_at: null,
    countdown_duration_minutes: 0, sales_notification_enabled: false, sales_notification_config: {}, faq_items: [],
  };
  const [{ data: lessons }, { count }] = await Promise.all([
    admin.from("lessons").select("id,title,sort_order").eq("class_id", product.id).order("sort_order"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("class_id", product.id).eq("early_bird", true).eq("status", "paid"),
  ]);
  (product as any).early_bird_used = count ?? 0;
  return <SalesPageClient config={config} product={product} lessons={lessons ?? []} />;
}
