import { NextRequest } from "next/server";
import { admin } from "@/lib/supabase/server";
import { PRODUCTS, createInvoice, mayarEnabled, productPrice, type LmsTier } from "@/lib/mayar";

async function applyVoucher(
  code: string | undefined,
  tier: LmsTier | undefined,
  basePrice: number
): Promise<{ amount: number; discount: number }> {
  if (!code) return { amount: basePrice, discount: 0 };
  const { data: v } = await admin
    .from("vouchers")
    .select("id,type,value,tier,max_uses,used_count,active,expires_at")
    .eq("code", code)
    .maybeSingle();
  if (!v || !v.active) return Promise.reject({ status: 400, message: "Kode voucher tidak valid" });
  if (v.expires_at && new Date(v.expires_at) < new Date()) {
    return Promise.reject({ status: 400, message: "Kode voucher sudah kedaluwarsa" });
  }
  if (v.max_uses !== null && v.used_count >= v.max_uses) {
    return Promise.reject({ status: 400, message: "Kuota voucher sudah habis" });
  }
  if (v.tier !== "all" && v.tier !== (tier ?? "yearly")) {
    return Promise.reject({ status: 400, message: "Voucher tidak berlaku untuk paket ini" });
  }
  const discount =
    v.type === "percent"
      ? Math.round((basePrice * Number(v.value)) / 100)
      : Math.min(Number(v.value), basePrice);
  return { amount: Math.max(basePrice - discount, 0), discount };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const product = body?.product;
  const productKey = product as keyof typeof PRODUCTS;
  const leadId = body?.lead_id;
  const tier: LmsTier | undefined =
    product === "fast_track" ? (body?.tier === "lifetime" ? "lifetime" : "yearly") : undefined;
  const voucher = typeof body?.voucher === "string" ? body.voucher.trim() : undefined;
  const amountOverride = typeof body?.amount === "number" && body.amount > 0 ? body.amount : undefined;

  if (!PRODUCTS[productKey] || typeof leadId !== "string") {
    return Response.json({ error: "Request tidak valid" }, { status: 400 });
  }
  if (!mayarEnabled()) {
    return Response.json({ error: "Pembayaran belum diaktifkan. Hubungi admin." }, { status: 400 });
  }

  let leadRow: { id: string; name: string | null; email: string | null; whatsapp: string | null } | null = null;
  if (String(leadId) === "test") {
    leadRow = { id: "test", name: "Test User", email: "test@example.com", whatsapp: "6280000000000" };
  } else {
    const { data: lead } = await admin
      .from("leads")
      .select("id, name, email, whatsapp")
      .eq("id", leadId)
      .maybeSingle();
    leadRow = lead;
  }
  if (!leadRow) {
    console.error("[checkout] lead not found", { leadId, product });
    return Response.json({ error: "Lead tidak ditemukan. Isi form tutorial di halaman utama dulu, lalu ulangi checkout." }, { status: 404 });
  }

  const { data: paid } = await admin
    .from("orders")
    .select("id")
    .eq("lead_id", leadId)
    .eq("product", product)
    .eq("status", "paid")
    .maybeSingle();
  if (paid) {
    return Response.json({
      link: `${process.env.APP_URL}/checkout/success?product=${product}&lead=${leadId}`,
    });
  }

  const basePrice = amountOverride ?? productPrice(productKey, tier);
  let final: { amount: number; discount: number };
  try {
    final = await applyVoucher(voucher, tier, basePrice);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return Response.json({ error: err.message ?? "Voucher tidak valid" }, { status: err.status ?? 400 });
  }

  let invoice;
  try {
    invoice = await createInvoice({
      name: leadRow.name ?? "User",
      email: leadRow.email ?? "test@example.com",
      mobile: leadRow.whatsapp ?? "6280000000000",
      product: productKey,
      leadId,
      tier,
      amount: final.amount,
    });
  } catch (e) {
    console.error("[checkout] invoice creation failed", {
      leadId,
      product,
      tier,
      error: e instanceof Error ? e.message : String(e),
    });
    return Response.json(
      { error: e instanceof Error ? e.message : "Gagal membuat invoice" },
      { status: 502 }
    );
  }

  await admin.from("orders").insert({
    lead_id: leadId,
    product,
    tier,
    voucher_code: voucher || null,
    amount: final.amount,
    mayar_invoice_id: invoice.invoiceId,
    mayar_transaction_id: invoice.transactionId,
  });

  await admin.rpc("enroll_lead_sequence", {
    p_lead_id: leadId,
    p_sequence_key: "abandoned_checkout",
  });

  await admin.from("pipeline_events").insert({
    lead_id: leadId,
    event_type: "checkout_initiated",
    meta: { product, invoice_id: invoice.invoiceId },
  });

  return Response.json({ link: invoice.link });
}