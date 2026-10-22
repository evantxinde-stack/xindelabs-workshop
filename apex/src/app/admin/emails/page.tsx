import { admin } from "@/lib/supabase/server";
import { EmailLogsTable, type LogRow } from "../shared";

export const dynamic = "force-dynamic";

async function getEmailLogs() {
  const { data } = await admin
    .from("email_logs")
    .select("id,status,resend_id,sent_at,opened_at,clicked_at")
    .order("sent_at", { ascending: false })
    .limit(30);
  return data ?? [];
}

export default async function EmailsPage() {
  const logs = (await getEmailLogs()) as LogRow[];
  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Email Logs</h1>
        <p className="mt-0.5 text-sm text-white/45">Riwayat pengiriman Resend.</p>
      </header>
      <EmailLogsTable logs={logs} />
    </>
  );
}