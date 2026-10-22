"use client";

import { useEffect, useRef, useState } from "react";

type Tpl = { id: string; key: string; subject: string | null; html_body: string | null; body_text: string | null };
type Step = { step: number; day_offset: number; template: Tpl };
type Seq = { id: string; key: string; name: string; steps: Step[] };

const inputCls = "input-dark w-full";
const toolCls =
  "rounded-full px-2.5 py-1 text-[11px] text-white/70 ring-1 ring-white/15 hover:bg-white/10 hover:text-white transition";
const tabCls = (on: boolean) =>
  `rounded-lg px-3 py-1.5 text-xs transition ${on ? "bg-[rgba(0,255,136,.12)] text-white" : "text-white/50 hover:text-white"}`;

const PLACEHOLDERS: { token: string; desc: string }[] = [
  { token: "{{name}}", desc: "Nama lead" },
  { token: "{{email}}", desc: "Email lead" },
  { token: "{{fast_track_url}}", desc: "Link Video Workshop" },
  { token: "{{vip_url}}", desc: "Link Bimbingan VIP" },
  { token: "{{checkout_url}}", desc: "Link checkout aktif" },
  { token: "{{group_url}}", desc: "Link grup" },
  { token: "{{lms_url}}", desc: "Link login Workshop" },
  { token: "{{lms_email}}", desc: "Email akun Workshop" },
  { token: "{{lms_password}}", desc: "Password Workshop (khusus sequence Workshop)" },
];

function cmpName(key: string, name: string) {
  return (
    {
      free_vip_upsell: "Tutorial Gratis",
      fasttrack_access: "Video Workshop",
      vip_onboarding: "VIP",
      abandoned_checkout: "Abandoned Checkout",
    }[key] ?? name
  );
}

function StepEditor({ t, onSaved }: { t: Tpl; onSaved: (t: Tpl) => void }) {
  const [mode, setMode] = useState<"text" | "html">(t.body_text?.trim() ? "text" : "html");
  const [subject, setSubject] = useState(t.subject ?? "");
  const [bodyText, setBodyText] = useState(t.body_text ?? "");
  const [html, setHtml] = useState(t.html_body ?? "");
  const [busy, setBusy] = useState<"" | "saving" | "ok" | "err">("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  const savedActive = mode === "text" ? t.body_text ?? "" : t.html_body ?? "";
  const activeBody = mode === "text" ? bodyText : html;
  const dirty = subject !== (t.subject ?? "") || activeBody !== savedActive;

  function insert(token: string) {
    const el = textRef.current!;
    const start = el.selectionStart ?? bodyText.length;
    const end = el.selectionEnd ?? bodyText.length;
    const next = bodyText.slice(0, start) + token + bodyText.slice(end);
    setBodyText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function save() {
    setBusy("saving");
    const payload: Record<string, string> = { id: t.id, subject };
    payload[mode === "text" ? "body_text" : "html_body"] = mode === "text" ? bodyText : html;
    const r = await fetch("/api/admin/email-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(r.ok ? "ok" : "err");
    if (r.ok) {
      onSaved({
        ...t,
        subject,
        body_text: mode === "text" ? bodyText : "",
        html_body: mode === "html" ? html : t.html_body,
      });
    }
  }

  return (
    <div className="border-t border-white/5 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-white/45">{t.key}</span>
        <div className="flex gap-1">
          <button className={tabCls(mode === "text")} onClick={() => setMode("text")}>Teks</button>
          <button className={tabCls(mode === "html")} onClick={() => setMode("html")}>HTML</button>
          <span className={`text-[11px] ${dirty ? "text-[#ffb86c]" : "text-white/30"}`}>{dirty ? "Belum disimpan" : "Tersimpan"}</span>
        </div>
      </div>

      <div className="mb-2 mt-3">
        <span className="text-xs text-white/45">Subjek</span>
        <input className={`${inputCls} mt-1`} value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      {mode === "text" && (
        <>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PLACEHOLDERS.map((p) => (
              <button key={p.token} className={toolCls} title={p.desc} onClick={() => insert(p.token)}>
                {p.token}
              </button>
            ))}
          </div>
          <textarea
            ref={textRef}
            className={`${inputCls} mt-2 min-h-[240px] resize-y`}
            value={bodyText}
            placeholder="Tulis isi email di sini tanpa HTML. Baris kosong = paragraf baru. Klik placeholder di atas untuk menyisipkan di kursor."
            onChange={(e) => setBodyText(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-white/35">
            Baris kosong = paragraf baru; satu baris = garis baru. Placeholder diganti otomatis saat email dikirim.
          </p>
        </>
      )}

      {mode === "html" && (
        <textarea
          className={`${inputCls} mt-2 min-h-[240px] resize-y font-mono text-xs`}
          value={html}
          placeholder="Isi HTML email di sini (power user)."
          onChange={(e) => setHtml(e.target.value)}
        />
      )}

      <button
        onClick={save}
        disabled={!dirty || busy === "saving"}
        className="mt-2 rounded-lg bg-[#00FF88] px-3 py-1.5 text-xs font-bold text-black disabled:opacity-40"
      >
        {busy === "saving" ? "Menyimpan…" : busy === "ok" ? "✓ Tersimpan" : "Simpan"}
      </button>
    </div>
  );
}

export default function FollowupEditor() {
  const [seqs, setSeqs] = useState<Seq[]>([]);
  const [active, setActive] = useState<Seq["id"] | "">("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/email-templates")
      .then((r) => r.json())
      .then((d) => {
        setSeqs(d.sequences ?? []);
        if (d.sequences?.[0]) setActive(d.sequences[0].id);
      })
      .catch(() => setErr("Gagal memuat sequence."));
  }, []);

  const cur = seqs.find((s) => s.id === active);

  return (
    <>
      <header className="scroll-mt-20">
        <h1 className="text-2xl font-bold">Email Follow-up</h1>
        <p className="mt-0.5 text-sm text-white/45">
          Kelola urutan email otomatis tiap funnel. Mode Teks = tulis biasa tanpa HTML; placeholder dipilih & disisipkan otomatis.
        </p>
      </header>
      {err && <p className="text-sm text-[#ff6b6b]">{err}</p>}

      <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
        <div className="panel p-2">
          {seqs.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full rounded-lg px-3 py-2.5 text-left transition ${active === s.id ? "bg-[rgba(0,255,136,.12)] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
            >
              <p className="text-sm font-medium italic">{cmpName(s.key, s.name)}</p>
              <p className="mt-0.5 font-mono text-[11px] text-white/35">{s.key}</p>
              <p className="text-[11px] text-white/40">{s.steps.length} email</p>
            </button>
          ))}
          {seqs.length === 0 && <p className="px-3 py-4 text-sm text-white/40">Belum ada sequence.</p>}
        </div>

        <div className="panel divide-y divide-white/5 p-0">
          {cur ? (
            cur.steps.map((st) => (
              <StepEditor key={st.template.id} t={st.template} onSaved={(tpl) => setSeqs((prev) => prev.map((s) => (s.id === cur.id ? { ...s, steps: s.steps.map((x) => (x.template.id === tpl.id ? { ...x, template: tpl } : x)) } : s)))} />
            ))
          ) : (
            <p className="p-5 text-sm text-white/40">Pilih sequence di kiri.</p>
          )}
        </div>
      </div>
    </>
  );
}