/* eslint-disable @next/next/no-img-element */
import { admin } from "@/lib/supabase/server";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { stripTags } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portofolio — XindeLabs",
  description:
    "Karya nyata XindeLabs: website, brand identity, dan sistem AI agent untuk bisnis di Indonesia.",
};

type Item = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  link_url: string | null;
};

export default async function PortfolioPage() {
  const { data } = await admin
    .from("portfolio")
    .select("id,title,slug,description,image_url,category,link_url")
    .order("sort_order", { ascending: true });

  const items: Item[] = data || [];
  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-white">
      <SiteHeader active="Portofolio" />
      <main className="mx-auto max-w-6xl px-4 py-14">
        <span className="badge">portofolio</span>
        <h1 className="mt-4 text-4xl font-bold md:text-5xl">Yang pernah kita bangun</h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Brand, website, dan sistem AI agent yang dipakai beneran oleh bisnis di Indonesia.
        </p>

        {categories.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
          </div>
        ) : null}

        {items.length ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="glass glow-border overflow-hidden rounded-2xl">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="h-48 w-full object-cover" />
                ) : null}
                <div className="p-5">
                  {item.category ? <span className="chip">{item.category}</span> : null}
                  <h2 className="mt-3 text-lg font-bold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{stripTags(item.description)}</p>
                  {item.link_url ? (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block font-mono text-[13px] text-[var(--accent)]"
                    >
                      Lihat proyek →
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass mt-10 rounded-2xl p-8 text-center text-white/60">
            Portofolio sedang dirapikan. Cek lagi sebentar lagi.
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
