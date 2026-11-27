import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { admin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-session";
import { mergeSiteConfig } from "@/lib/site-config";
import { getSiteConfig } from "@/lib/site-config.server";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const config = await getSiteConfig();
  return Response.json({ config });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const merged = mergeSiteConfig(body.config ?? body);
  const rows = [
    { key: "site_config", value: JSON.stringify(merged) },
    { key: "wa_admin_number", value: merged.global.wa_admin_number.trim() },
  ];

  const { error } = await admin.from("settings").upsert(rows, { onConflict: "key" });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/service");
  revalidatePath("/learn");

  return Response.json({ ok: true, config: merged });
}
