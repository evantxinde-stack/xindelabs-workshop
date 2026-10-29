"use client";
import { useMemo, useState } from "react";
import { ProductCard, type ClassRow } from "./catalog";

export default function CatalogGrid({ items, ownedKeys = [] }: { items: ClassRow[]; ownedKeys?: string[] }) {
  const [filter, setFilter] = useState("all");
  const visible = useMemo(() => filter === "all" ? items : items.filter((x) => filter === "workshop" ? x.product_type === "workshop" : filter === "course" ? x.product_type === "course" : x.product_type === "vip" || /vip|mentoring/i.test(x.slug)), [filter, items]);
  return <>
    <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter katalog">
      {[['all','Semua'],['course','Kelas'],['workshop','Workshop'],['vip','VIP']].map(([key,label]) => <button key={key} role="tab" aria-selected={filter === key} onClick={() => setFilter(key)} className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[.14em] transition ${filter === key ? "border-[#00ff88] bg-[#00ff88] text-[#06140d]" : "border-white/15 text-white/55 hover:border-[#00ff88]/60 hover:text-[#00ff88]"}`}>{label}</button>)}
    </div>
    <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visible.map((x) => <ProductCard key={x.id} item={x} owned={ownedKeys.includes(String(x.id)) || ownedKeys.includes(x.slug)} />)}</div>
    {!visible.length && <p className="mt-10 text-white/50">Belum ada produk di kategori ini.</p>}
  </>;
}
