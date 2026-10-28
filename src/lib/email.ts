import { admin } from "@/lib/supabase/server";

const MAX_ATTEMPTS = 5;
const BATCH = 50;

type Vars = Record<string, string>;

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

const htmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function textToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function render(template: { subject: string; html_body: string; body_text?: string | null }, vars: Vars) {
  const fill = (text: string) => text.replace(/\{\{\w+\}\}/g, (m) => vars[m.slice(2, -2)] ?? m);
  const subject = fill(template.subject);
  const raw = template.body_text?.trim()
    ? textToHtml(fill(htmlEscape(template.body_text)))
    : fill(template.html_body);
  const html = `${raw}<p style="font-size:12px;color:#666;"><a href="${appUrl()}/unsubscribe?email=${encodeURIComponent(vars.email)}">Berhenti berlangganan</a></p>`;
  return { subject, html };
}

async function buildVars(
  lead: { id: string; name: string; email: string },
  sequenceKey?: string | null
): Promise<Vars> {
  const app = appUrl();
  const vars: Vars = {
    name: lead.name,
    email: lead.email,
    vip_url: `${app}/vip-coaching?lead=${lead.id}`,
    fast_track_url: `${app}/fast-track?lead=${lead.id}`,
    group_url: process.env.NEXT_PUBLIC_GROUP_URL || "mailto:admin@example.com",
    checkout_url: `${app}/vip-coaching?lead=${lead.id}`,
    lms_url: process.env.NEXT_PUBLIC_LMS_URL ?? "https://xindelabs-workshop.vercel.app",
    lms_email: lead.email,
    lms_password: "",
    paid_until: "",
    renewal_url: `${app}/learn/dashboard`,
  };
  if (sequenceKey === "renewal_reminder" || sequenceKey === "renewal_confirmed") {
    const { data: member } = await admin
      .from("members")
      .select("paid_until, product")
      .eq("email", lead.email)
      .maybeSingle();
    if (member?.paid_until) vars.paid_until = String(member.paid_until).slice(0, 10);
    const slug = String(member?.product ?? "").split(",")[0].trim();
    if (slug) vars.renewal_url = `${app}/checkout/${slug}`;
  }
  if (sequenceKey === "fasttrack_access" || sequenceKey === "renewal_confirmed") {
    const { data: member } = await admin
      .from("members")
      .select("lms_password")
      .eq("email", lead.email)
      .maybeSingle();
    if (member?.lms_password) vars.lms_password = member.lms_password;
  }
  if (sequenceKey === "abandoned_checkout") {
    const { data: order } = await admin
      .from("orders")
      .select("product")
      .eq("lead_id", lead.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (order?.product) {
      vars.checkout_url = `${app}/checkout/${order.product}?lead=${lead.id}`;
    }
  }
  return vars;
}

async function sendViaResend(to: string, subject: string, html: string) {
  const base = process.env.RESEND_API_BASE ?? "https://api.resend.com";
  const res = await fetch(`${base}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: [to],
      subject,
      html,
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return { ok: false as const, error: json?.message ?? `HTTP ${res.status}` };
  return { ok: true as const, id: (json?.id ?? null) as string | null };
}

export async function dispatchDueEmails(leadId?: string) {
  const now = new Date(Date.now() + 90_000).toISOString();
  const sentAt = new Date().toISOString();
  const query = admin
    .from("email_queue")
    .select(
      "id, lead_id, sequence_id, template_id, attempts, email_sequences!inner(key)"
    )
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .lt("attempts", MAX_ATTEMPTS);
  const { data: cols, error } = await (leadId ? query.eq("lead_id", leadId) : query).limit(BATCH);

  if (error) throw new Error(error.message);
  let sent = 0;
  let skipped = 0;

  for (const q of cols ?? []) {
    const { data: claimed } = await admin
      .from("email_queue")
      .update({ status: "processing" })
      .eq("id", q.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    const { data: lead } = await admin
      .from("leads")
      .select("id, name, email")
      .eq("id", q.lead_id)
      .maybeSingle();
    if (!lead) {
      await fail(q.id, q.attempts, "lead not found");
      continue;
    }

    const { data: unsub } = await admin
      .from("unsubscribes")
      .select("id")
      .eq("email", lead.email)
      .maybeSingle();
    if (unsub) {
      await admin.from("email_queue").update({ status: "skipped" }).eq("id", q.id);
      skipped++;
      continue;
    }

    const { data: tpl } = await admin
      .from("email_templates")
      .select("subject, html_body, body_text")
      .eq("id", q.template_id)
      .maybeSingle();
    if (!tpl) {
      await fail(q.id, q.attempts, "template not found");
      continue;
    }

    const vars = await buildVars(lead, q.email_sequences?.[0]?.key);
    const { subject, html } = render(tpl, vars);

    const result = await sendViaResend(lead.email, subject, html);
    if (!result.ok) {
      await fail(q.id, q.attempts, result.error);
      continue;
    }

    await admin.from("email_queue").update({ status: "sent" }).eq("id", q.id);
    await admin.from("email_logs").insert({
      queue_id: q.id,
      lead_id: q.lead_id,
      resend_id: result.id,
      status: "sent",
      sent_at: sentAt,
    });
    sent++;
  }

  return { sent, skipped };
}

function fail(id: string, attempts: number, error: string) {
  return admin
    .from("email_queue")
    .update({
      status: "pending",
      attempts: attempts + 1,
      error,
    })
    .eq("id", id);
}