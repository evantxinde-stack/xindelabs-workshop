import type { Metadata } from "next";
import Link from "next/link";
import { loadCatalog } from "@/lib/catalog";
import { getSiteConfig } from "@/lib/site-config.server";
import { LearnShell } from "./catalog";
import CatalogGrid from "./catalog-grid";
import { catalogOwnership } from "./access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "XindeLabs Learn — Classroom & Digital Library",
  description:
    "Portal belajar XindeLabs: kelas online, workshop live & replay, template siap pakai, dan program mentoring AI & digital business.",
};

export default async function LearnPage() {
  const [items, site] = await Promise.all([loadCatalog(), getSiteConfig()]);
  const owned = await catalogOwnership(items);
  const learn = site.learn;

  return (
    <LearnShell>
      {/* Hero Umum Portal Belajar */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0f] px-6 py-14 md:px-14 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#00ff88]/10 blur-3xl"
        />
        <div className="relative max-w-3xl">
          <p className="font-mono text-[12px] lowercase tracking-[0.2em] text-[#00ff88]">
            {learn.hero_eyebrow}
          </p>
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.3rem,5.5vw,4rem)] font-bold leading-[1.05] tracking-tight">
            {learn.hero_title_prefix}{" "}
            <span className="text-[#00ff88]">{learn.hero_title_highlight}</span>
            {learn.hero_title_suffix ? ` ${learn.hero_title_suffix}` : ""}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65 md:text-xl">
            {learn.hero_desc}{" "}
            <span className="font-[family-name:var(--font-hand)] text-[1.35rem] leading-[1.15] text-[#00ff88]">
              {learn.hero_desc_hand}
            </span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#katalog"
              className="rounded-full bg-[#00ff88] px-7 py-3.5 text-[15px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]"
            >
              Jelajahi Katalog ↓
            </a>
            <Link
              href="/learn/dashboard"
              className="rounded-full border border-white/25 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:border-[#00ff88] hover:text-[#00ff88]"
            >
              Masuk Member Area →
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 font-mono text-[11px] uppercase tracking-[.14em] text-white/55">
            {items.length > 0 ? <span>{items.length} program aktif</span> : null}
            {learn.hero_badges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 01 / Pendekatan Belajar */}
      <section className="grid gap-10 py-20 md:grid-cols-[.8fr_1.2fr] md:items-start">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">
            {learn.problem_eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-bold md:text-5xl">{learn.problem_title}</h2>
        </div>
        <div className="space-y-5 text-lg leading-8 text-white/60">
          <p>{learn.problem_p1}</p>
          <p>{learn.problem_p2}</p>
          <p className="font-bold text-white">{learn.problem_p3}</p>
        </div>
      </section>

      {/* 02 / Jalur Belajar */}
      <section className="border-y border-white/10 py-20">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">
            {learn.curriculum_eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-bold md:text-5xl">{learn.curriculum_title}</h2>
          <p className="mt-5 text-lg leading-8 text-white/55">{learn.curriculum_desc}</p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {learn.curriculum_modules.map((label, index) => (
            <div
              key={`${index}-${label}`}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-5"
            >
              <span className="font-mono text-sm text-[#00ff88]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-medium leading-relaxed text-white/85">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Katalog Lengkap Semua Produk */}
      <section id="katalog" className="scroll-mt-20 py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">
              {learn.other_eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-5xl">{learn.other_title}</h2>
          </div>
          <Link
            href="/learn/kelas"
            className="font-mono text-xs uppercase tracking-[.16em] text-white/55 hover:text-[#00ff88]"
          >
            Buka halaman katalog penuh ↗
          </Link>
        </div>
        {items.length ? (
          <CatalogGrid items={items} ownedKeys={[...owned]} />
        ) : (
          <p className="mt-8 text-white/50">Katalog program sedang disiapkan.</p>
        )}
      </section>

      {/* 03 / Cocok Untuk */}
      <section className="grid gap-10 border-t border-white/10 py-20 md:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">
            {learn.fit_eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-bold md:text-5xl">{learn.fit_title}</h2>
        </div>
        <ul className="space-y-4 text-lg leading-8 text-white/60">
          {learn.fit_points.map((pt) => (
            <li key={pt}>✓ {pt}</li>
          ))}
        </ul>
      </section>

      {/* 04 / Cara Belajarnya */}
      <section className="rounded-2xl border border-white/10 bg-white/[.03] px-6 py-14 md:px-14">
        <p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">
          {learn.method_eyebrow}
        </p>
        <div className="mt-5 grid gap-8 md:grid-cols-3">
          {learn.method_steps.map((step) => (
            <div key={step.title}>
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-2 leading-7 text-white/60">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA Umum */}
      <section className="mt-16 border-t border-white/10 py-20 text-center">
        <p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">
          {learn.closing_eyebrow}
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold md:text-5xl">
          {learn.closing_title}
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#katalog"
            className="rounded-full bg-[#00ff88] px-7 py-3.5 text-[15px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]"
          >
            Lihat Semua Program ↑
          </a>
          <Link
            href="https://xindelabs.web.id/tutorial"
            className="rounded-full border border-white/25 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:border-[#00ff88] hover:text-[#00ff88]"
          >
            Coba Tutorial Gratis →
          </Link>
        </div>
      </section>
    </LearnShell>
  );
}
