"use client";

import { useEffect, useState } from "react";
import { fillTemplate, sanitizePhone, waLink, type WaTemplate } from "@/lib/wa";

const inputCls = "input-dark";

export type UnifiedLeadRow = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  raw_status: string | null;
  display_status: string;
  source: string;
  source_group: string;
  current_stage: string | null;
  products: string[];
  workshop_tier: string | null;
  amount_paid: number | null;
  created_at: string | null;
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function rupiah(n: number | null) {
  if (n === null || n === undefined) return "—";
  return `Rp${n.toLocaleString("id-ID")}`;
}

function sourceBadge(source: string, sourceGroup: string) {
  const map: Record<string, string> = {
    tutorial_hermes: "Tutorial Free",
    "landing-daftar": "Workshop Landing",
    checkout: "Workshop Checkout",
    komunitas: "Komunitas Gratis",
    test: "Internal Test",
  };
  const label = map[source] || "Other";
  return <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{label}</span>;
}

export function LeadsManagerUnified({ leads }: { leads: UnifiedLeadRow[] }) {
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [sel, setSel] = useState("");
  const [form, setForm] = useState<"closed" | "list" | "form">("closed");
  const [editId, setEditId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  async function load() {
    const res = await fetch("/api/admin/wa-templates");
    const data = await res.json().catch(() => []);
    const list: WaTemplate[] = Array.isArray(data) ? data : [];
    setTemplates(list);
    setSel((s) => s || (list[0]?.id ?? ""));
  }

  useEffect(() => {
    load();
  }, []);

  const selTpl = templates.find((t) => t.id === sel);

  function openNew() {
    setEditId(undefined);
    setName("");
    setContent("");
    setForm("form");
  }

  function openEdit(t: WaTemplate) {
    setEditId(t.id);
    setName(t.name);
    setContent(t.content);
    setForm("form");
  }

  function openManager() {
    setEditId(undefined);
    setForm("list");
  }

  async function saveTemplate() {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/wa-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, name, content }),
      });
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) {
        setForm("closed");
        await load();
      }
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 2000);
    }
  }

  async function deleteTemplate(id: string) {
    await fetch(`/api/admin/wa-templates?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  const filtered = leads.filter((l) => {
    const matchesSearch =
      search === "" ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.whatsapp || "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "All") return true;
    if (filter === "Tutorial") return l.source_group === "Tutorial";
    if (filter === "Workshop") return l.source_group === "Workshop";
    if (filter === "Komunitas") return l.source_group === "Komunitas";
    if (filter === "Paid") return l.display_status === "Paid";
    if (filter === "Follow-up") return l.display_status === "Follow-up";
    return true;
  });

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-white/60">
            Template WhatsApp:
            <select
              value={sel}
              onChange={(e) => setSel(e.target.value)}
              className={`${inputCls} w-auto`}
              disabled={templates.length === 0}
            >
              {templates.length === 0 && <option value="">Belum ada template</option>}
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <button onClick={openManager} className="btn-outline">
            Kelola Template…
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`${inputCls} w-auto`}
          >
            <option>All</option>
            <option>Tutorial</option>
            <option>Workshop</option>
            <option>Komunitas</option>
            <option>Paid</option>
            <option>Follow-up</option>
          </select>
          <input
            type="text"
            placeholder="Cari nama, email, WA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-48`}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="tbl w-full">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>Source</th>
              <th>Status</th>
              <th>Product</th>
              <th>Amount Paid</th>
              <th>Current Stage</th>
              <th>Created</th>
              <th>Follow-up WA</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const phone = sanitizePhone(l.whatsapp ?? "");
              const href = selTpl && phone ? waLink(phone, fillTemplate(selTpl.content, l.name)) : "";
              return (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td>{l.email}</td>
                  <td>{l.whatsapp ?? "—"}</td>
                  <td>{sourceBadge(l.source, l.source_group)}</td>
                  <td>{l.display_status}</td>
                  <td>{l.products.length > 0 ? l.products.join(", ") : "—"}</td>
                  <td>{rupiah(l.amount_paid)}</td>
                  <td>{l.current_stage ?? "—"}</td>
                  <td>{fmt(l.created_at)}</td>
                  <td>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-lg bg-[#00FF88] px-3 py-1.5 text-xs font-bold text-[#04110D] transition hover:shadow-[0_0_18px_var(--glow)]"
                      >
                        Kirim WA
                      </a>
                    ) : (
                      <span className="text-xs text-white/40">
                        {templates.length === 0 ? "Buat template dulu" : l.whatsapp ? "Tidak aktif" : "WA kosong"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-6 text-center text-white/40">
                  Belum ada leads
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {leads.length >= 500 && (
        <p className="mt-2 text-xs text-white/40">
          {/* ponytail: pagination needed when leads exceed 500 rows. */}
          Menampilkan {filtered.length} dari {leads.length} leads (fetch dibatasi 500).
        </p>
      )}

      {form === "list" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setForm("closed")}
        >
          <div
            className="panel max-h-[85vh] w-full max-w-lg overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="panel-title">Template WhatsApp</h3>
              <button
                onClick={() => setForm("closed")}
                className="rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-sm text-white/50">
              Gunakan <code className="rounded bg-white/10 px-1">{"{{name}}"}</code> sebagai pengganti nama lead.
            </p>
            <button
              onClick={openNew}
              className="btn-outline mt-4"
            >
              + Template Baru
            </button>
            <ul className="mt-3 space-y-2">
              {templates.map((t) => (
                <li key={t.id} className="rounded-xl border border-white/10 bg-[#0A1D14] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{t.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70 transition hover:border-[#00FF88] hover:text-[#00FF88]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="rounded-lg border border-[rgba(255,90,90,0.3)] px-2 py-1 text-xs text-[#ff6b6b] transition hover:bg-[rgba(255,90,90,0.1)]"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-white/50">{t.content}</p>
                </li>
              ))}
              {templates.length === 0 && (
                <p className="text-sm text-white/40">Belum ada template. Buat satu dulu.</p>
              )}
            </ul>
          </div>
        </div>
      )}

      {form === "form" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setForm("closed")}
        >
          <div
            className="panel max-h-[85vh] w-full max-w-lg overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="panel-title">
                {editId ? "Edit Template" : "Template WA Baru"}
              </h3>
              <button
                onClick={() => setForm("closed")}
                className="rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-white/60">Nama Template</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="contoh: Follow-up hari-1"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-white/60">
                  Isi Pesan (pakai {"{{name}}"} untuk nama lead)
                </span>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`${inputCls} font-mono`}
                  placeholder="Halo {{name}}, ..."
                />
              </label>
            </div>
            {status && (
              <p className={`mt-3 text-sm ${status === "saved" ? "text-[#00FF88]" : "text-[#ff6b6b]"}`}>
                {status === "saved" ? "Template tersimpan" : "Gagal menyimpan"}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setForm("closed")} className="btn-outline">
                Batal
              </button>
              <button
                onClick={saveTemplate}
                disabled={saving || !name.trim() || !content.trim()}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Menyimpan…" : "Simpan Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
