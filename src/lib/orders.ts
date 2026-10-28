import { admin } from "@/lib/supabase/server";
import { provisionLmsAccess } from "@/lib/lms";
import { isRenewal } from "@/lib/billing";
import { dispatchDueEmails } from "@/lib/email";
import { after } from "next/server";

const SEQUENCE_BY_PRODUCT: Record<string, string> = {
  vip: "vip_onboarding",
  fast_track: "fasttrack_access",
};
const STATUS_BY_PRODUCT: Record<string, string> = {
  vip: "vip_paid",
  fast_track: "fast_track_paid",
};

async function provisionForOrder(order: { product: string; tier?: string | null; lead_id: string; class_id?: string | null; bump_class_id?: string | null; payment_option?: string | null }) {
  if (order.product !== "fast_track" && !order.class_id) return;
  const { data: lead } = await admin
    .from("leads")
    .select("email, name")
    .eq("id", order.lead_id)
    .maybeSingle();
  if (!lead?.email) return;
  let product = order.product;
  if (order.class_id) {
    const { data: cls } = await admin.from("classes").select("slug").eq("id", order.class_id).maybeSingle();
    product = cls?.slug ?? product;
  }
  let bumpProduct: string | null = null;
  if (order.bump_class_id) {
    const { data: bumpCls } = await admin.from("classes").select("slug").eq("id", order.bump_class_id).maybeSingle();
    bumpProduct = bumpCls?.slug ?? null;
  }
  const option = order.payment_option === "annual" ? "annual" : "lifetime";
  for (const slug of [product, bumpProduct]) {
    if (!slug) continue;
    try {
      await provisionLmsAccess({ email: lead.email, name: lead.name, tier: order.tier ?? "yearly", product: slug, payment_option: option });
    } catch (e) {
      console.error("[order] lms provision failed", {
        leadId: order.lead_id,
        product: slug,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

async function consumeVoucher(code: string | null) {
  if (!code) return;
  const { data: v } = await admin
    .from("vouchers")
    .select("id, used_count")
    .eq("code", code)
    .maybeSingle();
  if (v) {
    await admin.from("vouchers").update({ used_count: v.used_count + 1 }).eq("id", v.id);
  }
}

export async function markOrderPaid(input: {
  transactionId: string;
  amount: number;
  method?: string | null;
}) {
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("mayar_transaction_id", input.transactionId)
    .maybeSingle();

  if (!order) return false;
  if (order.status === "paid") {
    await provisionForOrder(order);
    await dispatchNow(order.lead_id);
    return true;
  }

  await admin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", order.id);

  await admin
    .from("leads")
    .update({ status: STATUS_BY_PRODUCT[order.product] ?? order.product, current_stage: "paid" })
    .eq("id", order.lead_id);

  await admin.from("pipeline_events").insert({
    lead_id: order.lead_id,
    event_type: "paid",
    meta: { product: order.product, method: input.method, amount: input.amount },
  });

  const { data: lead } = await admin
    .from("leads")
    .select("email")
    .eq("id", order.lead_id)
    .maybeSingle();
  let productSlug = order.product;
  if (order.class_id) {
    const { data: cls } = await admin.from("classes").select("slug").eq("id", order.class_id).maybeSingle();
    productSlug = cls?.slug ?? productSlug;
  }
  const { data: member } = lead?.email
    ? await admin.from("members").select("tier,payment_option,product,paid_until").eq("email", lead.email).maybeSingle()
    : { data: null };

  // Renewal: restore access and send the confirmation instead of the
  // first-purchase onboarding drip.
  if (isRenewal(member, productSlug)) {
    try {
      await admin.rpc("enroll_lead_sequence", {
        p_lead_id: order.lead_id,
        p_sequence_key: "renewal_confirmed",
      });
    } catch (e) {
      console.error("[order] renewal confirmation enroll failed", {
        leadId: order.lead_id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
    await consumeVoucher(order.voucher_code ?? null);
    await provisionForOrder(order);
    await dispatchNow(order.lead_id);
    return true;
  }

  await admin.rpc("enroll_lead_sequence", {
    p_lead_id: order.lead_id,
    p_sequence_key: SEQUENCE_BY_PRODUCT[order.product] ?? "vip_onboarding",
  });

  await consumeVoucher(order.voucher_code ?? null);
  await provisionForOrder(order);

  const { data: abandoned } = await admin
    .from("email_sequences")
    .select("id")
    .eq("key", "abandoned_checkout")
    .maybeSingle();
  if (abandoned) {
    await admin
      .from("email_queue")
      .delete()
      .eq("lead_id", order.lead_id)
      .eq("sequence_id", abandoned.id)
      .eq("status", "pending");
  }

  await dispatchNow(order.lead_id);
  return true;
}

/**
 * Activation/renewal emails are transactional: fire them right after the
 * payment is fulfilled instead of waiting for the daily housekeeping cron.
 * `after()` keeps the webhook response fast; outside a request context (e.g.
 * a script) the dispatch runs inline.
 */
async function dispatchNow(leadId: string) {
  const run = async () => {
    try {
      await dispatchDueEmails(leadId);
    } catch (e) {
      console.error("[order] immediate dispatch failed", {
        leadId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };
  try {
    after(run);
  } catch {
    await run();
  }
}

export async function reconcilePendingPayments(limit = 20) {
  if (!process.env.MAYAR_API_KEY) return { checked: 0, paid: 0 };
  const { data: pending } = await admin
    .from("orders")
    .select("id, mayar_transaction_id, mayar_invoice_id, amount, product")
    .eq("status", "pending")
    .not("mayar_invoice_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  let paid = 0;
  for (const order of pending ?? []) {
    try {
      const { getInvoiceStatus } = await import("@/lib/mayar");
      if (!order.mayar_invoice_id) continue;
      if ((await getInvoiceStatus(order.mayar_invoice_id)) === "paid") {
        const ok = await markOrderPaid({
          transactionId: order.mayar_transaction_id,
          amount: Number(order.amount),
        });
        if (ok) paid++;
      }
    } catch {
      // jangan gagalkan iterasi lain
    }
  }
  return { checked: pending?.length ?? 0, paid };
}

export async function ensurePaidByLead(
  leadId: string,
  product: string
): Promise<{ paid: boolean }> {
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("lead_id", leadId)
    .eq("product", product)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!order || order.status !== "pending") {
    return { paid: order?.status === "paid" };
  }
  const { link, invoiceId } = order;
  if (process.env.MAYAR_API_KEY && invoiceId) {
    try {
      const { getInvoiceStatus } = await import("@/lib/mayar");
      const status = await getInvoiceStatus(invoiceId);
      if (status === "paid") {
        await markOrderPaid({
          transactionId: order.mayar_transaction_id,
          amount: Number(order.amount),
        });
        return { paid: true };
      }
    } catch {}
  }
  return { paid: false };
}