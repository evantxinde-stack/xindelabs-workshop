"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const next = new URLSearchParams(window.location.search).get("next") || "/admin";
        router.replace(next.startsWith("/admin") ? next : "/admin");
        router.refresh();
      } else {
        setError("Password salah.");
        setLoading(false);
      }
    } catch {
      setError("Gagal menghubungi server.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel w-full max-w-sm space-y-4 p-8">
      <div className="flex items-center gap-2.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#00FF88] shadow-[0_0_12px_var(--glow)]" />
        <p className="text-sm font-bold tracking-wide">XindeLabs Control Panel</p>
      </div>
      <h1 className="text-xl font-bold">Admin Login</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password admin"
        autoFocus
        required
        className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#00FF88]"
      />
      {error ? <p className="text-[13px] text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full rounded-lg bg-[#00FF88] py-3 text-sm font-bold text-[#0a1f12] transition hover:bg-[#5cffb3] disabled:opacity-40"
      >
        {loading ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
