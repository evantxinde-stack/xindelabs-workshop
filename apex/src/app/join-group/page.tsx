import { TrackVisit } from "@/components/TrackVisit";
import { ContentBlocks } from "@/components/ContentBlocks";
import { getPageBlocks } from "@/lib/blocks";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ lead?: string }> };

export default async function JoinGroup({ searchParams }: Props) {
  const { lead } = await searchParams;
  const blocks = await getPageBlocks("join_group");

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 font-sans text-white">
      <TrackVisit event="join_group_visited" />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[130px]"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
      />

      <ContentBlocks blocks={blocks} lead={lead} />
    </div>
  );
}