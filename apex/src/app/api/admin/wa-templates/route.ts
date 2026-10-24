import type { NextRequest } from "next/server";
import { admin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-session";


function bad(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export async function GET() {
  const { data } = await admin.from("wa_templates").select("id,name,content").order("name");
  return Response.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const content = String(body?.content ?? "").trim();
  const id = typeof body?.id === "string" && body.id ? body.id : undefined;
  if (!name || !content) return bad("name dan content wajib diisi");

  let error: { message: string } | null = null;
  if (id) {
    ({ error } = await admin.from("wa_templates").update({ name, content }).eq("id", id));
  } else {
    ({ error } = await admin.from("wa_templates").insert({ name, content }));
  }
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("id wajib diisi");
  const { error } = await admin.from("wa_templates").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}