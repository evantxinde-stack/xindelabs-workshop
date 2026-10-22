"use client";

import { useState } from "react";

export function PartnershipForm() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      company: String(fd.get("company") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      whatsapp: String(fd.get("whatsapp") || "").trim(),
      kind: String(fd.get("kind") || "").trim(),
      message: String(fd.get("message") || "").trim(),
      website: String(fd.get("website") || "").trim(),
    };

    if (!payload.name || !payload.email) {
      setState("error");
      setMessage("Nama dan email wajib diisi.");
      return;
    }

    setState("sending");
    try {
      const res = await fetch("/api/partnership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal mengirim");
      setState("ok");
      setMessage(data.message || "Permintaanmu sudah kami terima. Tim kami akan menghubungi lo.");
      e.currentTarget.reset();
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Gagal mengirim, coba lagi.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-name" className="mb-1 block text-sm font-medium text-white/70">
            Nama
          </label>
          <input id="p-name" name="name" required placeholder="Nama lengkap" className="input-futuristic" />
        </div>
        <div>
          <label htmlFor="p-company" className="mb-1 block text-sm font-medium text-white/70">
            Nama Perusahaan
          </label>
          <input id="p-company" name="company" placeholder="PT / Brand lo" className="input-futuristic" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-email" className="mb-1 block text-sm font-medium text-white/70">
            Email
          </label>
          <input id="p-email" name="email" type="email" required placeholder="email@contoh.com" className="input-futuristic" />
        </div>
        <div>
          <label htmlFor="p-wa" className="mb-1 block text-sm font-medium text-white/70">
            No. WhatsApp
          </label>
          <input id="p-wa" name="whatsapp" placeholder="08xxxxxxxxxx" className="input-futuristic" />
        </div>
      </div>

      <div>
        <label htmlFor="p-kind" className="mb-1 block text-sm font-medium text-white/70">
          Jenis Kerjasama
        </label>
        <select id="p-kind" name="kind" className="input-futuristic">
          <option value="Kelas Private">Kelas Private</option>
          <option value="Workshop Kantor">Workshop Kantor</option>
          <option value="Setup Agent">Setup Agent AI</option>
          <option value="Mentoring Rutin">Mentoring Rutin</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>

      <div>
        <label htmlFor="p-message" className="mb-1 block text-sm font-medium text-white/70">
          Ceritakan kebutuhannya
        </label>
        <textarea
          id="p-message"
          name="message"
          rows={4}
          placeholder="Timnya berapa orang, targetnya apa, kapan mulai?"
          className="input-futuristic"
        />
      </div>

      {/* honeypot — bot pengisi form akan mengisinya, manusia tidak */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <button
        type="submit"
        disabled={state === "sending"}
        className="btn-glow anim-pulse-glow rounded-xl px-4 py-3.5 text-base font-bold transition disabled:opacity-50"
      >
        {state === "sending" ? "Mengirim…" : "Ajukan Kerjasama"}
      </button>

      {message ? (
        <p
          className={
            state === "ok"
              ? "text-center text-sm text-[var(--accent)]"
              : "text-center text-sm text-red-300"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
