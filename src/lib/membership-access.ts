// Pure membership gate helpers — no DB client, so tests can load this module.
import { renewalWindow } from "./billing.ts";

export type Access = "active" | "read_only" | "none";

const ALL_ACCESS = ["is_all_access", "has_all_access"] as const;

function allAccess(m: any): boolean {
  return ALL_ACCESS.some((k) => m?.[k] === true);
}

const PRODUCT_ALIASES: Record<string, string[]> = {
  "kelas-bangun-hermes-agent": ["build-your-own-personalized-agent"],
};

export function classProductSlugs(cls: any): string[] {
  const slug = String(cls?.slug ?? "").toLowerCase();
  return [slug, ...(PRODUCT_ALIASES[slug] ?? [])].filter(Boolean);
}

export function memberProducts(member: any): string[] {
  const raw = member?.owned_classes;
  const list = [
    ...(Array.isArray(raw) ? raw : String(raw ?? "").split(",")),
    ...String(member?.product ?? "").split(","),
  ];
  return list
    .map((x: unknown) => String(x ?? "").trim().toLowerCase())
    .filter(Boolean);
}

export function billingAccess(member: any): Access {
  if (!member) return "none";
  const status = String(member.billing_status ?? "").toLowerCase();
  if (status === "revoked") return "none";
  if (allAccess(member) || member.is_vip === true || member.payment_option === "lifetime") return "active";
  if (member.payment_option === "annual" && member.paid_until) {
    const window = renewalWindow(member.paid_until);
    if (window.state === "expired") return "none";
    if (window.state === "grace") return "read_only";
  }
  if (status === "active") return "active";
  if (status === "grace" || status === "read_only") return "read_only";
  return "none";
}

function isVipClass(cls: any): boolean {
  const value = `${cls?.slug ?? ""} ${cls?.product_type ?? ""}`.toLowerCase();
  return value.includes("vip") || value.includes("mentoring");
}

export function ownsClass(member: any, cls: any, orders: any[] = []): boolean {
  const freeClass = ["workshop", "course"].includes(String(cls?.product_type)) && Number(cls?.price) === 0;
  const access = billingAccess(member);
  if (freeClass) return Boolean(member); // gratis: cukup punya akun member, tak perlu entri produk
  if (access === "none") return false;
  if (isVipClass(cls)) return member.is_vip === true;
  if (allAccess(member) || member.is_vip === true || member.payment_option === "lifetime") return true;
  if (member.payment_option === "annual" || member.payment_option === "yearly") {
    return classProductSlugs(cls).includes("kelas-bangun-hermes-agent") || classProductSlugs(cls).includes("build-your-own-personalized-agent");
  }
  const slugs = classProductSlugs(cls);
  if (!slugs.length) return false;
  const products = memberProducts(member);
  if (products.includes(String(cls?.id ?? "").toLowerCase())) return true;
  if (products.some((p) => slugs.includes(p))) return true;
  return orders.some(
    (o) =>
      o?.status === "paid" &&
      (o.class_id === cls?.id || slugs.includes(String(o.product ?? "").toLowerCase()))
  );
}
