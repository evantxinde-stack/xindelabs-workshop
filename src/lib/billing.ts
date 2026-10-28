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
