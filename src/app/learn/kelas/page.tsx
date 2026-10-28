import { loadCatalog } from "@/lib/catalog";
import { LearnShell, ProductCard } from "../catalog";

export const dynamic = "force-dynamic";

export default async function KelasPage() {
  const items = await loadCatalog(["course", "workshop", "bundle"]);
  return <LearnShell><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">Catalog</p><h1 className="mt-3 text-4xl font-bold">Kelas & Workshop</h1></div><p className="max-w-sm text-sm leading-6 text-white/50">Pilih produk untuk melihat detail dan checkout Mayar.</p></div><div className="mt-10 grid gap-5 md:grid-cols-3">{items.map((x: any) => <ProductCard key={x.id} item={x} />)}</div></LearnShell>;
}
