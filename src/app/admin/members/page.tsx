import { admin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { memberInsight, maskEmail } from "@/lib/insights";
import { Section } from "../shared";

export const dynamic = "force-dynamic";

export default async function MembersInsightsPage() {
  await requireAdmin();
  const [{ data: members }, { data: classes }, { data: lessons }, { data: progress }, { data: certificates }, { data: orders }] = await Promise.all([
    admin.from("members").select("*").order("email"),
    admin.from("classes").select("id,slug,title"),
    admin.from("lessons").select("id,class_id"),
    admin.from("lesson_progress").select("email,class_id,lesson_id,completed"),
    admin.from("certificates").select("email,class_id"),
    admin.from("orders").select("email,status,amount,product"),
  ]);
  const rows = (members ?? []).map((member: any) => ({ member, insight: memberInsight({ member, classes: classes ?? [], lessons: lessons ?? [], progress: progress ?? [], certificates: certificates ?? [], orders: orders ?? [] }) }));
  const revenue = rows.reduce((sum, row) => sum + row.insight.paidRevenue, 0);

  return <>
    <header><h1 className="text-2xl font-bold">Member Insights</h1><p className="mt-0.5 text-sm text-white/45">Billing, akses, pembelajaran, sertifikat.</p></header>
    <div className="mt-6 grid gap-3 md:grid-cols-3"><div className="panel p-5"><p className="panel-sub">Member</p><p className="mt-2 text-2xl font-bold">{rows.length}</p></div><div className="panel p-5"><p className="panel-sub">Revenue paid</p><p className="mt-2 text-2xl font-bold text-[#00FF88]">Rp{revenue.toLocaleString("id-ID")}</p></div><div className="panel p-5"><p className="panel-sub">Sertifikat</p><p className="mt-2 text-2xl font-bold">{rows.reduce((n, r) => n + r.insight.certificates, 0)}</p></div></div>
    <Section title={`Detail member (${rows.length})`}><div className="overflow-x-auto"><table className="tbl w-full"><thead><tr><th>Email</th><th>Akses</th><th>Kelas</th><th>Progress</th><th>Sertifikat</th><th>Revenue</th></tr></thead><tbody>{rows.map(({ member, insight }) => <tr key={member.email}><td>{maskEmail(member.email)}</td><td>{insight.access}</td><td>{insight.ownedClasses.length}</td><td>{insight.lessonsDone}/{insight.lessonsTotal} ({insight.progressPct}%)</td><td>{insight.certificates}</td><td>Rp{insight.paidRevenue.toLocaleString("id-ID")}</td></tr>)}</tbody></table></div></Section>
  </>;
}
