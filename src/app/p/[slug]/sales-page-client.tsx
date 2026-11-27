"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { classPrice, earlyBirdOpen } from "@/lib/mayar";
import { CheckoutForm } from "@/app/checkout/[product]/checkout-form";
import {
  extractYoutubeId,
  getBlocksFromConfig,
  type SalesBlock,
} from "@/lib/sales-blocks";

const arr = (v: any) => (Array.isArray(v) ? v : []);
const tag = "font-mono text-[11px] uppercase tracking-[.22em] text-[#00ff88]";
const rule = "border-t border-white/10";

function Countdown({ config }: { config: any }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (config.countdown_type === "none") return;
    const key = `sales-countdown:${config.slug}`;
    const saved = localStorage.getItem(key);
    const end =
      config.countdown_type === "fixed" && config.countdown_ends_at
        ? new Date(config.countdown_ends_at).getTime()
        : Number(saved) || Date.now() + Number(config.countdown_duration_minutes || 30) * 60000;
    if (!saved && config.countdown_type !== "fixed") localStorage.setItem(key, String(end));
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [config]);
  if (left === null || config.countdown_type === "none") return null;
  const s = Math.floor(left / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <div className={`${rule} mt-5 flex items-center gap-3 py-4`}>
      <span className={tag}>Penawaran tutup</span>
      <b className="font-mono text-2xl text-[#00ff88]">
        {p(Math.floor(s / 3600))}:{p(Math.floor(s / 60) % 60)}:{p(s % 60)}
      </b>
    </div>
  );
}

function Price({ product }: { product: any }) {
  const regular = Number(product?.price);
  if (!regular && product?.lifetime_price == null) return null;
  const current = classPrice(product, "lifetime");
  const sale =
    (earlyBirdOpen(product) || (Number.isFinite(regular) && current < regular)) &&
    Number.isFinite(regular) &&
    current < regular;
  const isEarlyBird = earlyBirdOpen(product) && current < regular;
  const quota = Number(product?.early_bird_quota);
  const left = Number.isFinite(quota)
    ? Math.max(0, quota - Number(product?.early_bird_used || 0))
    : null;
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <b className="text-5xl text-[#00ff88]">
          {current === 0 ? "Gratis" : `Rp${current.toLocaleString("id-ID")}`}
        </b>
        {sale ? (
          <span className="text-xl text-white/35 line-through">
            Rp{regular.toLocaleString("id-ID")}
          </span>
        ) : null}
      </div>
      {isEarlyBird ? (
        <p className="mt-3 text-sm text-white/60">
          {left === null
            ? "Harga early bird, selama periode masih terbuka"
            : `Harga early bird — sisa ${left} slot`}
        </p>
      ) : null}
    </div>
  );
}

function Section({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <section className={`${rule} py-16`}>
      <div className="mx-auto max-w-5xl px-6">
        {label ? <p className={tag}>{label}</p> : null}
        {children}
      </div>
    </section>
  );
}

function Embed({ config, at }: { config: any; at: string }) {
  const html = typeof config?.custom_html === "string" ? config.custom_html.trim() : "";
  if (!html || (config?.custom_html_position || "mid") !== at) return null;
  return (
    <section className={`${rule} py-16`}>
      <div className="mx-auto max-w-5xl px-6">
        <div className="prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}

function SalesToast({ config }: { config: any }) {
  const items: string[] = arr(config?.sales_notification_config?.items);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!config?.sales_notification_enabled || !items.length) return;
    let i = 0;
    let hide = 0;
    const show = () => {
      setMsg(String(items[i++ % items.length]));
      window.clearTimeout(hide);
      hide = window.setTimeout(() => setMsg(null), 5500);
    };
    const first = window.setTimeout(show, 4000);
    const id = window.setInterval(show, 11000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      window.clearTimeout(hide);
    };
  }, [config?.sales_notification_enabled, items.length]);
  if (!msg) return null;
  return (
    <button
      onClick={() => setMsg(null)}
      className="fixed bottom-5 left-5 z-[9999] flex max-w-xs items-center gap-3 rounded-xl border border-[#00ff88]/40 bg-[#0B1F16] px-4 py-3 text-left text-sm text-white shadow-2xl"
    >
      <span className="h-2.5 w-2.5 flex-none animate-pulse rounded-full bg-[#00ff88]" />
      {msg}
      <span className="ml-auto text-white/40">×</span>
    </button>
  );
}

function CustomOnly({ config }: { config: any }) {
  const [h, setH] = useState(0);
  const html = typeof config?.custom_html === "string" ? config.custom_html.trim() : "";
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const n = Number(e.data?.xindeH);
      if (n > 0) setH(n);
      if (e.data?.xindeCheckout || e.data?.xindeScroll) {
        if (e.data?.xindeCheckout) {
          window.fbq?.("track", "AddToCart", {
            content_name: config.slug,
            content_type: "product",
            currency: "IDR",
            value: config.price_idr,
          });
        }
        document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const href = e.data?.xindeClick;
      if (href) {
        window.fbq?.("track", "AddToCart", {
          content_name: config.slug,
          content_type: "product",
          currency: "IDR",
          value: config.price_idr,
        });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [config.slug, config.price_idr]);
  if (!html) return null;
  const bridge = `<script>var _t=document.getElementById("toast");if(_t)_t.remove();function H(){parent.postMessage({xindeH:document.documentElement.scrollHeight},"*")};document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a");if(!a)return;var h=a.getAttribute("href")||a.href||"";if(h.indexOf("/checkout/")>-1){e.preventDefault();parent.postMessage({xindeCheckout:1},"*")}else if(h==="#checkout"){e.preventDefault();parent.postMessage({xindeScroll:1},"*")}else parent.postMessage({xindeClick:h},"*")},true);addEventListener("load",H);addEventListener("resize",H);setInterval(H,1500)</script>`;
  const doc = html.includes("</body>") ? html.replace("</body>", bridge + "</body>") : html + bridge;
  return (
    <iframe
      title={config.slug || "Sales page"}
      srcDoc={doc}
      style={{ height: h ? `${h}px` : "100dvh" }}
      className="w-full border-0"
      scrolling="no"
    />
  );
}

function CustomPage({ config, product }: { config: any; product: any }) {
  const price = classPrice(product, "lifetime");
  return (
    <>
      <CustomOnly config={config} />
      <SalesToast config={config} />
      <section id="checkout" className="border-t border-white/10 bg-[#04110D] px-6 py-20 text-white">
        <div className="mx-auto max-w-md">
          <p className={tag}>// amankan slot</p>
          <h2 className="mt-4 text-3xl font-bold">Mulai bangun karyawan digitalmu.</h2>
          <p className="mt-3 text-white/55">Isi data. Link pembayaran Mayar muncul setelah submit.</p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0B1F16] p-6">
            <CheckoutForm
              product={product.slug || config.slug}
              priceIdr={price}
              classId={product.id}
              paymentOptions={product.payment_options || ["lifetime"]}
              bump={undefined}
            />
          </div>
        </div>
      </section>
    </>
  );
}

function RenderBlock({
  block,
  config,
  product,
  lessons,
  checkout,
  openFaq,
  setOpenFaq,
}: {
  block: SalesBlock;
  config: any;
  product: any;
  lessons: any[];
  checkout: string;
  openFaq: string | null;
  setOpenFaq: (v: string | null) => void;
}) {
  if (block.hidden) return null;
  const d = block.data || {};
  const ctaDefault = config.cta_label || "Daftar sekarang";

  switch (block.type) {
    case "hero": {
      const center = d.align === "center";
      return (
        <section className={`mx-auto max-w-5xl px-6 pb-20 pt-20 md:pt-28 ${center ? "text-center" : ""}`}>
          {d.badge ? <p className={tag}>{d.badge}</p> : null}
          <h1 className={`mt-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl ${center ? "mx-auto max-w-4xl" : "max-w-4xl"}`}>
            {d.headline || product?.title}
            {d.highlight ? <span className="text-[#00ff88]"> {d.highlight}</span> : null}
          </h1>
          {d.subheadline ? (
            <p className={`mt-7 text-lg leading-8 text-white/60 ${center ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
              {d.subheadline}
            </p>
          ) : null}
          <div className={`mt-9 flex flex-wrap gap-4 ${center ? "justify-center" : ""}`}>
            <Link href={checkout} className="rounded-full bg-[#00ff88] px-6 py-3.5 font-bold text-[#04110D]">
              {d.cta_label || ctaDefault}
            </Link>
          </div>
          {d.image_url ? (
            <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
              <img src={d.image_url} alt={d.headline || ""} className="w-full object-cover" />
            </div>
          ) : null}
        </section>
      );
    }

    case "video": {
      const yt = extractYoutubeId(d.youtube_id);
      if (!yt) return null;
      return (
        <Section label={d.heading || undefined}>
          <div className="mt-4 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${encodeURIComponent(yt)}`}
              title={d.heading || "Video"}
              allowFullScreen
            />
          </div>
          {d.caption ? <p className="mt-3 text-center text-sm text-white/50">{d.caption}</p> : null}
        </Section>
      );
    }

    case "text": {
      const center = d.align === "center";
      const paragraphs = String(d.body || "")
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      return (
        <Section label={d.eyebrow || undefined}>
          <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
            {d.heading ? <h2 className="mt-3 text-3xl font-bold md:text-4xl">{d.heading}</h2> : null}
            <div className="mt-5 space-y-4 text-base leading-8 text-white/70">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </Section>
      );
    }

    case "image": {
      if (!d.image_url) return null;
      const widthCls =
        d.max_width === "small"
          ? "max-w-md"
          : d.max_width === "medium"
            ? "max-w-2xl"
            : "max-w-5xl";
      return (
        <section className={`${rule} py-12`}>
          <div className={`mx-auto px-6 ${widthCls}`}>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <img src={d.image_url} alt={d.caption || ""} className="w-full object-cover" />
            </div>
            {d.caption ? <p className="mt-3 text-center text-sm text-white/50">{d.caption}</p> : null}
          </div>
        </section>
      );
    }

    case "problems": {
      const items = arr(d.items);
      if (!items.length) return null;
      return (
        <Section label={d.eyebrow || "Masalah yang diselesaikan"}>
          <div className="mt-8 space-y-8">
            {items.map((x: any, i: number) => (
              <div key={i} className="grid gap-3 md:grid-cols-[120px_1fr] md:gap-8">
                <span className="font-mono text-[11px] text-white/35">
                  {x.label || String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-2xl font-bold md:text-3xl">{x.title}</h2>
                  <p className="mt-3 max-w-2xl leading-7 text-white/55">{x.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "stats": {
      const items = arr(d.items);
      if (!items.length) return null;
      return (
        <Section label={d.eyebrow || "Yang sudah berjalan"}>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {items.map((x: any, i: number) => (
              <div key={i}>
                <b className="font-mono text-4xl text-[#00ff88]">{x.value}</b>
                <p className="mt-3 text-sm text-white/50">{x.label}</p>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "curriculum": {
      if (!lessons.length) return null;
      return (
        <Section label={d.eyebrow || "Isi materinya"}>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            {d.heading || "Yang bakal kamu bangun, modul per modul."}
          </h2>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/12 bg-[#0B1F16]">
            <div className="border-b border-white/10 px-5 py-3 font-mono text-[11px] text-white/40">
              $ ls modules/ --published
            </div>
            <ol className="divide-y divide-white/[.07]">
              {lessons.map((x: any, i: number) => (
                <li key={x.id} className="flex gap-4 px-5 py-3.5">
                  <span className="font-mono text-[11px] text-white/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-white/75">{x.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      );
    }

    case "benefits": {
      const items = arr(d.items);
      if (!items.length) return null;
      return (
        <Section label={d.eyebrow || "Yang kamu dapat"}>
          <div className="mt-8 space-y-6">
            {items.map((x: any, i: number) => (
              <div key={i} className="grid gap-2 md:grid-cols-[240px_1fr] md:gap-10">
                <h3 className="font-bold">{x.title || x.name}</h3>
                <p className="leading-7 text-white/55">{x.body}</p>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "testimonials": {
      const items = arr(d.items);
      if (!items.length) return null;
      return (
        <Section label={d.eyebrow || "Kata member"}>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {items.map((x: any, i: number) => (
              <blockquote key={i} className="rounded-2xl border border-white/12 bg-[#0B1F16] p-6">
                <p className="leading-7 text-white/75">“{x.quote || x.text}”</p>
                <footer className="mt-4 font-mono text-[11px] text-white/35">
                  {[x.name, x.meta].filter(Boolean).join(" · ")}
                </footer>
              </blockquote>
            ))}
          </div>
        </Section>
      );
    }

    case "pricing":
      return (
        <Section label={d.eyebrow || "Pricing"}>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">{d.heading || product?.title}</h2>
          <div className="mt-8 max-w-xl rounded-2xl border border-white/12 bg-[#0B1F16] p-7">
            <Price product={product} />
            {d.show_countdown !== false ? <Countdown config={config} /> : null}
            <Link
              href={checkout}
              className="mt-7 block rounded-full bg-[#00ff88] px-6 py-4 text-center font-bold text-[#04110D]"
            >
              {d.cta_label || ctaDefault}
            </Link>
            {d.note ? (
              <p className="mt-3 text-center text-xs text-white/40">{d.note}</p>
            ) : null}
          </div>
        </Section>
      );

    case "faq": {
      const items = arr(d.items);
      if (!items.length) return null;
      return (
        <Section label={d.eyebrow || "FAQ"}>
          <div className="mt-8 max-w-3xl">
            {items.map((x: any, i: number) => {
              const key = `${block.id}:${i}`;
              const isOpen = openFaq === key;
              return (
                <div key={key} className={rule}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : key)}
                    className="flex w-full justify-between py-5 text-left text-lg font-bold"
                  >
                    {x.question || x.q}
                    <span className="font-mono text-[#00ff88]">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen ? <p className="pb-5 leading-7 text-white/55">{x.answer || x.a}</p> : null}
                </div>
              );
            })}
          </div>
        </Section>
      );
    }

    case "cta":
      return (
        <section className={`${rule} py-20`}>
          <div className="mx-auto max-w-5xl px-6">
            {d.eyebrow ? <p className={tag}>{d.eyebrow}</p> : null}
            <h2 className="mt-4 max-w-3xl text-3xl font-bold md:text-5xl">
              {d.headline || "Berhenti kerjain semuanya sendiri."}
            </h2>
            {d.subheadline ? (
              <p className="mt-5 max-w-2xl leading-8 text-white/55">{d.subheadline}</p>
            ) : null}
            <Link
              href={d.cta_href || checkout}
              className="mt-8 inline-block rounded-full bg-[#00ff88] px-7 py-4 font-bold text-[#04110D]"
            >
              {d.cta_label || ctaDefault}
            </Link>
          </div>
        </section>
      );

    case "html": {
      const html = String(d.html || "").trim();
      if (!html) return null;
      return (
        <section className={`${rule} py-12`}>
          <div className="mx-auto max-w-5xl px-6">
            <div className="prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </section>
      );
    }
  }
}

export function SalesPageClient({
  config,
  product,
  lessons,
}: {
  config: any;
  product: any;
  lessons: any[];
}) {
  const [faq, setFaq] = useState<number | null>(null);
  const [openBlockFaq, setOpenBlockFaq] = useState<string | null>(null);
  const checkout = `https://xindelabs.web.id/checkout/${product?.slug || config.slug}`;
  const cta = config.cta_label || "Daftar sekarang";
  const pagePixelId = String(config?.sales_notification_config?.meta_pixel_id || "").replace(/\D/g, "");

  useEffect(() => {
    if (!pagePixelId || config.slug === "preview") return;
    if (typeof window === "undefined") return;
    const w = window as any;
    if (!w.fbq) {
      const n: any = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      w.fbq = n;
      if (!w._fbq) w._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    }
    w.fbq("init", pagePixelId);
    w.fbq("trackSingle", pagePixelId, "PageView");
    w.fbq("trackSingle", pagePixelId, "ViewContent", {
      content_name: product?.title || config.slug,
      content_type: "product",
      content_ids: product?.id ? [product.id] : undefined,
    });
  }, [pagePixelId, config.slug, product?.id, product?.title]);

  useEffect(() => {
    window.fbq?.("track", "ViewContent", {
      content_name: product?.title || config.slug,
      content_type: "product",
      content_ids: product?.id ? [product.id] : undefined,
    });
  }, [config.slug, product?.id, product?.title]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("a,button") as
        | HTMLAnchorElement
        | HTMLButtonElement
        | null;
      if (!el) return;
      const href = el.tagName === "A" ? (el as HTMLAnchorElement).href : undefined;
      if (el.tagName !== "BUTTON" && (!href || !href.includes("/checkout/"))) return;
      const eventPayload = {
        content_name: product?.title || config.slug,
        content_type: "product",
        content_ids: product?.id ? [product.id] : undefined,
        currency: "IDR",
        value: product ? classPrice(product, "lifetime") : undefined,
      };
      window.fbq?.("track", "AddToCart", eventPayload);
      if (pagePixelId && config.slug !== "preview") {
        window.fbq?.("trackSingle", pagePixelId, "AddToCart", eventPayload);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [config.slug, product, pagePixelId]);

  if (config.render_mode === "custom" && typeof config.custom_html === "string" && config.custom_html.trim()) {
    return <CustomPage config={config} product={product} />;
  }

  // New Drag-and-Drop Block Renderer (when builder_blocks exists)
  const builderBlocks = getBlocksFromConfig(config);
  if (builderBlocks) {
    return (
      <main className="min-h-screen bg-[#04110D] text-white">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#04110D]/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <a href="https://xindelabs.web.id" className="text-lg font-bold">
              xindelabs<span className="text-[#00ff88]">.</span>
            </a>
            <Link
              href={checkout}
              className="rounded-full border border-[#00ff88]/40 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-[#00ff88]"
            >
              {cta}
            </Link>
          </div>
        </header>

        {builderBlocks.map((block) => (
          <RenderBlock
            key={block.id}
            block={block}
            config={config}
            product={product}
            lessons={lessons}
            checkout={checkout}
            openFaq={openBlockFaq}
            setOpenFaq={setOpenBlockFaq}
          />
        ))}

        <SalesToast config={config} />
        <footer className="border-t border-white/10 py-8">
          <div className="mx-auto max-w-5xl px-6 font-mono text-[11px] text-white/30">
            xindelabs.web.id · AI agent · automation · digital systems
          </div>
        </footer>
      </main>
    );
  }

  // Legacy template fallback (100% backward compatible)
  const faqs = arr(config.faq_items);
  const problems = arr(config.problem_blocks);
  const stats = arr(config.stats);
  const benefits = arr(config.benefits);
  const testimonials = arr(config.testimonials);

  return (
    <main className="min-h-screen bg-[#04110D] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#04110D]/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="https://xindelabs.web.id" className="text-lg font-bold">
            xindelabs<span className="text-[#00ff88]">.</span>
          </a>
          <Link
            href={checkout}
            className="rounded-full border border-[#00ff88]/40 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-[#00ff88]"
          >
            {cta}
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-20 md:pt-28">
        {config.hero_badge ? <p className={tag}>{config.hero_badge}</p> : null}
        <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
          {config.headline || product?.title}
        </h1>
        {config.subheadline || product?.description ? (
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/60">
            {config.subheadline || product?.description}
          </p>
        ) : null}
        <div className="mt-9 flex flex-wrap gap-4">
          <Link href={checkout} className="rounded-full bg-[#00ff88] px-6 py-3.5 font-bold text-[#04110D]">
            {cta}
          </Link>
          {config.vsl_youtube_id ? (
            <a href="#video" className="py-3 font-mono text-[11px] uppercase tracking-wider text-white/50">
              lihat cara kerjanya
            </a>
          ) : null}
        </div>
      </section>
      {config.vsl_youtube_id ? (
        <section id="video" className="mx-auto max-w-5xl px-6 pb-16">
          <div className="aspect-video overflow-hidden rounded-2xl border border-white/10">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${encodeURIComponent(config.vsl_youtube_id)}`}
              title="Video sales letter"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}
      <Embed config={config} at="hero" />
      {problems.length > 0 ? (
        <Section label="Masalah yang diselesaikan">
          <div className="mt-8 space-y-8">
            {problems.map((x: any, i: number) => (
              <div key={i} className="grid gap-3 md:grid-cols-[120px_1fr] md:gap-8">
                <span className="font-mono text-[11px] text-white/35">{x.label || `0${i + 1}`}</span>
                <div>
                  <h2 className="text-2xl font-bold md:text-3xl">{x.title}</h2>
                  <p className="mt-3 max-w-2xl leading-7 text-white/55">{x.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
      {stats.length > 0 ? (
        <Section label="Yang sudah berjalan">
          <div className="mt-8 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {stats.map((x: any, i: number) => (
              <div key={i}>
                <b className="font-mono text-4xl text-[#00ff88]">{x.value}</b>
                <p className="mt-3 text-sm text-white/50">{x.label}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
      {lessons.length > 0 ? (
        <Section label="Isi materinya">
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Yang bakal kamu bangun, modul per modul.</h2>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/12 bg-[#0B1F16]">
            <div className="border-b border-white/10 px-5 py-3 font-mono text-[11px] text-white/40">
              $ ls modules/ --published
            </div>
            <ol className="divide-y divide-white/[.07]">
              {lessons.map((x: any, i: number) => (
                <li key={x.id} className="flex gap-4 px-5 py-3.5">
                  <span className="font-mono text-[11px] text-white/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-white/75">{x.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      ) : null}
      {benefits.length > 0 ? (
        <Section label="Yang kamu dapat">
          <div className="mt-8 space-y-6">
            {benefits.map((x: any, i: number) => (
              <div key={i} className="grid gap-2 md:grid-cols-[240px_1fr] md:gap-10">
                <h3 className="font-bold">{x.title || x.name}</h3>
                <p className="leading-7 text-white/55">{x.body}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
      {testimonials.length > 0 ? (
        <Section label="Kata member">
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {testimonials.map((x: any, i: number) => (
              <blockquote key={i} className="rounded-2xl border border-white/12 bg-[#0B1F16] p-6">
                <p className="leading-7 text-white/75">“{x.quote || x.text}”</p>
                <footer className="mt-4 font-mono text-[11px] text-white/35">
                  {[x.name, x.meta].filter(Boolean).join(" · ")}
                </footer>
              </blockquote>
            ))}
          </div>
        </Section>
      ) : null}
      <Embed config={config} at="mid" />
      <Section label="Pricing">
        <h2 className="mt-4 text-3xl font-bold md:text-4xl">{product?.title}</h2>
        <div className="mt-8 max-w-xl rounded-2xl border border-white/12 bg-[#0B1F16] p-7">
          <Price product={product} />
          <Countdown config={config} />
          <Link
            href={checkout}
            className="mt-7 block rounded-full bg-[#00ff88] px-6 py-4 text-center font-bold text-[#04110D]"
          >
            {cta}
          </Link>
          <p className="mt-3 text-center text-xs text-white/40">
            Pembayaran via Mayar · akses setelah pembayaran masuk
          </p>
        </div>
      </Section>
      {faqs.length > 0 ? (
        <Section label="FAQ">
          <div className="mt-8 max-w-3xl">
            {faqs.map((x: any, i: number) => (
              <div key={i} className={rule}>
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  className="flex w-full justify-between py-5 text-left text-lg font-bold"
                >
                  {x.question || x.q}
                  <span className="font-mono text-[#00ff88]">{faq === i ? "−" : "+"}</span>
                </button>
                {faq === i ? <p className="pb-5 leading-7 text-white/55">{x.answer || x.a}</p> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}
      <Embed config={config} at="last" />
      <section className={`${rule} py-20`}>
        <div className="mx-auto max-w-5xl px-6">
          <p className={tag}>Mulai</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold md:text-5xl">
            {config.final_headline || "Berhenti kerjain semuanya sendiri."}
          </h2>
          <p className="mt-5 max-w-2xl leading-8 text-white/55">
            {config.final_subheadline || "Bangun sistem yang jalan buat kamu, bukan sebaliknya."}
          </p>
          <Link
            href={checkout}
            className="mt-8 inline-block rounded-full bg-[#00ff88] px-7 py-4 font-bold text-[#04110D]"
          >
            {cta}
          </Link>
        </div>
      </section>
      <SalesToast config={config} />
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-5xl px-6 font-mono text-[11px] text-white/30">
          xindelabs.web.id · AI agent · automation · digital systems
        </div>
      </footer>
    </main>
  );
}
