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
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#00FF88] shadow-[0_0_12px_var(--glow)]" />
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide">XindeLabs Unified Funnel</p>
          <p className="text-[11px] text-white/40">Control Panel</p>
        </div>
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
      <div className="lg:hidden overflow-x-auto px-3 py-2">
        <div className="flex gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`nav-btn whitespace-nowrap${isActive(n.href) ? " nav-btn-active" : ""}`}>
              {n.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}