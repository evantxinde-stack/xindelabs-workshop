// Pure membership gate helpers — no DB client, so tests can load this module.
import { renewalWindow } from "./billing.ts";

export type Access = "active" | "read_only" | "none";

const ALL_ACCESS = ["is_all_access", "has_all_access"] as const;

function allAccess(m: any): boolean {
  return ALL_ACCESS.some((k) => m?.[k] === true);
}

export function memberProducts(member: any): string[] {
  const raw = member?.owned_classes;
  const list = Array.isArray(raw)
    ? raw
    : String(member?.product ?? "").split(",");
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

export function ownsClass(member: any, cls: any, orders: any[] = []): boolean {
  const access = billingAccess(member);
  if (access === "none") return false;
  if (allAccess(member) || member.is_vip === true) return true;
  const slug = String(cls?.slug ?? "").toLowerCase();
  if (!slug) return false;
  if (memberProducts(member).includes(slug)) return true;
  return orders.some(
    (o) =>
      o?.status === "paid" &&
      (o.class_id === cls?.id || String(o.product ?? "").toLowerCase() === slug)
  );
}
