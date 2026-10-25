import type { NextRequest } from "next/server";
import { admin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-session";


const KEYS = ["meta_pixel", "tiktok_pixel"] as const;

export async function GET() {
  const { data } = await admin.from("settings").select("key,value");
  const out: Record<string, string> = {};
  for (const k of KEYS) out[k] = data?.find((r) => r.key === k)?.value ?? "";
  return Response.json(out);
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest(req))) return new Response("Unauthorized", { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !KEYS.every((k) => typeof body[k] === "string")) {
    return Response.json({ error: "payload tidak valid" }, { status: 400 });
  }
  const rows = KEYS.map((k) => ({ key: k, value: (body[k] as string).trim() }));
  const { error } = await admin.from("settings").upsert(rows, { onConflict: "key" });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}