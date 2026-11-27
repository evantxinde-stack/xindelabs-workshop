import type { Metadata } from "next";
import Link from "next/link";
import { admin } from "@/lib/supabase/server";
import { ensurePaidByLead } from "@/lib/orders";
import { PRODUCTS, classPrice } from "@/lib/mayar";
import { parseJsonValue } from "@/lib/content";
import { normalizeProductMeta } from "@/lib/product-meta";

type Props = {
  params: Promise<{ product: string }>;
  searchParams: Promise<{ product?: string; lead?: string }>;
};

export function generateMetadata(): Metadata {
  return { title: "Status Pembayaran" };
}

export default async function SuccessPage({ searchParams }: Props) {
  const search = await searchParams;
  const product = search.product ?? "vip";
  const leadId = search.lead;
  const item = PRODUCTS[product as keyof typeof PRODUCTS] ?? PRODUCTS.vip;

  const lookupProduct = product === "video-workshop" ? "fast_track" : product;
  const [{ paid }, { data: cls }, { data: metaSetting }] = await Promise.all([
    leadId ? ensurePaidByLead(leadId, lookupProduct) : Promise.resolve({ paid: false }),
    admin.from("classes").select("id,slug,title,product_type").eq("slug", product).maybeSingle(),
    admin.from("settings").select("value").eq("key", "product_catalog_meta").maybeSingle(),
  ]);

  const itemName = cls?.title || (product === "video-workshop" ? "Video Workshop" : item.name);
  const isWorkshop = product === "fast_track" || product === "video-workshop";

  let upsellProduct: any = null;
  let upsellMeta: ReturnType<typeof normalizeProductMeta>["upsell"] | null = null;
  if (paid && cls) {
    const metaMap = parseJsonValue(metaSetting?.value) as Record<string, unknown>;
    const productMeta = normalizeProductMeta(metaMap[cls.id] ?? metaMap[cls.slug], cls.product_type);
    if (productMeta.upsell.enabled && productMeta.upsell.class_id) {
      const { data: upRow } = await admin
        .from("classes")
        .select("id,slug,title,description,price,lifetime_price,early_bird_price,early_bird_until,early_bird_quota")
        .eq("id", productMeta.upsell.class_id)
        .eq("is_published", true)
        .maybeSingle();
      if (upRow) {
        upsellProduct = upRow;
        upsellMeta = productMeta.upsell;
      }
    }
  }

  return (
    <div className="grid-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16 font-sans text-white">
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
              {isWorkshop ? (
                <>
                  Akses <span className="font-semibold text-white">{itemName}</span>{" "}
                  sudah aktif. Cek email kamu — kredensial login LMS{" "}
                  <span className="text-white/80">
                    {process.env.NEXT_PUBLIC_LMS_URL ?? "learn.xindelabs.web.id"}
                  </span>{" "}
                  ada di sana.
                </>
              ) : (
                <>
                  Terima kasih! Akses materi{" "}
                  <span className="font-semibold text-white">{itemName}</span>{" "}
                  sudah diproses dan akan dikirim bersama email instruksi.
                </>
              )}
            </p>
            {isWorkshop ? (
              <a
                href={process.env.NEXT_PUBLIC_LMS_URL ?? "https://learn.xindelabs.web.id"}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow mt-3 block rounded-xl px-6 py-3.5 font-bold transition"
              >
                Buka Video Workshop
              </a>
            ) : null}
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

      {/* Post-Purchase Upsell Offer */}
      {upsellProduct && upsellMeta ? (
        <section className="relative z-10 mt-6 w-full max-w-md rounded-2xl border-2 border-[#00ff88]/50 bg-[#071911] p-6 text-left shadow-2xl">
          <span className="inline-block rounded-full bg-[#00ff88]/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#00ff88]">
            {upsellMeta.badge}
          </span>
          <h2 className="mt-3 text-xl font-bold text-white">
            {upsellMeta.headline || upsellProduct.title}
          </h2>
          {upsellMeta.description || upsellProduct.description ? (
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              {upsellMeta.description || upsellProduct.description}
            </p>
          ) : null}
          <p className="mt-4 font-mono text-2xl font-bold text-[#00ff88]">
            Rp{classPrice(upsellProduct, "lifetime").toLocaleString("id-ID")}
          </p>
          <Link
            href={`/checkout/${upsellProduct.slug}${leadId ? `?lead=${encodeURIComponent(leadId)}` : ""}`}
            className="btn-glow mt-4 block rounded-xl px-5 py-3 text-center text-sm font-bold"
          >
            {upsellMeta.cta_label}
          </Link>
        </section>
      ) : null}
    </div>
  );
}
