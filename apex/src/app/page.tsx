/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { admin } from "@/lib/supabase/server";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PartnershipForm } from "@/components/PartnershipForm";
import { formatDate, formatIDR, parseJsonValue, stripTags } from "@/lib/content";

export const dynamic = "force-dynamic";

type Program = {
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number | null;
  type: string | null;
  features: unknown;
};

type ClassRow = {
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number | null;
};

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  category: string | null;
};

const ECOSYSTEM = [
  {
    href: "https://kelas.xindelabs.web.id",
    label: "Kelas",
    desc: "Kelas online & live untuk bangun skill AI agent dari nol.",
    cta: "Buka Kelas",
  },
  {
    href: "https://workshop.xindelabs.web.id",
    label: "Workshop",
    desc: "Workshop Intensity: sekali jalan, sistem sales & konten lo jadi jalan sendiri.",
    cta: "Lihat Workshop",
  },
  {
    href: "https://member.xindelabs.web.id",
    label: "Member",
    desc: "Area member: modul, rekaman, sesi live, dan komunitas alumni.",
    cta: "Masuk Area Member",
  },
  {
    href: "/blog",
    label: "Blog",
    desc: "Artikel soal AI agent, personal branding, dan sistem penjualan.",
    cta: "Baca Blog",
  },
  {
    href: "/portofolio",
    label: "Portofolio",
    desc: "Karya nyata: website, brand, dan sistem yang pernah kita bangun.",
    cta: "Lihat Portofolio",
  },
];

export default async function Home() {
  const [contentRes, programsRes, classesRes, postsRes, waRes] = await Promise.all([
    admin.from("site_content").select("value").eq("key", "homepage").maybeSingle(),
    admin
      .from("programs")
      .select("slug,title,description,cover_image,price,type,features")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .limit(4),
    admin
      .from("classes")
      .select("slug,title,description,cover_image,price")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(4),
    admin
      .from("blog_posts")
      .select("slug,title,excerpt,cover_image,published_at,category")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3),
    admin.from("settings").select("value").eq("key", "wa_admin_number").maybeSingle(),
  ]);

  const content = parseJsonValue(contentRes.data?.value);
  const programs: Program[] = programsRes.data || [];
  const classes: ClassRow[] = classesRes.data || [];
  const posts: Post[] = postsRes.data || [];
  const waNumber = String(waRes.data?.value || "").replace(/\D/g, "");
  const waHref = waNumber
    ? `https://wa.me/${waNumber.startsWith("0") ? "62" + waNumber.slice(1) : waNumber}`
    : null;

  const heroTitle = stripTags(content.hero_title) || "Bangun Karyawan Super Pintar";
  const heroSubtitle =
    stripTags(content.hero_subtitle) ||
    "Bikin agent AI yang follow-up calon client, riset prospek, bikin konten, dan jawab objeji — 24/7, tanpa lo perlu lembur.";

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-white">
      <SiteHeader />

      {/* ================= HERO / PERSONAL BRANDING ================= */}
      <main className="grid-bg relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-30 blur-[140px]"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:pb-24 md:pt-24">
          <span className="badge anim-fade-up inline-block">personal branding · ai agent · digital business</span>
          <h1 className="anim-fade-up anim-delay-100 mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
            <span className="text-gradient">{heroTitle}</span>
          </h1>
          <p className="anim-fade-up anim-delay-200 mt-6 max-w-2xl text-base leading-relaxed text-white/65 md:text-lg">
            {heroSubtitle}
          </p>

          <div className="anim-fade-up anim-delay-300 mt-8 flex flex-wrap gap-3">
            <Link href="https://kelas.xindelabs.web.id" className="btn-glow rounded-xl px-5 py-3 font-bold">
              Lihat Kelas
            </Link>
            <Link
              href="https://workshop.xindelabs.web.id"
              className="btn-glow-outline rounded-xl px-5 py-3 font-semibold"
            >
              Lihat Workshop
            </Link>
            <Link href="/tutorial" className="btn-glow-outline rounded-xl px-5 py-3 font-semibold">
              Tutorial Gratis
            </Link>
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow-outline rounded-xl px-5 py-3 font-semibold"
              >
                Chat Admin
              </a>
            ) : null}
          </div>

          <dl className="anim-fade-up anim-delay-400 mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { k: "Kelas live", v: `${classes.length || "—"}` },
              { k: "Program", v: `${programs.length || "—"}` },
              { k: "Artikel", v: `${posts.length || "—"}` },
              { k: "Siap 24/7", v: "Yes" },
            ].map((s) => (
              <div key={s.k} className="glass rounded-2xl px-4 py-4">
                <dt className="font-mono text-xs uppercase tracking-wider text-white/40">{s.k}</dt>
                <dd className="mt-1 text-2xl font-bold text-[var(--accent)]">{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      {/* ================= EKOSISTEM ================= */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <span className="badge">ekosistem xinde labs</span>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Satu tempat, semua yang lo butuhin</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/60">
            Belajar, bantuin, dan grow — semuanya nyambung lewat satu sistem.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ECOSYSTEM.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="glass glow-border group rounded-2xl p-6 transition"
            >
              <h3 className="text-lg font-bold text-white">{item.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{item.desc}</p>
              <span className="mt-4 inline-block font-mono text-[13px] text-[var(--accent)]">
                {item.cta} →
              </span>
            </Link>
          ))}

          <div className="glass glow-border rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white">Butuh CUSTOM?</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Kelas private, workshop kantor, atau setup agent khusus brand lo.
            </p>
            <a href="#kerjasama" className="mt-4 inline-block font-mono text-[13px] text-[var(--accent)]">
              Ajukan Kerjasama →
            </a>
          </div>
        </div>
      </section>

      {/* ================= PROGRAM UNGGULAN ================= */}
      {programs.length ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="badge">program</span>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">Program Unggulan</h2>
            </div>
            <Link href="https://kelas.xindelabs.web.id" className="font-mono text-sm text-[var(--accent)]">
              Lihat semua →
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {programs.map((p) => (
              <article key={p.slug} className="glass glow-border overflow-hidden rounded-2xl">
                {p.cover_image ? (
                  <img src={p.cover_image} alt={p.title} className="h-36 w-full object-cover" />
                ) : null}
                <div className="p-5">
                  {p.type ? <span className="chip">{p.type}</span> : null}
                  <h3 className="mt-3 text-base font-bold">{p.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-white/60">{stripTags(p.description)}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="price-tag text-sm">{formatIDR(p.price)}</span>
                    <Link
                      href="https://kelas.xindelabs.web.id"
                      className="font-mono text-[13px] text-[var(--accent)]"
                    >
                      Detail →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* ================= KELAS TERBARU ================= */}
      {classes.length ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <span className="badge">kelas</span>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Kelas yang lagi aktif</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {classes.map((c) => (
              <article key={c.slug} className="glass glow-border rounded-2xl p-5">
                <h3 className="text-base font-bold">{c.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-white/60">{stripTags(c.description)}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-sm text-[var(--accent)]">{formatIDR(c.price)}</span>
                  <Link
                    href="https://kelas.xindelabs.web.id"
                    className="font-mono text-[13px] text-white/70 hover:text-[var(--accent)]"
                  >
                    Daftar →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* ================= ARTIKEL TERBARU ================= */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="badge">blog</span>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">Catatan terbaru</h2>
          </div>
          <Link href="/blog" className="font-mono text-sm text-[var(--accent)]">
            Semua artikel →
          </Link>
        </div>

        {posts.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="glass glow-border rounded-2xl p-5 transition">
                {p.cover_image ? (
                  <img src={p.cover_image} alt={p.title} className="mb-4 h-40 w-full rounded-xl object-cover" />
                ) : null}
                {p.category ? <span className="chip">{p.category}</span> : null}
                <h3 className="mt-3 text-base font-bold leading-snug">{p.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-white/60">{stripTags(p.excerpt)}</p>
                <span className="mt-4 block font-mono text-xs text-white/40">
                  {formatDate(p.published_at)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-white/50">Belum ada artikel. Segera hadir.</p>
        )}
      </section>

      {/* ================= KERJASAMA ================= */}
      <section id="kerjasama" className="mx-auto max-w-4xl px-4 py-16">
        <div className="glass glow-border rounded-3xl p-6 md:p-10">
          <span className="badge">kerjasama</span>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Punya tim yang butuh upgrade?</h2>
          <p className="mt-3 max-w-2xl text-white/60">
            Ceritakan kebutuhan lo — kelas private, workshop kantor, sampai setup agent AI buat tim marketing.
          </p>
          <div className="mt-8">
            <PartnershipForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
