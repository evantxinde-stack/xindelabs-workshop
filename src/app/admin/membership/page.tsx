import { admin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Section } from "../shared";
import { billingAccess } from "@/lib/membership-access";
import { renewalWindow } from "@/lib/billing";

export const dynamic = "force-dynamic";

type State = "active" | "due" | "grace" | "expired" | "revoked" | "lifetime";

function stateOf(member: any): State {
  if (member.billing_status === "revoked") return "revoked";
  if (member.tier === "lifetime" || member.payment_option === "lifetime") return "lifetime";
  const access = billingAccess(member);
  if (access === "none") return "expired";
  const window = renewalWindow(member.paid_until);
  if (window.state === "grace") return "grace";
  if (window.state === "due") return "due";
  return "active";
}

const LABEL: Record<State, string> = {
  active: "Aktif",
  due: "Jatuh tempo ≤30 hari",
  grace: "Masa tenggang (read-only)",
  expired: "Expired (akses tertutup)",
  revoked: "Revoked",
  lifetime: "Lifetime",
};

const ORDER: State[] = ["due", "grace", "expired", "revoked", "active", "lifetime"];

export default async function MembershipBillingPage() {
  await requireAdmin();
  const { data } = await admin
    .from("members")
    .select("email,name,status,tier,payment_option,billing_status,paid_until,grace_until,product")
    .order("paid_until", { ascending: true, nullsFirst: false });
  const members = (data ?? []) as any[];

  const groups = new Map<State, any[]>();
  for (const m of members) {
    const s = stateOf(m);
    groups.set(s, [...(groups.get(s) ?? []), m]);
  }

  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Membership &amp; Renewal</h1>
        <p className="mt-0.5 text-sm text-white/45">
          Status tagihan annual. Perubahan status dilakukan otomatis oleh webhook dan cron harian —
          halaman ini hanya untuk memantau.
        </p>
      </header>

      {ORDER.filter((s) => groups.has(s)).map((s) => (
        <Section key={s} title={`${LABEL[s]} (${groups.get(s)!.length})`}>
          <div className="overflow-x-auto">
            <table className="tbl w-full">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Tier</th>
                  <th>Tagihan</th>
                  <th>Paid Until</th>
                  <th>Grace Until</th>
                  <th>Produk</th>
                </tr>
              </thead>
              <tbody>
                {groups.get(s)!.map((m) => (
                  <tr key={m.email}>
                    <td>{m.email}</td>
                    <td>{m.tier ?? "—"}</td>
                    <td>{m.payment_option ?? "—"}</td>
                    <td>{m.paid_until ?? "—"}</td>
                    <td className="text-white/60">{m.grace_until ?? "—"}</td>
                    <td className="max-w-[240px] truncate text-xs text-white/45">{m.product ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ))}

      {!members.length && (
        <Section title="Belum ada member">
          <p className="text-white/50">Belum ada record membership.</p>
        </Section>
      )}
    </>
  );
}
