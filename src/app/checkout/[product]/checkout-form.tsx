"use client";

import { useState } from "react";
import { DiscordIdHelp } from "@/components/DiscordIdHelp";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export type CheckoutBumpOffer = {
  amount: number;
  title: string | null;
  description?: string | null;
  strikePrice?: number | null;
};

export function CheckoutForm({
  product,
  leadId,
  priceIdr,
  classId,
  discordRoleId,
  paymentOptions = ["lifetime"],
  bump,
  defaults,
}: {
  product: string;
  leadId?: string;
  priceIdr?: number;
  classId?: string;
  discordRoleId?: string;
  paymentOptions?: string[];
  bump?: CheckoutBumpOffer;
  defaults?: { name?: string; email?: string; whatsapp?: string };
}) {
  const [name, setName] = useState(defaults?.name || "");
  const [email, setEmail] = useState(defaults?.email || "");
  const [whatsapp, setWhatsapp] = useState(defaults?.whatsapp || "");
  const [discord, setDiscord] = useState("");
  const [voucher, setVoucher] = useState("");
  const [orderBump, setOrderBump] = useState(false);
  const [paymentOption, setPaymentOption] = useState(
    paymentOptions.includes("annual") ? "annual" : "lifetime",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const totalIdr = (priceIdr ?? 0) + (orderBump && bump ? bump.amount : 0);

  async function pay() {
    if (
      name.trim().length < 2 ||
      !/^\S+@\S+\.\S+$/.test(email.trim()) ||
      whatsapp.trim().length < 8 ||
      (discord && !/^\d{17,20}$/.test(discord))
    ) {
      setError("Isi nama, email, dan WhatsApp dengan benar. Discord User ID opsional.");
      return;
    }
    setBusy(true);
    setError("");
    window.fbq?.("track", "InitiateCheckout", {
      content_name: product,
      content_type: "product",
      currency: "IDR",
      value: totalIdr,
    });
    const r = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product,
        lead_id: leadId,
        name,email,whatsapp,
        discord_id: discord,
        voucher,
        amount: totalIdr,
        order_bump: orderBump,
        class_id: classId,
        discord_role_id: discordRoleId,
        payment_option:paymentOption,
      }),
    });
    const j = await r.json();
    if (!r.ok) setError(j.error || "Checkout gagal");
    else location.href = j.link;
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {paymentOptions.length > 1 ? (
        <div className="grid grid-cols-2 gap-2">
          {paymentOptions.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setPaymentOption(x)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                paymentOption === x
                  ? "border-[#00ff88] bg-[#00ff88]/10 font-semibold text-[#00ff88]"
                  : "border-white/15 text-white/60"
              }`}
            >
              {x === "annual" ? "12 Bulan (Annual)" : "Lifetime"}
            </button>
          ))}
        </div>
      ) : null}

      <label className="block text-sm text-white/70">
        Nama lengkap
        <input
          required
          aria-required="true"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-dark mt-1 min-h-11 w-full border-white/25"
        />
      </label>

      <label className="block text-sm text-white/70">
        Email
        <input
          required
          aria-required="true"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-dark mt-1 min-h-11 w-full border-white/25"
        />
      </label>

      <label className="block text-sm text-white/70">
        No. WhatsApp
        <input
          required
          aria-required="true"
          inputMode="tel"
          type="tel"
          autoComplete="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="08xxxxxxxxxx"
          className="input-dark mt-1 min-h-11 w-full border-white/25"
        />
      </label>

      <label className="block text-sm text-white/70">
        Discord User ID (opsional)
        <input
          inputMode="numeric"
          autoComplete="off"
          value={discord}
          onChange={(e) => setDiscord(e.target.value.replace(/\D/g, ""))}
          placeholder="Contoh: 123456789012345678"
          className="input-dark mt-1 min-h-11 w-full border-white/25"
        />
      </label>

      <DiscordIdHelp label="Cara mendapatkan Discord User ID" />

      {/* Interactive Order Bump Box */}
      {bump && bump.amount > 0 ? (
        <label
          className={`block cursor-pointer rounded-xl border-2 border-dashed p-4 transition ${
            orderBump
              ? "border-[#00ff88] bg-[#00ff88]/10"
              : "border-[#00ff88]/40 bg-[#0A140E]/90 hover:border-[#00ff88]/75"
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={orderBump}
              onChange={(e) => setOrderBump(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#00ff88]"
            />
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded bg-[#00ff88]/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#00ff88]">
                Penawaran Sekali Klik · Order Bump
              </span>
              <p className="mt-1.5 text-sm font-bold text-white">
                {bump.title || "Tambahkan paket bonus ini"}
              </p>
              {bump.description ? (
                <p className="mt-1 text-xs leading-relaxed text-white/60">{bump.description}</p>
              ) : null}
              <p className="mt-2 flex items-baseline gap-2 font-mono text-xs">
                <strong className="text-[#00ff88]">
                  + Rp{bump.amount.toLocaleString("id-ID")}
                </strong>
                {bump.strikePrice && bump.strikePrice > bump.amount ? (
                  <span className="text-white/35 line-through">
                    Rp{bump.strikePrice.toLocaleString("id-ID")}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </label>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5 text-xs text-white/65">
        <div className="flex items-center justify-between">
          <span>Total pembayaran</span>
          <b className="font-mono text-sm text-[#00ff88]">
            Rp{totalIdr.toLocaleString("id-ID")}
          </b>
        </div>
        {orderBump && bump ? (
          <p className="mt-1 text-[11px] text-white/45">
            Termasuk Order Bump (+Rp{bump.amount.toLocaleString("id-ID")})
          </p>
        ) : null}
      </div>

      <input
        value={voucher}
        onChange={(e) => setVoucher(e.target.value)}
        placeholder="Kode voucher (opsional)"
        className="input-dark min-h-11 w-full border-white/25"
      />

      <button
        onClick={pay}
        disabled={busy}
        className="btn-glow w-full rounded-xl px-6 py-3.5 font-bold disabled:opacity-40"
      >
        {busy ? "Memproses…" : "Lanjutkan ke Pembayaran"}
      </button>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
