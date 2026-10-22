"use client";

import { useMemo, useState } from "react";

type Ev = {
  id: string;
  lead_id: string | null;
  event_type: string;
  meta: unknown;
  created_at: string | null;
};

export function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

const evMap: Record<string,string> = {
  lead_form_submitted: "Mengisi Form Lead",
  vip_visited: "Membuka Halaman VIP",
  fast_track_visited: "Membuka Halaman Workshop",
  join_group_visited: "Membuka Halaman Join Group",
  checkout_initiated: "Klik Checkout / Mulai Bayar",
  paid: "Pembayaran Berhasil",
  checkout_page_view: "Membuka Halaman Checkout",
  email_sent: "Email Terkirim",
  email_opened: "Email Dibuka",
  email_clicked: "Link Email Diklik",
};
function label(e: string){ return evMap[e] ?? e.replace(/_/g, " "); }

export function Timeline({ events, leads }: { events: Ev[]; leads?: Array<{id:string,name:string|null,email:string|null}> }) {
  const [sel, setSel] = useState<string>("__all");
  const leadMap = useMemo(() => new Map((leads??[]).map(l => [l.id, l])), [leads]);
  const groups = useMemo(() => {
    const m = new Map<string, Ev[]>();
    for (const e of events) {
      const k = e.lead_id ?? "no_lead";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    for (const [k, list] of m) {
      list.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    }
    return Array.from(m.entries()).sort((a, b) => {
      const ta = a[1].at(-1)?.created_at ?? a[1][0]?.created_at ?? "";
      const tb = b[1].at(-1)?.created_at ?? b[1][0]?.created_at ?? "";
      return tb.localeCompare(ta);
    });
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSel("__all")}
          className={`rounded-full border px-3 py-1 text-xs ${sel === "__all" ? "border-white/40 bg-white/10" : "border-white/10 hover:bg-white/5"}`}
        >
          Semua ({groups.length})
        </button>
        {groups.slice(0, 10).map(([k]) => (
          <button
            key={k}
            onClick={() => setSel(k)}
            className={`rounded-full border px-3 py-1 text-xs ${sel === k ? "border-white/40 bg-white/10" : "border-white/10 hover:bg-white/5"}`}
          >
            {k.slice(0, 8)}
          </button>
        ))}
      </div>
      {(sel === "__all" ? groups : groups.filter(([k]) => k === sel)).map(([leadId, list]) => (
        <div key={leadId} className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            {(() => { const l = leadMap.get(leadId); return <div className="text-xs text-white/70">{l?.name || "Tanpa Nama"}{l?.email ? ` · ${l.email}` : ""}</div>; })()}
            <div className="text-xs text-white/40">{list.length} events</div>
          </div>
          <ol className="space-y-2">
            {list.map((e, i) => (
              <li key={e.id} className="flex items-start gap-3 border-l border-white/10 pl-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{label(e.event_type)}</span>
                    <span className="text-xs text-white/40">{fmt(e.created_at)}</span>
                  </div>
                  {e.meta ? <pre className="mt-1 overflow-x-auto rounded-lg bg-black/20 p-2 text-[10px] text-white/50">{JSON.stringify(e.meta as any, null, 2)}</pre> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
      {groups.length === 0 && (
        <div className="py-6 text-center text-white/40">Belum ada events</div>
      )}
    </div>
  );
}
