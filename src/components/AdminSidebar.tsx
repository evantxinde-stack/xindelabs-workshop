"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_GROUPS = [
  {
    title: "Halaman & Konten",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/site-settings", label: "Pengaturan Situs" },
      { href: "/admin/sales-pages", label: "Sales Pages" },
      { href: "/admin/content", label: "Blog & Portofolio" },
      { href: "/admin/editor", label: "Halaman Funnel" },
    ],
  },
  {
    title: "Produk & LMS",
    items: [
      { href: "/admin/products", label: "Product Management" },
      { href: "/admin/lms/courses", label: "Course Management" },
      { href: "/admin/workshops", label: "Workshop Kit" },
      { href: "/admin/vip", label: "VIP Manager" },
      { href: "/admin/vouchers", label: "Voucher" },
    ],
  },
  {
    title: "Leads & Member",
    items: [
      { href: "/admin/unified-leads", label: "Unified Leads" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/members", label: "Member Insights" },
      { href: "/admin/membership", label: "Membership & Renewal" },
    ],
  },
  {
    title: "Automasi & Tracking",
    items: [
      { href: "/admin/followups", label: "Email Follow-up" },
      { href: "/admin/emails", label: "Email Logs" },
      { href: "/admin/pixels", label: "Pixel Meta & TikTok" },
    ],
  },
];

export default function AdminSidebar() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  const currentLabel =
    NAV_GROUPS.flatMap((g) => g.items).find((i) => isActive(i.href))?.label ?? "Admin";

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleLogout(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/logout", { method: "POST" });
    setOpen(false);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop Sidebar (lg and up) */}
      <aside className="sidebar hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
        <div className="flex items-baseline gap-2 px-5 py-5">
          <a href="https://xindelabs.web.id" className="text-xl font-bold tracking-tight text-white">
            xindelabs<span className="text-[#00FF88]">.</span>
          </a>
          <span className="font-mono text-[12px] text-white/55">admin</span>
        </div>
        <nav className="px-3 pb-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-3">
              <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                {group.title}
              </p>
              {group.items.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`nav-btn${isActive(n.href) ? " nav-btn-active" : ""}`}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="mx-3 my-3 border-t border-white/10" />
          <a href="/" target="_blank" rel="noopener noreferrer" className="nav-btn">
            Lihat Situs ↗
          </a>
          <form action="/api/admin/logout" method="post" onSubmit={handleLogout}>
            <button type="submit" className="nav-btn w-full text-left">Logout</button>
          </form>
        </nav>
      </aside>

      {/* Mobile Top Bar + Top-Right Hamburger Pop-up (< lg) */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050A07]/90 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href="/admin" className="flex shrink-0 items-baseline gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">
                xindelabs<span className="text-[#00FF88]">.</span>
              </span>
              <span className="font-mono text-[11px] text-white/50">admin</span>
            </Link>
            <span className="truncate rounded-full border border-[#00FF88]/25 bg-[#00FF88]/10 px-2 py-0.5 font-mono text-[10px] text-[#00FF88]">
              {currentLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Buka menu admin"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#00FF88]/35 bg-[#0A140E] text-sm text-[#00FF88] transition hover:border-[#00FF88] hover:bg-[#0f2419]"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/65 backdrop-blur-xs"
          />

          <div
            role="dialog"
            aria-label="Menu Admin"
            className="fixed right-3 top-14 z-50 flex max-h-[calc(100vh-4.5rem)] w-[min(320px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[#163020] bg-[#0A140E]/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00FF88]">
                // admin menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="rounded-md px-2 py-1 font-mono text-xs text-white/55 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2.5">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="mb-2.5 last:mb-0">
                  <p className="px-3 pb-1 pt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((n) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className={`nav-btn${isActive(n.href) ? " nav-btn-active" : ""}`}
                      >
                        {n.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/25 px-3 py-2.5">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-1.5 text-xs text-white/65 transition hover:bg-white/5 hover:text-[#00FF88]"
              >
                Lihat Situs ↗
              </a>
              <form action="/api/admin/logout" method="post" onSubmit={handleLogout}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 text-xs text-red-300/80 transition hover:bg-red-500/10 hover:text-red-200"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
