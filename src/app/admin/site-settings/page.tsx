import { admin } from "@/lib/supabase/server";
import { getSiteConfig } from "@/lib/site-config.server";
import SiteSettingsEditor from "./editor";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  const [config, classesRes] = await Promise.all([
    getSiteConfig(),
    admin
      .from("classes")
      .select("slug,title,product_type")
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
  ]);

  const classes = (classesRes.data ?? []).map((c) => ({
    slug: String(c.slug),
    title: String(c.title),
    product_type: String(c.product_type || "course"),
  }));

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#00ff88]">
            // site settings hub
          </p>
          <h1 className="mt-1 text-2xl font-bold">Pengaturan Situs Terpusat</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            Ubah konten Homepage, halaman Service, halaman Learn, dan kontak global langsung dari sini tanpa sentuh kode.
          </p>
        </div>
      </header>
      <SiteSettingsEditor initialConfig={config} classes={classes} />
    </>
  );
}
