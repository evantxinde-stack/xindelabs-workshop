import type { Metadata } from "next";
import { ensurePaidByLead } from "@/lib/orders";
import { PRODUCTS } from "@/lib/mayar";

type Props = {
  params: Promise<{ product: string }>;
  searchParams: Promise<{ product?: string; lead?: string }>;
};

export function generateMetadata(): Metadata {
  return { title: "Status Pembayaran" };
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const search = await searchParams;
  const product = search.product ?? "vip";
  const leadId = search.lead;
  const item = PRODUCTS[product as keyof typeof PRODUCTS] ?? PRODUCTS.vip;

  const { paid } = leadId ? await ensurePaidByLead(leadId, product) : { paid: false };

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 font-sans text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
      />

      <main className="glass glow-border anim-fade-up relative z-10 w-full max-w-md rounded-2xl p-6 text-center shadow-xl md:p-8">
        {paid ? (
          <>
            <h1 className="text-2xl font-bold">Pembayaran Berhasil</h1>
            <p className="mt-4 text-white/60">
              {product === "fast_track" ? (
                <>
                  Akses <span className="font-semibold text-white">{item.name}</span>{" "}
                  sudah aktif. Cek email kamu — kredensial login LMS{" "}
                  <span className="text-white/80">{process.env.NEXT_PUBLIC_LMS_URL ?? "xindelabs-workshop.vercel.app"}</span>{" "}
                  ada di sana.
                </>
              ) : (
                <>
                  Terima kasih! Akses materi{" "}
                  <span className="font-semibold text-white">{item.name}</span>{" "}
                  sudah diproses dan akan dikirim bersama email instruksi.
                </>
              )}
            </p>
            {product === "fast_track" && (
              <a
                href={process.env.NEXT_PUBLIC_LMS_URL ?? "https://xindelabs-workshop.vercel.app"}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow mt-3 block rounded-xl px-6 py-3.5 font-bold transition"
              >
                Buka Video Workshop
              </a>
            )}
            <div className="mt-7 space-y-3">
              <a
                href={`${process.env.NEXT_PUBLIC_GROUP_URL ?? "#"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow block rounded-xl px-6 py-3.5 font-bold transition"
              >
                Gabung Grup Private
              </a>
              <a
                href="/"
                className="block text-sm text-white/40 underline transition hover:text-[var(--accent)]"
              >
                Kembali ke Halaman Utama
              </a>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Menunggu Konfirmasi</h1>
            <p className="mt-4 text-white/60">
              Pembayaranmu sedang diverifikasi otomatis. Jika sudah membayar tapi
              status tidak berubah, hubungi admin via WhatsApp.
            </p>
            <a
              href="https://wa.me/?text=Halo,%20saya%20sudah%20bayar%20tetapi%20belum%20terkonfirmasi"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glow mt-7 inline-block rounded-xl px-6 py-3.5 font-bold transition"
            >
              Konfirmasi via WhatsApp
            </a>
          </>
        )}
      </main>
    </div>
  );
}
