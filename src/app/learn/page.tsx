import { loadCatalog } from "@/lib/catalog";
import { LearnShell, ProductCard } from "./catalog";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const items = await loadCatalog();
  return <LearnShell><section className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">Learn / XindeLabs</p><h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">Bangun sistem AI yang <span className="text-[#00ff88]">bekerja.</span></h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/55">Kelas, workshop, dan bundle untuk membangun AI agent serta digital business.</p></section><div className="mt-12 grid gap-5 md:grid-cols-3">{items.map((x:any)=><ProductCard key={x.id} item={x}/>)}</div>{!items.length&&<p className="mt-10 text-white/50">Katalog sedang disiapkan.</p>}</LearnShell>;
}
