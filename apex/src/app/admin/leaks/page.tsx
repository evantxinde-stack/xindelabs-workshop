import { admin } from "@/lib/supabase/server";
import { StatusBar } from "../charts";

export const dynamic = "force-dynamic";

export default async function LeaksPage() {
  const [events, leads, orders] = await Promise.all([
    admin.from("pipeline_events").select("id,lead_id,event_type,created_at"),
    admin.from("leads").select("id,status,source,created_at"),
    admin.from("orders").select("id,lead_id,product,status"),
  ]);

  const ev = events.data ?? [];
  const distinct = (pred: (e: (typeof ev)[number]) => boolean) => new Set(ev.filter(pred).map((e) => e.lead_id));

  const visited = distinct((e) => /_visited$/.test(e.event_type));
  const checkoutVisited = distinct((e) => e.event_type === "checkout_visited");
  const checkoutInit = distinct((e) => e.event_type === "checkout_initiated");

  const paidLeads = new Set((orders.data ?? []).filter((o) => o.status === "paid").map((o) => o.lead_id));

  const allLeads = leads.data ?? [];
  const engaged = new Set(ev.map((e) => e.lead_id));

  const stages = [
    { key: "lead_masuk", label: "Lead Masuk", leads: allLeads.length, hint: "Semua baris leads" },
    { key: "ledeng_onb", label: "Engaged (punya event)", leads: engaged.size, hint: "Lead yang tercatat di pipeline_events" },
    { key: "lander", label: "Lander Dilihat", leads: visited.size, hint: "fast_track_visited / vip_visited / join_group_visited" },
    { key: "checkout_buka", label: "Checkout Dibuka", leads: checkoutVisited.size, hint: "checkout_visited" },
    { key: "checkout_mulai", label: "Checkout Dimulai", leads: checkoutInit.size, hint: "checkout_initiated" },
    { key: "bayar", label: "Pembayaran Sukses", leads: paidLeads.size, hint: "orders paid" },
  ];

  const eventBreakdown = new Map<string, number>();
  for (const e of ev) eventBreakdown.set(e.event_type, (eventBreakdown.get(e.event_type) ?? 0) + 1);

  const bySource = new Map<string, number>();
  for (const l of allLeads) {
    const s = l.source || "unknown";
    bySource.set(s, (bySource.get(s) ?? 0) + 1);
  }

  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Funnel Kebocoran</h1>
        <p className="mt-0.5 text-sm text-white/45">Di mana lead hilang di tiap tahap funnel.</p>
      </header>

      <div className="panel p-5">
        <h2 className="panel-title">Alur Funnel</h2>
        <p className="panel-sub mt-0.5">Lead unik per tahap, konversi dari tahap sebelumnya, dan kebocoran.</p>
        <div className="mt-4 space-y-4">
          {stages.map((s, i) => {
            const prev = i === 0 ? s.leads : stages[i - 1].leads;
            const conv = i === 0 ? 100 : prev ? Math.round((s.leads / prev) * 100) : 0;
            const bocor = i === 0 ? 0 : prev - s.leads;
            return (
              <div key={s.key}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-white/80">{s.label}</span>
                  <span className="text-white/45">
                    {s.leads.toLocaleString("id-ID")} lead
                    {i > 0 && (
                      <>
                        {" · "}
                        <span className="text-[#00FF88]">{conv}% dari prev</span>
                        {bocor > 0 && <span className="text-[#ff6b6b]"> · bocor {bocor}</span>}
                      </>
                    )}
                  </span>
                </div>
                <StatusBar label="" value={s.leads} total={allLeads.length || 1} color={s.leads ? "#00FF88" : "rgba(255,255,255,.08)"} />
                {s.hint && <p className="mt-0.5 text-[11px] text-white/35">{s.hint}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="panel-title">Event Pipeline</h2>
          <p className="panel-sub mt-0.5">Jumlah event per jenis.</p>
          <div className="mt-3 max-h-64 overflow-y-auto">
            {[...eventBreakdown.entries()].map(([type, n]) => (
              <div key={type} className="flex items-center justify-between border-b border-white/5 py-1.5 text-sm last:border-0">
                <span className="font-mono text-xs text-white/70">{type}</span>
                <span className="text-white/45">{n.toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="panel-title">Lead per Source</h2>
          <p className="panel-sub mt-0.5">Distribusi asal lead.</p>
          <div className="mt-3 space-y-3">
            {[...bySource.entries()].map(([src, n]) => (
              <StatusBar key={src} label={src} value={n} total={allLeads.length || 1} color="#7f9cff" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}