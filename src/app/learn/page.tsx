import type { Metadata } from "next";
import { loadCatalog } from "@/lib/catalog";
import { classPrice } from "@/lib/mayar";
import { getSiteConfig } from "@/lib/site-config.server";
import { LearnShell, ProductCard } from "./catalog";
import { catalogOwnership } from "./access";
import FlagshipCheckout from "./flagship-checkout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bangun Karyawan Super 24/7" };

export default async function LearnPage() {
  const [items, site] = await Promise.all([loadCatalog(), getSiteConfig()]);
  const owned = await catalogOwnership(items);
  const learn = site.learn;
  const flagshipSlug = learn.flagship_slug || "kelas-bangun-hermes-agent";
  const flagship = items.find((item: any) => item.slug === flagshipSlug) ?? items.find((item: any) => item.product_type === "course");
  const others = items.filter((item: any) => item.slug !== flagship?.slug);
  const flagshipPrice = flagship ? classPrice(flagship as any, "lifetime") : 0;

  return <LearnShell>
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0f] px-6 py-14 md:px-14 md:py-20">
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#00ff88]/10 blur-3xl" />
      <div className="relative max-w-3xl">
        <p className="font-mono text-[12px] lowercase tracking-[0.2em] text-[#00ff88]">{learn.hero_eyebrow}</p>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4.2rem)] font-bold leading-[1.03] tracking-tight">{learn.hero_title_prefix} <span className="text-[#00ff88]">{learn.hero_title_highlight}</span> {learn.hero_title_suffix}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65 md:text-xl">{learn.hero_desc} <span className="font-[family-name:var(--font-hand)] text-[1.35rem] leading-[1.15] text-[#00ff88]">{learn.hero_desc_hand}</span></p>
        <div className="mt-8 flex flex-wrap items-center gap-4"><FlagshipCheckout item={flagship ?? { id: "", slug: flagshipSlug, title: "Bangun Karyawan Super 24/7", price: 0 }} /><a href="#materi" className="font-mono text-xs uppercase tracking-[.16em] text-white/70 underline decoration-white/25 underline-offset-4 transition hover:text-[#00ff88] hover:decoration-[#00ff88]">Lihat isi kelas ↓</a></div>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1"><strong className="font-[family-name:var(--font-display)] text-2xl text-[#00ff88]">{flagshipPrice > 0 ? `Rp${flagshipPrice.toLocaleString("id-ID")}` : "Gratis"}</strong><span className="text-sm text-white/55">{learn.hero_price_note}</span></div>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 font-mono text-[11px] uppercase tracking-[.14em] text-white/55">{learn.hero_badges.map((badge) => <span key={badge}>{badge}</span>)}</div>
      </div>
    </section>

    <section className="grid gap-10 py-20 md:grid-cols-[.8fr_1.2fr] md:items-start">
      <div><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">{learn.problem_eyebrow}</p><h2 className="mt-4 text-3xl font-bold md:text-5xl">{learn.problem_title}</h2></div>
      <div className="space-y-5 text-lg leading-8 text-white/60"><p>{learn.problem_p1}</p><p>{learn.problem_p2}</p><p className="font-bold text-white">{learn.problem_p3}</p></div>
    </section>

    <section id="materi" className="border-y border-white/10 py-20"><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">{learn.curriculum_eyebrow}</p><h2 className="mt-4 text-3xl font-bold md:text-5xl">{learn.curriculum_title}</h2><p className="mt-5 text-lg leading-8 text-white/55">{learn.curriculum_desc}</p></div><div className="mt-10 grid gap-3 md:grid-cols-2">{learn.curriculum_modules.map((label, index) => <div key={`${index}-${label}`} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-5"><span className="font-mono text-sm text-[#00ff88]">{String(index + 1).padStart(2, "0")}</span><span className="font-medium text-white/85">{label}</span></div>)}</div></section>

    <section className="grid gap-10 py-20 md:grid-cols-2"><div><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">{learn.fit_eyebrow}</p><h2 className="mt-4 text-3xl font-bold md:text-5xl">{learn.fit_title}</h2></div><ul className="space-y-4 text-lg leading-8 text-white/60">{learn.fit_points.map((pt) => <li key={pt}>✓ {pt}</li>)}</ul></section>

    <section className="rounded-2xl border border-white/10 bg-white/[.03] px-6 py-14 md:px-14"><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">{learn.method_eyebrow}</p><div className="mt-5 grid gap-8 md:grid-cols-3">{learn.method_steps.map((step) => <div key={step.title}><h3 className="text-xl font-bold text-white">{step.title}</h3><p className="mt-2 leading-7 text-white/60">{step.desc}</p></div>)}</div></section>

    <section className="py-20"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">{learn.other_eyebrow}</p><h2 className="mt-4 text-3xl font-bold md:text-5xl">{learn.other_title}</h2></div><a href="/learn/kelas" className="font-mono text-xs uppercase tracking-[.16em] text-white/55 hover:text-[#00ff88]">Lihat semua katalog ↗</a></div>{others.length ? <div className="mt-10 grid gap-5 md:grid-cols-3">{others.map((item: any) => <ProductCard key={item.id} item={item} owned={owned.has(String(item.id)) || owned.has(item.slug)} />)}</div> : <p className="mt-8 text-white/50">Produk lain sedang disiapkan.</p>}</section>

    <section className="border-t border-white/10 py-20 text-center"><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">{learn.closing_eyebrow}</p><h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold md:text-6xl">{learn.closing_title}</h2><div className="mt-8"><FlagshipCheckout item={flagship ?? { id: "", slug: flagshipSlug, title: "Bangun Karyawan Super 24/7", price: 0 }} /></div></section>
  </LearnShell>;
}
