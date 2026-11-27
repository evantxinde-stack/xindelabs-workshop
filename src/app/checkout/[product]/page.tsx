import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutTracker } from "./checkout-tracker";
import { CheckoutForm } from "./checkout-form";
import { admin } from "@/lib/supabase/server";
import { parsePrice } from "@/lib/price";
import { classPrice } from "@/lib/mayar";
import { bumpOffer } from "@/lib/checkout";
import { parseJsonValue } from "@/lib/content";
import { normalizeProductMeta } from "@/lib/product-meta";
import { learnMember } from "@/app/learn/access";
import { notFound } from "next/navigation";

const PRODUCTS: Record<string, { name: string }> = {
  vip: { name: "Bimbingan VIP" },
  fast_track: { name: "Video Workshop" },
};

type Props = {
  params: Promise<{ product: string }>;
  searchParams: Promise<{ lead?: string; class_id?: string; member?: string }>;
};

const CLASS_FIELDS =
  "id,slug,title,description,price,annual_price,lifetime_price,payment_options,early_bird_price,early_bird_until,early_bird_quota,member_cross_sell_price,discord_role_id,bump_class_id,bump_price,bump_title,bump_active,product_type";

export function generateMetadata(): Metadata {
  return { title: "Checkout" };
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const [{ product }, { lead, class_id }] = await Promise.all([params, searchParams]);
  const cls = class_id
    ? (await admin.from("classes").select(CLASS_FIELDS).eq("id", class_id).maybeSingle()).data
    : (await admin.from("classes").select(CLASS_FIELDS).eq("slug", product).maybeSingle()).data;

  if (!cls && !(product in PRODUCTS)) notFound();
  const item: any = cls || PRODUCTS[product];
  const page = product === "vip" ? "vip" : "fast_track";
  const { member: sessionMember } = await learnMember();
  const memberPrice = Boolean(sessionMember && (sessionMember.is_all_access || sessionMember.is_vip));

  const leadRow = lead
    ? (await admin.from("leads").select("id,name,email,whatsapp").eq("id", lead).maybeSingle()).data
    : sessionMember?.email
      ? (
          await admin
            .from("leads")
            .select("id,name,email,whatsapp")
            .eq("email", sessionMember.email)
            .maybeSingle()
        ).data
      : null;

  const leadId = leadRow?.id || undefined;
  const defaults = {
    name: leadRow?.name || "",
    email: leadRow?.email || sessionMember?.email || "",
    whatsapp: leadRow?.whatsapp || "",
  };

  const [{ data: cta }, { data: metaSetting }] = await Promise.all([
    admin
      .from("page_blocks")
      .select("props")
      .eq("page", page)
      .eq("block_type", "cta_card")
      .order("sort_order")
      .limit(1)
      .maybeSingle(),
    admin.from("settings").select("value").eq("key", "product_catalog_meta").maybeSingle(),
  ]);

  if (cls) {
    const { count } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("class_id", cls.id)
      .eq("early_bird", true)
      .eq("status", "paid");
    (cls as any).early_bird_used = count || 0;
  }

  const metaMap = parseJsonValue(metaSetting?.value) as Record<string, unknown>;
  const productMeta = cls
    ? normalizeProductMeta(metaMap[cls.id] ?? metaMap[cls.slug], cls.product_type)
    : null;

  const baseBump = bumpOffer(cls as any);
  const bump = baseBump
    ? {
        amount: baseBump.amount,
        title: baseBump.title,
        description: productMeta?.bump_description || null,
        strikePrice: productMeta?.bump_strike_price || null,
      }
    : undefined;

  let crossSellProducts: any[] = [];
  if (productMeta?.cross_sell.enabled && productMeta.cross_sell.class_ids.length > 0) {
    const { data: csRows } = await admin
      .from("classes")
      .select("id,slug,title,description,price,lifetime_price")
      .in("id", productMeta.cross_sell.class_ids)
      .eq("is_published", true);
    crossSellProducts = csRows ?? [];
  }

  const options: string[] = (cls as any)?.payment_options?.length
    ? (cls as any).payment_options
    : ["lifetime"];
  const activeOption = options.includes("annual") ? "annual" : "lifetime";
  const price =
    (memberPrice && Number(cls?.member_cross_sell_price) > 0
      ? Number(cls?.member_cross_sell_price)
      : undefined) ||
    (cls ? classPrice(cls as any, activeOption as any) : undefined) ||
    (cta?.props as any)?.price ||
    (product === "vip" ? "Rp2.999.000" : "Rp599.000 / tahun · Rp999.000 lifetime");
  const priceIdr = typeof price === "number" ? price : parsePrice(String(price));

  return (
    <div className="grid-bg relative flex min-h-screen flex-col items-center justify-center px-4 py-16 font-sans text-white">
      <main className="glass glow-border relative z-10 w-full max-w-md rounded-2xl p-6 shadow-xl md:p-8">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="mt-5 flex justify-between border-b border-white/10 pb-4">
          <span className="text-white/70">{item.name || item.title}</span>
          <span className="price-tag">
            {typeof price === "number" ? `Rp${price.toLocaleString("id-ID")}` : price}
          </span>
        </div>
        <p className="mt-5 text-sm text-white/50">
          Discord ID opsional. Isi jika ingin auto-role komunitas setelah pembayaran.
        </p>
        <div className="mt-5">
          <CheckoutForm
            product={product}
            leadId={leadId}
            defaults={defaults}
            priceIdr={priceIdr}
            classId={cls?.id}
            discordRoleId={cls?.discord_role_id}
            paymentOptions={options}
            bump={bump}
          />
        </div>
        <CheckoutTracker product={product} />
      </main>

      {crossSellProducts.length > 0 ? (
        <section className="relative z-10 mt-6 w-full max-w-md rounded-2xl border border-white/10 bg-[#0A140E]/90 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00ff88]">
            // cross-sell
          </p>
          <h2 className="mt-1 text-base font-bold text-white">
            {productMeta?.cross_sell.heading || "Sering dibeli bersamaan"}
          </h2>
          <div className="mt-3 space-y-2.5">
            {crossSellProducts.map((cs) => {
              const csPrice = Number(cs.lifetime_price ?? cs.price ?? 0);
              return (
                <div
                  key={cs.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{cs.title}</p>
                    <p className="mt-0.5 font-mono text-xs text-[#00ff88]">
                      {csPrice === 0 ? "Gratis" : `Rp${csPrice.toLocaleString("id-ID")}`}
                    </p>
                  </div>
                  <Link
                    href={`/checkout/${cs.slug}${leadId ? `?lead=${encodeURIComponent(leadId)}` : ""}`}
                    className="shrink-0 rounded-lg border border-[#00ff88]/40 px-3 py-1.5 text-xs font-semibold text-[#00ff88] transition hover:bg-[#00ff88] hover:text-[#04110D]"
                  >
                    Lihat →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
