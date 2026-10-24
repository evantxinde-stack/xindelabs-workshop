import type { NextRequest } from "next/server";
import { admin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-session";
import { BLOCK_TYPES, PAGES, type Block, type BlockType, type PageKey } from "@/lib/content-data";


function bad(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function httpError(msg: string) {
  return Response.json({ error: msg }, { status: 500 });
}

export async function GET() {
  const { data } = await admin
    .from("page_blocks")
    .select("id,page,block_type,sort_order,props")
    .order("sort_order", { ascending: true });

  const grouped = Object.fromEntries(PAGES.map((p) => [p.key, [] as Block[]])) as Record<PageKey, Block[]>;
  for (const row of data ?? []) {
    if (!(row.page in grouped)) continue;
    grouped[row.page as PageKey].push({
      id: row.id,
      block_type: row.block_type as BlockType,
      sort_order: row.sort_order,
      props: (row.props ?? {}) as Record<string, string>,
    });
  }
  return Response.json(grouped);
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const page = body?.page as PageKey | undefined;
  const blocks = body?.blocks as unknown;
  if (!page || !PAGES.some((p) => p.key === page) || !Array.isArray(blocks)) {
    return bad("Halaman atau daftar block tidak valid");
  }

  const rows = blocks
    .filter((b) => b && typeof b === "object" && b.block_type && BLOCK_TYPES[b.block_type as BlockType])
    .map((b, i) => ({
      id: typeof b.id === "string" ? b.id : crypto.randomUUID(),
      page,
      sort_order: i,
      block_type: b.block_type as BlockType,
      props: b.props && typeof b.props === "object" ? b.props : {},
    }));

  const { error: upErr } = await admin.from("page_blocks").upsert(rows, { onConflict: "id" });
  if (upErr) return httpError(upErr.message);

  const ids = rows.map((r) => r.id);
  if (ids.length) {
    const { error: delErr } = await admin
      .from("page_blocks")
      .delete()
      .eq("page", page)
      .not("id", "in", `(${ids.join(",")})`);
    if (delErr) return httpError(delErr.message);
  } else {
    const { error: delErr } = await admin.from("page_blocks").delete().eq("page", page);
    if (delErr) return httpError(delErr.message);
  }

  return Response.json({ ok: true });
}