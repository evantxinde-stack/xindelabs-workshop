export type Voucher = { type?: string | null; value?: number | string | null };

export function normalizeVoucherType(type: unknown): "percent" | "fixed" | null {
  if (type === "percent") return "percent";
  if (type === "fixed" || type === "amount") return "fixed";
  return null;
}

export function applyDiscount(base: number, voucher: Voucher): number {
  const amount = Math.max(0, Number(voucher.value) || 0);
  const discount = normalizeVoucherType(voucher.type) === "percent"
    ? Math.round(base * Math.min(amount, 100) / 100)
    : Math.min(amount, base);
  return Math.max(0, base - discount);
}

export function orderTotal(base: number, bump: number, selected: boolean): number {
  return Math.max(0, base + (selected ? Math.max(0, bump) : 0));
}

export function callbackTokenOk(provided: string | null, expected?: string): boolean {
  if (!expected) return true;
  return Boolean(provided) && provided === expected;
}

const PAID = new Set(["paid", "success", "settled", "capture", "captured"]);

/**
 * Mayar callback normalisation: only `payment.received` carrying a paid status
 * yields a transaction id, so unverified events can never reach fulfillment.
 */
export function parseMayarEvent(body: unknown): { transactionId: string; amount: number; method: string | null } | null {
  const raw = (body ?? {}) as { event?: unknown; id?: unknown; data?: Record<string, unknown> };
  if (String(raw.event ?? "") !== "payment.received") return null;
  const data = raw.data ?? {};
  const status = String(data.status ?? "").toLowerCase();
  const txStatus = String(data.transactionStatus ?? "").toLowerCase();
  const paid = status === "true" || PAID.has(status) || PAID.has(txStatus);
  if (!paid) return null;
  const transactionId = String(data.transactionId ?? data.id ?? raw.id ?? "").trim();
  if (!transactionId) return null;
  const amount = Number(data.amount ?? 0);
  const method = data.paymentMethod ? String(data.paymentMethod) : null;
  return { transactionId, amount: Number.isFinite(amount) ? amount : 0, method };
}
export function bumpOffer(cls?: {
  id?: string | null;
  bump_class_id?: string | null;
  bump_price?: number | string | null;
  bump_title?: string | null;
  bump_active?: boolean | null;
} | null): { classId: string; amount: number; title: string | null } | null {
  const amount = Number(cls?.bump_price);
  if (!cls?.bump_class_id || !cls?.bump_active) return null;
  if (cls.bump_class_id === cls.id) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { classId: cls.bump_class_id, amount, title: cls.bump_title ?? null };
}
