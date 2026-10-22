import type { NextRequest } from "next/server";
import { admin } from "@/lib/supabase/server";

function isAdmin(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return req.headers.get("authorization") === `Basic ${btoa("admin:" + password)}`;
}

export async function GET() {
  const [seqs, steps] = await Promise.all([
    admin.from("email_sequences").select("id,key,name").order("key"),
    admin
      .from("email_steps")
      .select("id,sequence_id,step,day_offset,email_templates(id,key,subject,html_body,body_text)")
      .order("step"),
  ]);

  const bySeq = new Map<string, { step: number; day_offset: number; template: { id: string; key: string; subject: string | null; html_body: string | null; body_text: string | null } }[]>();
  for (const s of steps.data ?? []) {
    const tpl = s.email_templates as unknown as { id: string; key: string; subject: string | null; html_body: string | null; body_text: string | null } | null;
    if (!tpl) continue;
    const list = bySeq.get(s.sequence_id) ?? [];
    list.push({ step: s.step, day_offset: s.day_offset, template: tpl });
    bySeq.set(s.sequence_id, list);
  }

  const sequences = (seqs.data ?? []).map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    steps: (bySeq.get(s.id) ?? []).sort((a, b) => a.step - b.step),
  }));
  return Response.json({ sequences });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return new Response("Unauthorized", { status: 401 });
  const body = (await req.json().catch(() => null)) as
    | { id?: string; subject?: unknown; html_body?: unknown; body_text?: unknown }
    | null;
  const hasContent = [body?.subject, body?.html_body, body?.body_text].some(
    (v) => typeof v === "string"
  );
  if (!body?.id || !hasContent) {
    return Response.json({ error: "id + subject/html_body/body_text tidak valid" }, { status: 400 });
  }
  const patch: Record<string, string> = {};
  if (typeof body.subject === "string") patch.subject = body.subject;
  if (typeof body.html_body === "string") patch.html_body = body.html_body;
  if (typeof body.body_text === "string") patch.body_text = body.body_text;
  // Mode terakhir yang disimpan = yang dipakai. Simpan HTML -> teks dikosongkan (dan sebaliknya).
  if (typeof body.html_body === "string") patch.body_text = "";
  if (typeof body.body_text === "string") patch.html_body = typeof body.html_body === "string" ? body.html_body : "";

  const { error } = await admin.from("email_templates").update(patch).eq("id", body.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}