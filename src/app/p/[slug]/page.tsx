import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase/server";
import { SalesPageClient } from "./sales-page-client";

export const dynamic = "force-dynamic";

export default async function SalesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: config } = await admin.from("sales_page_config").select("*").eq("slug", slug).maybeSingle();
  if (!config) notFound();
  const [{ data: product }, { data: lessons }] = await Promise.all([
    config.class_id ? admin.from("classes").select("*").eq("id", config.class_id).maybeSingle() : Promise.resolve({ data: null }),
    config.class_id ? admin.from("lessons").select("id,title,sort_order").eq("class_id", config.class_id).order("sort_order") : Promise.resolve({ data: [] }),
  ]);
  if (product) {
    const { count } = await admin.from("orders").select("id", { count: "exact", head: true }).eq("class_id", product.id).eq("early_bird", true).eq("status", "paid");
    (product as any).early_bird_used = count ?? 0;
  }
  return <SalesPageClient config={config} product={product} lessons={lessons ?? []} />;
}
