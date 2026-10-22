import { provisionLmsAccess } from "@/lib/lms";

export async function POST(req: Request) {
  const secret = process.env.PROVISION_LMS_SECRET;
  if (!secret) return Response.json({ error: "Provisioning belum dikonfigurasi" }, { status: 503 });

  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided !== secret) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email: string = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) return Response.json({ error: "email wajib diisi" }, { status: 400 });

  try {
    const result = await provisionLmsAccess({
      email,
      name: typeof body?.name === "string" ? body.name : undefined,
      tier: typeof body?.tier === "string" ? body.tier : undefined,
    });
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Provisioning gagal" },
      { status: 500 }
    );
  }
}