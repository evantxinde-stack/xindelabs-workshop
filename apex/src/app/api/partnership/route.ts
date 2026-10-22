import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid request" }, { status: 400 });

    // honeypot: bot mengisi field tersembunyi -> pretend sukses, jangan simpan
    if (String(body.website || "").trim()) {
      return NextResponse.json({ ok: true, message: "Permintaanmu sudah kami terima." });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const company = String(body.company || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const serviceType = String(body.kind || "").trim() || "Lainnya";
    const message = String(body.message || "").trim();

    if (!name || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Nama dan email valid wajib diisi." }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: "Pesan terlalu panjang." }, { status: 400 });
    }

    const { error } = await admin.from("partnership_inquiries").insert({
      name,
      email,
      company: company || null,
      whatsapp: whatsapp || null,
      service_type: serviceType,
      message: message || null,
      status: "new",
    });

    if (error) {
      return NextResponse.json({ error: "Gagal menyimpan, coba lagi." }, { status: 500 });
    }

    // samakan dengan lead supaya masuk pipeline admin
    try {
      const { data: existing } = await admin
        .from("leads")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing?.id) {
        await admin
          .from("leads")
          .update({
            company,
            phone: whatsapp || null,
            notes: `Permintaan kerjasama: ${serviceType}${message ? ` — ${message}` : ""}`,
          })
          .eq("id", existing.id);
      } else {
        await admin.from("leads").insert({
          name,
          email,
          whatsapp: whatsapp || null,
          phone: whatsapp || null,
          source: "kerjasama",
          notes: `Permintaan kerjasama: ${serviceType}${message ? ` — ${message}` : ""}`,
        });
      }
    } catch {
      // inquiry sudah tersimpan; sinkron lead hanya bonus
    }

    return NextResponse.json({
      ok: true,
      message: "Permintaanmu sudah kami terima. Tim kami akan menghubungi lo.",
    });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
