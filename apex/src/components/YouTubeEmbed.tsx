export function YouTubeEmbed({ url }: { url?: string }) {
  const id = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1];
  if (!id) return null;
  return (
    <div className="anim-fade-up mt-8 overflow-hidden rounded-2xl border border-[var(--border)] shadow-2xl">
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title="Video Penawaran"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}