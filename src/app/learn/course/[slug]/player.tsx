"use client";

import { useState } from "react";
import { progressPct, nextLesson } from "@/lib/learning";
import { parseLessonContent, renderLessonBodyHtml } from "@/lib/lesson-content";

export default function CoursePlayer({
  cls,
  lessons,
  initialDone = [],
  existingCertificate = "",
}: {
  cls: any;
  lessons: any[];
  initialDone?: string[];
  existingCertificate?: string;
}) {
  const [selected, setSelected] = useState(lessons[0]);
  const [done, setDone] = useState<string[]>(initialDone);
  const [certificate, setCertificate] = useState(existingCertificate);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function complete() {
    if (!selected) return;
    const response = await fetch("/api/member/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: selected.id, class_id: cls.id, completed: true }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Gagal simpan progress");
      return;
    }
    setError("");
    const next = done.includes(selected.id) ? done : [...done, selected.id];
    setDone(next);
    const following = nextLesson(lessons, next);
    if (following) setSelected(following);
  }

  async function claimCertificate() {
    const response = await fetch("/api/member/certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id: cls.id }),
    });
    const body = await response.json();
    setCertificate(body.data?.certificate_number || body.error || "Gagal klaim sertifikat");
  }

  const pct = progressPct(lessons, done);
  const parsed = selected
    ? parseLessonContent(selected.content_html || selected.content, selected.pdf_url)
    : { body: "", links: [] };
  const bodyHtml = renderLessonBodyHtml(parsed.body);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-white/10 bg-[#0B1F16] p-4">
        <p className="mb-3 text-xs uppercase text-[#00ff88]">Modul / Bab</p>
        <div className="space-y-1">
          {lessons.map((l: any, idx: number) => (
            <button
              key={l.id}
              onClick={() => {
                setSelected(l);
                setCopied(false);
              }}
              className={`block w-full rounded-lg p-3 text-left text-sm transition ${
                selected?.id === l.id
                  ? "bg-[#00ff88] font-semibold text-[#050A07]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="mr-1.5 font-mono text-xs opacity-70">
                {done.includes(l.id) ? "✓" : String(idx + 1).padStart(2, "0")}
              </span>
              {l.title}
            </button>
          ))}
        </div>
      </aside>

      <section>
        <div className="mb-2 flex items-center justify-between text-xs text-white/45">
          <span>Progress</span>
          <span>
            {pct}% · {done.length}/{lessons.length} bab
          </span>
        </div>
        <div className="mb-5 h-2 rounded-full bg-white/10">
          <div className="h-2 rounded-full bg-[#00ff88] transition-all" style={{ width: `${pct}%` }} />
        </div>

        {selected ? (
          <>
            <h2 className="text-2xl font-bold">{selected.title}</h2>

            {selected.youtube_id ? (
              <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${encodeURIComponent(selected.youtube_id)}`}
                  title={selected.title}
                  allowFullScreen
                />
              </div>
            ) : null}

            {bodyHtml ? (
              <div
                className="prose-invert mt-5 space-y-3 rounded-2xl border border-white/10 bg-[#0A140E]/80 p-5 text-[15px] leading-7 text-white/80"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : null}

            {Boolean(selected.prompt) || parsed.links.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {Boolean(selected.prompt) ? (
                  <div className="rounded-xl border border-white/10 bg-[#0B1F16] p-4">
                    <h3 className="font-bold">Prompt</h3>
                    <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/70">
                      {selected.prompt}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selected.prompt);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1800);
                      }}
                      className="mt-3 rounded-lg border border-[#00ff88]/40 px-3 py-2 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/10"
                    >
                      {copied ? "Tersalin ✓" : "Copy Prompt"}
                    </button>
                  </div>
                ) : null}

                {parsed.links.length > 0 ? (
                  <div className="rounded-xl border border-white/10 bg-[#0B1F16] p-4">
                    <h3 className="font-bold">Tautan & Materi</h3>
                    <div className="mt-3 space-y-2">
                      {parsed.links.map((link, i) => (
                        <a
                          key={`${link.url}-${i}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3.5 py-2.5 text-sm text-[#00ff88] transition hover:border-[#00ff88]/50 hover:bg-[#00ff88]/5"
                        >
                          <span className="truncate font-medium">{link.label}</span>
                          <span className="shrink-0 font-mono text-xs">↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={complete}
                className="rounded-lg bg-[#00ff88] px-4 py-3 font-bold text-[#050A07] transition hover:bg-[#5cffb3]"
              >
                {done.includes(selected.id) ? "Selesai ✓" : "Tandai Selesai"}
              </button>
              {pct === 100 && !certificate ? (
                <button
                  onClick={claimCertificate}
                  className="rounded-lg border border-[#00ff88]/40 px-4 py-3 text-[#00ff88] hover:bg-[#00ff88]/10"
                >
                  Klaim Sertifikat
                </button>
              ) : null}
            </div>

            {error ? <p className="mt-3 text-sm text-[#ff6b6b]">{error}</p> : null}

            {certificate ? (
              <div className="mt-5 rounded-2xl border border-[#00ff88]/40 bg-[#0B1F16] p-5">
                <p className="font-mono text-xs uppercase text-[#00ff88]">Sertifikat</p>
                <h3 className="mt-2 text-xl font-bold">{certificate}</h3>
                <p className="mt-1 text-sm text-white/50">{cls.title}</p>
                <a
                  href={`/certificate/${certificate}`}
                  target="_blank"
                  className="mt-3 inline-block text-sm text-[#00ff88]"
                >
                  Verifikasi / bagikan sertifikat →
                </a>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-white/50">Belum ada materi.</p>
        )}
      </section>
    </div>
  );
}
