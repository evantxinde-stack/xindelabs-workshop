import { requireAdmin } from "@/lib/admin-auth";
import { admin } from "@/lib/supabase/server";
import { Section } from "../shared";

export const dynamic = "force-dynamic";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium" });
}

async function getData() {
  const { data: members } = await admin
    .from("members")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return { members: members ?? [] };
}

export default async function LmsPage() {
  requireAdmin();
  const { members } = await getData();
  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">LMS Management</h1>
        <p className="mt-0.5 text-sm text-white/45">Manage LMS members dan akses.</p>
      </header>
      <Section title="LMS Members">
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Product</th>
                <th>Tier</th>
                <th>Paid Until</th>
                <th>Created</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => (
                <tr key={m.id}>
                  <td>{m.email}</td>
                  <td>{m.status}</td>
                  <td>{m.product}</td>
                  <td>{m.tier}</td>
                  <td>{m.paid_until ? new Date(m.paid_until).toLocaleDateString("id-ID") : "—"}</td>
                  <td>{fmt(m.created_at)}</td>
                  <td>{fmt(m.updated_at)}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-white/40">
                    Belum ada members
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
