import { admin } from "@/lib/supabase/server";

// Catalog rows + which sales page (if any) should be the detail destination.
export async function loadCatalog(types?: string[]) {
  let query = admin.from("classes").select("id,slug,title,description,price,annual_price,lifetime_price,early_bird_price,early_bird_until,early_bird_quota,product_type,is_published,sort_order,cover_image").eq("is_published", true);
  if (types) query = query.in("product_type", types);
  const [{ data }, { data: pages }, { data: eb }] = await Promise.all([
    query.order("sort_order"),
    admin.from("sales_page_config").select("class_id,slug,is_default,updated_at").not("class_id", "is", null).order("is_default", { ascending: false }).order("updated_at", { ascending: false }),
    admin.from("orders").select("class_id").eq("early_bird", true).eq("status", "paid"),
  ]);
  const byClass = new Map<string, string>();
  (pages ?? []).forEach((p: any) => { if (!byClass.has(p.class_id)) byClass.set(p.class_id, p.slug); });
  const used = new Map<string, number>();
  (eb ?? []).forEach((o: any) => used.set(o.class_id, (used.get(o.class_id) || 0) + 1));
  return (data ?? []).map((x: any) => ({ ...x, sales_page_slug: byClass.get(x.id) ?? null, early_bird_used: used.get(x.id) || 0 }));
}
