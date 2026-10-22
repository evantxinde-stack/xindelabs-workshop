import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata: Metadata = { title: "Admin · XindeLabs" };

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid-bg min-h-screen font-sans text-white lg:grid lg:grid-cols-[240px_1fr]">
      <AdminSidebar />
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-5">{children}</div>
      </main>
    </div>
  );
}