"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key");

export default function MemberPricing({ classes }: { classes: any[] }) {
  const [rows, setRows] = useState(classes);
  const [busy, setBusy] = useState<string | null>(null);
  async function save(id: string, value: string) {
    setBusy(id);
    const price = value === "" ? null : Number(value);
    const { error } = await db.from("classes").update({ member_cross_sell_price: price }).eq("id", id);
    if (!error) setRows(rows.map((row) => row.id === id ? { ...row, member_cross_sell_price: price } : row));
    setBusy(null);
  }
  return <section className="panel mt-8 p-5">
    <h2 className="text-lg font-bold text-white">Harga Cross-Sell Member</h2>
    <p className="mt-1 text-xs text-white/45">Harga ini tampil saat member membuka kelas yang terkunci.</p>
    <div className="mt-4 space-y-2">
      {rows.map((row) => <div key={row.id} className="grid gap-2 border-b border-white/10 py-3 sm:grid-cols-[1fr_180px_90px] sm:items-center">
        <div><p className="text-sm text-white">{row.title}</p><p className="text-xs text-white/35">{row.product_type || row.type || "course"}</p></div>
        <input defaultValue={row.member_cross_sell_price ?? ""} type="number" min="0" placeholder="Rp harga member" aria-label={`Harga member ${row.title}`} className="input-dark" onChange={(e) => setRows(rows.map((x) => x.id === row.id ? { ...x, draft: e.target.value } : x))} />
        <button disabled={busy === row.id} onClick={() => save(row.id, row.draft ?? String(row.member_cross_sell_price ?? ""))} className="btn-primary px-3 py-2 text-xs">{busy === row.id ? "..." : "Simpan"}</button>
      </div>)}
      {!rows.length && <p className="text-sm text-white/40">Belum ada produk.</p>}
    </div>
  </section>;
}
