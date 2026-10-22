import { markOrderPaid } from "@/lib/orders";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const event = body?.event;
  const data = body?.data ?? {};

  if (event === "payment.received" && data.status === "SUCCESS" && data.transactionStatus === "paid") {
    const transactionId = data.transactionId ?? data.id;
    if (transactionId) {
      await markOrderPaid({ transactionId, amount: data.amount ?? 0, method: data.paymentMethod });
    }
  }

  return Response.json({ ok: true });
}