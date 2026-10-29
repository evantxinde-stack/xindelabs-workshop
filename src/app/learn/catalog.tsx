import Link from "next/link";
import { classPrice, earlyBirdOpen } from "@/lib/mayar";
import FreeAccessButton from "./free-access-button";

export type ClassRow = { id: string; slug: string; title: string; description?: string; price?: string | number; early_bird_price?: number | null; sales_page_slug?: string | null; product_type?: string; type?: string; trailer_youtube_id?: string; member_cross_sell_price?: number; is_published?: boolean };

const LEARN_LINKS = [
  { href: "/learn/kelas", label: "kelas" },
  { href: "/learn/vip", label: "vip lounge" },
];

const neon = "text-[#00ff88]";
const display = "font-[family-name:var(--font-display)]";
const mono = "font-mono text-[11px] uppercase tracking-[0.18em]";

export function ProductCard({ item, locked = false, onSelect }: { item: ClassRow; locked?: boolean; onSelect?: (item: ClassRow) => void }) {
  const type = item.product_type || item.type || "course";
  const regular = Number(item.price);
  const now = classPrice(item as any, "lifetime");
  const hasSale = earlyBirdOpen(item as any) && Number.isFinite(regular) && now < regular;
  const compact = (value: number) => `Rp${Math.round(value / 1000)}K`;
  const formatPrice = (value: number) => `Rp${value.toLocaleString("id-ID")}`;
  const priceNode = !Number.isFinite(regular) || regular <= 0
    ? "Lihat detail"
    : hasSale
      ? compact(now)
      : compact(regular);
  return <article className="rounded-2xl border border-white/10 bg-[#0B1F16] p-5">
    <div className="flex items-start justify-between gap-3"><span className="rounded-full border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/55">{type}</span>{locked && <span aria-label="Terkunci" title="Belum dimiliki" className="text-lg">🔒</span>}</div>
    <h2 className="mt-4 text-xl font-bold text-white">{item.title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-white/55">{item.description || "Materi praktis XindeLabs untuk membangun sistem digital yang berjalan."}</p>
    <div className="mt-5 flex items-center justify-between gap-3"><strong className="flex items-baseline gap-2"><span className={neon}>{priceNode}</span>{hasSale && <span className="text-xs font-normal text-white/40 line-through">{formatPrice(regular)}</span>}</strong>{locked && onSelect ? <button onClick={() => onSelect(item)} className="rounded-full bg-[#00ff88] px-4 py-2 text-[13px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]">Lihat benefit</button> : Number(item.price) === 0 && type === "workshop" ? <FreeAccessButton slug={item.slug}/> : <span className="flex items-center gap-2"><Link href={`https://xindelabs.web.id/p/${item.sales_page_slug || item.slug}`} className="rounded-full bg-[#00ff88] px-4 py-2 text-[13px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]">Lihat detail</Link><Link href={`https://xindelabs.web.id/checkout/${item.slug}`} className="font-mono text-[11px] uppercase tracking-wider text-white/50 transition hover:text-[#00ff88]">beli</Link></span>}</div>
  </article>;
}

export function BackToClasses() {
  return <Link href="/learn/dashboard" className={`${mono} inline-block rounded-full border border-white/15 px-3 py-1.5 text-white/60 transition hover:border-[#00ff88]/50 hover:text-[#00ff88]`}>← home kelas</Link>;
}

export function memberPrice(item: ClassRow): number {
  const member = Number(item.member_cross_sell_price);
  if (Number.isFinite(member) && member > 0) return member;
  return Number(item.price) || 0;
}

export function LearnHeader() {
  return <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b]/85 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
      <div className="flex items-baseline gap-2">
        <a href="https://xindelabs.web.id" className={`${display} text-xl font-bold tracking-tight text-white`}>
          xindelabs<span className={neon}>.</span>
        </a>
        <Link href="/learn" className="font-mono text-[12px] text-white/55 transition hover:text-[#00ff88]">
          learn
        </Link>
      </div>
      <nav className="hidden items-center gap-7 font-mono text-[11px] lowercase tracking-[0.16em] text-white/55 sm:flex">
        {LEARN_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="transition hover:text-[#00ff88]">{l.label}</Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/learn/login" className="rounded-full bg-[#00ff88] px-4 py-2 text-[13px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]">
          login member
        </Link>
        <details className="relative sm:hidden">
          <summary aria-label="Menu" className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-white/15 text-white/70 [&::-webkit-details-marker]:hidden">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
            </svg>
          </summary>
          <nav className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-white/10 bg-[#0c0c0f] p-2 font-mono text-[12px] lowercase tracking-[0.12em] text-white/70 shadow-2xl">
            {[...LEARN_LINKS, { href: "/learn/login", label: "login member" }].map((l) => (
              <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 hover:bg-white/5 hover:text-[#00ff88]">
                {l.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </div>
  </header>;
}

export function LearnShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#04110D] text-white"><LearnHeader/><main className="mx-auto max-w-6xl px-5 py-12">{children}</main></div>;
}
