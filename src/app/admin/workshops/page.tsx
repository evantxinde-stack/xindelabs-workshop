"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key");
const emptyPre = { class_id: "", slug: "", title: "", description: "", video_url: "", tools: "[]", downloads: "[]", checklist: "[]", sort_order: 0, published: true };
const emptyDeck = { class_id: "", title: "", content_markdown: "", code_language: "bash", external_embed_url: "", theme: "futuristic-green", sort_order: 0, published: true };

function Field({ label, value, onChange, area = false }: { label: string; value: string | number; onChange: (v: string) => void; area?: boolean }) {
  const C = area ? "textarea" : "input";
  return <label className="block text-xs text-white/55">{label}<C value={value} onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => onChange(e.target.value)} className="input-dark mt-1 w-full" rows={area ? 7 : undefined} /></label>;
}

export default function WorkshopsPage() {
  const [classes, setClasses] = useState<any[]>([]); const [pres, setPres] = useState<any[]>([]); const [decks, setDecks] = useState<any[]>([]);
  const [pre, setPre] = useState<any>(emptyPre); const [deck, setDeck] = useState<any>(emptyDeck); const [message, setMessage] = useState("");
  async function load() { const [c, p, d] = await Promise.all([db.from("classes").select("id,title,slug,product_type").eq("product_type", "workshop").order("title"), db.from("workshop_pre_sessions").select("*").order("sort_order"), db.from("workshop_decks").select("*").order("sort_order")]); setClasses(c.data ?? []); setPres(p.data ?? []); setDecks(d.data ?? []); }
  useEffect(() => { void load(); }, []);
  const update = (setter: any, key: string) => (v: string) => setter((x: any) => ({ ...x, [key]: v }));
  async function savePre(e: React.FormEvent) { e.preventDefault(); const payload = { ...pre, sort_order: Number(pre.sort_order), tools: JSON.parse(pre.tools || "[]"), downloads: JSON.parse(pre.downloads || "[]"), checklist: JSON.parse(pre.checklist || "[]") }; const r = await db.from("workshop_pre_sessions").upsert(payload); setMessage(r.error?.message ?? "Pre-session tersimpan"); if (!r.error) { setPre(emptyPre); void load(); } }
  async function saveDeck(e: React.FormEvent) { e.preventDefault(); const r = await db.from("workshop_decks").upsert({ ...deck, sort_order: Number(deck.sort_order) }); setMessage(r.error?.message ?? "Deck tersimpan"); if (!r.error) { setDeck(emptyDeck); void load(); } }
  async function remove(table: string, id: string) { await db.from(table).delete().eq("id", id); void load(); }
  return <>
    <header><h1 className="text-2xl font-bold">Workshop Kit Manager</h1><p className="mt-1 text-sm text-white/45">Pre-Session, slide deck, jadwal live, dan replay.</p></header>
    {message && <p className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 p-3 text-sm text-[#10B981]">{message}</p>}
    <section className="panel p-5"><h2 className="panel-title">Workshop class</h2><select value={pre.class_id} onChange={e => { setPre({ ...pre, class_id: e.target.value }); setDeck({ ...deck, class_id: e.target.value }); }} className="input-dark mt-3 w-full"><option value="">Pilih workshop</option>{classes.map(c => <option key={c.id} value={c.id}>{c.title} · {c.slug}</option>)}</select><p className="mt-2 text-xs text-white/40">Jadwal dan URL live/replay dikelola di data class: workshop_date, workshop_meet_url, workshop_replay_url.</p></section>
    <div className="grid gap-5 xl:grid-cols-2">
      <form onSubmit={savePre} className="panel space-y-3 p-5"><h2 className="panel-title">Pre-Session Kit</h2><Field label="Slug" value={pre.slug} onChange={update(setPre,"slug")} /><Field label="Judul" value={pre.title} onChange={update(setPre,"title")} /><Field label="Deskripsi" value={pre.description} onChange={update(setPre,"description")} area /><Field label="Video URL" value={pre.video_url} onChange={update(setPre,"video_url")} /><Field label="Tools JSON" value={pre.tools} onChange={update(setPre,"tools")} area /><Field label="Downloads JSON" value={pre.downloads} onChange={update(setPre,"downloads")} area /><Field label="Checklist JSON (9 item)" value={pre.checklist} onChange={update(setPre,"checklist")} area /><button className="btn-glow rounded-lg px-4 py-2 text-sm font-bold">Simpan Pre-Session</button></form>
      <form onSubmit={saveDeck} className="panel space-y-3 p-5"><h2 className="panel-title">Slide Deck Builder</h2><Field label="Judul modul" value={deck.title} onChange={update(setDeck,"title")} /><Field label="Urutan" value={deck.sort_order} onChange={update(setDeck,"sort_order")} /><Field label="Markdown / code blocks" value={deck.content_markdown} onChange={update(setDeck,"content_markdown")} area /><Field label="Bahasa code" value={deck.code_language} onChange={update(setDeck,"code_language")} /><Field label="External embed URL (opsional)" value={deck.external_embed_url} onChange={update(setDeck,"external_embed_url")} /><button className="btn-glow rounded-lg px-4 py-2 text-sm font-bold">Simpan Deck</button></form>
    </div>
    <div className="grid gap-5 xl:grid-cols-2"><section className="panel p-5"><h2 className="panel-title">Pre-session tersimpan</h2>{pres.map(x => <div key={x.id} className="mt-3 flex justify-between border-b border-white/10 pb-2 text-sm"><span>{x.sort_order}. {x.title}</span><button onClick={() => remove("workshop_pre_sessions", x.id)} className="text-red-300">Hapus</button></div>)}</section><section className="panel p-5"><h2 className="panel-title">Deck tersimpan</h2>{decks.map(x => <div key={x.id} className="mt-3 flex justify-between border-b border-white/10 pb-2 text-sm"><span>{x.sort_order}. {x.title}</span><button onClick={() => remove("workshop_decks", x.id)} className="text-red-300">Hapus</button></div>)}</section></div>
  </>;
}
