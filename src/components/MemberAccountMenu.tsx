"use client";
import { useState } from "react";
export default function MemberAccountMenu() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    await fetch("/api/member/logout", { method: "POST" });
    location.href = "/learn";
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/member/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, password: next }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Password diganti. Gunakan password baru saat login berikutnya." : data.error || "Gagal ganti password.");
    if (res.ok) { setCurrent(""); setNext(""); }
    setBusy(false);
  }
  const field = "input-dark w-full";
  return <div className="flex flex-col items-end gap-2">
    <div className="flex items-center gap-2">
      <button onClick={() => setOpen(!open)} className="rounded-lg border border-white/15 px-3 py-2 text-[13px] text-white/70 transition hover:text-[#00ff88]">Ganti password</button>
      <button onClick={logout} className="rounded-lg border border-white/15 px-3 py-2 text-[13px] text-white/70 transition hover:text-[#00ff88]">Logout</button>
    </div>
    {open && <form onSubmit={changePassword} className="w-full max-w-sm space-y-2 rounded-xl border border-white/10 bg-[#0B1F16] p-4 text-left">
      <input required type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Password sekarang" className={field} />
      <input required minLength={6} type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Password baru (min. 6 karakter)" className={field} />
      <button disabled={busy} className="w-full rounded-lg bg-[#00ff88] px-4 py-2.5 font-bold text-[#050A07]">{busy ? "Menyimpan…" : "Simpan password"}</button>
      {message && <p className="text-[13px] text-[#00ff88]">{message}</p>}
    </form>}
  </div>;
}
