"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/editor", label: "Editor Landing Page" },
  { href: "/admin/workshops", label: "Workshop Kit" },
  { href: "/admin/sales-pages", label: "Sales Pages" },
  { href: "/admin/vip", label: "VIP Manager" },
  { href: "/admin/content", label: "Content Manager" },
  { href: "/admin/lms/courses", label: "Course Management" },
  { href: "/admin/unified-leads", label: "Unified Leads" },
  { href: "/admin/workshop-members", label: "Workshop Members" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/pipeline", label: "Pipeline Events" },
  { href: "/admin/emails", label: "Email Logs" },
  { href: "/admin/followups", label: "Email Follow-up" },
  { href: "/admin/pixels", label: "Pixel Meta & TikTok" },
  { href: "/admin/lms", label: "LMS Management" },
  { href: "/admin/vouchers", label: "Voucher" },
];

export default function AdminSidebar() {
  const path = usePathname();
  const router = useRouter();
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  async function handleLogout(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <aside className="sidebar lg:sticky lg:top-0 lg:h-screen lg:flex-col">
      <div className="flex items-baseline gap-2 px-5 py-5">
        <a href="https://xindelabs.web.id" className="text-xl font-bold tracking-tight text-white">
          xindelabs<span className="text-[#00FF88]">.</span>
        </a>
        <span className="font-mono text-[12px] text-white/55">admin</span>
      </div>
      <nav className="hidden px-3 lg:block">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`nav-btn${isActive(n.href) ? " nav-btn-active" : ""}`}>
            {n.label}
          </Link>
        ))}
        <div className="mx-3 my-3 border-t border-white/10" />
        <a href="/" target="_blank" rel="noopener noreferrer" className="nav-btn">
          Lihat Situs ↗
        </a>
        <form action="/api/admin/logout" method="post" onSubmit={handleLogout}>
          <button type="submit" className="nav-btn w-full text-left">Logout</button>
        </form>
      </nav>
      <div className="px-3 py-2 lg:hidden">
        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white/65 [&::-webkit-details-marker]:hidden">
            admin menu
            <span className="text-[#00FF88]">☰</span>
          </summary>
          <nav className="absolute left-0 right-0 top-12 z-50 rounded-xl border border-white/10 bg-[#0B1F16] p-2 shadow-2xl">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`nav-btn${isActive(n.href) ? " nav-btn-active" : ""}`}>
                {n.label}
              </Link>
            ))}
            <a href="/" className="nav-btn">Lihat Situs ↗</a>
            <form action="/api/admin/logout" method="post" onSubmit={handleLogout}>
              <button type="submit" className="nav-btn w-full text-left">Logout</button>
            </form>
          </nav>
        </details>
      </div>
    </aside>
  );
}