import { admin } from "@/lib/supabase/server";
import { markOrderPaid } from "@/lib/orders";
import { getInvoiceStatus } from "@/lib/mayar";
import { callbackTokenOk, parseMayarEvent } from "@/lib/checkout";

export async function POST(req: Request) {
  const expectedToken = process.env.MAYAR_CALLBACK_TOKEN;
  const providedToken = req.headers.get("x-callback-token");
  if (!callbackTokenOk(providedToken, expectedToken)) return Response.json({ error: "Callback tidak terautentikasi" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = parseMayarEvent(body);
  if (!parsed) return Response.json({ ok: true, ignored: true });

  const { data: order } = await admin
    .from("orders")
    .select("id,mayar_invoice_id")
    .eq("mayar_transaction_id", parsed.transactionId)
    .maybeSingle();
  if (!order?.mayar_invoice_id) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });

  const verified = String(await getInvoiceStatus(order.mayar_invoice_id)).toLowerCase();
  if (!["paid", "success", "settled"].includes(verified)) return Response.json({ error: "Pembayaran belum terverifikasi" }, { status: 409 });

  await markOrderPaid({ transactionId: parsed.transactionId, amount: parsed.amount, method: parsed.method });
  return Response.json({ ok: true });
}