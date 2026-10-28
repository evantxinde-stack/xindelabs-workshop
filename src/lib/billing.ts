/**
 * Billing window rules — pure, no I/O, so they stay unit-testable.
 * Lifetime purchases never expire; annual purchases run 12 months and
 * renew from the current period end when it is still in the future.
 */
export type PaymentOption = "annual" | "lifetime";

export function membershipPeriodEnd(option: PaymentOption) {
  if (option === "lifetime") return null;
  const end = new Date();
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return end.toISOString();
}

export function nextPaidUntil(
  option: PaymentOption,
  currentPaidUntil?: string | null
): string | null {
  if (option === "lifetime") return null;
  const now = Date.now();
  const current = currentPaidUntil ? new Date(currentPaidUntil).getTime() : 0;
  const base = Number.isFinite(current) && current > now ? current : now;
  return new Date(base + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const GRACE_DAYS = 7;

/**
 * Where an annual member sits relative to their billing window.
 * due = still active but inside the reminder window; grace = window passed,
 * read-only until grace ends; expired = grace over, access must be revoked.
 */
export function renewalWindow(
  paidUntil: string | null | undefined,
  now: Date = new Date(),
  graceDays = GRACE_DAYS,
  remindDays = 30
): { state: "lifetime" | "active" | "due" | "grace" | "expired"; daysLeft: number | null } {
  if (!paidUntil) return { state: "lifetime", daysLeft: null };
  const end = new Date(paidUntil).getTime();
  if (!Number.isFinite(end)) return { state: "lifetime", daysLeft: null };
  const day = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((end - now.getTime()) / day);
  if (daysLeft > remindDays) return { state: "active", daysLeft };
  if (daysLeft > 0) return { state: "due", daysLeft };
  if (daysLeft > -graceDays) return { state: "grace", daysLeft };
  return { state: "expired", daysLeft };
}

export function graceUntil(paidUntil: string, graceDays = GRACE_DAYS): string {
  return new Date(new Date(paidUntil).getTime() + graceDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
