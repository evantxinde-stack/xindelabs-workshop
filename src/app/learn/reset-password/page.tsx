"use client";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { LearnShell } from "../catalog";

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Memeriksa link reset…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const code = new URLSearchParams(location.search).get("code");
      if (!code) { setMessage("Link reset tidak valid. Minta link baru dari halaman login."); return; }
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) { setMessage("Link reset kadaluarsa. Minta link baru dari halaman login."); return; }
      setReady(true);
      setMessage("");
    })();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage(error.message); setBusy(false); return; }
    const token = data.user ? (await supabase.auth.getSession()).data.session?.access_token : "";
    if (token) await fetch("/api/member/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: token }) });
    setMessage("Password diganti. Mengalihkan ke dashboard…");
    location.href = "/learn/dashboard";
  }

  return <LearnShell><div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0B1F16] p-6">
    <p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">Member Area</p>
    <h1 className="mt-3 text-3xl font-bold">Password baru</h1>
    {ready ? <form onSubmit={submit} className="mt-6 space-y-3">
      <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password baru (min. 6 karakter)" className="input-dark w-full" />
      <button disabled={busy} className="w-full rounded-lg bg-[#00ff88] px-4 py-3 font-bold text-[#050A07]">{busy ? "Menyimpan…" : "Simpan password"}</button>
    </form> : <p className="mt-4 text-sm text-white/60">{message}</p>}
    {ready && message && <p className="mt-4 text-sm text-[#00ff88]">{message}</p>}
    <a href="/learn/login" className="mt-5 inline-block text-sm text-white/50 underline">Ke halaman login</a>
  </div></LearnShell>;
}
