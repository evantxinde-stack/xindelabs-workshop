"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function CreateVoucherForm() {
  const [code, setCode] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState("10");
  const [tier, setTier] = useState("all");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("vouchers").insert({
      code: code.toUpperCase().trim(),
      type,
      value: Number(value),
      tier,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt || null,
      active: true,
    });
    setLoading(false);
    location.reload();
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border border-white/10 p-4 md:grid-cols-8">
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="KODE" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm uppercase" required />
      <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
        <option value="percent">Percent</option>
        <option value="fixed">Fixed (Rp)</option>
      </select>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Nilai" type="number" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" required />
      <select value={tier} onChange={(e) => setTier(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
        <option value="all">all</option>
        <option value="yearly">yearly</option>
        <option value="lifetime">lifetime</option>
      </select>
      <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Max Uses" type="number" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" />
      <input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" />
      <button disabled={loading} className="btn-glow rounded-xl px-4 py-2 text-sm font-bold">{loading ? "..." : "Tambah"}</button>
    </form>
  );
}
