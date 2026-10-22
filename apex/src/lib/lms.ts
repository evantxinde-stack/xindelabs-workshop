import { randomBytes } from "node:crypto";
import { admin } from "@/lib/supabase/server";

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
    .select("tier, lms_password")
    .eq("email", email)
    .maybeSingle();

  if (existing?.lms_password) {
    return {
      ok: true,
      email,
      tier: existing.tier === "lifetime" ? "lifetime" : tier,
      lms_password: existing.lms_password,
      lms_url: LMS_URL,
    };
  }

  const password = randomPassword();
  await createAuthUser(email, password);

  const paidUntil =
    tier === "lifetime"
      ? null
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

  await admin
    .from("members")
    .upsert(
      {
        email,
        status: "paid",
        product,
        tier,
        paid_until: paidUntil,
        lms_password: password,
      },
      { onConflict: "email" }
    );

  return { ok: true, email, tier, lms_password: password, lms_url: LMS_URL };
}