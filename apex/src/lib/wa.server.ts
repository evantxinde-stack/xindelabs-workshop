import { admin } from "@/lib/supabase/server";
import type { WaTemplate } from "@/lib/wa";

export async function getWaTemplates(): Promise<WaTemplate[]> {
  const { data } = await admin.from("wa_templates").select("id,name,content").order("name");
  return (data ?? []) as WaTemplate[];
}