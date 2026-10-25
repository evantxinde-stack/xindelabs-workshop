import type { NextRequest } from "next/server";
import { admin } from "@/lib/supabase/server";

function authorized(req: NextRequest) {
  const expected = process.env.HERMES_API_KEY || process.env.ADMIN_SECRET;
  if (!expected) return false;
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  return req.headers.get("x-api-key") === expected || bearer === expected;
}
function body(input: any) {
  if (!input || typeof input !== "object" || typeof input.title !== "string" || typeof input.slug !== "string") return null;
  return { ...input, title: input.title.trim(), slug: input.slug.trim().toLowerCase(), updated_at: new Date().toISOString() };
}
export async function GET(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const slug = req.nextUrl.searchParams.get("slug");
  const q = admin.from("blog_posts").select("*").order("updated_at", { ascending: false });
  const { data, error } = slug ? await q.eq("slug", slug).maybeSingle() : await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
export async function POST(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const row = body(await req.json().catch(() => null));
  if (!row) return Response.json({ error: "title dan slug wajib diisi" }, { status: 400 });
  const { data, error } = await admin.from("blog_posts").insert(row).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ data }, { status: 201 });
}
export async function PUT(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const input = await req.json().catch(() => null); const row = body(input);
  if (!row) return Response.json({ error: "title dan slug wajib diisi" }, { status: 400 });
  const { data, error } = await admin.from("blog_posts").update(row).eq(input.id ? "id" : "slug", input.id || row.slug).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ data });
}
