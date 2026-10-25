import { admin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const type: string = body?.type ?? "";
  const data = body?.data ?? {};
  const resendId: string = data?.email_id;
  if (!resendId) return new Response("ok", { status: 200 });

  const now = new Date().toISOString();
  const patch: Record<string, string> = {};
  if (type === "email.opened") patch.opened_at = data?.created_at ?? now;
  if (type === "email.clicked") patch.clicked_at = data?.created_at ?? now;
  if (type === "email.delivered") patch.status = "delivered";
  if (type === "email.bounced" || type === "email.complained") patch.status = "bounced";

  const { data: log } = await admin
    .from("email_logs")
    .update(patch)
    .eq("resend_id", resendId)
    .select("queue_id, status")
    .maybeSingle();

  if (log?.queue_id && patch.status === "bounced") {
    await admin.from("email_queue").update({ status: "failed", error: `resend ${type}` }).eq("id", log.queue_id);
  }

  return new Response("ok", { status: 200 });
}