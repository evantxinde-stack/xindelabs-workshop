import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { SERVICE_LINES } from "@/lib/services";
import { formatWaHref } from "@/lib/site-config";
import { getSiteConfig } from "@/lib/site-config.server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Service — XindeLabs",
  description:
    "Enam lini jasa XindeLabs: pelatihan AI, event speaker, instalasi AI, automation bisnis, vibe marketing, dan aplikasi bisnis. Work with me.",
};

export default async function ServicePage() {
  const site = await getSiteConfig();
  const svc = site.service;
  const activeLines = svc.lines.length ? svc.lines : SERVICE_LINES;
  const SERVICES = activeLines.map((s) => ({
    n: s.number,
    slug: s.slug,
    title: s.title,
    desc: s.description,
    points: s.points,
  }));

  const waHref =
    formatWaHref(site.global.wa_admin_number, svc.wa_prefill_text) ||
    "https://wa.me/62895335137700?text=" + encodeURIComponent(svc.wa_prefill_text);

  const display = "font-[family-name:var(--font-display)]";
  const hand = "font-[family-name:var(--font-hand)]";

  return (
    <div className="min-h-screen bg-[#09090b] font-sans text-[#f4f2ee] antialiased">
      <SiteHeader active="service" />

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-16">
        <p className="font-mono text-[12px] lowercase tracking-[0.2em] text-[#00ff88]">{svc.eyebrow}</p>
        <h1 className={`${display} mt-5 max-w-3xl text-[clamp(2.1rem,5vw,3.4rem)] font-bold leading-[1.05] tracking-tight`}>
          {svc.title}{" "}
          <span className={`${hand} font-bold text-[#00ff88]`}>{svc.title_highlight}</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-white/60">
          {svc.subtitle}
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.slug} id={s.slug} className="flex scroll-mt-24 flex-col bg-[#0c0c0f] p-6">
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
              <Link
                href="/service#konsultasi"
                className="mt-auto pt-5 font-mono text-[11.5px] font-bold text-[#00ff88] transition hover:text-white"
              >
                Konsultasikan sekarang →
              </Link>
            </div>
          ))}
        </div>

        <div id="konsultasi" className="mt-14 scroll-mt-24 rounded-2xl border border-[#00ff88]/30 bg-[#07130d] p-8 md:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#00ff88]">{svc.consult_eyebrow}</p>
          <h2 className={`${display} mt-3 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight`}>{svc.consult_title}</h2>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-white/60">
            {svc.consult_desc}
          </p>
          <div className="mt-7 max-w-xl">
            <LeadForm
              buttonTxt="Konsultasikan sekarang"
              buttonTxtLoading="Mengirim…"
              note="Data lo aman, cuma dipakai buat follow-up konsultasi."
              redirect="/service"
              source="service-consultation"
            />
          </div>
        </div>

        <div className="mt-14 rounded-2xl border border-[#00ff88]/30 bg-[#07130d] p-8 md:p-10">
          <h2 className={`${display} text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight`}>
            {svc.cta_title}
          </h2>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-white/60">
            {svc.cta_desc}
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
              href={site.global.instagram_url}
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
          <p className="mt-6 text-[13.5px] text-white/45">
            Belum siap project? Mulai dari{" "}
            <Link href="/tutorial" className="font-semibold text-[#00ff88] underline-offset-4 hover:underline">
              tutorial gratis + komunitas
            </Link>{" "}
            dulu.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
