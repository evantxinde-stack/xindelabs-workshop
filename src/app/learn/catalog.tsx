import Link from "next/link";
import { classPrice, earlyBirdOpen } from "@/lib/mayar";
import FreeAccessButton from "./free-access-button";

export type ClassRow = { id: string; slug: string; title: string; description?: string; price?: string | number; early_bird_price?: number | null; sales_page_slug?: string | null; cover_image?: string | null; product_type?: string; type?: string; trailer_youtube_id?: string; member_cross_sell_price?: number; is_published?: boolean };

const LEARN_LINKS = [
  { href: "/learn/kelas", label: "kelas" },
  { href: "/learn/vip", label: "vip lounge" },
];

const neon = "text-[#00ff88]";
const display = "font-[family-name:var(--font-display)]";
const mono = "font-mono text-[11px] uppercase tracking-[0.18em]";

export function ProductCard({ item, locked = false, owned = false, onSelect }: { item: ClassRow; locked?: boolean; owned?: boolean; onSelect?: (item: ClassRow) => void }) {
  const type = item.product_type || item.type || "course";
  const regular = Number(item.price);
  const now = classPrice(item as any, "lifetime");
  const hasSale = earlyBirdOpen(item as any) && Number.isFinite(regular) && now < regular;
  const free = Number(item.price) === 0;
  const compact = (value: number) => `Rp${Math.round(value / 1000)}K`;
  const formatPrice = (value: number) => `Rp${value.toLocaleString("id-ID")}`;
  const cover = typeof item.cover_image === "string" && item.cover_image.trim() ? item.cover_image.trim() : null;
  const priceNode = free ? "Gratis" : hasSale ? compact(now) : Number.isFinite(regular) && regular > 0 ? compact(regular) : "Lihat detail";
  const badge = owned ? "Dimiliki" : free ? "Gratis" : locked ? "Terkunci" : hasSale ? "Early bird" : type;
  const ownedHref = type === "workshop" ? `/learn/workshop/${item.slug}` : `/learn/course/${item.slug}`;
  const action = owned
    ? <span className="flex items-center gap-3"><Link href={ownedHref} className="rounded-full bg-[#00ff88] px-4 py-2 text-[13px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]">{type === "workshop" ? "Masuk workshop" : "Akses kelas"}</Link></span>
    : locked && onSelect
    ? <button onClick={() => onSelect(item)} className="rounded-full bg-[#00ff88] px-4 py-2 text-[13px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]">Lihat benefit</button>
    : free && type === "workshop"
      ? <FreeAccessButton slug={item.slug} />
      : <span className="flex items-center gap-3"><Link href={`/learn/course/${item.slug}`} className="rounded-full bg-[#00ff88] px-4 py-2 text-[13px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]">{free ? "Buka akses" : "Lihat detail"}</Link>{!free && <Link href={`https://xindelabs.web.id/checkout/${item.slug}`} className="font-mono text-[11px] uppercase tracking-wider text-white/50 transition hover:text-[#00ff88]">beli</Link>}</span>;
  return <article className="group flex flex-col overflow-hidden rounded-3xl border border-[#00ff88]/15 bg-[#0B1F16] transition hover:border-[#00ff88]/45 hover:shadow-[0_0_40px_-12px_rgba(0,255,136,0.35)]">
    <div className="relative aspect-video overflow-hidden bg-[#06140D]">
      {cover
        ? <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"/>
        : <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,136,0.18),transparent_60%)]"><span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/25">{type}</span></div>}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1F16] via-[#0B1F16]/25 to-transparent"/>
      <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] backdrop-blur ${free ? "border-[#00ff88]/60 bg-[#00ff88]/15 text-[#00ff88]" : "border-white/20 bg-black/40 text-white/70"}`}>{badge}</span>
    </div>
    <div className="flex flex-1 flex-col p-5">
      <h2 className="text-xl font-bold leading-snug text-white">{item.title}</h2>
      <p className="mt-3 text-sm leading-6 text-white/55">{item.description || "Materi praktis XindeLabs untuk membangun sistem digital yang berjalan."}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
        <strong className="flex items-baseline gap-2"><span className={free ? "text-[#00ff88]" : neon}>{priceNode}</span>{hasSale && <span className="text-xs font-normal text-white/40 line-through">{formatPrice(regular)}</span>}</strong>
        {action}
      </div>
    </div>
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
