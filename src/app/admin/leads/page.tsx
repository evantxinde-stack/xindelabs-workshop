import { admin } from "@/lib/supabase/server";
import { LeadsManager, type LeadRow } from "@/components/LeadsManager";
import { Section } from "../shared";

export const dynamic = "force-dynamic";

async function getLeads() {
  const { data } = await admin
    .from("leads")
    .select("id,name,email,whatsapp,status,source,current_stage,created_at,business_field")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export default async function LeadsPage() {
  const leads = (await getLeads()) as LeadRow[];
  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Leads & WhatsApp</h1>
        <p className="mt-0.5 text-sm text-white/45">Pilih template, lalu kirim follow-up WA manual ke tiap lead.</p>
      </header>
      <Section title="Daftar Leads">
        <LeadsManager leads={leads} />
      </Section>
    </>
  );
}