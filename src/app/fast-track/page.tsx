import { TrackVisit } from "@/components/TrackVisit";
import { ContentBlocks } from "@/components/ContentBlocks";
import { getPageBlocks } from "@/lib/blocks";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ lead?: string }> };

export default async function FastTrack({ searchParams }: Props) {
  const { lead } = await searchParams;
  const blocks = await getPageBlocks("fast_track");

  return (
    <div className="grid-bg relative min-h-screen overflow-hidden px-4 pb-20 pt-12 font-sans text-white">
      <TrackVisit event="fast_track_visited" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-10 h-[340px] w-[340px] rounded-full opacity-20 blur-[110px]"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
      />

      <ContentBlocks blocks={blocks} lead={lead} />
    </div>
  );
}