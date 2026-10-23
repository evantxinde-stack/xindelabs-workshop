import Link from "next/link";

export const SITE_LINKS = [
  { href: "https://kelas.xindelabs.web.id", label: "Kelas" },
  { href: "https://workshop.xindelabs.web.id", label: "Workshop" },
  { href: "https://member.xindelabs.web.id", label: "Member" },
  { href: "/blog", label: "Blog" },
  { href: "/portofolio", label: "Portofolio" },
  { href: "/tutorial", label: "Tutorial" },
];

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(4,17,13,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="font-mono text-base font-bold tracking-tight text-white">
          <span className="text-gradient">XINDE</span> LABS
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[13px] text-white/60">
          {SITE_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                active && active === l.label
                  ? "font-semibold text-[var(--accent)]"
                  : "transition hover:text-[var(--accent)]"
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/tutorial" className="btn-glow rounded-lg px-3.5 py-2 font-mono text-[13px] font-bold">
          Ambil Tutorial
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-[rgba(7,22,15,0.7)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 font-mono text-[13px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-bold text-white">
            <span className="text-gradient">XINDE</span> LABS
          </div>
          <p className="mt-1">Personal branding · AI agent · digital business</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {SITE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-[var(--accent)]">
              {l.label}
            </Link>
          ))}
        </div>
        <p>© {new Date().getFullYear()} XindeLabs</p>
      </div>
    </footer>
  );
}
