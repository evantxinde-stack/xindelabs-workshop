"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { classPrice, earlyBirdOpen } from "@/lib/mayar";

function Countdown({ config }: { config: any }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (config.countdown_type === "none") return;
    const key = `sales-countdown:${config.slug}`;
    const saved = localStorage.getItem(key);
    const end = config.countdown_type === "fixed" && config.countdown_ends_at ? new Date(config.countdown_ends_at).getTime() : Number(saved) || Date.now() + Number(config.countdown_duration_minutes || 30) * 60000;
    if (!saved && config.countdown_type !== "fixed") localStorage.setItem(key, String(end));
    const tick = () => setLeft(Math.max(0, end - Date.now())); tick(); const timer = window.setInterval(tick, 1000); return () => clearInterval(timer);
  }, [config]);
  if (left === null || config.countdown_type === "none") return null;
  const seconds = Math.floor(left / 1000); return <div className="rounded-xl border border-[#10B981]/30 bg-[#0A140E] px-4 py-3 text-center text-sm">Penawaran berakhir dalam <strong className="text-[#10B981]">{String(Math.floor(seconds / 3600)).padStart(2,"0")}:{String(Math.floor(seconds / 60) % 60).padStart(2,"0")}:{String(seconds % 60).padStart(2,"0")}</strong></div>;
}

function PriceBlock({ product }: { product: any }) {
  const regular = Number(product?.price);
  if (!Number.isFinite(regular) || regular <= 0) return null;
  const now = classPrice(product, "lifetime");
  const sale = earlyBirdOpen(product) && now < regular;
  const quota = Number(product?.early_bird_quota);
  const left = Number.isFinite(quota) ? Math.max(0, quota - Number(product?.early_bird_used || 0)) : null;
  return <div className="mt-6">{sale && left !== null && <p className="mb-2 inline-block rounded-full border border-[#10B981]/40 px-3 py-1 text-xs font-bold text-[#10B981]">Sisa {left} slot harga early bird</p>}<div className="flex items-baseline gap-3"><span className="text-4xl font-bold text-[#00ff88]">Rp{now.toLocaleString("id-ID")}</span>{sale && <span className="text-lg text-white/40 line-through">Rp{regular.toLocaleString("id-ID")}</span>}{sale && <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">early bird</span>}</div></div>;
}

export function SalesPageClient({ config, product, lessons }: { config: any; product: any; lessons: any[] }) {
  const [faq, setFaq] = useState<number | null>(null); const [toast, setToast] = useState(false);
  const faqs = Array.isArray(config.faq_items) ? config.faq_items : []; const notices = Array.isArray(config.sales_notification_config?.items) ? config.sales_notification_config.items : ["Ada member baru bergabung."];
  useEffect(() => { if (!config.sales_notification_enabled) return; const id = window.setInterval(() => setToast(true), 12000); return () => clearInterval(id); }, [config.sales_notification_enabled]);
  return <main className="min-h-screen bg-[#050A07] px-5 py-12 text-white"><div className="mx-auto max-w-4xl"><p className="font-mono text-xs uppercase tracking-[.25em] text-[#10B981]">XindeLabs</p><h1 className="mt-5 text-4xl font-bold md:text-6xl">{config.headline || product?.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">{config.subheadline || product?.description}</p><div className="mt-8"><Countdown config={config}/></div>{config.vsl_youtube_id && <div className="mt-8 aspect-video overflow-hidden rounded-2xl border border-white/10"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${encodeURIComponent(config.vsl_youtube_id)}`} title="Video sales letter" allowFullScreen/></div>}<section className="mt-10 rounded-2xl border border-[#10B981]/30 bg-[#0A140E] p-6"><h2 className="text-2xl font-bold">Yang kamu dapatkan</h2><ul className="mt-5 grid gap-3 text-white/70 md:grid-cols-2"><li>✓ Materi langkah demi langkah</li><li>✓ Praktik langsung dengan AI Agent</li><li>✓ Template dan prompt siap pakai</li><li>✓ Akses komunitas belajar</li></ul>{lessons.length>0&&<div className="mt-6 border-t border-white/10 pt-5"><p className="text-sm text-white/45">Modul termasuk:</p><div className="mt-3 grid gap-2 md:grid-cols-2">{lessons.map((x:any)=><span key={x.id} className="text-sm text-white/70">{x.sort_order+1}. {x.title}</span>)}</div></div>}<PriceBlock product={product}/><Link href={`https://xindelabs.web.id/checkout/${product?.slug || config.slug}`} className="mt-7 inline-block rounded-lg bg-[#10B981] px-6 py-3 font-bold text-[#050A07]">Mulai sekarang</Link></section><section className="mt-10"><h2 className="text-2xl font-bold">FAQ</h2>{faqs.map((x:any,i:number)=><div key={i} className="border-b border-white/10 py-4"><button onClick={()=>setFaq(faq===i?null:i)} className="flex w-full justify-between text-left font-bold">{x.question||x.q||`Pertanyaan ${i+1}`}<span>{faq===i?"−":"+"}</span></button>{faq===i&&<p className="mt-3 text-white/60">{x.answer||x.a}</p>}</div>)}</section></div>{toast&&<button onClick={()=>setToast(false)} className="fixed bottom-5 left-5 rounded-xl border border-[#10B981]/40 bg-[#0A140E] px-4 py-3 text-left text-sm shadow-xl">{notices[Math.floor(Math.random()*notices.length)]}<span className="ml-3 text-white/40">×</span></button>}</main>;
}
