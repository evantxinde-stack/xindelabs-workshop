"use client";

import { useEffect, useMemo, useState } from "react";
import { Section } from "../../shared";

type ProductType = "course" | "workshop" | "vip";
type Lesson = { id: string; class_id: string; title: string; youtube_id?: string | null; prompt?: string | null; pdf_url?: string | null; sort_order: number };
type ClassRow = { id: string; slug: string; title: string; description: string | null; price: number | null; product_type: ProductType | "bundle"; is_published: boolean; sort_order: number; trailer_youtube_id?: string | null; member_cross_sell_price?: number | null; workshop_meet_url?: string | null; workshop_replay_url?: string | null };
type FormState = Partial<Omit<ClassRow, "price" | "sort_order" | "member_cross_sell_price">> & { price?: number | string | null; sort_order?: number | string; member_cross_sell_price?: number | string | null };

const toNumber = (value: unknown) => value === "" || value == null ? null : Number(value);

const normalize = (form: FormState) => ({ ...form, price: toNumber(form.price), sort_order: Number(form.sort_order || 0), member_cross_sell_price: toNumber(form.member_cross_sell_price) });

const empty: FormState = { title: "", slug: "", description: "", price: "", is_published: false, sort_order: 0, trailer_youtube_id: "", member_cross_sell_price: "", workshop_meet_url: "", workshop_replay_url: "" };

const TABS: { key: ProductType; label: string; hint: string }[] = [
  { key: "course", label: "Kelas", hint: "Course dan materi belajar" },
  { key: "workshop", label: "Workshop", hint: "Workshop live, replay, dan pre-session" },
  { key: "vip", label: "VIP Lounge", hint: "Program bimbingan dan akses VIP" },
];
const money = (n: number | null | undefined) => n == null ? "—" : `Rp${Number(n).toLocaleString("id-ID")}`;

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1 block text-xs text-white/50">{label}</span>{children}</label>; }

export default function AdminCoursesPage() {
  const [tab, setTab] = useState<ProductType>("course");
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [selected, setSelected] = useState<ClassRow | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonBusy, setLessonBusy] = useState(false);
  const filtered = useMemo(() => rows.filter((x) => x.product_type === tab || (tab === "course" && x.product_type === "bundle")), [rows, tab]);

  async function load() { setLoading(true); const r = await fetch("/api/admin/classes"); const j = await r.json(); setRows(j.data ?? []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function choose(row: ClassRow) { setSelected(row); setForm({ ...row }); setMessage(""); const r = await fetch(`/api/admin/lessons?class_id=${encodeURIComponent(row.id)}`); const j = await r.json(); setLessons(j.data ?? []); }
  function newItem() { setLessons([]); setSelected(null); setForm({ ...empty, product_type: tab }); setMessage(""); }
  function set
(key: keyof ClassRow, value: unknown) { setForm((x) => ({ ...x, [key]: value })); }
  async function save(e: React.FormEvent) { e.preventDefault(); setSaving(true); setMessage(""); const method = selected ? "PATCH" : "POST"; const body = selected ? { ...normalize(form), id: selected.id } : { ...normalize(form), product_type: tab }; const r = await fetch("/api/admin/classes", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok) setMessage(j.error || "Gagal menyimpan"); else { setMessage("Tersimpan"); await load(); if (j.data) choose(j.data); } setSaving(false); }

  return <>
    <header className="mb-6"><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#00ff88]">// learn catalog</p><h1 className="mt-2 text-2xl font-bold">Katalog LMS</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">Atur semua isi Learn dari satu tempat. Pilih kategori, edit produk, lalu lihat status tampilnya di katalog.</p></header>
    <div className="mb-5 flex flex-wrap gap-2">{TABS.map((x) => <button key={x.key} onClick={() => { setTab(x.key); setSelected(null); setForm({ ...empty, product_type: x.key }); }} className={`rounded-full border px-4 py-2 text-sm transition ${tab === x.key ? "border-[#00ff88] bg-[#00ff88] font-bold text-[#04110D]" : "border-white/15 text-white/55 hover:border-[#00ff88] hover:text-white"}`}>{x.label}</button>)}</div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Section title={TABS.find((x) => x.key === tab)?.label || "Katalog"} sub={TABS.find((x) => x.key === tab)?.hint}>
        {loading ? <p className="text-sm text-white/45">Memuat katalog…</p> : <div className="space-y-2">{filtered.map((row) => <button key={row.id} onClick={() => choose(row)} className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${selected?.id === row.id ? "border-[#00ff88] bg-[#00ff88]/[.06]" : "border-white/10 bg-white/[.02] hover:border-white/25"}`}><span><strong className="block text-sm text-white">{row.title}</strong><span className="mt-1 block text-xs text-white/40">/{row.slug} · {money(row.price)}</span></span><span className={`rounded-full border px-2 py-1 text-[10px] uppercase ${row.is_published ? "border-[#00ff88]/30 text-[#00ff88]" : "border-white/15 text-white/40"}`}>{row.is_published ? "tayang" : "draft"}</span></button>)}{!filtered.length && <p className="py-6 text-sm text-white/40">Belum ada produk di kategori ini.</p>}<button onClick={newItem} className="btn-outline mt-2 w-full">+ Tambah {TABS.find((x) => x.key === tab)?.label}</button></div>}
      </Section>
      <Section title={selected ? "Edit produk" : `Tambah ${TABS.find((x) => x.key === tab)?.label}`} sub="Perubahan tersimpan ke katalog Learn.">
        <form onSubmit={save} className="space-y-3">
          <Field label="Nama yang tampil"><input className="input-dark" value={form.title || ""} onChange={(e) => set("title", e.target.value)} required /></Field>
          <Field label="Slug URL"><input className="input-dark" value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} placeholder="contoh: hermes-agent-workshop" required /></Field>
          <Field label="Deskripsi singkat"><textarea className="input-dark min-h-20" value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Harga"><input className="input-dark" type="number" min="0" value={form.price ?? ""} onChange={(e) => set("price", e.target.value)} /></Field><Field label="Urutan"><input className="input-dark" type="number" value={form.sort_order ?? 0} onChange={(e) => set("sort_order", e.target.value)} /></Field></div>
          {tab === "course" && <><Field label="Link video pengantar"><input className="input-dark" value={form.trailer_youtube_id || ""} onChange={(e) => set("trailer_youtube_id", e.target.value)} placeholder="YouTube ID (opsional)" /></Field><Field label="Harga khusus member"><input className="input-dark" type="number" min="0" value={form.member_cross_sell_price ?? ""} onChange={(e) => set("member_cross_sell_price", e.target.value)} /></Field></>}
          {tab === "workshop" && <><Field label="Link meeting"><input className="input-dark" value={form.workshop_meet_url || ""} onChange={(e) => set("workshop_meet_url", e.target.value)} placeholder="https://…" /></Field><Field label="Link replay"><input className="input-dark" value={form.workshop_replay_url || ""} onChange={(e) => set("workshop_replay_url", e.target.value)} placeholder="https://…" /></Field></>}
          {selected && <div className="border-t border-white/10 pt-4"><p className="mb-1 text-sm font-semibold text-white">Video & modul</p><p className="mb-3 text-xs text-white/40">Tambahkan link YouTube per modul. Isi ID atau URL YouTube.</p><div className="space-y-2">{lessons.map((lesson) => <div key={lesson.id} className="rounded-lg border border-white/10 bg-white/[.02] p-3"><input className="input-dark" value={lesson.title} onChange={(e) => setLessons((xs) => xs.map((x) => x.id === lesson.id ? { ...x, title: e.target.value } : x))} placeholder="Judul modul" /><input className="input-dark mt-2" value={lesson.youtube_id || ""} onChange={(e) => setLessons((xs) => xs.map((x) => x.id === lesson.id ? { ...x, youtube_id: e.target.value } : x))} placeholder="https://youtube.com/watch?v=..." /><button type="button" className="mt-2 text-xs text-[#00ff88]" onClick={async () => { setLessonBusy(true); await fetch("/api/admin/lessons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lesson) }); setLessonBusy(false); }}>Simpan modul</button></div>)}</div><button type="button" className="btn-outline mt-3 w-full" onClick={async () => { setLessonBusy(true); const r = await fetch("/api/admin/lessons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ class_id: selected.id, title: `Modul ${lessons.length + 1}`, sort_order: lessons.length }) }); const j = await r.json(); if (j.data) setLessons((xs) => [...xs, j.data]); setLessonBusy(false); }}>+ Tambah modul video</button></div>}
          <label className="flex items-center gap-2 pt-2 text-sm text-white/70"><input type="checkbox" checked={Boolean(form.is_published)} onChange={(e) => set("is_published", e.target.checked)} /> Tampilkan di katalog Learn</label>
          {message && <p className={`text-sm ${message === "Tersimpan" ? "text-[#00ff88]" : "text-red-300"}`}>{message}</p>}
          <button disabled={saving} className="btn-primary w-full disabled:opacity-50">{saving ? "Menyimpan…" : "Simpan perubahan"}</button>
        </form>
      </Section>
    </div>
  </>;
}
