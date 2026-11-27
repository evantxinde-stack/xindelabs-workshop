"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Section } from "../../shared";
import {
  detectLessonMode,
  parseLessonContent,
  serializeLessonContent,
  type LessonLink,
  type LessonMode,
} from "@/lib/lesson-content";

type ClassRow = {
  id: string;
  slug: string;
  title: string;
  product_type: string;
  is_published: boolean;
};

type RawLesson = {
  id: string;
  class_id: string;
  title: string;
  youtube_id?: string | null;
  content?: string | null;
  prompt?: string | null;
  pdf_url?: string | null;
  sort_order: number;
};

type DraftLesson = {
  id?: string;
  class_id: string;
  title: string;
  sort_order: number;
  mode: LessonMode;
  youtube_id: string;
  body: string;
  prompt: string;
  links: LessonLink[];
};

const MODES: { key: LessonMode; label: string; desc: string }[] = [
  { key: "video", label: "Video", desc: "Embed video YouTube" },
  { key: "text", label: "Teks / Artikel", desc: "Materi bacaan & panduan" },
  { key: "combo", label: "Kombinasi (Video + Teks)", desc: "Video disertai penjelasan teks" },
];

function extractYoutubePreviewId(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop() || "";
    }
  } catch {}
  return s.replace(/^.*(?:v=|youtu\.be\/)/, "").split(/[?&#]/)[0] || "";
}

function toDraft(lesson: RawLesson): DraftLesson {
  const { body, links } = parseLessonContent(lesson.content, lesson.pdf_url);
  return {
    id: lesson.id,
    class_id: lesson.class_id,
    title: lesson.title,
    sort_order: lesson.sort_order ?? 0,
    mode: detectLessonMode({ youtube_id: lesson.youtube_id, body }),
    youtube_id: lesson.youtube_id || "",
    body,
    prompt: lesson.prompt || "",
    links,
  };
}

function emptyDraft(classId: string, order: number): DraftLesson {
  return {
    class_id: classId,
    title: "",
    sort_order: order,
    mode: "video",
    youtube_id: "",
    body: "",
    prompt: "",
    links: [],
  };
}

function lessonBadge(lesson: RawLesson): string {
  const { body, links } = parseLessonContent(lesson.content, lesson.pdf_url);
  const mode = detectLessonMode({ youtube_id: lesson.youtube_id, body });
  const base = mode === "combo" ? "Video + Teks" : mode === "text" ? "Teks" : "Video";
  return links.length ? `${base} · ${links.length} link` : base;
}

export default function AdminCourseModulesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassRow | null>(null);
  const [lessons, setLessons] = useState<RawLesson[]>([]);
  const [draft, setDraft] = useState<DraftLesson | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function loadLessons(cls: ClassRow, keepLessonId?: string) {
    setLoadingLessons(true);
    const r = await fetch(`/api/admin/lessons?class_id=${encodeURIComponent(cls.id)}`);
    const j = await r.json().catch(() => ({}));
    const list: RawLesson[] = j.data ?? [];
    setLessons(list);
    setLoadingLessons(false);

    if (keepLessonId) {
      const found = list.find((l) => l.id === keepLessonId);
      if (found) {
        setDraft(toDraft(found));
        return;
      }
    }
    setDraft(list[0] ? toDraft(list[0]) : emptyDraft(cls.id, 0));
  }

  useEffect(() => {
    async function init() {
      setLoadingClasses(true);
      const r = await fetch("/api/admin/classes");
      const j = await r.json().catch(() => ({}));
      const list: ClassRow[] = j.data ?? [];
      setClasses(list);
      setLoadingClasses(false);

      const paramId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("class_id")
          : null;
      const initial = list.find((c) => c.id === paramId) ?? list[0] ?? null;
      if (initial) {
        setSelectedClass(initial);
        void loadLessons(initial);
      }
    }
    void init();
  }, []);

  function selectClass(cls: ClassRow) {
    setSelectedClass(cls);
    setStatus(null);
    void loadLessons(cls);
  }

  function startNewLesson() {
    if (!selectedClass) return;
    setDraft(emptyDraft(selectedClass.id, lessons.length));
    setStatus(null);
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !selectedClass) return;
    if (!draft.title.trim()) {
      setStatus({ type: "err", text: "Judul modul wajib diisi." });
      return;
    }

    setSaving(true);
    setStatus(null);

    const youtubeValue = draft.mode === "text" ? null : draft.youtube_id.trim() || null;
    const bodyValue = draft.mode === "video" ? "" : draft.body;
    const { content, pdf_url } = serializeLessonContent(bodyValue, draft.links);

    const payload = {
      id: draft.id,
      class_id: selectedClass.id,
      title: draft.title.trim(),
      sort_order: Number(draft.sort_order || 0),
      youtube_id: youtubeValue,
      content,
      pdf_url,
      prompt: draft.prompt.trim() || null,
    };

    const r = await fetch("/api/admin/lessons", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus({ type: "err", text: j.error || "Gagal menyimpan modul." });
    } else {
      setStatus({ type: "ok", text: "Modul berhasil disimpan!" });
      await loadLessons(selectedClass, j.data?.id ?? draft.id);
    }
    setSaving(false);
  }

  async function deleteLesson(lesson: RawLesson) {
    if (!selectedClass || !window.confirm(`Hapus modul "${lesson.title}"?`)) return;
    setSaving(true);
    setStatus(null);
    const r = await fetch(`/api/admin/lessons?id=${encodeURIComponent(lesson.id)}`, {
      method: "DELETE",
    });
    if (r.ok) {
      setStatus({ type: "ok", text: "Modul dihapus." });
      await loadLessons(selectedClass);
    } else {
      setStatus({ type: "err", text: "Gagal menghapus modul." });
    }
    setSaving(false);
  }

  async function moveLesson(idx: number, dir: -1 | 1) {
    if (!selectedClass) return;
    const target = idx + dir;
    if (target < 0 || target >= lessons.length) return;
    const a = lessons[idx];
    const b = lessons[target];
    setSaving(true);
    await Promise.all([
      fetch("/api/admin/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...a, sort_order: target }),
      }),
      fetch("/api/admin/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...b, sort_order: idx }),
      }),
    ]);
    await loadLessons(selectedClass, draft?.id);
    setSaving(false);
  }

  const previewYtId = draft ? extractYoutubePreviewId(draft.youtube_id) : "";

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#00ff88]">
            // course builder
          </p>
          <h1 className="mt-2 text-2xl font-bold">Course Management (Modul & Materi)</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">
            Fokus atur isi modul per kelas: bisa berupa Video, Teks, Kombinasi Video + Teks, Prompt, dan banyak tautan/link materi.
          </p>
        </div>
        <Link href="/admin/products" className="btn-outline">
          + Kelola / Tambah Produk →
        </Link>
      </header>

      {/* Class Selector */}
      <div className="panel mb-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label className="block text-xs text-white/50">Pilih Kelas / Produk untuk Diatur Modulnya</label>
            {loadingClasses ? (
              <p className="mt-1.5 text-sm text-white/45">Memuat daftar kelas…</p>
            ) : classes.length > 0 ? (
              <select
                value={selectedClass?.id || ""}
                onChange={(e) => {
                  const found = classes.find((c) => c.id === e.target.value);
                  if (found) selectClass(found);
                }}
                className="input-dark mt-1.5 w-full max-w-xl"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.product_type} · {c.is_published ? "tayang" : "draft"})
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1.5 text-sm text-white/45">
                Belum ada produk. Tambahkan dulu di{" "}
                <Link href="/admin/products" className="text-[#00ff88] underline">
                  Product Management
                </Link>
                .
              </p>
            )}
          </div>
          {selectedClass ? (
            <div className="flex flex-wrap gap-2">
              <a
                href={`/learn/course/${selectedClass.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                Preview Kelas ↗
              </a>
              <button type="button" onClick={startNewLesson} className="btn-glow rounded-lg px-4 py-2 text-xs font-bold">
                + Tambah Modul Baru
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {selectedClass ? (
        <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left: Module List */}
          <Section
            title={`Daftar Modul (${lessons.length})`}
            sub="Klik modul untuk edit atau ubah urutannya."
          >
            {loadingLessons ? (
              <p className="text-sm text-white/45">Memuat modul…</p>
            ) : lessons.length === 0 ? (
              <p className="py-4 text-sm text-white/45">
                Belum ada modul di kelas ini. Klik &ldquo;+ Tambah Modul Baru&rdquo; untuk mulai.
              </p>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, idx) => {
                  const active = draft?.id === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      className={`rounded-xl border p-3 transition ${
                        active
                          ? "border-[#00ff88] bg-[#00ff88]/[.07]"
                          : "border-white/10 bg-white/[.02] hover:border-white/25"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(toDraft(lesson));
                          setStatus(null);
                        }}
                        className="block w-full text-left"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 font-mono text-xs text-[#00ff88]">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                              {lesson.title}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/45">
                              {lessonBadge(lesson)}
                            </p>
                          </div>
                        </div>
                      </button>
                      <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-white/10 pt-2">
                        <button
                          type="button"
                          disabled={idx === 0 || saving}
                          onClick={() => moveLesson(idx, -1)}
                          className="rounded border border-white/10 px-2 py-0.5 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === lessons.length - 1 || saving}
                          onClick={() => moveLesson(idx, 1)}
                          className="rounded border border-white/10 px-2 py-0.5 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => deleteLesson(lesson)}
                          className="rounded border border-red-400/25 px-2 py-0.5 text-xs text-red-300 hover:bg-red-500/10"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Right: Module Editor */}
          <Section
            title={draft?.id ? `Edit Modul: ${draft.title || "Tanpa judul"}` : "Buat Modul Baru"}
            sub="Pilih format modul (Video, Teks, atau Kombinasi) dan tambahkan tautan materi jika perlu."
          >
            {draft ? (
              <form onSubmit={saveLesson} className="space-y-5">
                {status ? (
                  <div
                    className={`rounded-xl border px-4 py-2.5 text-sm ${
                      status.type === "ok"
                        ? "border-[#00ff88]/30 bg-[#00ff88]/10 text-[#86efac]"
                        : "border-red-400/30 bg-red-500/10 text-red-200"
                    }`}
                  >
                    {status.text}
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-[1fr_110px]">
                  <label className="block">
                    <span className="mb-1 block text-xs text-white/60">Judul Modul</span>
                    <input
                      className="input-dark w-full"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="Mis. Bab 1 — Setup AI Agent di VPS"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-white/60">Urutan</span>
                    <input
                      type="number"
                      className="input-dark w-full"
                      value={draft.sort_order}
                      onChange={(e) =>
                        setDraft({ ...draft, sort_order: Number(e.target.value || 0) })
                      }
                    />
                  </label>
                </div>

                {/* Format Selector: Video / Teks / Kombinasi */}
                <div>
                  <span className="mb-2 block text-xs font-medium text-white/65">
                    Format Konten Modul
                  </span>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {MODES.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setDraft({ ...draft, mode: m.key })}
                        className={`rounded-xl border p-3 text-left transition ${
                          draft.mode === m.key
                            ? "border-[#00ff88] bg-[#00ff88]/10 text-white"
                            : "border-white/10 bg-white/[.02] text-white/60 hover:border-white/25"
                        }`}
                      >
                        <span className="block text-xs font-bold">{m.label}</span>
                        <span className="mt-0.5 block text-[11px] opacity-70">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video Section */}
                {draft.mode === "video" || draft.mode === "combo" ? (
                  <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-white/70">
                        Link / ID Video YouTube
                      </span>
                      <input
                        className="input-dark w-full"
                        value={draft.youtube_id}
                        onChange={(e) => setDraft({ ...draft, youtube_id: e.target.value })}
                        placeholder="https://youtube.com/watch?v=... atau YouTube ID"
                      />
                    </label>
                    {previewYtId ? (
                      <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
                        <iframe
                          className="h-full w-full"
                          src={`https://www.youtube.com/embed/${encodeURIComponent(previewYtId)}`}
                          title="Preview video"
                          allowFullScreen
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Text Section */}
                {draft.mode === "text" || draft.mode === "combo" ? (
                  <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-4">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-white/70">
                        Materi Teks / Artikel
                      </span>
                      <textarea
                        rows={8}
                        className="input-dark w-full font-sans text-sm leading-relaxed"
                        value={draft.body}
                        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                        placeholder={"Tulis materi modul di sini...\n\nTips format:\n## Subjudul\n- Poin daftar\n**teks tebal**\n[Nama Link](https://contoh.com)"}
                      />
                    </label>
                    <p className="text-[11px] text-white/40">
                      Mendukung paragraf, <code>## Subjudul</code>, daftar <code>- item</code>,{" "}
                      <code>**tebal**</code>, dan tautan inline <code>[teks](https://...)</code>.
                    </p>
                  </div>
                ) : null}

                {/* Multi-Link Section */}
                <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-white/75">
                        Tautan / Link Materi (PDF, Notion, Repo, Tools, dll.)
                      </p>
                      <p className="text-[11px] text-white/40">
                        Semua link di sini tampil sebagai tombol klik di bawah materi modul.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          links: [...draft.links, { label: "", url: "" }],
                        })
                      }
                      className="btn-outline shrink-0"
                    >
                      + Tambah Link
                    </button>
                  </div>

                  {draft.links.length === 0 ? (
                    <p className="text-xs text-white/35">Belum ada tautan ditambahkan.</p>
                  ) : (
                    <div className="space-y-2">
                      {draft.links.map((link, idx) => (
                        <div
                          key={idx}
                          className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]"
                        >
                          <input
                            className="input-dark"
                            value={link.label}
                            placeholder="Label (mis. Slide PDF / Template)"
                            onChange={(e) => {
                              const next = draft.links.map((l, i) =>
                                i === idx ? { ...l, label: e.target.value } : l,
                              );
                              setDraft({ ...draft, links: next });
                            }}
                          />
                          <input
                            className="input-dark"
                            type="url"
                            value={link.url}
                            placeholder="https://..."
                            onChange={(e) => {
                              const next = draft.links.map((l, i) =>
                                i === idx ? { ...l, url: e.target.value } : l,
                              );
                              setDraft({ ...draft, links: next });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                links: draft.links.filter((_, i) => i !== idx),
                              })
                            }
                            className="btn-danger"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optional Prompt Section */}
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-white/65">
                    Prompt / Template Siap Copy (Opsional)
                  </span>
                  <textarea
                    rows={4}
                    className="input-dark w-full font-mono text-xs"
                    value={draft.prompt}
                    onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
                    placeholder="Isi prompt atau snippet kode yang bisa langsung di-copy member..."
                  />
                </label>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-glow rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                  >
                    {saving ? "Menyimpan…" : draft.id ? "Simpan Modul" : "Buat Modul"}
                  </button>
                </div>
              </form>
            ) : null}
          </Section>
        </div>
      ) : null}
    </>
  );
}
