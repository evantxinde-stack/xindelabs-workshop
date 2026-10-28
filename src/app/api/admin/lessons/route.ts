import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-session";

async function auth(req: NextRequest) { return isAdminRequest(req); }
function youtubeId(value: unknown) { const raw = String(value || "").trim(); if (!raw) return null; try { const u = new URL(raw); if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null; if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop() || null; } catch {} return raw.replace(/^.*(?:v=|youtu\.be\/)/, "").split(/[?&#]/)[0] || null; }
function lessonPayload(b: any) { const id = youtubeId(b.youtube_id); return { title: String(b.title || "").trim(), youtube_id: id, youtube_embed_url: id ? `https://www.youtube.com/embed/${id}` : null, prompt: b.prompt || null, pdf_url: b.pdf_url || null, sort_order: Number(b.sort_order || 0) }; }
export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const classId = req.nextUrl.searchParams.get("class_id");
  if (!classId) return NextResponse.json({ error: "class_id wajib" }, { status: 400 });
  const { data, error } = await admin.from("lessons").select("*").eq("class_id", classId).order("sort_order");
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data: data ?? [] });
}
export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b?.class_id || !b?.title) return NextResponse.json({ error: "Kelas dan judul wajib diisi" }, { status: 400 });
  const { data, error } = await admin.from("lessons").insert({ class_id: b.class_id, ...lessonPayload(b) }).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data }, { status: 201 });
}
export async function PATCH(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b?.id || !b?.title) return NextResponse.json({ error: "Lesson tidak lengkap" }, { status: 400 });
  const { data, error } = await admin.from("lessons").update(lessonPayload(b)).eq("id", b.id).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
}
export async function DELETE(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const { error } = await admin.from("lessons").delete().eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ deleted: true });
}
