"use client";

import { useEffect, useState } from "react";
import { ContentBlocks } from "@/components/ContentBlocks";
import {
  BLOCK_TYPES,
  PAGES,
  youtubeId,
  type Block,
  type BlockType,
  type PageKey,
} from "@/lib/content-data";

const TYPE_LIST = Object.keys(BLOCK_TYPES) as BlockType[];

function emptyProps(t: BlockType): Record<string, string> {
  const props: Record<string, string> = {};
  for (const f of BLOCK_TYPES[t].fields) props[f.key] = f.select ? f.select[0].value : "";
  return props;
}

const inputCls =
  "input-dark";

type Device = "desktop" | "tablet" | "mobile";

function ItemEditor({
  value,
  cols,
  onChange,
}: {
  value: string;
  cols: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const split = (line: string) => cols.map((_, i) => line.split("|")[i] ?? "");
  const rows = (value ?? "").split("\n").filter(Boolean).map(split);
  const serialize = (rs: string[][]) => onChange(rs.map((r) => r.join("|")).join("\n"));

  const set = (ri: number, ci: number, v: string) =>
    serialize(rows.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? v : c)) : r)));
  const add = () => serialize([...rows, cols.map(() => "")]);
  const remove = (ri: number) => serialize(rows.filter((_, i) => i !== ri));
  const move = (ri: number, dir: -1 | 1) => {
    const j = ri + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[ri], next[j]] = [next[j], next[ri]];
    serialize(next);
  };

  return (
    <div className="space-y-2">
      {cols.length > 1 && (
        <div className={`grid gap-2 ${cols.length > 2 ? "grid-cols-3" : "grid-cols-[1fr_2fr]"}`}>
          {cols.map((c) => (
            <span key={c.value} className="text-[11px] font-medium text-white/40">{c.label}</span>
          ))}
        </div>
      )}
      {rows.map((row, ri) => (
        <div key={ri} className="flex items-start gap-1.5">
          <div
            className={`grid flex-1 gap-1.5 ${cols.length >= 3 ? "grid-cols-3" : cols.length === 2 ? "grid-cols-[1fr_2fr]" : "grid-cols-1"}`}
          >
            {row.map((cell, ci) => (
              <input
                key={ci}
                value={cell}
                placeholder={cols[ci].label}
                onChange={(e) => set(ri, ci, e.target.value)}
                className={inputCls}
              />
            ))}
          </div>
          <div className="flex shrink-0 gap-1">
            <button onClick={() => move(ri, -1)} disabled={ri === 0} className="mt-1 rounded border border-white/10 px-1.5 py-1 text-xs text-white/50 hover:bg-white/10 disabled:opacity-30">↑</button>
            <button onClick={() => move(ri, 1)} disabled={ri === rows.length - 1} className="mt-1 rounded border border-white/10 px-1.5 py-1 text-xs text-white/50 hover:bg-white/10 disabled:opacity-30">↓</button>
            <button onClick={() => remove(ri)} className="btn-danger mt-1">Hapus</button>
          </div>
        </div>
      ))}
      <button onClick={add} className="btn-outline">+ Tambah Item</button>
    </div>
  );
}

function LivePreview({
  blocks,
  device,
  onDevice,
}: {
  blocks: Block[];
  device: Device;
  onDevice: (d: Device) => void;
}) {
  const width = device === "desktop" ? "100%" : device === "tablet" ? 768 : 375;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#04110D]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-auto flex items-center gap-1">
          {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => onDevice(d)}
              className={`rounded px-2 py-1 text-xs font-medium capitalize transition ${
                device === d ? "bg-white/15 text-white" : "text-white/40 hover:text-white/80"
              }`}
            >
              {d === "desktop" ? "🖥" : "📱"}
            </button>
          ))}
          <span className="ml-1 text-xs text-white/40">
            {typeof width === "number" ? `${width}px` : "full"}
          </span>
        </div>
      </div>
      <div className="grid-bg max-h-[75vh] overflow-y-auto p-4">
        <div className="mx-auto" style={{ width }}>
          <ContentBlocks blocks={blocks} />
        </div>
      </div>
    </div>
  );
}

export function BlockEditor() {
  const [page, setPage] = useState<PageKey>("tutorial");
  const [byPage, setByPage] = useState<Record<string, Block[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<BlockType | "">("");
  const [device, setDevice] = useState<Device>("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"saved" | "saving" | "error" | null>(null);

  useEffect(() => {
    fetch("/api/admin/blocks")
      .then((r) => r.json())
      .then((data) => {
        if (data) setByPage(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const blocks = byPage[page] ?? [];

  function setBlocks(next: Block[], p: PageKey = page) {
    setByPage((prev) => ({ ...prev, [p]: next }));
  }

  function setProp(index: number, key: string, value: string) {
    setBlocks(
      blocks.map((b, i) => (i === index ? { ...b, props: { ...b.props, [key]: value } } : b)),
    );
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[j]] = [next[j], next[index]];
    setBlocks(next.map((b, i) => ({ ...b, sort_order: i })));
  }

  function remove(index: number) {
    const b = blocks[index];
    if (b.id) {
      setExpanded((e) => {
        const n = { ...e };
        delete n[b.id as string];
        return n;
      });
    }
    setBlocks(blocks.filter((_, i) => i !== index));
  }

  function addBlock(type: BlockType) {
    const b: Block = {
      id: crypto.randomUUID(),
      block_type: type,
      sort_order: blocks.length,
      props: emptyProps(type),
    };
    setBlocks([...blocks, b]);
    setExpanded((e) => ({ ...e, [b.id as string]: true }));
    setAdding("");
  }

  function duplicate(index: number) {
    const src = blocks[index];
    const b: Block = {
      id: crypto.randomUUID(),
      block_type: src.block_type,
      sort_order: src.sort_order + 1,
      props: { ...src.props },
    };
    const next = [...blocks];
    next.splice(index + 1, 0, b);
    setBlocks(next.map((blk, i) => ({ ...blk, sort_order: i })));
    setExpanded((e) => ({ ...e, [b.id as string]: true }));
  }

  const customIdx = blocks.findIndex((b) => b.block_type === "custom_page");

  function toggleEmbed() {
    if (customIdx >= 0) {
      setBlocks(blocks.filter((b) => b.block_type !== "custom_page"));
    } else {
      const b: Block = {
        id: crypto.randomUUID(),
        block_type: "custom_page",
        sort_order: 0,
        props: emptyProps("custom_page"),
      };
      setBlocks([b, ...blocks]);
      setExpanded((e) => ({ ...e, [b.id as string]: true }));
    }
  }

  function toggle(id: string | undefined) {
    if (!id) return;
    setExpanded((e) => ({ ...e, [id]: !(e[id] ?? true) }));
  }

  async function save() {
    setSaving(true);
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/blocks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page,
          blocks: blocks.map((b) => ({ id: b.id, block_type: b.block_type, props: b.props })),
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 2500);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">Editor Landing Page</h2>
          <p className="text-sm text-white/45">
            Tambah, hapus, dan urutkan section. Bisa embed YouTube, HTML, atau widget apa pun.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {status === "saved" && <span className="text-sm text-[#00FF88]">✓ Tersimpan</span>}
          {status === "saving" && <span className="text-sm text-white/40">Menyimpan…</span>}
          {status === "error" && <span className="text-sm text-[#ff6b6b]">Gagal menyimpan</span>}
          <button
            onClick={save}
            disabled={saving || loading}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Menyimpan…" : "Simpan Halaman"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setPage(p.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              page === p.key
                ? "bg-[#00FF88] text-[#04110D]"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-white/40">Memuat konten…</p>
      ) : (
        <div className="mt-5">
          <div className={`mb-5 rounded-xl border ${customIdx >= 0 ? "border-[var(--accent)] bg-[#0A1D14]" : "border-white/10 bg-white/[.02]"}`}>
            <div className="flex flex-wrap items-center gap-2 p-3">
              <button
                onClick={toggleEmbed}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${customIdx >= 0 ? "bg-[rgba(0,255,136,.15)] text-white" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
              >
                ✦ Desain HTML dari luar {customIdx >= 0 ? "(AKTIF)" : ""}
              </button>
              {customIdx >= 0 ? (
                <span className="text-xs text-white/45">
                  Aktif di halaman ini — seluruh section di bawah <b>digantikan</b> oleh HTML ini. Matikan utk kembali ke section biasa.
                </span>
              ) : (
                <span className="text-xs text-white/45">
                  Tempel hasil desain (Framer/Carrd/dll.) utk memakai seluruh halaman — section dgn editor di atas menjadi tidak dipakai.
                </span>
              )}
            </div>
            {customIdx >= 0 && (
              <div className="border-t border-white/10 p-3">
                <textarea
                  rows={14}
                  value={blocks[customIdx].props.html ?? ""}
                  onChange={(e) => (customIdx >= 0 ? setProp(customIdx, "html", e.target.value) : null)}
                  placeholder="<div>… desain kamu di sini …</div>"
                  className={`${inputCls} min-h-[320px] resize-y font-mono text-xs`}
                />
                <p className="mt-1 text-[11px] text-white/35">
                  Seluruh section halaman di bawah ini tidak akan muncul saat opsi ini aktif (termasuk di live site).
                </p>
              </div>
            )}
          </div>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <div className="order-2 space-y-3 lg:order-1">
          {blocks.length === 0 && (
            <p className="text-sm text-white/40">
              Tidak ada block. Tambah block pertama di bawah.
            </p>
          )}
          {blocks.map((b, i) => {
            const meta = BLOCK_TYPES[b.block_type];
            const key = b.id ?? `tmp-${i}`;
            const open = expanded[b.id as string] ?? true;
            const vid = b.block_type === "youtube" ? youtubeId(b.props.url) : null;
            return (
              <div key={key} className="rounded-xl border border-white/10 bg-[#0A1D14]">
                <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                  <button
                    onClick={() => toggle(b.id)}
                    className="text-sm text-white/40 transition hover:text-white"
                    title={open ? "Tutup" : "Buka"}
                  >
                    {open ? "▾" : "▸"}
                  </button>
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/40">
                    #{i + 1}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => duplicate(i)}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/60 transition hover:bg-white/10"
                    >
                      ⧉ Salin
                    </button>
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === blocks.length - 1}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => remove(i)}
                      className="btn-danger"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                {open && (
                  <div className="space-y-3 border-t border-white/10 p-3">
                    {vid && (
                      <div className="overflow-hidden rounded-lg border border-white/10">
                        <div className="aspect-video w-full">
                          <iframe
                            src={`https://www.youtube.com/embed/${vid}`}
                            title="Preview Video"
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                    {meta.fields
                      .filter((f) => !f.showIf || b.props[f.showIf.key] === f.showIf.value)
                      .map((f) => (
                        <label key={f.key} className="block">
                          <span className="mb-1 block text-xs font-medium text-white/60">{f.label}</span>
                          {f.items ? (
                            <ItemEditor value={b.props[f.key] ?? ""} cols={f.items} onChange={(v) => setProp(i, f.key, v)} />
                          ) : f.select ? (
                            <select
                              value={b.props[f.key] ?? ""}
                              onChange={(e) => setProp(i, f.key, e.target.value)}
                              className={inputCls}
                            >
                              {f.select.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          ) : f.multiline ? (
                            <textarea
                              rows={f.rows ?? 4}
                              value={b.props[f.key] ?? ""}
                              onChange={(e) => setProp(i, f.key, e.target.value)}
                              className={`${inputCls} font-mono`}
                            />
                          ) : (
                            <input
                              type={f.url ? "url" : "text"}
                              value={b.props[f.key] ?? ""}
                              onChange={(e) => setProp(i, f.key, e.target.value)}
                              placeholder={f.url ? "https://…" : undefined}
                              className={inputCls}
                            />
                          )}
                        </label>
                      ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-2 pt-1">
            <select
              value={adding}
              onChange={(e) => setAdding(e.target.value as BlockType)}
              className={`${inputCls} w-auto`}
            >
              <option value="">Pilih tipe block…</option>
              {TYPE_LIST.map((t) => (
                <option key={t} value={t}>
                  {BLOCK_TYPES[t].label}
                </option>
              ))}
            </select>
            <button
              onClick={() => adding && addBlock(adding)}
              disabled={!adding}
              className="btn-outline disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Tambah
            </button>
          </div>
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#00ff88]">Preview langsung</p>
              <span className="text-xs text-white/40">Perubahan terlihat di sini</span>
            </div>
            <LivePreview blocks={blocks} device={device} onDevice={setDevice} />
          </div>
        </div>
        </div>
      )}
    </div>
  );
}