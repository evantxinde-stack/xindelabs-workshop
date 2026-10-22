/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase/server";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { formatDate, sanitizeHtml, stripTags } from "@/lib/content";

export const dynamic = "force-dynamic";

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  content_markdown: string | null;
  content: string | null;
  cover_image: string | null;
  published_at: string | null;
  category: string | null;
  tags: string[] | null;
  author: string | null;
  author_agent: string | null;
  cta_url: string | null;
  cta_label: string | null;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await admin
    .from("blog_posts")
    .select("title,seo_title,seo_description,excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return { title: "Artikel — Xinde Labs" };
  return {
    title: data.seo_title || data.title,
    description: data.seo_description || stripTags(data.excerpt) || undefined,
  };
}

function renderBody(post: Post) {
  const markdown = stripTags(post.content_markdown);
  const html = sanitizeHtml(post.content || "");
  if (html) return <div className="prose-invert space-y-4 text-white/80" dangerouslySetInnerHTML={{ __html: html }} />;
  if (markdown) {
    return (
      <div className="space-y-4 text-white/80">
        {markdown.split(/\n{2,}/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }
  return <p className="text-white/70">{stripTags(post.excerpt)}</p>;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await admin
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) notFound();
  const post = data as Post;

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-white">
      <SiteHeader active="Blog" />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <Link href="/blog" className="font-mono text-sm text-[var(--accent)]">
          ← Semua artikel
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {post.category ? <span className="chip">{post.category}</span> : null}
          <span className="font-mono text-xs text-white/40">{formatDate(post.published_at)}</span>
          {post.author ? <span className="font-mono text-xs text-white/40">· {post.author}</span> : null}
          {post.author_agent ? (
            <span className="font-mono text-xs text-white/40">· {post.author_agent}</span>
          ) : null}
        </div>

        <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">{post.title}</h1>
        {post.excerpt ? <p className="mt-4 text-lg text-white/65">{stripTags(post.excerpt)}</p> : null}

        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="mt-8 w-full rounded-2xl object-cover"
          />
        ) : null}

        <article className="mt-10 border-t border-[var(--border)] pt-8">{renderBody(post)}</article>

        {post.cta_url ? (
          <div className="glass glow-border mt-10 rounded-2xl p-6">
            <p className="text-white/70">Mau mulai praktiknya sekarang?</p>
            <Link href={post.cta_url} className="btn-glow mt-4 inline-block rounded-xl px-5 py-3 font-bold">
              {post.cta_label || "Daftar Sekarang"}
            </Link>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
