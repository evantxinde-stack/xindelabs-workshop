import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { admin } from "@/lib/supabase/server";
import { authCookieOptions } from "@/lib/auth-cookie";
import { isValidEmail } from "@/lib/validate";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key";

/** Discord User IDs are snowflakes. Empty string is allowed — a member may not use Discord yet. */
function cleanDiscord(value: unknown) {
  const raw = String(value ?? "").replace(/\D/g, "");
  return /^\d{17,20}$/.test(raw) ? raw : "";
}

async function assignConnectCircle(discordId: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || !/^\d{17,20}$/.test(discordId)) return { ok: false, reason: "missing_credentials_or_id" };
  const guild = "1260441398449143948";
  const role = "1260443523870621736";
  const headers = { Authorization: `Bot ${token}`, "Content-Type": "application/json" };
  const member = await fetch(`https://discord.com/api/v10/guilds/${guild}/members/${discordId}`, { headers });
  if (!member.ok) return { ok: false, reason: "not_in_server" };
  const assigned = await fetch(`https://discord.com/api/v10/guilds/${guild}/members/${discordId}/roles/${role}`, { method: "PUT", headers });
  return { ok: assigned.ok, reason: assigned.ok ? "assigned" : `discord_${assigned.status}` };
}

async function createAuthUser(email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, exists: false, detail: "no service key" };
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (res.ok) return { ok: true, exists: false, detail: "" };
  const detail = await res.text();
  return { ok: false, exists: /already|registered|exists/i.test(detail), detail };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const whatsapp = String(body.whatsapp || "").trim();
    const business_field = String(body.business_field || "").trim();
    const source = String(body.source || "tutorial_hermes").trim();
    const password = typeof body.password === "string" ? body.password : "";
    const discord_id = cleanDiscord(body.discord_id);

    if (business_field.length > 120) {
      return NextResponse.json({ error: "business field too long" }, { status: 400 });
    }

    if (!name || !isValidEmail(email)) {
      return NextResponse.json({ error: "name and valid email required" }, { status: 400 });
    }

    if (password && password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    }

    // Try to find existing lead by email
    const { data: existing, error: findErr } = await admin
      .from("leads")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (findErr) {
      return NextResponse.json({ error: "query failed" }, { status: 500 });
    }

    let leadId = existing?.id as string | undefined;

    if (existing?.id) {
      // Record pipeline event
      try {
        await admin.from("pipeline_events").insert({
          lead_id: existing.id,
          event_type: "lead_form_submitted",
          meta: { source, landing_page: "/" },
        });
      } catch {}
      if (discord_id) await admin.from("leads").update({ discord_id }).eq("id", existing.id);
      if (!password) return NextResponse.json({ leadId: existing.id, exists: true });
    } else {
      // Create new lead
      const { data: created, error: createErr } = await admin
        .from("leads")
        .insert({
          name,
          email: email.toLowerCase(),
          whatsapp,
          source,
          business_field: business_field || null,
          ...(discord_id ? { discord_id } : {}),
        })
        .select("id")
        .single();

      if (createErr || !created?.id) {
        return NextResponse.json({ error: "create failed" }, { status: 500 });
      }

      try {
        await admin.from("pipeline_events").insert({
          lead_id: created.id,
          event_type: "lead_form_submitted",
          meta: { source, landing_page: "/" },
        });
      } catch {}

      if (!password) return NextResponse.json({ leadId: created.id, exists: false });
      leadId = created.id;
    }

    // Password = tutorial signup: auto-register the member account and log them in.
    const auth = await createAuthUser(email, password);
    if (!auth.ok && auth.exists) {
      return NextResponse.json(
        { error: "Email ini sudah terdaftar. Login di area member, atau pakai email lain.", login: true },
        { status: 409 }
      );
    }
    if (!auth.ok) {
      return NextResponse.json({ error: "Registrasi akun gagal: " + auth.detail.slice(0, 120) }, { status: 500 });
    }

    // Free orientation class: registered members always get it, no purchase needed.
    const { data: freeClass } = await admin
      .from("classes")
      .select("id,slug")
      .eq("slug", "tutorial-bangun-hermes")
      .maybeSingle();
    const freeIds = freeClass ? [String(freeClass.id), String(freeClass.slug)] : [];

    // Merge, never replace: an existing paid member must keep the classes they bought.
    const { data: currentMember } = await admin
      .from("members")
      .select("owned_classes")
      .eq("email", email)
      .maybeSingle();
    const currentOwned = Array.isArray(currentMember?.owned_classes)
      ? currentMember!.owned_classes.map(String)
      : [];

    // Existing member: never overwrite status/tier — a paid member re-registering
    // must not be downgraded to the free tier.
    const memberPatch: Record<string, unknown> = { owned_classes: [...new Set([...currentOwned, ...freeIds])] };
    if (discord_id) memberPatch.discord_id = discord_id;
    const { error: memberErr } = currentMember
      ? await admin.from("members").update(memberPatch).eq("email", email)
      : await admin.from("members").insert({
          email,
          status: "free",
          tier: "free",
          product: "tutorial-bangun-hermes",
          ...memberPatch,
        });
    if (memberErr) {
      return NextResponse.json({ error: "Akun dibuat, tapi profil member gagal disimpan." }, { status: 500 });
    }

    try {
      await admin.from("pipeline_events").insert({
        lead_id: leadId,
        event_type: "member_registered",
        meta: { source, funnel: "tutorial_hermes", has_discord: Boolean(discord_id) },
      });
    } catch {}

    const client = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
    const { data: signIn } = await client.auth.signInWithPassword({ email, password });
    if (signIn?.session?.access_token) {
      (await cookies()).set("member_access_token", signIn.session.access_token, authCookieOptions());
    }

    // Fire-and-forget: the free community role must never block registration.
    const discordRole = discord_id ? await assignConnectCircle(discord_id) : null;

    return NextResponse.json({ leadId, exists: true, registered: true, loggedIn: Boolean(signIn?.session), discord: discordRole });
  } catch (e) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
