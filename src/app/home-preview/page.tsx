/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { admin } from "@/lib/supabase/server";
import { stripTags } from "@/lib/content";
import { SERVICE_LINES } from "@/lib/services";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview — Homepage baru", robots: { index: false } };

const LEARN = "https://learn.xindelabs.web.id";
const display = "font-[family-name:var(--font-display)]";
const mono = "font-[family-name:var(--font-geist-mono)]";

type Work = { id: string; title: string; slug: string; description: string | null; category: string | null; link_url: string | null };

const WORKS: (Work & { img: string; stats: [string, string][]; href: string; cta: string })[] = [
  {
    id: "flagship", slug: "kelas-bangun-hermes-agent", title: "Bangun Karyawan Super 24/7",
    category: "Kelas · AI Agent", link_url: null, description:
      "Kelas flagship: bangun AI agent yang ngerti SOP bisnis, kerja 24 jam, dan nggak perlu kamu pantau. Dari nol sampai agent jalan sendiri.",
    img: "/p/workshop-hero.jpg", href: "/p/bangun-pasukan-ai", cta: "Lihat kelasnya",
    stats: [["Peserta", "15 / 50"], ["Modul", "10"], ["Harga", "Rp298rb"]],
  },
  {
    id: "klinik", slug: "agent-sales-klinik", title: "Agent Sales Klinik",
    category: "AI Agent · WhatsApp", link_url: null, description:
      "Agent yang jawab FAQ treatment, kualifikasi leads, dan booking janji temu otomatis. Jalan di WhatsApp, 24 jam.",
    img: "/p/ai-agent-system.svg", href: "/service#agent-ai", cta: "Lihat sistemnya",
    stats: [["Channel", "WA"], ["Respons", "<5 dtk"], ["Shift", "24/7"]],
  },
  {
    id: "funnel", slug: "landing-funnel-kelas", title: "Funnel & Onboarding Member",
    category: "Sistem · Mayar", link_url: null, description:
      "Landing, checkout Mayar, provisioning LMS, dan email akses. Pembayaran masuk, akun aktif kurang dari satu menit.",
    img: "/p/workflow-map.svg", href: "/service#funnel", cta: "Lihat alurnya",
    stats: [["Aktif", "<1 mnt"], ["Bayar", "Mayar"], ["Akses", "LMS"]],
  },
  {
    id: "konten", slug: "otomasi-konten-ig", title: "Engine Konten Instagram",
    category: "AI Agent · Content", link_url: null, description:
      "Satu brief mingguan jadi 30 caption, visual, dan jadwal posting. Tiga brand terbit tiap hari tanpa kamu pegang satu-satu.",
    img: "/p/workshop-steps.jpg", href: "/service#konten", cta: "Lihat engine-nya",
    stats: [["Brand", "3"], ["Post", "Harian"], ["Brief", "1/mgg"]],
  },
];

const SKILLS = [
  { title: "AI Agent & Automation", desc: "Agent yang baca konteks, ambil keputusan, dan eksekusi kerjaan operasional tanpa disuruh.", chips: ["Hermes Agent", "OpenAI", "Claude", "n8n"] },
  { title: "Funnel & Payment", desc: "Landing, checkout, webhook, provisioning akses. Uang masuk, sistem langsung bergerak.", chips: ["Mayar", "Supabase", "Next.js", "Resend"] },
  { title: "Content Engine", desc: "Riset, copy, visual, jadwal, publish. Mesin konten yang jaga brand tetap hidup.", chips: ["Instagram", "Threads", "Meta Ads", "Playwright"] },
  { title: "Digital Selling", desc: "Positioning, penawaran, follow-up. Sales background yang dipakai buat naikin konversi.", chips: ["Offer design", "Copywriting", "CRM", "WhatsApp"] },
  { title: "Web & Dashboard", desc: "Bangun web, LMS, dan dashboard produksi. Bukan mockup, tapi yang dipakai harian.", chips: ["Next.js", "Tailwind", "Supabase", "Vercel"] },
  { title: "Bot Operations", desc: "Tim bot yang jalan di VPS, punya jadwal, guard anti-dobel, dan log yang bisa diaudit.", chips: ["VPS", "Systemd", "Cron", "Docker"] },
];

const STEPS = [
  ["01", "Audit", "Kita petakan kerjaan repetitif yang paling makan waktu di bisnis lo."],
  ["02", "Bangun", "Agent, funnel, dan konten engine dibangun sesuai alur yang sudah ada."],
  ["03", "Uji", "Dijalankan di skenario asli. Cek output, biaya, dan titik gagalnya."],
  ["04", "Serah terima", "Lo pegang sistemnya, plus panduan dan akses ke kelas pendamping."],
];

export default async function HomePreview() {
  const [{ data: works }, { data: wa }] = await Promise.all([
    admin.from("portfolio").select("id,title,slug,description,category,link_url").order("sort_order").limit(6),
    admin.from("settings").select("value").eq("key", "wa_admin_number").maybeSingle(),
  ]);
  const waNumber = String(wa?.value || "").replace(/\D/g, "");
  const waHref = waNumber ? `https://wa.me/${waNumber.startsWith("0") ? "62" + waNumber.slice(1) : waNumber}` : "https://wa.me/62895335137700";
  const extra: Work[] = (works || []).filter((w: Work) => !WORKS.some((x) => x.slug === w.slug)).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F1F0EC] text-[#0B0B0B] antialiased [font-feature-settings:'ss01']">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#F1F0EC]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-12">
          <Link href="/" className={`${display} text-lg font-bold tracking-tight`}>
            xindelabs<span className="text-[#0A8A55]">.</span>
          </Link>
          <nav className={`${mono} hidden items-center gap-8 text-[11px] uppercase tracking-[0.16em] text-black/60 md:flex`}>
            <a href="#karya" className="hover:text-black">Karya</a>
            <a href="#keahlian" className="hover:text-black">Keahlian</a>
            <a href="#cara" className="hover:text-black">Cara kerja</a>
            <a href={LEARN} className="hover:text-black">Kelas</a>
          </nav>
          <a href="/service" className="rounded-full bg-[#0B0B0B] px-5 py-2.5 text-[13px] font-semibold text-[#F1F0EC] transition hover:bg-[#0A8A55]">
            Work with me
          </a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="mx-auto max-w-7xl px-5 pb-14 pt-10 md:px-12 md:pb-20 md:pt-16">
          <div className="grid items-end gap-10 md:grid-cols-[1.35fr_.65fr]">
            <div>
              <p className={`${mono} text-[11px] uppercase tracking-[0.28em] text-[#0A8A55]`}>Jakarta, ID · AI Automation</p>
              <h1 className={`${display} mt-4 text-[clamp(4rem,15vw,11.5rem)] font-bold leading-[0.82] tracking-[-0.05em]`}>
                xindelabs<span className="text-[#00C46A]">.</span>
              </h1>
              <h2 className={`${display} mt-8 max-w-3xl text-[clamp(1.15rem,2.4vw,1.85rem)] font-bold uppercase leading-[1.15] tracking-[-0.01em]`}>
                Bikin bisnis jalan tanpa nambah jam kerja.
              </h2>
              <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-black/60">
                Saya bangun agent AI, funnel yang nutup penjualan sendiri, dan sistem konten yang terbit tiap hari.
                Semua yang ada di sini sudah jalan di bisnis sendiri — bukan demo.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#karya" className="rounded-full bg-[#00FF88] px-7 py-3.5 text-[14px] font-bold text-[#062014] ring-1 ring-black/10 transition hover:bg-[#5cffb3]">
                  Lihat karyanya
                </a>
                <a href={waHref} target="_blank" rel="noopener" className="rounded-full border border-black/20 px-6 py-3.5 text-[14px] font-semibold transition hover:border-black/50">
                  Tanya dulu
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-[1.25rem] bg-[#E6E4DE] ring-1 ring-black/10">
                <img src="/founder.jpg" alt="Xinde, founder XindeLabs" width={1080} height={1350} className="aspect-[4/5] w-full object-cover grayscale" />
              </div>
              <div className={`${mono} mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-black/45`}>
                <span>xinde · founder</span><span>est. 2024</span>
              </div>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-black/10 md:grid-cols-4">
            {[["24/7", "agent aktif di VPS"], ["<1 mnt", "bayar → akses LMS"], ["3 brand", "konten terbit otomatis"], ["5 niche", "campaign Meta Ads"]].map(([v, k]) => (
              <div key={k} className="bg-[#F1F0EC] px-5 py-6">
                <p className={`${display} text-2xl font-bold tracking-tight md:text-3xl`}>{v}</p>
                <p className={`${mono} mt-1.5 text-[10.5px] uppercase leading-relaxed tracking-[0.1em] text-black/45`}>{k}</p>
              </div>
            ))}
          </div>
        </section>

        {/* KARYA */}
        <section id="karya" className="mx-auto max-w-7xl px-5 py-16 md:px-12 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-black/15 pt-8">
            <div>
              <h2 className={`${display} text-[clamp(1.9rem,4.2vw,3.2rem)] font-bold leading-none tracking-[-0.03em]`}>Karya pilihan</h2>
              <p className="mt-3 max-w-xl text-[15px] text-black/55">Sistem yang jalan di bisnis sendiri dan klien. Bukan konsep, bukan mockup.</p>
            </div>
            <a href="/portofolio" className={`${mono} text-[11px] uppercase tracking-[0.16em] text-black/50 underline underline-offset-4 hover:text-black`}>semua karya →</a>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {WORKS.map((w) => (
              <article key={w.id} className="group overflow-hidden rounded-2xl border border-black/12 bg-[#FAF9F6]">
                <div className="relative overflow-hidden bg-[#E6E4DE]">
                  <img src={w.img} alt={w.title} width={1280} height={720} className="aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
                  <span className={`${mono} absolute left-4 top-4 rounded-full bg-[#0B0B0B] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#F1F0EC]`}>{w.category}</span>
                </div>
                <div className="p-6">
                  <h3 className={`${display} text-xl font-bold tracking-tight`}>{w.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-black/55">{w.description}</p>
                  <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-black/10 pt-4">
                    {w.stats.map(([k, v]) => (
                      <div key={k}>
                        <dt className={`${mono} text-[9.5px] uppercase tracking-[0.14em] text-black/40`}>{k}</dt>
                        <dd className={`${display} mt-0.5 text-[15px] font-bold`}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <a href={w.href} className={`${mono} mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] underline decoration-black/25 underline-offset-4 hover:decoration-[#0A8A55]`}>
                    {w.cta} →
                  </a>
                </div>
              </article>
            ))}
          </div>

          {extra.length ? (
            <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-black/12 bg-black/10 sm:grid-cols-2">
              {extra.map((w) => (
                <a key={w.id} href="/portofolio" className="group bg-[#FAF9F6] p-6 transition hover:bg-white">
                  <span className={`${mono} text-[10px] uppercase tracking-[0.16em] text-[#0A8A55]`}>{w.category || "karya"}</span>
                  <h3 className={`${display} mt-2 text-[17px] font-bold`}>{w.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-black/50">{stripTags(w.description) || "Detail di halaman portofolio."}</p>
                  <span className={`${mono} mt-4 block text-[10px] uppercase tracking-[0.14em] text-black/35 group-hover:text-black`}>baca →</span>
                </a>
              ))}
            </div>
          ) : null}
        </section>

        {/* KEAHLIAN */}
        <section id="keahlian" className="border-y border-black/10 bg-[#E9E7E1]">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-12 md:py-24">
            <h2 className={`${display} max-w-3xl text-[clamp(1.9rem,4.2vw,3.2rem)] font-bold leading-[1.02] tracking-[-0.03em]`}>
              Keahlian yang bikin sistemnya nyala.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SKILLS.map((s) => (
                <div key={s.title} className="rounded-2xl border border-black/12 bg-[#F1F0EC] p-6">
                  <h3 className={`${display} text-[17px] font-bold tracking-tight`}>{s.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-black/55">{s.desc}</p>
                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {s.chips.map((c) => (
                      <li key={c} className={`${mono} rounded-full border border-black/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-black/55`}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICE_LINES.map((s) => (
                <Link key={s.slug} href={`/service#${s.slug}`} className="group bg-[#F1F0EC] p-5 transition hover:bg-white">
                  <span className={`${mono} text-[10px] uppercase tracking-[0.16em] text-[#0A8A55]`}>{s.number}</span>
                  <p className={`${display} mt-2 text-[14.5px] font-bold leading-snug`}>{s.title}</p>
                  <span className={`${mono} mt-3 block text-[10px] uppercase tracking-[0.12em] text-black/40 group-hover:text-black`}>detail →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CARA KERJA */}
        <section id="cara" className="mx-auto max-w-7xl px-5 py-16 md:px-12 md:py-24">
          <h2 className={`${display} max-w-2xl text-[clamp(1.9rem,4.2vw,3.2rem)] font-bold leading-[1.02] tracking-[-0.03em]`}>
            Cara kerja.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="border-t border-black/20 pt-4">
                <span className={`${mono} text-[11px] tracking-[0.2em] text-[#0A8A55]`}>{n}</span>
                <h3 className={`${display} mt-3 text-[17px] font-bold`}>{t}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-black/55">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-start gap-6 rounded-2xl bg-[#0B0B0B] p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <h3 className={`${display} text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-tight text-[#F1F0EC]`}>
                Siap punya sistem yang kerja buat lo?
              </h3>
              <p className="mt-2 text-[14px] text-[#F1F0EC]/55">Mulai dari satu proses yang paling makan waktu.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/service" className="rounded-full bg-[#00FF88] px-6 py-3 text-[14px] font-bold text-[#062014] transition hover:bg-[#5cffb3]">Work with me</a>
              <a href={LEARN} className="rounded-full border border-[#F1F0EC]/30 px-6 py-3 text-[14px] font-semibold text-[#F1F0EC] transition hover:border-[#00FF88] hover:text-[#00FF88]">Lihat kelas</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="rounded-t-[2rem] bg-[#0B0B0B] px-5 pb-10 pt-14 text-[#F1F0EC] md:rounded-t-[3rem] md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <p className={`${display} text-2xl font-bold`}>xindelabs<span className="text-[#00FF88]">.</span></p>
              <p className={`${mono} mt-3 max-w-xs text-[11.5px] leading-relaxed text-[#F1F0EC]/45`}>
                AI automation & digital selling. Dibangun, diuji, dipakai sendiri.
              </p>
            </div>
            {[
              ["Navigasi", [["Karya", "#karya"], ["Keahlian", "#keahlian"], ["Service", "/service"], ["Portofolio", "/portofolio"]]],
              ["Kelas", [["Katalog", `${LEARN}/kelas`], ["Workshop", `${LEARN}/workshop`], ["Member", `${LEARN}/member`], ["Tutorial", "/tutorial"]]],
              ["Kontak", [["WhatsApp", waHref], ["Instagram", "https://instagram.com/xindelabs.id"], ["Threads", "https://threads.net/@xindelabs.id"], ["Email", "mailto:hello@xindelabs.web.id"]]],
            ].map(([title, links]) => (
              <div key={String(title)}>
                <p className={`${mono} text-[10px] uppercase tracking-[0.2em] text-[#F1F0EC]/35`}>{String(title)}</p>
                <ul className="mt-4 space-y-2.5">
                  {(links as string[][]).map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-[13.5px] text-[#F1F0EC]/70 transition hover:text-[#00FF88]">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={`${mono} mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F0EC]/12 pt-5 text-[10px] uppercase tracking-[0.16em] text-[#F1F0EC]/30`}>
            <span>© 2026 xindelabs</span>
            <span>built to run itself</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
