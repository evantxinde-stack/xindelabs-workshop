import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const source = String(body.source || "tutorial_hermes").trim();

    if (!name || !email) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
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

    if (existing?.id) {
      // Record pipeline event
      try {
        await admin.from("pipeline_events").insert({
          lead_id: existing.id,
          event_type: "lead_form_submitted",
          meta: { source, landing_page: "/" },
        });
      } catch {}
      return NextResponse.json({ leadId: existing.id, exists: true });
    }

    // Create new lead
    const { data: created, error: createErr } = await admin
      .from("leads")
      .insert({
        name,
        email: email.toLowerCase(),
        whatsapp,
        source,
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

    return NextResponse.json({ leadId: created.id, exists: false });
  } catch (e) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
