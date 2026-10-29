"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { LearnShell } from "../../catalog";

const FAILED = "/learn/login?error=oauth";

export default function MemberOAuthCallback() {
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      if (!code) { location.replace(FAILED); return; }
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) { location.replace(FAILED); return; }
      await fetch("/api/member/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: data.session.access_token }),
      });
      location.replace("/learn/dashboard");
    })();
  }, []);
  return <LearnShell><div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0B1F16] p-6 text-center"><p className="font-mono text-xs uppercase tracking-[.25em] text-[#00ff88]">Member Area</p><h1 className="mt-3 text-2xl font-bold">Menyelesaikan login…</h1><p className="mt-3 text-sm text-white/50">Sebentar, jangan tutup halaman ini.</p></div></LearnShell>;
}
