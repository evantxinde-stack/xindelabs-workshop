"use client";

import { useState } from "react";
import { DiscordIdHelp } from "@/components/DiscordIdHelp";
import type { ClassRow } from "./catalog";

export default function FlagshipCheckout({ item, displayTitle = "Bangun Karyawan Super 24/7" }: { item: ClassRow; displayTitle?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    setBusy(true); setError("");
    const body = { product: item.slug, class_id: item.id, name: form.get("name"), email: form.get("email"), whatsapp: form.get("whatsapp"), discord_id: form.get("discord_id") || undefined, voucher: form.get("voucher") || undefined, payment_option: "lifetime" };
    const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.link) { setError(json.error || "Checkout gagal. Coba lagi."); setBusy(false); return; }
    location.href = json.link;
  }
  return <>
    <button onClick={() => setOpen(true)} className="btn-glow rounded-full px-6 py-3.5 font-bold">Mulai bangun sekarang ↗</button>
    {open && <div role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <form action={submit} className="glass my-8 w-full max-w-md rounded-2xl border border-[#00ff88]/30 p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#00ff88]">Daftar sekarang</p><h2 id="checkout-title" className="mt-2 text-2xl font-bold">{displayTitle}</h2></div><button type="button" aria-label="Tutup checkout" onClick={() => setOpen(false)} className="min-h-11 min-w-11 rounded-full text-2xl text-white/70 hover:bg-white/10 hover:text-white">×</button></div>
        <p className="mt-3 text-sm text-white/55">Isi data. Setelah itu lo diarahkan ke pembayaran Mayar.</p>
        <div className="mt-6 space-y-4"><label className="block text-sm text-white/70">Nama lengkap<input name="name" required autoComplete="name" className="input-dark mt-1 min-h-11 w-full border-white/25" /></label><label className="block text-sm text-white/70">Email<input name="email" required type="email" autoComplete="email" className="input-dark mt-1 min-h-11 w-full border-white/25" /></label><label className="block text-sm text-white/70">No. WhatsApp<input name="whatsapp" required type="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" className="input-dark mt-1 min-h-11 w-full border-white/25" /></label><label className="block text-sm text-white/70">Discord User ID <span className="text-white/40">(opsional)</span><input name="discord_id" inputMode="numeric" className="input-dark mt-1 min-h-11 w-full border-white/25" placeholder="Contoh: 123456789012345678" /></label><DiscordIdHelp label="Cara mendapatkan Discord User ID" /><input name="voucher" placeholder="Kode voucher (opsional)" className="input-dark min-h-11 w-full border-white/25" /><button disabled={busy} className="btn-glow w-full rounded-xl px-6 py-3.5 font-bold disabled:opacity-50">{busy ? "Menghubungkan ke Mayar…" : "Lanjutkan ke Pembayaran"}</button>{error && <p role="alert" className="text-sm text-red-300">{error}</p>}</div>
      </form>
    </div>}
  </>;
}
