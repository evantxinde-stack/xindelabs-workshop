"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { demoMode, trackEvent } from "@/lib/funnel";

const BUSINESS_FIELDS = [
  "Instalasi AI untuk Bisnis",
  "Otomatisasi Proses Bisnis",
  "Vibe Marketing / Konten",
  "Pembuatan Aplikasi Bisnis",
  "Produk Digital / Kelas Online",
  "Belajar AI Agent",
  "Lainnya",
];

export function LeadForm({
  buttonTxt,
  buttonTxtLoading,
  note,
  redirect,
  source = "tutorial_hermes",
}: {
  buttonTxt: string;
  buttonTxtLoading: string;
  note: string;
  redirect?: string;
  source?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [dup, setDup] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      whatsapp: String(fd.get("whatsapp") || "").trim(),
      business_field: String(fd.get("business_field") || "").trim(),
    };
    if (!payload.name || !payload.email) return;

    setSubmitting(true);
    setDup(false);
    let leadId: string | null = null;
    let foundDup = false;

    try {
      if (demoMode) {
        leadId = Math.random().toString(36).slice(2);
      } else {
        const res = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, source }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.leadId) {
          leadId = data.leadId;
          foundDup = !!data.exists;
          if (foundDup) setDup(true);
        } else {
          throw new Error(data.error || "Failed to submit");
        }
      }
    } catch (err) {
      setSubmitting(false);
      return;
    }

    if (leadId) {
      try { trackEvent(leadId, "lead_form_submitted", { source, landing_page: "/" }); } catch {}
      setTimeout(() => router.push(redirect ? `${redirect}?lead=${leadId}` : `/vip-coaching?lead=${leadId}`), foundDup ? 1200 : 0);
      return;
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-white/70">
          Nama
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Nama lengkap"
          className="input-futuristic"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-white/70">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="email@contoh.com"
          className="input-futuristic"
        />
      </div>
      <div>
        <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium text-white/70">
          No. WhatsApp
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          required
          placeholder="08xxxxxxxxxx"
          className="input-futuristic"
        />
      </div>
      <div>
        <label htmlFor="business_field" className="mb-1 block text-sm font-medium text-white/70">
          Bidang Bisnis
        </label>
        <select
          id="business_field"
          name="business_field"
          defaultValue=""
          className="input-futuristic"
        >
          <option value="">Pilih bidang bisnis (opsional)</option>
          {BUSINESS_FIELDS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="btn-glow anim-pulse-glow w-full rounded-xl px-4 py-3.5 text-base font-bold transition disabled:opacity-50"
      >
        {submitting ? buttonTxtLoading : buttonTxt}
      </button>
      {dup ? <p className="text-center text-xs text-[var(--accent)]">Data sudah terdaftar. Mengarahkan ke halaman tutorial...</p> : <p className="text-center text-xs text-white/30">{note}</p>}
    </form>
  );
}
