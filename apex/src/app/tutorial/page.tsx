import { ContentBlocks } from "@/components/ContentBlocks";
import { getPageBlocks } from "@/lib/blocks";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tutorial Hermes Gratis — Bangun Agent AI",
  description:
    "Tutorial Hermes gratis. Bangun agent AI pertamamu langkah demi langkah, dari fundamental ngomong ke AI sampai workflow yang siap dipakai.",
};

export default async function TutorialPage() {
  const blocks = await getPageBlocks("tutorial");

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-white">
      <SiteHeader active="Tutorial" />
      <main className="grid-bg relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-30 blur-[140px]"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 md:pb-20 md:pt-16">
          <ContentBlocks blocks={blocks} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
