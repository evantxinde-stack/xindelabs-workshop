"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FreeAccessButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button disabled={busy} onClick={async () => {
    setBusy(true);
    const r = await fetch("/api/member/free-access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401 && data.login) { router.push(`/learn/login?next=${encodeURIComponent(`/learn/workshop/${slug}`)}`); return; }
    if (!r.ok) { alert(data.error || "Akses gagal"); setBusy(false); return; }
    router.push(data.redirect);
  }} className="rounded-full bg-[#00ff88] px-4 py-2 text-[13px] font-bold text-[#0a1f12]">{busy ? "memproses..." : "Akses Gratis"}</button>;
}
