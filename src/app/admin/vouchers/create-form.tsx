"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key"
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
    <form onSubmit={submit} className="panel mt-6 grid gap-4 p-5 md:grid-cols-8">
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="KODE" className="input-dark uppercase" required />
      <select value={type} onChange={(e) => setType(e.target.value)} className="input-dark">
        <option value="percent">Percent</option>
        <option value="fixed">Fixed (Rp)</option>
      </select>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Nilai" type="number" className="input-dark" required />
      <select value={tier} onChange={(e) => setTier(e.target.value)} className="input-dark">
        <option value="all">all</option>
        <option value="yearly">yearly</option>
        <option value="lifetime">lifetime</option>
      </select>
      <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Max Uses" type="number" className="input-dark" />
      <input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" className="input-dark" />
      <button disabled={loading} className="btn-glow rounded-xl px-4 py-2 text-sm font-bold">{loading ? "..." : "Tambah"}</button>
    </form>
  );
}
