import { admin } from "@/lib/supabase/server";
import VipManager from "./manager";

export const dynamic = "force-dynamic";

export default async function VipPage() {
  const [{ data: config }, { data: workspace }, { data: members }] = await Promise.all([
    admin.from("vip_config").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("vip_workspace").select("*").order("updated_at", { ascending: false }),
    admin.from("members").select("id,email,name,status,product,tier,is_vip").or("is_vip.eq.true,product.ilike.%vip%,tier.ilike.%vip%").order("created_at", { ascending: false }),
  ]);
  return <><header><h1 className="text-2xl font-bold">VIP Manager</h1><p className="mt-1 text-sm text-white/45">Kuota, booking WhatsApp, dan workspace privat member VIP.</p></header><VipManager initialConfig={config} initialWorkspace={workspace ?? []} members={members ?? []} /></>;
}
