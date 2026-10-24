import type { Metadata } from "next";
import { CheckoutTracker } from "./checkout-tracker";
import { PayButton } from "./pay-button";
import { admin } from "@/lib/supabase/server";
import { parsePrice } from "@/lib/price";

const PRODUCTS: Record<string, { name: string }> = {
  vip: { name: "Bimbingan VIP" },
  fast_track: { name: "Video Workshop" },
};

type Props = {
  params: Promise<{ product: string }>;
  searchParams: Promise<{ lead?: string }>;
};

export function generateMetadata(): Metadata {
  return { title: "Checkout" };
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const [{ product }, { lead }] = await Promise.all([params, searchParams]);
  const item = PRODUCTS[product] ?? PRODUCTS.vip;

  const page = product === "vip" ? "vip" : "fast_track";
  const { data: cta } = await admin
    .from("page_blocks")
    .select("props")
    .eq("page", page)
    .eq("block_type", "cta_card")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const price = (cta?.props as any)?.price ?? (product === "vip" ? "Rp2.999.000" : "Rp599.000 / tahun · Rp999.000 lifetime");
  const priceIdr = parsePrice(price);
  const { data: wa } = await admin.from("settings").select("value").eq("key", "wa_admin_number").maybeSingle();
  const waNum = (wa?.value || "").replace(/\D/g, "");
  const waLink = waNum ? (waNum.startsWith("0") ? "62" + waNum.slice(1) : waNum) : null;
  const waHref = waLink ? `https://wa.me/${waLink}?text=${encodeURIComponent("Halo, saya mau pesan produk")}` : "https://wa.me/?text=Halo,%20saya%20mau%20pesan%20produk";

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 font-sans text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
      />

      <main className="glass glow-border anim-fade-up relative z-10 w-full max-w-md rounded-2xl p-6 shadow-xl md:p-8">
        <h1 className="text-2xl font-bold">Checkout</h1>

        <div className="mt-5 flex items-center justify-between border-b border-white/10 pb-4">
          <span className="text-white/70">{item.name}</span>
          <span className="price-tag">{price}</span>
        </div>

        <p className="mt-5 text-sm text-white/50">
          Setelah tombol diklik, kamu dialihkan ke halaman pembayaran Mayar.
        </p>

        <div className="mt-5">
          <PayButton product={product} leadId={lead} priceIdr={priceIdr} />
        </div>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center text-sm text-white/40 underline transition hover:text-[var(--accent)]"
        >
          Kendala pembayaran? Hubungi admin via WhatsApp
        </a>

        <CheckoutTracker product={product} />
      </main>
    </div>
  );
}
