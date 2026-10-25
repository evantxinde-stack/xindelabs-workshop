"use client";

import { useState } from "react";
import { FAST_TRACK_TIERS } from "@/lib/mayar";

type Tier = "yearly" | "lifetime";

export function PayButton({ product, leadId, priceIdr }: { product: string; leadId?: string; priceIdr?: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>("yearly");
  const [voucher, setVoucher] = useState("");

  const isWorkshop = product === "fast_track";

  async function pay() {
    if (!leadId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          lead_id: leadId,
          ...(isWorkshop ? { tier, voucher } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Terjadi kesalahan. Coba lagi.");
        return;
      }
      window.location.href = json.link;
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {isWorkshop ? null : null}
      {isWorkshop && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {(["yearly", "lifetime"] as Tier[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  tier === t
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-white/15 hover:border-white/30"
                }`}
              >
                <span className="block text-sm text-white/70">
                  {t === "yearly" ? "Tahunan" : "Lifetime"}
                </span>
                <span className="price-tag text-sm">
                  {t === "yearly" ? "Rp599.000" : "Rp999.000"}
                </span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={voucher}
            onChange={(e) => setVoucher(e.target.value)}
            placeholder="Kode voucher (opsional)"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[var(--accent)]"
          />
          <div className="space-y-1 text-xs text-white/40">
            <p>Kode tersedia: <span className="font-mono">EARLYBIRD</span> (diskon untuk Tahunan/Lifetime)</p>
            <p>Kode Lifetime: <span className="font-mono">LIFETIME50</span> (bisa dicoba untuk paket Lifetime)</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={pay}
        disabled={!leadId || busy}
        className="btn-glow w-full rounded-xl px-6 py-3.5 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Memproses..." : "Lanjutkan ke Pembayaran"}
      </button>
      {!leadId && (
        <p className="mt-2 text-sm text-white/40">
          Untuk melanjutkan, isi form tutorial di halaman utama dulu.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}