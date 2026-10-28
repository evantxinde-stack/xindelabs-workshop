import { dispatchDueEmails } from "@/lib/email";
import { reconcilePendingPayments } from "@/lib/orders";
import { revokeExpiredMemberships } from "@/lib/membership";

export async function POST(req: Request) {
  const provided =
    req.headers.get("x-cron-secret") ??
    (req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let result;
  try {
    const [emails, payments, memberships] = await Promise.all([
      dispatchDueEmails(),
      reconcilePendingPayments(),
      revokeExpiredMemberships(),
    ]);
    result = { emails, payments, memberships };
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "dispatch failed" }, { status: 500 });
  }
  return Response.json(result);
}