import { loadCatalog } from "@/lib/catalog";
import { LearnShell } from "../catalog";
import CatalogGrid from "../catalog-grid";
import { catalogOwnership } from "../access";

export const dynamic = "force-dynamic";

export default async function KelasPage() {
  const items = await loadCatalog(["course", "workshop", "bundle"]);
  const owned = await catalogOwnership(items);
  return <LearnShell><section className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">XindeLabs Learn / Catalog</p><h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Bangun sistem yang <span className="text-[#00ff88]">benar-benar bekerja.</span></h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/55">Kelas, workshop, dan mentoring untuk membangun AI agent serta digital business—dengan materi yang bisa langsung dipakai.</p></section><CatalogGrid items={items as any} ownedKeys={[...owned]}/></LearnShell>;
}
