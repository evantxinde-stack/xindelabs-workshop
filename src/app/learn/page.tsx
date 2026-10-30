import type { Metadata } from "next";
import { loadCatalog } from "@/lib/catalog";
import { classPrice } from "@/lib/mayar";
import { LearnShell, ProductCard } from "./catalog";
import { catalogOwnership } from "./access";
import FlagshipCheckout from "./flagship-checkout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bangun Karyawan Super 24/7" };

const FLAGSHIP = "kelas-bangun-hermes-agent";

export default async function LearnPage() {
  const items = await loadCatalog();
  const owned = await catalogOwnership(items);
  const flagship = items.find((item: any) => item.slug === FLAGSHIP) ?? items.find((item: any) => item.product_type === "course");
  const others = items.filter((item: any) => item.slug !== flagship?.slug);
  const flagshipPrice = flagship ? classPrice(flagship as any, "lifetime") : 0;

  return <LearnShell>
    <section className="relative overflow-hidden rounded-[2rem] border border-[#00ff88]/20 bg-[#0B1F16] px-6 py-14 md:px-14 md:py-24">
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#00ff88]/10 blur-3xl" />
      <div className="relative max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">XindeLabs / AI Agent Masterclass</p>
        <h1 className="mt-5 text-5xl font-bold leading-[.98] tracking-tight md:text-7xl">Bangun <span className="text-[#00ff88]">Karyawan Super</span> 24/7.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65 md:text-xl">Satu AI agent yang membantu kerja rutin bisnis lo: membaca konteks, menjalankan tugas, dan tahu kapan harus memanggil manusia.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4"><FlagshipCheckout item={flagship ?? { id: "", slug: FLAGSHIP, title: "Bangun Karyawan Super 24/7", price: 0 }} /><a href="#materi" className="font-mono text-xs uppercase tracking-[.16em] text-white/55 hover:text-[#00ff88]">Lihat isi kelas ↓</a></div>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1"><strong className="text-2xl text-[#00ff88]">{flagshipPrice > 0 ? `Rp${flagshipPrice.toLocaleString("id-ID")}` : "Gratis"}</strong><span className="text-sm text-white/45">akses kelas + update materi</span></div><div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 font-mono text-[11px] uppercase tracking-[.14em] text-white/45"><span>10 modul inti</span><span>Praktik dari nol</span><span>Akses via member area</span></div>
      </div>
    </section>

    <section className="grid gap-10 py-20 md:grid-cols-[.8fr_1.2fr] md:items-start">
      <div><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">01 / Masalahnya</p><h2 className="mt-4 text-3xl font-bold md:text-5xl">AI sudah ada. Tapi kerjaan masih numpuk di lo.</h2></div>
      <div className="space-y-5 text-lg leading-8 text-white/60"><p>Chat calon pelanggan, follow-up, laporan, konten, dan tugas berulang masih menunggu lo buka laptop.</p><p>ChatGPT bisa menjawab. Tapi bisnis butuh sistem yang paham konteks, punya aturan, dan bisa bekerja tanpa terus-terusan disuruh.</p><p className="font-bold text-white">Kelas ini membangun fondasinya. Bukan sekadar prompt yang selesai setelah dicoba sekali.</p></div>
    </section>

    <section id="materi" className="border-y border-white/10 py-20"><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">02 / Yang lo bangun</p><h2 className="mt-4 text-3xl font-bold md:text-5xl">Dari agent kosong sampai punya sistem kerja.</h2><p className="mt-5 text-lg leading-8 text-white/55">Sepuluh modul inti. Urutannya dibuat supaya lo bisa langsung praktik, bukan tersesat di daftar tools.</p></div><div className="mt-10 grid gap-3 md:grid-cols-2">{["Fondasi dan arsitektur AI agent", "Identitas, konteks, dan memory", "Custom skills yang bisa dipakai ulang", "Tools, API, dan konektor", "Otomasi tugas terjadwal", "Multi-agent dan pembagian peran", "Sales dan customer service", "Konten dari data bisnis", "Monitoring dan troubleshooting", "Deployment: agent hidup 24/7"].map((label, index) => <div key={label} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-5"><span className="font-mono text-sm text-[#00ff88]">{String(index + 1).padStart(2, "0")}</span><span className="font-medium text-white/85">{label}</span></div>)}</div></section>

    <section className="grid gap-10 py-20 md:grid-cols-2"><div><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">03 / Cocok kalau</p><h2 className="mt-4 text-3xl font-bold md:text-5xl">Lo ingin bisnis lebih rapi tanpa menambah semua orang.</h2></div><ul className="space-y-4 text-lg leading-8 text-white/60"><li>✓ Sudah memakai AI, tapi masih copy-paste manual.</li><li>✓ Punya pekerjaan berulang yang menyita waktu setiap hari.</li><li>✓ Ingin staf punya sistem kerja yang bisa diikuti.</li><li>✓ Siap praktik dan mengecek hasil, bukan mencari tombol ajaib.</li></ul></section>

    <section className="rounded-[2rem] bg-[#f4f2ee] px-6 py-14 text-[#0a1f12] md:px-14"><p className="font-mono text-xs uppercase tracking-[.25em] text-[#0a8a55]">04 / Cara belajarnya</p><div className="mt-5 grid gap-8 md:grid-cols-3"><div><h3 className="text-xl font-bold">Pahami</h3><p className="mt-2 leading-7 text-[#0a1f12]/65">Lihat peta kerja agent, batas akses, dan konteks yang dibutuhkan.</p></div><div><h3 className="text-xl font-bold">Bangun</h3><p className="mt-2 leading-7 text-[#0a1f12]/65">Ikuti langkahnya. Pasang agent dan skill yang relevan dengan bisnis lo.</p></div><div><h3 className="text-xl font-bold">Uji</h3><p className="mt-2 leading-7 text-[#0a1f12]/65">Cek output, perbaiki aturan, lalu jalankan tugas secara konsisten.</p></div></div></section>

    <section className="py-20"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">05 / Produk lain</p><h2 className="mt-4 text-3xl font-bold md:text-5xl">Mulai dari yang paling pas.</h2></div><a href="/learn/kelas" className="font-mono text-xs uppercase tracking-[.16em] text-white/55 hover:text-[#00ff88]">Lihat semua katalog ↗</a></div>{others.length ? <div className="mt-10 grid gap-5 md:grid-cols-3">{others.map((item: any) => <ProductCard key={item.id} item={item} owned={owned.has(String(item.id)) || owned.has(item.slug)} />)}</div> : <p className="mt-8 text-white/50">Produk lain sedang disiapkan.</p>}</section>

    <section className="border-t border-white/10 py-20 text-center"><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">Siap mulai?</p><h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold md:text-6xl">Bangun karyawan digital pertama lo.</h2><div className="mt-8"><FlagshipCheckout item={flagship ?? { id: "", slug: FLAGSHIP, title: "Bangun Karyawan Super 24/7", price: 0 }} /></div></section>
  </LearnShell>;
}
