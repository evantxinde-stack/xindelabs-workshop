/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { admin } from "@/lib/supabase/server";
import { formatIDR, stripTags } from "@/lib/content";
import { LeadForm } from "@/components/LeadForm";
import { SERVICE_LINES } from "@/lib/services";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "XindeLabs — AI Automation & Digital Selling",
  description:
    "XindeLabs membangun sistem AI yang menjalankan operasional bisnis: agent otonom, funnel yang menutup penjualan sendiri, dan konten yang terbit tanpa kamu pegang satu-satu.",
};

const LEARN_URL = "https://learn.xindelabs.web.id";
const SERVICE_URL = "/service";
const MEMBER_URL = "https://learn.xindelabs.web.id/member";
const KELAS_URL = "https://learn.xindelabs.web.id/kelas";
const WORKSHOP_URL = "https://learn.xindelabs.web.id/workshop";

type ClassRow = {
  slug: string;
  title: string;
  description: string | null;
  price: number | null;
  product_type: string | null;
};

type WorkRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  link_url: string | null;
};

const TRACK_RECORD = [
  "Tim bot hermes yang jalan harian di VPS",
  "Engine Instagram: 3 brand, konten terbit otomatis",
  "Funnel Mayar: bayar → akses LMS dalam hitungan detik",
  "Sistem Meta Ads multi-niche dengan evaluasi berkala",
  "Membership klinik: poin, tier, dan kartu digital",
];

const STATS = [
  { v: "24/7", k: "agent aktif di VPS, tanpa disuruh" },
  { v: "< 1 menit", k: "dari payment masuk ke akses LMS terbuka" },
  { v: "3 brand", k: "konten Instagram terbit otomatis tiap hari" },
  { v: "5 niche", k: "campaign Meta Ads dengan evaluasi berkala" },
];

const display = "font-[family-name:var(--font-display)]";
const hand = "font-[family-name:var(--font-hand)]";

// Satu sumber nav buat desktop + burger mobile
const NAV = [
  { href: LEARN_URL, label: "learn" },
  { href: "/blog", label: "blog" },
  { href: "/portofolio", label: "portofolio" },
  { href: SERVICE_URL, label: "service" },
  { href: "/tutorial", label: "tutorial" },
];

function NavBurger() {
  return (
    <details className="relative sm:hidden">
      <summary
        aria-label="Menu"
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-white/15 text-white/70 [&::-webkit-details-marker]:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
        </svg>
      </summary>
      <nav className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-white/10 bg-[#0c0c0f] p-2 font-mono text-[12px] lowercase tracking-[0.12em] text-white/70 shadow-2xl">
        {NAV.map((l) => (
          <a key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 hover:bg-white/5 hover:text-[#00ff88]">
            {l.label}
          </a>
        ))}
      </nav>
    </details>
  );
}


export default async function Home() {
  const [workRes, classesRes, waRes] = await Promise.all([
    admin
      .from("portfolio")
      .select("id,title,slug,description,category,link_url")
      .order("sort_order", { ascending: true })
      .limit(6),
    admin
      .from("classes")
      .select("slug,title,description,price,product_type")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(3),
    admin.from("settings").select("value").eq("key", "wa_admin_number").maybeSingle(),
  ]);

  const works: WorkRow[] = workRes.data || [];
  const classes: ClassRow[] = classesRes.data || [];
  const waNumber = String(waRes.data?.value || "").replace(/\D/g, "");
  const waHref = waNumber
    ? `https://wa.me/${waNumber.startsWith("0") ? "62" + waNumber.slice(1) : waNumber}`
    : null;

  return (
    <div className="min-h-screen bg-[#09090b] font-sans text-[#f4f2ee] antialiased">
      {/* ============ NAV — wordmark lowercase + dot ============ */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className={`${display} text-xl font-bold tracking-tight`}>
            xindelabs<span className="text-[#00ff88]">.</span>
          </Link>
          <nav className="hidden items-center gap-7 font-mono text-[11px] lowercase tracking-[0.16em] text-white/55 sm:flex">
            <a href={LEARN_URL} className="hover:text-[#00ff88]">learn</a>
            <a href="/blog" className="hover:text-[#00ff88]">blog</a>
            <a href="/portofolio" className="hover:text-[#00ff88]">portofolio</a>
            <a href={SERVICE_URL} className="hover:text-[#00ff88]">service</a>
            <a href="/tutorial" className="hover:text-[#00ff88]">tutorial</a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href={SERVICE_URL}
              className="rounded-full bg-[#00ff88] px-4 py-2 text-[13px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]"
            >
              Work with me
            </a>
            <NavBurger />
          </div>
        </div>
      </header>

      <main className="relative">
        {/* ============ HERO ============ */}
        <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-24 pt-16 md:grid-cols-[1.15fr_.85fr] md:gap-14 md:pb-32 md:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[640px] -translate-x-1/2 rounded-full opacity-[0.13] blur-[150px]"
            style={{ background: "radial-gradient(circle, #00ff88 0%, transparent 70%)" }}
          />
          <div className="relative">
            <p className="font-mono text-[12px] lowercase tracking-[0.2em] text-[#00ff88]">
              // ai automation · digital selling
            </p>
            <h1
              className={`${display} mt-6 text-[clamp(2.5rem,6.5vw,4.3rem)] font-bold leading-[1.03] tracking-tight`}
            >
              Yang bikin capek bukan jualannya — tapi{" "}
              <span className="text-[#00ff88]">semua yang lo kerjain ulang tiap hari.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/60 md:text-lg">
              XindeLabs bikin agent AI yang ambil alih kerjaan berulang: follow-up leads, funnel
              yang nutup penjualan, konten yang terbit tiap hari.{" "}
              <span className={`${hand} text-[1.35rem] leading-[1.15] text-[#00ff88]`}>Biar lo balik ngurus growth.</span>
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={SERVICE_URL}
                className="rounded-full bg-[#00ff88] px-7 py-3 text-[15px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]"
              >
                Work with me →
              </a>
              <a
                href={LEARN_URL}
                className="rounded-full border border-white/25 px-7 py-3 text-[15px] font-semibold transition hover:border-[#00ff88] hover:text-[#00ff88]"
              >
                Liat kelasnya
              </a>
            </div>
            <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
              scroll ↓
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <img
                src="/founder.jpg"
                alt="Evant Danamaya — founder XindeLabs"
                className="aspect-[4/5] w-full object-cover"
                width={1080}
                height={1350}
              />
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
              evant danamaya · founder
            </p>
          </div>
        </section>

        {/* ============ STATS — angka live ============ */}
        <section className="border-y border-white/10 bg-[#0c0c0f]">
          <div className="mx-auto grid max-w-6xl gap-px px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.k} className="px-4 py-3">
                <p className={`${display} text-3xl font-bold text-[#00ff88] md:text-4xl`}>{s.v}</p>
                <p className="mt-2 font-mono text-[11.5px] leading-relaxed text-white/65">{s.k}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 01 — TENTANG ============ */}
        <section id="tentang" className="mx-auto max-w-6xl px-5 py-24">
          <p className="font-mono text-[12px] lowercase tracking-[0.2em] text-[#00ff88]">tentang</p>
          <h2
            className={`${display} mt-5 max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.06] tracking-tight`}
          >
            Dari kerja manual, jadi{" "}
            <span className={`${hand} font-bold text-[#00ff88]`}>sistem yang jalan sendiri.</span>
          </h2>

          <div className="mt-10 grid gap-10 md:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-4 text-[15px] leading-relaxed text-white/65">
              <p>
                Latar belakang saya penjualan, bukan kampus IT. Semua yang saya bangun di sini
                berawal dari satu masalah yang sama: kerjaan repetitif — follow-up, rekap, posting,
                hitung — menghabiskan waktu yang seharusnya dipakai untuk tumbuh.
              </p>
              <p>
                Sekarang XindeLabs membangun lapisan itu dengan AI: agent otonom yang mengambil
                pekerjaan operasional, funnel yang mengurus pembayaran sampai akses produk, dan
                sistem konten yang menjaga brand tetap hidup.
              </p>
              <p className={`${hand} text-2xl leading-snug text-[#00ff88]`}>
                Semua angka di atas jalan di bisnis saya sendiri, tiap hari.
              </p>
            </div>
            <div className="self-start rounded-xl border border-white/10 bg-[#0c0c0f] p-6">
              <p className="font-mono text-[11px] text-white/45">$ whoami</p>
              <ul className="mt-4 space-y-3 text-[13.5px] leading-snug text-white/70">
                {TRACK_RECORD.map((r) => (
                  <li key={r} className="flex gap-2.5">
                    <span className="font-mono text-[#00ff88]">›</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {SERVICE_LINES.map((s) => (
              <Link key={s.slug} href={`/service#${s.slug}`} className="group bg-[#0c0c0f] p-6 transition hover:bg-[#0f1b14]">
                <span className="font-mono text-[11px] text-[#00ff88]">{s.number}</span>
                <h3 className={`${display} mt-3 text-[16px] font-bold group-hover:text-[#00ff88]`}>{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/50">{s.short}</p>
                <span className="mt-4 block font-mono text-[10px] uppercase tracking-[0.14em] text-white/35 group-hover:text-[#00ff88]">lihat detail →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ============ 02 — KARYA (WHITE) ============ */}
        <section id="karya" className="border-y border-white/10 bg-white text-[#0a0a0c]">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <p className="font-mono text-[12px] lowercase tracking-[0.2em] text-[#0a8a55]">karya</p>
            <h2
              className={`${display} mt-5 max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.06] tracking-tight`}
            >
              Yang lo liat di sini <span className={`${hand} font-bold text-[#0a8a55]`}>sistem yang kepake, bukan mockup.</span>
            </h2>

            {works.length ? (
              <>
                <p className="mt-10 font-mono text-[12px] text-[#0a8a55]">$ ls karya/ --published</p>
                <div className="mt-3 divide-y divide-[#e4e4e4] border-y border-[#e4e4e4]">
                  {works.map((w, i) => (
                    <details
                      key={w.id}
                      className="group py-5 [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex cursor-pointer items-baseline gap-4">
                        <span className="font-mono text-[11px] text-[#0a8a55]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1">
                          <span className={`${display} block text-[17px] font-bold`}>{w.title}</span>
                          {w.category ? (
                            <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6b7a70]">
                              {w.category}
                            </span>
                          ) : null}
                        </span>
                        <span className="font-mono text-lg text-[#0a8a55] group-open:hidden">→</span>
                        <span className="hidden font-mono text-lg text-[#0a8a55] group-open:inline">↑</span>
                      </summary>
                      <div className="mt-4 pl-8">
                        <p className="max-w-2xl whitespace-pre-line text-[14px] leading-relaxed text-[#3a3a3a]">
                          {stripTags(w.description) || "Detail menyusul."}
                        </p>
                        {w.link_url ? (
                          <a
                            href={w.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block font-mono text-[12px] text-[#0a8a55] underline decoration-[#0a8a55]/40 underline-offset-4"
                          >
                            lihat hasilnya ↗
                          </a>
                        ) : null}
                      </div>
                    </details>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-8 text-[15px] text-[#3a3a3a]">
                Studi kasus sedang dirapikan.{" "}
                <Link href="/portofolio" className="text-[#0a8a55] underline underline-offset-4">
                  Lihat portofolio
                </Link>
                .
              </p>
            )}

            <Link
              href="/portofolio"
              className="mt-8 inline-block font-mono text-[12px] lowercase tracking-[0.14em] text-[#0a8a55]"
            >
              semua karya →
            </Link>
          </div>
        </section>

        {/* ============ 03 — BELAJAR ============ */}
        <section id="belajar" className="mx-auto max-w-6xl px-5 py-24">
          <p className="font-mono text-[12px] lowercase tracking-[0.2em] text-[#00ff88]">belajar</p>
          <h2
            className={`${display} mt-5 max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.06] tracking-tight`}
          >
            Cara bangunnya, <span className="text-[#00ff88]">diajarkan kebuka.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/60">
            Semua yang dipakai di project nyata ditulis dan diajarkan di classroom XindeLabs: kelas
            online, tantangan praktik, dan mentoring.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {classes.length ? (
              classes.map((c) => (
                <a
                  key={c.slug}
                  href={LEARN_URL}
                  className="rounded-xl border border-white/10 bg-[#0c0c0f] p-5 transition hover:border-[#00ff88]/50"
                >
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/45">
                    {c.product_type || "kelas"}
                  </span>
                  <h3 className={`${display} mt-3 text-[15.5px] font-bold leading-snug`}>{c.title}</h3>
                  <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-white/50">
                    {stripTags(c.description)}
                  </p>
                  <p className="mt-4 font-mono text-[12px] text-[#00ff88]">{formatIDR(c.price)}</p>
                </a>
              ))
            ) : (
              <div className="sm:col-span-3 rounded-xl border border-dashed border-[#00ff88]/30 p-6 text-[14px] text-white/60">
                Kelas pertama sedang disiapkan.{" "}
                <a href={LEARN_URL} className="text-[#00ff88] underline underline-offset-4">
                  Lihat classroom
                </a>
                .
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={LEARN_URL}
              className="rounded-full bg-[#00ff88] px-7 py-3 text-[15px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]"
            >
              Masuk classroom →
            </a>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">
              {classes.length > 0
                ? `${classes.length} kelas aktif · akses langsung setelah bayar`
                : "akses langsung setelah bayar"}
            </span>
          </div>
        </section>

        {/* ============ 04 — KONTAK ============ */}
        <section
          id="kontak"
          className="relative border-t border-white/10"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, rgba(0,255,136,0.14), transparent 45%), linear-gradient(160deg, #07130d 0%, #09090b 60%)",
          }}
        >
          <div className="mx-auto max-w-6xl px-5 py-24">
            <p className="font-mono text-[12px] lowercase tracking-[0.2em] text-[#00ff88]">kontak</p>
            <h2
              className={`${display} mt-5 max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.06] tracking-tight`}
            >
              Berhenti jadi bottleneck operasional.{" "}
              <span className={`${hand} font-bold text-[#00ff88]`}>Bikin sistemnya yang jaga.</span>
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/60">
              Terbuka untuk project automation, infrastruktur agent, sampai build end-to-end — dari
              satu workflow sampai sistem operasional penuh.
            </p>

            <div className="mt-10 grid gap-10 md:grid-cols-[1.05fr_.95fr] md:items-start">
              <div className="grid gap-6 sm:grid-cols-2">
                {waHref ? (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="group">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/45">
                      whatsapp
                    </span>
                    <span
                      className={`${display} mt-1 block text-[17px] font-bold group-hover:text-[#00ff88]`}
                    >
                      Chat langsung ↗
                    </span>
                  </a>
                ) : null}
                <a
                  href="https://instagram.com/xindelabs.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/45">
                    instagram
                  </span>
                  <span
                    className={`${display} mt-1 block text-[17px] font-bold group-hover:text-[#00ff88]`}
                  >
                    @xindelabs.id ↗
                  </span>
                </a>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0B1F16]/70 p-6">
                <p className="font-mono text-[11px] lowercase tracking-[0.18em] text-[#00ff88]">
                  // mulai dari sini
                </p>
                <h3 className={`${display} mt-3 text-xl font-bold`}>Ceritain bisnisnya</h3>
                <p className="mt-2 text-sm text-white/55">
                  Isi 4 field, gw balas langsung via WhatsApp.
                </p>
                <div className="mt-5">
                  <LeadForm
                    buttonTxt="Kirim & lanjut WhatsApp"
                    buttonTxtLoading="Mengirim…"
                    note="Data lo aman, cuma dipakai buat follow-up."
                    redirect="/service"
                    source="main-hub-contact"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-white/10 bg-[#09090b] pb-12">
        <div className="mx-auto max-w-6xl px-5">
          <div className="pt-8">
            <p className={`${display} text-lg font-bold tracking-tight`}>
              <span className={`${hand} font-bold text-[#00ff88]`}>Dibangun,</span> bukan dipresentasikan.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
              <span>© {new Date().getFullYear()} xindelabs</span>
              <nav className="flex gap-5">
                <a href={LEARN_URL} className="lowercase hover:text-[#00ff88]">learn</a>
                <Link href="/blog" className="lowercase hover:text-[#00ff88]">blog</Link>
                <a href={SERVICE_URL} className="lowercase hover:text-[#00ff88]">service</a>
                <a href={KELAS_URL} className="lowercase hover:text-[#00ff88]">kelas</a>
                <a href={WORKSHOP_URL} className="lowercase hover:text-[#00ff88]">workshop</a>
                <Link href="/portofolio" className="lowercase hover:text-[#00ff88]">portofolio</Link>
                <a href={MEMBER_URL} className="lowercase hover:text-[#00ff88]">member</a>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
