import Link from "next/link";

export type ClassRow = { id: string; slug: string; title: string; description?: string; price?: string | number; product_type?: string; type?: string; trailer_youtube_id?: string; member_cross_sell_price?: number; is_published?: boolean };

export function ProductCard({ item, locked = false, onSelect }: { item: ClassRow; locked?: boolean; onSelect?: (item: ClassRow) => void }) {
  const type = item.product_type || item.type || "course";
  return <article className="rounded-2xl border border-white/10 bg-[#0A140E] p-5 shadow-[0_0_30px_rgba(16,185,129,.06)]">
    <div className="flex items-start justify-between gap-3"><span className="rounded-full border border-[#10B981]/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#10B981]">{type}</span>{locked && <span aria-label="Terkunci" title="Belum dimiliki" className="text-lg">🔒</span>}</div>
    <h2 className="mt-4 text-xl font-bold text-white">{item.title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-white/55">{item.description || "Materi praktis XindeLabs untuk membangun sistem digital yang berjalan."}</p>
    <div className="mt-5 flex items-center justify-between gap-3"><strong className="text-[#10B981]">{item.price || "Lihat detail"}</strong>{locked && onSelect ? <button onClick={() => onSelect(item)} className="rounded-lg bg-[#10B981] px-3 py-2 text-sm font-bold text-[#050A07]">Lihat benefit</button> : <Link href={`/checkout/${item.slug}`} className="rounded-lg bg-[#10B981] px-3 py-2 text-sm font-bold text-[#050A07]">Detail / Beli</Link>}</div>
  </article>;
}

export function LearnHeader() { return <header className="border-b border-white/10 bg-[#050A07]/90 px-5 py-4 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/learn" className="text-xl font-bold text-white">xindelabs<span className="text-[#10B981]">.</span> learn</Link><nav className="flex items-center gap-4 text-sm"><Link href="/learn/kelas" className="text-white/60 hover:text-[#10B981]">Kelas</Link><Link href="/learn/vip" className="text-white/60 hover:text-[#10B981]">VIP Lounge</Link><Link href="/learn/login" className="rounded-lg border border-[#10B981]/40 px-3 py-2 text-[#10B981]">Login Member</Link></nav></div></header>; }
export function LearnShell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#050A07] text-white"><LearnHeader/><main className="mx-auto max-w-6xl px-5 py-12">{children}</main></div>; }
