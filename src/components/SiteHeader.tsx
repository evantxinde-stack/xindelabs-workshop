import Link from "next/link";

// Single source of truth for nav, mirrors the Main Hub header.
export const SITE_LINKS = [
  { href: "https://learn.xindelabs.web.id", label: "learn" },
  { href: "/blog", label: "blog" },
  { href: "/portofolio", label: "portofolio" },
  { href: "/service", label: "service" },
];

const display = "font-[family-name:var(--font-display)]";

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className={`${display} text-xl font-bold tracking-tight text-white`}>
          xindelabs<span className="text-[#00ff88]">.</span>
        </Link>

        <nav className="hidden items-center gap-7 font-mono text-[11px] lowercase tracking-[0.16em] text-white/55 sm:flex">
          {SITE_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                active && active === l.label
                  ? "text-[#00ff88]"
                  : "transition hover:text-[#00ff88]"
              }
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/tutorial"
            className={`transition hover:text-[#00ff88] ${active === "tutorial" ? "text-[#00ff88]" : ""}`}
          >
            tutorial
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/service"
            className="rounded-full bg-[#00ff88] px-4 py-2 text-[13px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]"
          >
            Work with me
          </Link>
          <details className="relative sm:hidden">
            <summary
              aria-label="Menu"
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-white/15 text-white/70 [&::-webkit-details-marker]:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
              </svg>
            </summary>
            <nav className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-white/10 bg-[#0c0c0f] p-2 font-mono text-[12px] lowercase tracking-[0.12em] text-white/70 shadow-2xl">
              {[...SITE_LINKS, { href: "/tutorial", label: "tutorial" }].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-lg px-3 py-2.5 hover:bg-white/5 hover:text-[#00ff88]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 font-mono text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className={`${display} text-base font-bold text-white`}>
            xindelabs<span className="text-[#00ff88]">.</span>
          </div>
          <p className="mt-1">Personal branding · AI agent · digital business</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 lowercase tracking-[0.12em]">
          {SITE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-[#00ff88]">
              {l.label}
            </Link>
          ))}
        </div>
        <p>© {new Date().getFullYear()} XindeLabs</p>
      </div>
    </footer>
  );
}
