"use client";

import { useEffect, useState } from "react";

const FIELDS = [
  {
    key: "meta_pixel",
    label: "Meta Pixel ID",
    sub: "ID numerik dari Meta Events Manager (mis. 1234567890).",
    placeholder: "e.g. 1234567890",
  },
  {
    key: "tiktok_pixel",
    label: "TikTok Pixel ID",
    sub: "SDK ID TikTok (mis. C1234ABC5DE).",
    placeholder: "e.g. C1234ABC5DE",
  },
];

const inputCls = "input-dark mt-1 w-full";

export default function PixelsPage() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/pixels")
      .then((r) => r.json())
      .then((d) => setVals(d))
      .catch(() => setMsg("Gagal memuat (pastikan tabel settings sudah dijalankan)."));
  }, []);

  async function save() {
    setStatus("saving");
    const r = await fetch("/api/admin/pixels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vals),
    });
    const d = await r.json().catch(() => ({}));
    setStatus(r.ok ? "ok" : "err");
    setMsg(r.ok ? "Tersimpan. Refresh situs untuk memberlakukan pixel." : d.error ?? "Gagal simpan");
  }

  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Pixel Meta & TikTok</h1>
        <p className="mt-0.5 text-sm text-white/45">
          Pixel dipasang otomatis di semua halaman funnel (bukan LMS statis).
        </p>
      </header>
      <div className="panel p-5">
        <div className="space-y-4">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm font-medium text-white/80">{f.label}</span>
              <p className="mb-1 text-xs text-white/45">{f.sub}</p>
              <input
                type="text"
                className={inputCls}
                value={vals[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} disabled={status === "saving"} className="rounded-lg bg-[#00FF88] px-4 py-2 text-sm font-bold text-black disabled:opacity-50">
            {status === "saving" ? "Menyimpan…" : "Simpan"}
          </button>
          {msg && <p className="text-xs text-white/60">{msg}</p>}
        </div>
      </div>
    </>
  );
}