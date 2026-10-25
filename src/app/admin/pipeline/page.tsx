import { admin } from "@/lib/supabase/server";
import { Timeline } from "./timeline";

export const dynamic = "force-dynamic";

async function getEvents() {
  const { data } = await admin
    .from("pipeline_events")
    .select("id,lead_id,event_type,meta,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  return data ?? [];
}

async function getLeads() {
  const { data } = await admin
    .from("leads")
    .select("id,name,email");
  return data ?? [];
}

export default async function PipelinePage() {
  const [events, leads] = await Promise.all([getEvents(), getLeads()]);
  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Pipeline Leads</h1>
        <p className="mt-0.5 text-sm text-white/45">Tracking per lead (bahasa mudah dipahami).</p>
      </header>
      <Timeline events={events} leads={leads} />
    </>
  );
}