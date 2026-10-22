import { admin } from "@/lib/supabase/server";
import { Section } from "../shared";
import { LeadsManagerUnified } from "@/components/LeadsManagerUnified";
import { buildUnifiedLeads } from "@/lib/unified-funnel";

export const dynamic = "force-dynamic";

async function getData() {
  const [leadsAll, membersAll, ordersAll] = await Promise.all([
    admin.from("leads").select("*").order("created_at", { ascending: false }).limit(500),
    admin.from("members").select("*"),
    admin.from("orders").select("*"),
  ]);

  const leads = leadsAll.data ?? [];
  const members = membersAll.data ?? [];
  const orders = ordersAll.data ?? [];

  const leadNotesMap = new Map<string, string | null>();
  for (const l of leads) {
    leadNotesMap.set(l.id, (l as any).notes ?? null);
  }

  const unified = buildUnifiedLeads(leads as any, members as any, orders as any, leadNotesMap);
  return { unified, totalLeads: leads.length };
}

export default async function UnifiedLeadsPage() {
  const { unified } = await getData();
  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Unified Leads</h1>
        <p className="mt-0.5 text-sm text-white/45">Tampilan terpusat untuk semua funnel.</p>
      </header>
      <Section title="Daftar Leads">
        <LeadsManagerUnified leads={unified as any} />
      </Section>
    </>
  );
}
