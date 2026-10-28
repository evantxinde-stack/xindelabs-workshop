import { admin } from "@/lib/supabase/server";
import { certificateStatus, maskEmail } from "@/lib/insights";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const decoded = decodeURIComponent(number);
  const { data: cert } = await admin
    .from("certificates")
    .select("certificate_number,email,class_id,issued_at")
    .eq("certificate_number", decoded)
    .maybeSingle();
  const status = certificateStatus(decoded, cert);
  const [{ data: cls }, { data: member }] = cert
    ? await Promise.all([
        admin.from("classes").select("title").eq("id", cert.class_id).maybeSingle(),
        admin.from("members").select("name").eq("email", cert.email).maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  const valid = status === "valid";
  return (
    <main className="min-h-screen bg-[#04110D] px-5 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">Verifikasi Sertifikat</p>
        <h1 className="mt-3 text-3xl font-bold">
          {valid ? "Sertifikat valid" : status === "not_found" ? "Sertifikat tidak ditemukan" : "Nomor sertifikat tidak valid"}
        </h1>

        {valid && (
          <div className="mt-8 rounded-2xl border border-[#00ff88]/40 bg-[#0B1F16] p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-white/45">Nomor</dt>
                <dd className="mt-1 break-all font-bold">{cert!.certificate_number}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-white/45">Diterbitkan</dt>
                <dd className="mt-1 font-bold">{cert!.issued_at ? new Date(cert!.issued_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-white/45">Penerima</dt>
                <dd className="mt-1 font-bold">{member?.name || maskEmail(cert!.email)}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-white/45">Kelas</dt>
                <dd className="mt-1 font-bold">{cls?.title || "—"}</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-white/45">Diterbitkan oleh XindeLabs.</p>
          </div>
        )}

        {!valid && (
          <p className="mt-6 text-sm text-white/50">
            Periksa kembali nomor sertifikat. Format resmi: <span className="font-mono">XL-XXXXXXXX-XXXXX</span>.
          </p>
        )}

        <a href="https://xindelabs.web.id" className="mt-10 inline-block rounded-lg bg-[#00ff88] px-4 py-3 font-bold text-[#050A07]">
          xindelabs.web.id
        </a>
      </div>
    </main>
  );
}
