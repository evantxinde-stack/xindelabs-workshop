import { randomBytes } from "node:crypto";
import { admin } from "@/lib/supabase/server";
import { nextPaidUntil, type PaymentOption } from "@/lib/billing";

export const LMS_URL =
  process.env.NEXT_PUBLIC_LMS_URL ?? "https://xindelabs-workshop.vercel.app";

export const WORKSHOP_PRODUCT = "build-your-own-personalized-agent";
export type LmsTier = "yearly" | "lifetime";

function randomPassword() {
  return randomBytes(9).toString("base64url").slice(0, 12);
}

async function supabaseAdmin(path: string, init: RequestInit) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${url}/auth/v1/admin/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json };
}

async function createAuthUser(email: string, password: string) {
  const created = await supabaseAdmin("users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (created.ok) return true;

  const list = await supabaseAdmin(
    `users?filter=email&keyword=${encodeURIComponent(email)}`,
    { method: "GET" }
  );
  const user = (list.json?.users ?? []).find(
    (u: { email?: string }) => String(u.email ?? "").toLowerCase() === email
  );
  if (user?.id) {
    await supabaseAdmin(`users/${user.id}`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });
    return true;
  }
  throw new Error(
    `Gagal membuat akun LMS untuk ${email}: ${
      created.json?.error_description ?? created.json?.msg ?? created.status
    }`
  );
}

export async function provisionLmsAccess(input: {
  email: string;
  name?: string;
  tier?: string;
  payment_option?: "annual" | "lifetime";
  product?: string;
}): Promise<{
  ok: boolean;
  email: string;
  tier: LmsTier;
  lms_password: string;
  lms_url: string;
}> {
  const email = input.email.trim().toLowerCase();
  const tier: LmsTier = input.tier === "lifetime" ? "lifetime" : "yearly";
  const product = input.product ?? WORKSHOP_PRODUCT;

  const { data: existing } = await admin
    .from("members")
    .select("tier, lms_password, paid_until, product")
    .eq("email", email)
    .maybeSingle();

  const password = existing?.lms_password ?? randomPassword();
  if (!existing?.lms_password) await createAuthUser(email, password);

  // Ownership is a comma-separated slug list; merging keeps earlier purchases
  // (including order bumps) accessible instead of replacing them.
  const owned = new Set(
    [
      ...String((existing as { product?: string | null } | null)?.product ?? "").split(","),
      product,
    ]
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  const productList = Array.from(owned).join(",");

  const finalTier: LmsTier = existing?.tier === "lifetime" ? "lifetime" : tier;
  const option: PaymentOption =
    finalTier === "lifetime" ? "lifetime" : input.payment_option ?? "annual";
  const paidUntil = nextPaidUntil(option, existing?.paid_until);

  await admin
    .from("members")
    .upsert(
      {
        email,
        status: "paid",
        product: productList,
        tier: finalTier,
        payment_option: option,
        billing_status: "active",
        paid_until: paidUntil,
        lms_password: password,
      },
      { onConflict: "email" }
    );

  return { ok: true, email, tier: finalTier, lms_password: password, lms_url: LMS_URL };
}