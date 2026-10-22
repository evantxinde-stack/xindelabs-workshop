/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { admin } from "@/lib/supabase/server";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { formatDate, stripTags } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog — Xinde Labs",
  description:
    "Artikel soal AI agent, personal branding, dan sistem penjualan dari Xinde Labs.",
};

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  category: string | null;
  tags: string[] | null;
  author: string | null;
};

export default async function BlogPage() {
  const { data } = await admin
    .from("blog_posts")
    .select("slug,title,excerpt,cover_image,published_at,category,tags,author")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const posts: Post[] = data || [];

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-white">
      <SiteHeader active="Blog" />
      <main className="mx-auto max-w-6xl px-4 py-14">
        <span className="badge">blog hermes agent</span>
        <h1 className="mt-4 text-4xl font-bold md:text-5xl">Catatan & Tulisan</h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Tips AI agent, personal branding, dan sistem penjualan — ditulis dari yang pernah dipraktekin.
        </p>

        {posts.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="glass glow-border rounded-2xl p-5 transition">
                {p.cover_image ? (
                  <img src={p.cover_image} alt={p.title} className="mb-4 h-44 w-full rounded-xl object-cover" />
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  {p.category ? <span className="chip">{p.category}</span> : null}
                  <span className="font-mono text-xs text-white/40">{formatDate(p.published_at)}</span>
                </div>
                <h2 className="mt-3 text-lg font-bold leading-snug">{p.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-white/60">{stripTags(p.excerpt)}</p>
                <span className="mt-4 inline-block font-mono text-[13px] text-[var(--accent)]">
                  Baca selengkapnya →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass mt-10 rounded-2xl p-8 text-center text-white/60">
            Belum ada artikel terbit. Tunggu artikel berikutnya.
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
