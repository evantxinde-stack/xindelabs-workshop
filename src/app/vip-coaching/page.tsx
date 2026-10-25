import { TrackVisit } from "@/components/TrackVisit";
import { ContentBlocks } from "@/components/ContentBlocks";
import { getPageBlocks } from "@/lib/blocks";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ lead?: string }> };

export default async function VipCoaching({ searchParams }: Props) {
  const { lead } = await searchParams;
  const blocks = await getPageBlocks("vip");

  return (
    <div className="grid-bg relative min-h-screen overflow-hidden px-4 pb-20 pt-12 font-sans text-white">
      <TrackVisit event="vip_visited" />
      {/* glow orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[360px] w-[360px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
      />

      <ContentBlocks blocks={blocks} lead={lead} />
    </div>
  );
}