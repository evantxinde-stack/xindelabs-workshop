import { admin } from "@/lib/supabase/server";
import { Section } from "../shared";
import { parseWorkshopAmountFromNotes } from "@/lib/unified-funnel";

export const dynamic = "force-dynamic";

function rupiah(n: number | null) {
  if (n === null || n === undefined) return "Belum tercatat";
  return `Rp${n.toLocaleString("id-ID")}`;
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium" });
}

async function getData() {
  const [leadsAll, membersAll] = await Promise.all([
    admin.from("leads").select("*"),
    admin.from("members").select("*").order("created_at", { ascending: false }),
  ]);

  const leads = leadsAll.data ?? [];
  const members = membersAll.data ?? [];

  const emailToLeadNotes = new Map<string, string | null>();
  for (const l of leads as any[]) {
    const e = (l.email || "").toLowerCase();
    if (e && !emailToLeadNotes.has(e)) {
      emailToLeadNotes.set(e, l.notes ?? null);
    }
  }

  const rows = members.map((m: any) => {
    const e = (m.email || "").toLowerCase();
    const notes = emailToLeadNotes.get(e) ?? null;
    const amount = parseWorkshopAmountFromNotes(notes);
    return {
      email: m.email,
      status: m.status,
      tier: m.tier,
      amount_paid: amount,
      paid_until: m.paid_until,
      created: m.created_at,
    };
  });

  return { rows };
}

export default async function WorkshopMembersPage() {
  const { rows } = await getData();
  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Workshop Members</h1>
        <p className="mt-0.5 text-sm text-white/45">Daftar member workshop.</p>
      </header>
      <Section title="Workshop Members">
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Tier</th>
                <th>Amount Paid</th>
                <th>Paid Until</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.email}</td>
                  <td>{r.status}</td>
                  <td>{r.tier}</td>
                  <td>{rupiah(r.amount_paid)}</td>
                  <td>{r.paid_until ? new Date(r.paid_until).toLocaleDateString("id-ID") : "—"}</td>
                  <td>{fmt(r.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
