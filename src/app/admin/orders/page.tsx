import { admin } from "@/lib/supabase/server";
import { Section } from "../shared";
import { mapSource } from "@/lib/unified-funnel";

export const dynamic = "force-dynamic";

function rupiah(n: number | null) {
  if (n === null || n === undefined) return "—";
  return `Rp${Number(n).toLocaleString("id-ID")}`;
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

async function getData() {
  const [ordersAll, leadsAll] = await Promise.all([
    admin.from("orders").select("*").order("created_at", { ascending: false }),
    admin.from("leads").select("*"),
  ]);

  const orders = ordersAll.data ?? [];
  const leads = leadsAll.data ?? [];

  const leadMap = new Map<string, any>();
  for (const l of leads) {
    leadMap.set(l.id, l);
  }

  const rows = orders.map((o: any) => {
    const l = o.lead_id ? leadMap.get(o.lead_id) : null;
    const sm = mapSource(l?.source);
    return {
      id: o.id,
      lead_name: l?.name || "—",
      lead_email: l?.email || "—",
      source: sm.label,
      product: o.product,
      amount: o.amount,
      status: o.status,
      paid_at: o.paid_at,
      created_at: o.created_at,
    };
  });

  return { rows };
}

export default async function OrdersPage() {
  const { rows } = await getData();
  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="mt-0.5 text-sm text-white/45">Daftar order.</p>
      </header>
      <Section title="Daftar Orders">
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Email</th>
                <th>Source</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid At</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.lead_name}</td>
                  <td>{r.lead_email}</td>
                  <td>{r.source}</td>
                  <td>{r.product || "—"}</td>
                  <td>{rupiah(r.amount)}</td>
                  <td>{r.status}</td>
                  <td>{fmt(r.paid_at)}</td>
                  <td>{fmt(r.created_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-white/40">
                    Belum ada orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
