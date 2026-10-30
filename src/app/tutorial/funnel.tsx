"use client";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { DiscordIdHelp } from "@/components/DiscordIdHelp";

const neon = "text-[#00ff88]";
const card = "rounded-2xl border border-white/10 bg-[#0B1F16] p-8";
const mono = "font-mono text-[11px] uppercase tracking-[0.18em]";
const btn =
  "rounded-full bg-[#00ff88] px-6 py-3 text-[13px] font-bold text-[#0a1f12] transition hover:bg-[#5cffb3]";
const input =
  "w-full rounded-lg border border-white/12 bg-black/40 px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#00ff88]";

const EVENTS: Record<number, string> = { 0: "lead_capture", 1: "vip_offer_viewed", 2: "course_downsell_viewed", 3: "free_tutorial_viewed" };

export default function TutorialFunnel({ vip, course, free }: { vip: any; course: any; free?: { href: string; learn: string } }) {
  const [step, setStep] = useState(0);
  const [lead, setLead] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", password: "", discord_id: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [freeAccess, setFreeAccess] = useState<"idle" | "busy" | "done" | "login">("idle");

  async function grantFreeTutorial() {
    setFreeAccess("busy");
    const r = await fetch("/api/member/free-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "tutorial-bangun-hermes" }),
    });
    setFreeAccess(r.status === 401 ? "login" : r.ok ? "done" : "idle");
  }

  async function advance(next: number) {
    if (lead?.leadId)
      await fetch("/api/tutorial/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.leadId,
          event_type: EVENTS[next],
          step: next,
        }),
      });
    setStep(next);
  }

  async function capture(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (form.password.length < 6) { setError("Password minimal 6 karakter."); setBusy(false); return; }
    if (form.discord_id && !/^\d{17,20}$/.test(form.discord_id)) { setError("Discord User ID harus 17–20 digit, atau kosongkan jika belum punya Discord."); setBusy(false); return; }
    const r = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, source: "tutorial_hermes" }),
    });
    const j = await r.json();
    if (r.ok) {
      setLead(j);
      await advance(1);
    } else setError(j.error || "Registrasi gagal. Coba lagi.");
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-[#04110D] text-white">
      <SiteHeader active="tutorial" />
      <main className="mx-auto max-w-4xl px-5 py-14">
        <p className={`${mono} ${neon}`}>// jalur belajar</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight md:text-5xl">
          Mulai bangun <span className={neon}>agent</span> pertamamu.
        </h1>

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
                <input type="password" required minLength={6} placeholder="Password (min. 6 karakter)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} />
                <input inputMode="numeric" placeholder="Discord User ID (opsional)" value={form.discord_id} onChange={(e) => setForm({ ...form, discord_id: e.target.value.replace(/\D/g, "") })} className={input} />
                <DiscordIdHelp />
                <button disabled={busy} className={`${btn} w-full`}>
                  {busy ? "Memproses…" : "Lihat penawaran"}
                </button>
              </form>
            </section>
          )}

          {step === 1 && (
            <Offer
              title={vip?.title || "Bimbingan VIP 1-on-1"}
              video={vip?.vsl_youtube_id}
              description={`Slot ${vip?.month_label || "bulan ini"}: ${vip?.remaining_slots ?? "—"} dari ${vip?.total_slots ?? "—"} slot tersisa. Bimbingan privat bareng Evant untuk brand, agent, dan growth kamu — dibahas dulu, cocok atau tidak.`}
              primary="Konsultasi Bimbingan"
              href={vip?.whatsapp_booking_url || "https://wa.me/62895335137700?text=Halo%2C%20saya%20mau%20tanya%20soal%20Bimbingan%20VIP"}
              secondary="Belum berminat, lanjut lihat opsi lain"
              onSecondary={() => advance(2)}
            />
          )}

          {step === 2 && (
            <Offer
              title={course?.title || "Kelas & Workshop Hermes Agent"}
              video={course?.trailer_youtube_id}
              description={`Bangun agent Hermes dari nol dengan materi terstruktur dan praktik langsung.${course?.price_label ? ` Mulai ${course.price_label}${course?.regular_label ? ` (normal ${course.regular_label})` : ""}.` : ""}`}
              primary="Daftar Kelas Sekarang"
              href={`${course?.checkout_href || "/checkout/fast_track"}${lead?.leadId ? `?lead=${lead.leadId}` : ""}`}
              secondary="Belum sekarang, saya mulai dari tutorial gratis"
              onSecondary={() => { grantFreeTutorial(); advance(3); }}
              countdown
            />
          )}

          {step === 3 && (
            <section className={`${card} mx-auto max-w-2xl text-center`}>
              <p className={`${mono} ${neon}`}>free hermes tutorial</p>
              <h2 className="mt-3 text-3xl font-bold">Akun kamu aktif. Tutorial gratis sudah terbuka.</h2>
              <p className="mt-4 text-white/55">
                Kelas “Bangun Hermes Agent dari Nol” — instalasi, konfigurasi, cron, sampai workspace — bisa langsung kamu buka. Gabung komunitas Discord untuk tanya jawab harian.
              </p>
              <a href={freeAccess === "done" || freeAccess === "busy" ? free?.learn || "/learn" : "/learn/login"} className={`${btn} mt-7 inline-block`}>
                {freeAccess === "busy" ? "Membuka akses…" : "Buka Tutorial Gratis"}
              </a>
              <a href={free?.href || "/join-group"} className="mt-4 block text-[13px] text-white/50 underline hover:text-white/80">
                Gabung Komunitas Discord Gratis
              </a>
              {freeAccess === "login" && (
                <p className="mt-4 text-[13px] text-amber-300">Login dulu untuk membuka kelas gratis — pakai email &amp; password yang baru kamu daftarkan.</p>
              )}
              {!form.discord_id && freeAccess === "done" && (
                <div className="mt-7 rounded-xl border border-white/10 bg-black/30 p-5 text-left">
                  <p className="text-sm text-white/70">Punya Discord? Tambahkan User ID sekarang biar otomatis dapat role <b className="text-white">Connect Circle</b>. Bisa juga menyusul dari area member.</p>
                  <DiscordIdHelp className="mt-2" />
                </div>
              )}
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
