export type LmsTier = "yearly" | "lifetime";
export type PaymentOption = "annual" | "lifetime";

export function isPaymentOption(value: unknown): value is PaymentOption {
  return value === "annual" || value === "lifetime";
}

export function earlyBirdOpen(
  cls: { early_bird_price?: number | null; early_bird_until?: string | null; early_bird_quota?: number | null; early_bird_used?: number }
): boolean {
  if (cls.early_bird_price == null || !Number.isFinite(Number(cls.early_bird_price)) || Number(cls.early_bird_price) < 0) return false;
  if (cls.early_bird_until && new Date(cls.early_bird_until).getTime() <= Date.now()) return false;
  return cls.early_bird_quota == null || Number(cls.early_bird_used || 0) < Number(cls.early_bird_quota);
}

export function classPrice(
  cls: {
    price?: number | null;
    annual_price?: number | null;
    lifetime_price?: number | null;
    early_bird_price?: number | null;
    early_bird_until?: string | null;
    early_bird_quota?: number | null;
    early_bird_used?: number;
  },
  option: PaymentOption
): number {
  if (option === "annual") return Number(cls.annual_price);
  if (earlyBirdOpen(cls)) return Number(cls.early_bird_price);
  return Number(cls.lifetime_price ?? cls.price);
}

export function annualProductMapping(slug: string) {
  return process.env[`MAYAR_ANNUAL_PRODUCT_${slug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`];
}

export const FAST_TRACK_TIERS: Record<LmsTier, number> = {
  yearly: 599000,
  lifetime: 999000,
};

export const PRODUCTS = {
  vip: {
    name: "Bimbingan VIP",
    price: 2999000,
    priceLabel: "Rp2.999.000",
  },
  fast_track: {
    name: "Video Workshop",
    price: FAST_TRACK_TIERS.yearly,
    priceLabel: "Rp599.000",
  },
} as const;

export type Product = keyof typeof PRODUCTS | (string & {});

export function productPrice(product: Product, tier?: LmsTier): number {
  if (product === "fast_track") return FAST_TRACK_TIERS[tier ?? "yearly"];
  return PRODUCTS[product as keyof typeof PRODUCTS]?.price ?? 0;
}

const BASE =
  process.env.MAYAR_ENV === "production"
    ? "https://api.mayar.id/hl/v2"
    : "https://api.mayar.io/hl/v2";

export type Invoice = {
  link: string;
  invoiceId: string;
  transactionId: string;
};

export function mayarEnabled() {
  return Boolean(process.env.MAYAR_API_KEY);
}

async function mayar<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MAYAR_API_KEY}`,
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.messages ?? json?.message ?? "Mayar request failed");
  }
  return json;
}

export async function createInvoice(input: {
  name: string;
  email: string;
  mobile?: string | null;
  product: Product;
  leadId: string;
  tier?: LmsTier;
  amount?: number;
  productName?: string;
  classId?: string;
}): Promise<Invoice> {
  const product = PRODUCTS[input.product as keyof typeof PRODUCTS] ?? { name: input.product };
  if (!input.mobile) {
    throw new Error("Nomor WhatsApp wajib diisi untuk membuat invoice. Hubungi admin.");
  }
  const tierLabel =
    input.product === "fast_track"
      ? input.tier === "lifetime"
        ? " (Lifetime)"
        : " (Tahunan 12 bulan)"
      : "";
  const description = `Pembelian ${input.productName ?? product.name}${tierLabel}`;
  const rate = input.amount ?? productPrice(input.product, input.tier);
  const json = await mayar<{
    data: { id: string; transactionId: string; link: string };
  }>("/invoices/create", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      mobile: input.mobile || undefined,
      description,
      expiredAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      items: [{ quantity: 1, rate, description }],
      redirectUrl: `${process.env.APP_URL}/checkout/success?product=${input.product}&lead=${input.leadId}`,
      extraData: { leadId: input.leadId, product: input.product, tier: input.tier ?? null, classId: input.classId ?? null },
    }),
  });
  return {
    link: json.data.link,
    invoiceId: json.data.id,
    transactionId: json.data.transactionId,
  };
}

export async function getInvoiceStatus(invoiceId: string): Promise<string> {
  const json = await mayar<{ data: { status?: string } }>(`/invoices/${invoiceId}`);
  return json.data?.status ?? "unknown";
}