import { admin } from "@/lib/supabase/server";
import SalesPageEditor from "./editor";

export const dynamic = "force-dynamic";

export default async function SalesPagesPage() {
  const [{ data: configs }, { data: classes }, { data: lessonRows }] = await Promise.all([
    admin.from("sales_page_config").select("*").order("updated_at", { ascending: false }),
    admin.from("classes").select("*").order("title"),
    admin.from("lessons").select("id,title,class_id,sort_order").order("sort_order"),
  ]);
  const lessons: Record<string, unknown[]> = {};
  for (const row of lessonRows ?? []) { const k = (row as any).class_id; if (k) (lessons[k] ||= []).push(row); }
  return <>
    <header><h1 className="text-2xl font-bold">Sales Page Builder</h1><p className="mt-1 text-sm text-white/45">VSL, countdown, FAQ, dan live-sales notification.</p></header>
    <SalesPageEditor initial={configs ?? []} classes={classes ?? []} lessons={lessons} />
  </>;
}
