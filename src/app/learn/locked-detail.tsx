import Link from "next/link";

/** Satu tampilan detail untuk kelas/workshop yang belum dimiliki member. */
export type LockedClass = { id: string; slug: string; title: string; description?: string | null; cover_image?: string | null; product_type?: string | null; price?: number | string | null; member_cross_sell_price?: number | null; trailer_youtube_id?: string | null };
type Lesson = { id: string; title: string; sort_order?: number };

const display = "font-[family-name:var(--font-display)]";
const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

export default function LockedDetail({ cls, lessons = [], kind = "course", backHref = "/learn/dashboard" }: { cls: LockedClass; lessons?: Lesson[]; kind?: "course" | "workshop"; backHref?: string }) {
  const cover = typeof cls.cover_image === "string" && cls.cover_image.trim() ? cls.cover_image.trim() : null;
  const memberPrice = Number(cls.member_cross_sell_price);
  const basePrice = Number(cls.price);
  const price = Number.isFinite(memberPrice) && memberPrice > 0 ? memberPrice : Number.isFinite(basePrice) && basePrice > 0 ? basePrice : null;
  const free = Number(cls.price) === 0;
  const label = kind === "workshop" ? "workshop" : String(cls.product_type || "course");
  const wa = `https://wa.me/62895335137700?text=${encodeURIComponent(`Halo XindeLabs, gw mau tanya soal ${cls.title}.`)}`;

  return <div className="mx-auto max-w-5xl">
    <Link href={backHref} className="inline-flex min-h-11 items-center py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:text-[#00ff88]">← kembali ke kelas</Link>

    <h1 className="mt-6 text-[clamp(1.9rem,4vw,2.8rem)] font-bold leading-tight lg:hidden">{cls.title}</h1>
    {cover ? <div className="relative mt-5 aspect-[2.2/1] max-h-60 overflow-hidden rounded-3xl border border-white/10 bg-[#06140D] sm:aspect-[2.4/1]">
      <img src={cover} alt="" className="h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04110D] via-[#04110D]/40 to-transparent" />
      <span aria-label="Terkunci" className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80 backdrop-blur">🔒 {label} · terkunci</span>
    </div> : <div className="mt-5 inline-flex rounded-full border border-white/10 bg-[#06140D] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">🔒 {label} · terkunci</div>}

    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <h1 className={`${display} hidden text-[clamp(1.9rem,4vw,2.8rem)] font-bold leading-tight lg:block`}>{cls.title}</h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#00ff88]">kurikulum · akses dibuka setelah pembelian</p>
        <p className="mt-4 text-[15px] leading-relaxed text-white/60">{cls.description || "Materi praktis XindeLabs untuk membangun sistem digital yang berjalan."}</p>

        {cls.trailer_youtube_id ? <div className="mt-6 aspect-video overflow-hidden rounded-2xl border border-white/10"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${encodeURIComponent(cls.trailer_youtube_id)}`} title="Video pengantar" allowFullScreen /></div> : null}

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0B1F16] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold">Materi {kind === "workshop" ? "workshop" : "kelas"}</h2>
            <span className="font-mono text-[11px] text-white/60">{lessons.length} modul</span>
          </div>
          {lessons.length ? <ol className="mt-4 space-y-2">{lessons.map((l, i) => <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[.02] px-4 py-3"><span className="flex items-center gap-3 text-sm text-white/70"><span className="font-mono text-[11px] text-white/35">{String(i + 1).padStart(2, "0")}</span>{l.title}</span><span aria-hidden className="text-xs text-white/30">🔒</span></li>)}</ol> : <p className="mt-3 text-sm text-white/45">Materi sedang disiapkan.</p>}
          <p className="mt-4 text-xs text-white/55">Daftar modul terlihat sebagai pratinjau. Isi materi, video, dan file latihan terbuka setelah kelas dimiliki.</p>
        </div>
      </div>

      <aside className="order-first h-fit rounded-2xl border border-[#00ff88]/30 bg-[#0B1F16] p-5 lg:order-none lg:sticky lg:top-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#00ff88]">akses {label}</p>
        <p className="mt-4 text-3xl font-bold text-white">{free ? "Gratis" : price ? rupiah(price) : "Hubungi kami"}</p>
        {Number.isFinite(memberPrice) && memberPrice > 0 && Number.isFinite(basePrice) && memberPrice < basePrice ? <p className="mt-1 text-xs text-white/55">harga khusus member · normal <s>{rupiah(basePrice)}</s></p> : null}
        {free
          ? <Link href={`/learn/${cls.product_type === "workshop" ? "workshop" : "course"}/${cls.slug}`} className="mt-5 block rounded-full bg-[#00ff88] px-5 py-3 text-center font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]">Buka akses gratis</Link>
          : <a href={`/checkout/${cls.slug}`} className="mt-5 block rounded-full bg-[#00ff88] px-5 py-3 text-center font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]">Beli akses{price ? ` · ${rupiah(price)}` : ""}</a>}
        <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-full border border-white/30 px-5 py-3 text-center text-sm font-semibold text-white/85 transition hover:border-[#00ff88] hover:text-[#00ff88]">Tanya dulu via WhatsApp</a>
        <ul className="mt-5 space-y-2 text-sm text-white/60">
          <li>✓ Progres belajar tersimpan</li>
          <li>✓ Materi tersusun per modul</li>
          <li>✓ Akses melalui akun member kamu</li>
          {kind === "workshop" ? <li>✓ Sesi live + replay</li> : null}
        </ul>
        <p className="mt-4 text-xs text-white/55">Akses masuk otomatis ke akun member setelah pembayaran terkonfirmasi.</p>
      </aside>
    </div>
  </div>;
}
