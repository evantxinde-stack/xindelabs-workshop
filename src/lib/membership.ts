import { admin } from "@/lib/supabase/server";
import { graceUntil, renewalWindow } from "@/lib/billing";

export async function revokeExpiredMemberships() {
  const now = new Date().toISOString();
  const { data: expired, error } = await admin
    .from("members")
    .select("id")
    .eq("payment_option", "annual")
    .eq("billing_status", "grace")
    .lt("grace_until", now)
    .limit(100);

  if (error) throw error;
  let revoked = 0;
  for (const member of expired ?? []) {
    const { error: updateError } = await admin
      .from("members")
      .update({ billing_status: "revoked", revoked_at: now })
      .eq("id", member.id)
      .eq("payment_option", "annual")
      .eq("billing_status", "grace");
    if (updateError) throw updateError;
    revoked++;
  }
  return { checked: expired?.length ?? 0, revoked };
}

/**
 * Annual members whose paid_until already passed move active → grace
 * (read-only, grace_until = paid_until + 7 days). Grace expiry is revoked by
 * revokeExpiredMemberships. Lifetime members are never touched.
 */
export async function syncAnnualRenewals() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: lapsed, error } = await admin
    .from("members")
    .select("id,paid_until")
    .eq("payment_option", "annual")
    .eq("billing_status", "active")
    .not("paid_until", "is", null)
    .lt("paid_until", today)
    .limit(100);
  if (error) throw error;

  let graced = 0;
  for (const member of lapsed ?? []) {
    const { error: updateError } = await admin
      .from("members")
      .update({ billing_status: "grace", grace_until: graceUntil(member.paid_until) })
      .eq("id", member.id)
      .eq("billing_status", "active");
    if (updateError) throw updateError;
    graced++;
  }
  return { checked: lapsed?.length ?? 0, graced };
}

/** Annual members inside the renewal reminder window (default 30 days). */
export async function renewalsDue(days = 30) {
  const limit = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await admin
    .from("members")
    .select("id,email,name,paid_until,product")
    .eq("payment_option", "annual")
    .eq("billing_status", "active")
    .not("paid_until", "is", null)
    .lte("paid_until", limit)
    .order("paid_until");
  if (error) throw error;
  return (data ?? []).filter((m) => renewalWindow(m.paid_until).state === "due");
}

const RENEWAL_SEQUENCE_KEY = "renewal_reminder";

/**
 * Queue one reminder per due member through the normal email_queue →
 * dispatcher path (unsubscribes and retries keep working). Idempotent: skips a
 * member who already has a queue row for this sequence.
 */
export async function queueRenewalReminders(days = 30) {
  const due = await renewalsDue(days);
  if (!due.length) return { due: 0, queued: 0, skipped: 0 };

  const { data: sequence } = await admin
    .from("email_sequences")
    .select("id")
    .eq("key", RENEWAL_SEQUENCE_KEY)
    .maybeSingle();
  const { data: template } = await admin
    .from("email_templates")
    .select("id")
    .eq("key", `${RENEWAL_SEQUENCE_KEY}_due`)
    .maybeSingle();
  if (!sequence || !template) {
    return { due: due.length, queued: 0, skipped: due.length, error: "sequence atau template belum ada" };
  }

  let queued = 0;
  let skipped = 0;
  for (const member of due) {
    const { data: lead } = await admin
      .from("leads")
      .select("id")
      .eq("email", String(member.email).toLowerCase())
      .maybeSingle();
    if (!lead) {
      skipped++;
      continue;
    }
    const { data: existing } = await admin
      .from("email_queue")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("sequence_id", sequence.id)
      .in("status", ["pending", "processing", "sent"])
      .limit(1);
    if (existing?.length) {
      skipped++;
      continue;
    }
    const { error } = await admin.from("email_queue").insert({
      lead_id: lead.id,
      sequence_id: sequence.id,
      template_id: template.id,
      step: 1,
      scheduled_for: new Date().toISOString(),
      status: "pending",
    });
    if (error) throw error;
    queued++;
  }
  return { due: due.length, queued, skipped };
}
