import { admin } from "@/lib/supabase/server";
import { Section } from "../shared";
import { mapSource } from "@/lib/unified-funnel";
import { OrderWaFollowup } from "@/components/OrderWaFollowup";

export const dynamic = "force-dynamic";

async function getData() {
  const [ordersAll, leadsAll] = await Promise.all([
    admin.from("orders").select("*").order("created_at", { ascending: false }),
    admin.from("leads").select("id,name,email,whatsapp"),
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
      whatsapp: l?.whatsapp ?? null,
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
        <p className="mt-0.5 text-sm text-white/45">
          Daftar order — klik &quot;Kirim WA&quot; untuk follow-up pending.
        </p>
      </header>
      <Section title="Daftar Orders">
        <OrderWaFollowup orders={rows} />
      </Section>
    </>
  );
}
