"use client";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

const neon = "text-[#00ff88]";
const card = "rounded-2xl border border-white/10 bg-[#0B1F16] p-8";
const mono = "font-mono text-[11px] uppercase tracking-[0.18em]";
const btn =
  "rounded-full bg-[#00ff88] px-6 py-3 text-[13px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]";
const input =
  "w-full rounded-lg border border-white/12 bg-black/40 px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#00ff88]";

const STEPS = ["Data diri", "VIP", "Kelas", "Tutorial gratis"];

export default function TutorialFunnel({ vip, course }: { vip: any; course: any }) {
  const [step, setStep] = useState(0);
  const [lead, setLead] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "" });
  const [busy, setBusy] = useState(false);

  async function advance(next: number) {
    if (lead?.leadId)
      await fetch("/api/tutorial/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.leadId,
          event_type: ["lead_capture", "vip_offer_viewed", "course_downsell_viewed", "free_tutorial_viewed"][next],
          step: next,
        }),
      });
    setStep(next);
  }

  async function capture(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, source: "tutorial_hermes" }),
    });
    const j = await r.json();
    if (r.ok) {
      setLead(j);
      await advance(1);
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-[#04110D] text-white">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-14">
        <p className={`${mono} ${neon}`}>// jalur belajar</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight md:text-5xl">
          Mulai bangun <span className={neon}>agent</span> pertamamu.
        </h1>

        <div className="mt-8 flex flex-wrap gap-2">
          {STEPS.map((x, i) => (
            <span
              key={x}
              className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${
                i <= step ? "bg-[#00ff88] text-[#0a1f12]" : "bg-white/5 text-white/40"
              }`}
            >
              {i + 1}. {x}
            </span>
          ))}
        </div>

        <div className="mt-10">
          {step === 0 && (
            <section className={`${card} mx-auto max-w-lg`}>
              <p className={`${mono} ${neon}`}>lead capture</p>
              <h2 className="mt-3 text-2xl font-bold">Mulai belajar AI Agent</h2>
              <form onSubmit={capture} className="mt-6 space-y-3">
                {([["name", "Nama"], ["email", "Email"], ["whatsapp", "No. WhatsApp"]] as const).map(([k, l]) => (
                  <input
                    key={k}
                    required
                    type={k === "email" ? "email" : "text"}
                    placeholder={l}
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className={input}
                  />
                ))}
                <button disabled={busy} className={`${btn} w-full`}>
                  {busy ? "Memproses…" : "Lihat penawaran"}
                </button>
              </form>
            </section>
          )}

          {step === 1 && (
            <Offer
              title="Bimbingan VIP 1-on-1"
              video={vip?.vsl_youtube_id}
              description={`Slot ${vip?.month_label || "bulan ini"}: ${vip?.remaining_slots ?? "—"} dari ${vip?.total_slots ?? "—"} tersisa.`}
              primary="Ambil Slot VIP Sekarang"
              href={`/checkout/vip?lead=${lead?.leadId || ""}`}
              secondary="Belum butuh bimbingan VIP, lihat opsi belajar mandiri"
              onSecondary={() => advance(2)}
            />
          )}

          {step === 2 && (
            <Offer
              title="Kelas & Workshop Hermes Agent"
              video={course?.trailer_youtube_id}
              description="Bangun agent Hermes dari nol dengan materi terstruktur dan praktik langsung."
              primary="Daftar Kelas Sekarang"
              href={`/checkout/${course?.slug || "fast_track"}`}
              secondary="Lewati penawaran, lanjut ke Tutorial Gratis"
              onSecondary={() => advance(3)}
              countdown
            />
          )}

          {step === 3 && (
            <section className={`${card} mx-auto max-w-2xl text-center`}>
              <p className={`${mono} ${neon}`}>free hermes tutorial</p>
              <h2 className="mt-3 text-3xl font-bold">Mulai bangun agent pertamamu</h2>
              <p className="mt-4 text-white/55">
                Tutorial gratis, materi dasar, dan komunitas untuk lanjut praktik bersama.
              </p>
              <a href="/join-group" className={`${btn} mt-7 inline-block`}>
                Gabung Komunitas Discord
              </a>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Offer({
  title,
  video,
  description,
  primary,
  href,
  secondary,
  onSecondary,
  countdown = false,
}: {
  title: string;
  video?: string;
  description: string;
  primary: string;
  href: string;
  secondary: string;
  onSecondary: () => void;
  countdown?: boolean;
}) {
  const [left] = useState(() => (countdown ? Date.now() + 30 * 60 * 1000 : 0));
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!countdown) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  return (
    <section className={`${card} mx-auto max-w-2xl`}>
      <p className={`${mono} ${neon}`}>step berikutnya</p>
      <h2 className="mt-3 text-3xl font-bold">{title}</h2>
      {video && (
        <div className="mt-6 aspect-video overflow-hidden rounded-xl border border-white/10">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${encodeURIComponent(video)}`}
            title={title}
            allowFullScreen
          />
        </div>
      )}
      <p className="mt-5 text-white/55">{description}</p>
      {countdown && (
        <p className={`mt-4 ${neon} font-mono text-[12px]`}>
          Penawaran terbatas: {Math.max(0, Math.floor((left - now) / 60000))} menit
        </p>
      )}
      <a href={href} className={`${btn} mt-7 inline-block`}>
        {primary}
      </a>
      <button onClick={onSecondary} className="mt-5 block text-[13px] text-white/40 underline hover:text-white/70">
        {secondary}
      </button>
    </section>
  );
}
