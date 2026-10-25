import { admin } from "@/lib/supabase/server";
import { AreaChart, BarsChart, StatusBar } from "./charts";
import { buildUnifiedLeads, computeRevenueDetailed, uniquePaidCustomers, mapSource } from "@/lib/unified-funnel";

export const dynamic = "force-dynamic";

type Range = { from: Date; toEx: Date };

function parseDate(s: string | undefined, fallback: string) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return fallback;
  return s;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

const rupiah = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`
    : `Rp${n.toLocaleString("id-ID")}`;

async function load(params: Promise<{ from?: string; to?: string }>) {
  const q = await params;
  const today = new Date();
  const from = new Date(parseDate(q.from, iso(addDays(today, -29))));
  const fromStr = parseDate(q.from, iso(addDays(today, -29)));
  const toStr = parseDate(q.to, iso(addDays(today, 1)));
  const toEx = new Date(toStr);

  const range: Range = { from, toEx };

  const [leadsAll, membersAll, ordersAll, emails, queue, unsubs] = await Promise.all([
    admin.from("leads").select("*"),
    admin.from("members").select("*"),
    admin.from("orders").select("*"),
    admin.from("email_logs").select("status,sent_at"),
    admin.from("email_queue").select("status"),
    admin.from("unsubscribes").select("created_at"),
  ]);

  const leads = leadsAll.data ?? [];
  const members = membersAll.data ?? [];
  const orders = ordersAll.data ?? [];

  // Build lead notes map
  const leadNotesMap = new Map<string, string | null>();
  for (const l of leads) {
    leadNotesMap.set(l.id, (l as any).notes ?? null);
  }

  const unified = buildUnifiedLeads(leads as any, members as any, orders as any, leadNotesMap);

  const inRange = (d: string | null) => d && new Date(d) >= range.from && new Date(d) < range.toEx;

  type DayRow = { leads: number; paid: number; revenue: number; sent: number; bounce: number };
  const dayMap = new Map<string, DayRow>();
  for (let d = new Date(range.from); d < range.toEx; d.setDate(d.getDate() + 1)) {
    dayMap.set(iso(d), { leads: 0, paid: 0, revenue: 0, sent: 0, bounce: 0 });
  }
  const bump = (d: string | null, k: keyof DayRow) => {
    if (!d) return;
    const key = iso(new Date(d));
    if (dayMap.has(key)) dayMap.get(key)![k]++;
  };
  for (const l of leads) bump((l as any).created_at, "leads");
  for (const o of orders as any[]) if (o.status === "paid" && inRange(o.paid_at)) {
    const key = iso(new Date(o.paid_at!));
    if (dayMap.has(key)) {
      const row = dayMap.get(key)!;
      row.paid++;
      row.revenue += Number(o.amount ?? 0);
    }
  }
  for (const e of emails.data ?? []) if (inRange(e.sent_at)) {
    bump(e.sent_at, "sent");
    if (e.status === "bounced") bump(e.sent_at, "bounce");
  }

  const days = [...dayMap.entries()].map(([k, v]) => ({ ...v, label: dayLabel(new Date(k + "T00:00:00")) }));
  const leadsPoints = days.map((d) => ({ label: d.label, value: d.leads }));
  const payPoints = days.map((d) => ({ label: d.label, value: d.paid }));
  const revPoints = days.map((d) => ({ label: d.label, value: d.revenue }));

  const leadsTotal = leads.filter((l) => inRange((l as any).created_at)).length ?? 0;
  const paidOrders = orders.filter((o) => (o as any).status === "paid" && inRange((o as any).paid_at)) ?? [];
  const revenue = paidOrders.reduce((s, o) => s + Number((o as any).amount ?? 0), 0);
  const pendingOrders = orders.filter((o) => (o as any).status === "pending").length ?? 0;
  const sent = emails.data?.filter((e) => e.status === "sent" && inRange(e.sent_at)).length ?? 0;
  const bounced = emails.data?.filter((e) => e.status === "bounced" && inRange(e.sent_at)).length ?? 0;
  const due = queue.data?.filter((q) => q.status === "pending").length ?? 0;
  const failed = queue.data?.filter((q) => q.status === "failed").length ?? 0;
  const unsubsTotal = unsubs.data?.filter((u) => inRange(u.created_at)).length ?? 0;

  const revDetailed = computeRevenueDetailed(leads as any, members as any, orders as any, leadNotesMap);
  const paidCustomersSet = uniquePaidCustomers(unified);

  const tutorialLeads = unified.filter((u) => u.source_group === "Tutorial").length;
  const workshopLeads = unified.filter((u) => u.source_group === "Workshop").length;
  const komunitasLeads = unified.filter((u) => u.source_group === "Komunitas").length;
  const vipOffer = unified.filter((u) => /vip/i.test(`${u.products.join(" ")} ${u.current_stage ?? ""}`)).length;
  const courseDownsell = unified.filter((u) => /course|kelas|fast.?track/i.test(`${u.products.join(" ")} ${u.current_stage ?? ""}`)).length;
  const freeTutorial = unified.filter((u) => u.source_group === "Tutorial" || u.products.includes("Tutorial Free")).length;
  const paidCustomers = paidCustomersSet.size;
  const workshopMembers = members.filter((m) => (m as any).status === "paid").length;
  const ordersPending = orders.filter((o) => (o as any).status === "pending").length;
  const revenueRecorded = revDetailed.revenueRecorded;
  const amountUnrecordedCount = revDetailed.amountUnrecordedCount;

  return {
    range,
    fromStr,
    toStr,
    days,
    leadsPoints,
    payPoints,
    revPoints,
    leadsTotal,
    paidOrders,
    revenue,
    pendingOrders,
    sent,
    bounced,
    due,
    failed,
    unsubsTotal,
    tutorialLeads,
    workshopLeads,
    komunitasLeads,
    vipOffer,
    courseDownsell,
    freeTutorial,
    paidCustomers,
    workshopMembers,
    ordersPending,
    revenueRecorded,
    amountUnrecordedCount,
    unified,
    members: members as any[],
  };
}

function Stat({ label, value, tone, note }: { label: string; value: string; tone?: "ok" | "warn"; note?: string }) {
  const color = tone === "ok" ? "text-[#00FF88]" : tone === "warn" ? "text-[#ff6b6b]" : "text-white";
  return (
    <div className="panel grid-bg p-4">
      <p className="text-xs font-medium text-white/45">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {note && <p className="mt-0.5 text-[11px] text-white/35">{note}</p>}
    </div>
  );
}

function Chart({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <div className="mb-3">
        <h2 className="panel-title">{title}</h2>
        <p className="panel-sub mt-0.5">{sub}</p>
      </div>
      {children}
    </div>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const s = await load(searchParams);
  const conv = s.leadsTotal ? Math.round((s.paidOrders.length / s.leadsTotal) * 100) : 0;

  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-0.5 text-sm text-white/45">Ringkasan funnel, pembayaran, dan email.</p>
      </header>

      <form method="get" className="panel flex flex-wrap items-end gap-3 p-4">
        <label className="block">
          <span className="text-xs text-white/45">Dari</span>
          <input type="date" name="from" defaultValue={s.fromStr} className="input-dark mt-1" />
        </label>
        <label className="block">
          <span className="text-xs text-white/45">Sampai</span>
          <input type="date" name="to" defaultValue={s.toStr} className="input-dark mt-1" />
        </label>
        <button className="rounded-lg bg-[#00FF88] px-4 py-2 text-sm font-bold text-black">Terapkan</button>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { n: "7 hari", d: 6 },
            { n: "30 hari", d: 29 },
            { n: "90 hari", d: 89 },
            { n: "Semua", d: 3650 },
          ].map((p) => (
            <a
              key={p.n}
              href={`/admin?from=${iso(addDays(new Date(), -p.d))}&to=${iso(addDays(new Date(), 1))}`}
              className="rounded-full px-3 py-1.5 text-white/60 ring-1 ring-white/10 hover:bg-white/5 hover:text-white"
            >
              {p.n}
            </a>
          ))}
        </div>
      </form>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Total Omzet (Mayar)" value={rupiah(s.revenue)} tone="ok" />
        <Stat label="Total Leads" value={s.leadsTotal.toLocaleString("id-ID")} />
        <Stat label="Tutorial Leads" value={s.tutorialLeads.toLocaleString("id-ID")} />
        <Stat label="Workshop Leads" value={s.workshopLeads.toLocaleString("id-ID")} />
        <Stat label="Komunitas Leads" value={s.komunitasLeads.toLocaleString("id-ID")} />
        <Stat label="Paid Customers" value={s.paidCustomers.toLocaleString("id-ID")} tone="ok" />
        <Stat label="Workshop Members" value={s.workshopMembers.toLocaleString("id-ID")} />
        <Stat label="Orders Pending" value={s.ordersPending.toLocaleString("id-ID")} tone={s.ordersPending > 0 ? "warn" : undefined} />
        <Stat label="Revenue Tercatat" value={rupiah(s.revenueRecorded)} tone="ok" />
        <Stat label="Amount Belum Tercatat" value={s.amountUnrecordedCount.toLocaleString("id-ID")} />
        <Stat label="Email Terkirim" value={s.sent ? s.sent.toLocaleString("id-ID") : "0"} />
        <Stat label="Queue Gagal" value={s.failed ? s.failed.toLocaleString("id-ID") : "0"} tone={s.failed > 0 ? "warn" : undefined} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Chart title="Pendapatan per Hari" sub="Total nominal order paid per hari.">
          <AreaChart points={s.revPoints} money />
        </Chart>
        <Chart title="Leads Baru per Hari" sub="Lead masuk per hari.">
          <BarsChart points={s.leadsPoints} />
        </Chart>
        <Chart title="Pembayaran Sukses per Hari" sub="Jumlah transaksi paid per hari.">
          <BarsChart points={s.payPoints} />
        </Chart>
        <Chart title="Status Email" sub={`Dari ${(s.sent || 0) + (s.bounced || 0)} email di rentang ini.`}>
          <div className="space-y-3">
            <StatusBar label="Terkirim" value={s.sent || 0} total={(s.sent || 0) + (s.bounced || 0) || 1} color="#00FF88" />
            <StatusBar label="Bounce" value={s.bounced || 0} total={(s.sent || 0) + (s.bounced || 0) || 1} color="#ff6b6b" />
            <StatusBar label="Antrian menunggu" value={s.due || 0} total={(s.due || 0) + (s.failed || 0) || 1} color="rgba(255,255,255,.35)" />
            <StatusBar label="Antrian gagal" value={s.failed || 0} total={(s.failed || 0) + (s.due || 0) || 1} color="#ff6b6b" />
          </div>
        </Chart>
      </div>

      <div className="panel p-5">
        <h2 className="panel-title">Funnel Conversion Center</h2>
        <p className="panel-sub mt-0.5">Konversi dari lead yang masuk sampai pembayaran sukses.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <StatusBar label="Leads Baru" value={s.leadsTotal} total={s.leadsTotal || 1} color="#00FF88" />
            <div className="mt-2">
              <StatusBar label={`Pembayaran Sukses (${conv}%)`} value={s.paidOrders.length} total={s.leadsTotal || 1} color="#7f9cff" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-white/45">
              Avg transaksi: <span className="text-white">{rupiah(s.paidOrders.length ? Math.round(s.revenue / s.paidOrders.length) : 0)}</span>
            </p>
            <p className="text-xs text-white/45">
              Transaksi sukses: <span className="text-white">{s.paidOrders.length}</span>
            </p>
          </div>
          <div className="space-y-3">
            {[['VIP Offer', s.vipOffer], ['Course Downsell', s.courseDownsell], ['Free Tutorial', s.freeTutorial]].map(([label, value]) => {
              const n = Number(value); const pct = s.leadsTotal ? Math.round((n / s.leadsTotal) * 100) : 0;
              return <StatusBar key={String(label)} label={`${label} (${pct}%)`} value={n} total={s.leadsTotal || 1} color="#10B981" />;
            })}
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="panel-title">Member Terbaru</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {s.members.slice(0, 6).map((m: any) => <div key={m.id} className="rounded-lg border border-white/10 bg-[#0A140E] p-3 text-sm"><span className="text-white">{m.name || m.email || 'Member'}</span><span className="ml-2 text-xs text-white/40">{m.product || m.tier || m.status || '—'}</span></div>)}
          {!s.members.length && <p className="text-sm text-white/40">Belum ada member.</p>}
        </div>
      </div>
    </>
  );
}
