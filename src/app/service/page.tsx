import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Service — XindeLabs",
  description:
    "Layanan XindeLabs: AI agent otonom, funnel & checkout, konten Instagram, Meta Ads, membership & LMS. Work with me.",
};

type Service = {
  n: string;
  title: string;
  desc: string;
  points: string[];
  harga: string;
};

const SERVICES: Service[] = [
  {
    n: "01",
    title: "AI Agent & Automasi Operasional",
    desc: "Agent yang jalan 24/7 di server: follow-up leads, rekap, laporan, customer care — tanpa lo suruh tiap hari.",
    points: ["Hermes agent di VPS", "Integrasi WhatsApp & email", "Jadwal & laporan otomatis"],
    harga: "mulai Rp 3,5jt setup + Rp 750rb/bln",
  },
  {
    n: "02",
    title: "Funnel & Checkout Otomatis",
    desc: "Landing → payment gateway → akses produk, semuanya otomatis. Bayar masuk, akses terbuka dalam hitungan detik.",
    points: ["Funnel multi-step", "Mayar / Midtrans / QRIS", "Auto-grant akses LMS"],
    harga: "mulai Rp 4,5jt",
  },
  {
    n: "03",
    title: "Instagram Engine",
    desc: "Riset hook, produksi carousel, posting terjadwal, dan auto-DM per brand. Feed tetap hidup walau lo nggak pegang HP.",
    points: ["Carousel & caption auto", "Jadwal 3×/hari", "Auto-DM keyword"],
    harga: "mulai Rp 2,5jt + Rp 1jt/bln",
  },
  {
    n: "04",
    title: "Meta Ads Management",
    desc: "Testing terstruktur multi-niche: copy, visual, budget, evaluasi H+3/H+5/H+7. Yang menang discale, yang kalah dimatikan.",
    points: ["Riset audiens & Ad Library", "Copy + visual testing", "Laporan evaluasi berkala"],
    harga: "mulai Rp 3jt/bln + ad spend",
  },
  {
    n: "05",
    title: "Membership & LMS",
    desc: "Area member, kelas online, tier, poin, voucher, dan affiliate — akses terkunci rapi sampai pembayaran masuk.",
    points: ["Gate akses per produk", "Tier & poin member", "Voucher + affiliate"],
    harga: "mulai Rp 6jt",
  },
  {
    n: "06",
    title: "Content Ecosystem",
    desc: "Satu sistem untuk banyak brand: riset, produksi, distribusi, sampai pengukuran. Konsisten tanpa nambah orang.",
    points: ["Multi-brand calendar", "Repurpose lintas platform", "Dashboard performa"],
    harga: "mulai Rp 4jt/bln",
  },
];

export default async function ServicePage() {
  const waHref = "https://wa.me/62895335137700?text=" + encodeURIComponent("Halo XindeLabs, gw mau bahas project.");

  const display = "font-[family-name:var(--font-display)]";
  const hand = "font-[family-name:var(--font-hand)]";

  return (
    <div className="min-h-screen bg-[#09090b] font-sans text-[#f4f2ee] antialiased">
      <SiteHeader active="Service" />

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-16">
        <p className="font-mono text-[12px] lowercase tracking-[0.2em] text-[#00ff88]">service</p>
        <h1 className={`${display} mt-5 max-w-3xl text-[clamp(2.1rem,5vw,3.4rem)] font-bold leading-[1.05] tracking-tight`}>
          Yang bisa gw bangun{" "}
          <span className={`${hand} font-bold text-[#00ff88]`}>buat bisnis lo.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-white/60">
          Semua di bawah ini sudah jalan di bisnis gw sendiri — bukan konsep. Pilih yang paling nyangkut,
          sisanya bisa nyusul.
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.n} className="flex flex-col bg-[#0c0c0f] p-6">
              <span className="font-mono text-[11px] text-[#00ff88]">{s.n}</span>
              <h2 className={`${display} mt-3 text-[17px] font-bold leading-snug`}>{s.title}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{s.desc}</p>
              <ul className="mt-4 space-y-1.5 text-[12.5px] text-white/45">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="font-mono text-[#00ff88]/70">›</span>
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-5 font-mono text-[11.5px] text-white/40">{s.harga}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-[#00ff88]/30 bg-[#07130d] p-8 md:p-10">
          <h2 className={`${display} text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight`}>
            Mau mulai dari mana?
          </h2>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-white/60">
            Ceritain kerjaan repetitif yang paling nyita waktu lo. Gw bantu petakan mana yang bisa
            diotomasi duluan — gratis, 20 menit.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#00ff88] px-7 py-3 text-[15px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]"
            >
              Chat WhatsApp →
            </a>
            <a
              href="https://instagram.com/xindelabs.id"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/25 px-7 py-3 text-[15px] font-semibold transition hover:border-[#00ff88] hover:text-[#00ff88]"
            >
              DM Instagram
            </a>
            <Link
              href="/#karya"
              className="rounded-full border border-white/15 px-7 py-3 text-[15px] font-semibold text-white/70 transition hover:border-white/40"
            >
              Liat karya dulu
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
