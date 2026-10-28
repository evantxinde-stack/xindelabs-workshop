import { dispatchDueEmails } from "@/lib/email";
import { admin } from "@/lib/supabase/server";
import { reconcilePendingPayments } from "@/lib/orders";
import { revokeExpiredMemberships, syncAnnualRenewals, queueRenewalReminders } from "@/lib/membership";

export async function POST(req: Request) {
  const provided =
    req.headers.get("x-cron-secret") ??
    (req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let result;
  try {
    const [emails, payments, memberships, renewals] = await Promise.all([
      dispatchDueEmails(),
      reconcilePendingPayments(),
      revokeExpiredMemberships(),
      syncAnnualRenewals(),
    ]);
    const reminders = await queueRenewalReminders();
    const alerts = await collectAlerts();
    result = { emails, payments, memberships, renewals, reminders, alerts };
    console.log("[cron] send-email", JSON.stringify(result));
  } catch (e) {
    const message = e instanceof Error ? e.message : "dispatch failed";
    console.error("[cron] send-email failed", message);
    return Response.json({ error: message }, { status: 500 });
  }
  return Response.json(result);
}

/**
 * Operational alarms surfaced in the cron response so a scheduled run that is
 * quietly failing is visible without a log digger: mail the queue can never
 * deliver, and members whose paid window already lapsed.
 */
async function collectAlerts() {
  const [stuck, bounced, lapsed] = await Promise.all([
    admin.from("email_queue").select("id", { count: "exact", head: true }).gte("attempts", 5).eq("status", "pending"),
    admin.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
    admin.from("members").select("id", { count: "exact", head: true }).in("billing_status", ["grace", "revoked"]),
  ]);
  const alerts: string[] = [];
  if (stuck.count) alerts.push(`email macet (attempts>=5): ${stuck.count}`);
  if (bounced.count) alerts.push(`email bounced: ${bounced.count}`);
  if (lapsed.count) alerts.push(`member grace/revoked: ${lapsed.count}`);
  return alerts;
}