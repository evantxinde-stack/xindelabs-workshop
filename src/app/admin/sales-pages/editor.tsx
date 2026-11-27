"use client";

import { useMemo, useState } from "react";
import { SalesPageClient } from "@/app/p/[slug]/sales-page-client";
import {
  BLOCK_CATALOG,
  createBlock,
  extractYoutubeId,
  legacyConfigToBlocks,
  type SalesBlock,
  type SalesBlockType,
} from "@/lib/sales-blocks";

type BuilderPageState = {
  id?: string;
  slug: string;
  class_id: string;
  render_mode: "template" | "custom";
  is_default: boolean;
  is_published: boolean;
  cta_label: string;
  countdown_type: "evergreen" | "fixed" | "none";
  countdown_ends_at: string;
  countdown_duration_minutes: number;
  sales_notification_enabled: boolean;
  notification_items: string[];
  meta_pixel_id: string;
  custom_html: string;
  blocks: SalesBlock[];
};

function parseNoticeConfig(value: unknown): { items: string[]; meta_pixel_id: string } {
  let obj: any = value;
  if (typeof value === "string") {
    try {
      obj = JSON.parse(value);
    } catch {
      obj = {};
    }
  }
  return {
    items: Array.isArray(obj?.items) ? obj.items.map((x: unknown) => String(x ?? "")) : [],
    meta_pixel_id: typeof obj?.meta_pixel_id === "string" ? obj.meta_pixel_id.trim() : "",
  };
}

function defaultBlocks(productTitle?: string): SalesBlock[] {
  const hero = createBlock("hero");
  if (productTitle) hero.data.headline = productTitle;
  return [
    hero,
    createBlock("benefits"),
    createBlock("pricing"),
    createBlock("faq"),
    createBlock("cta"),
  ];
}

function blankPage(classId = "", productTitle = ""): BuilderPageState {
  return {
    slug: "",
    class_id: classId,
    render_mode: "template",
    is_default: false,
    is_published: true,
    cta_label: "Daftar sekarang",
    countdown_type: "evergreen",
    countdown_ends_at: "",
    countdown_duration_minutes: 30,
    sales_notification_enabled: false,
    notification_items: [],
    meta_pixel_id: "",
    custom_html: "",
    blocks: defaultBlocks(productTitle),
  };
}

function rowToState(row: any, classes: any[]): BuilderPageState {
  const prod = classes.find((c) => c.id === row.class_id);
  const notice = parseNoticeConfig(row.sales_notification_config);
  return {
    id: row.id,
    slug: String(row.slug || ""),
    class_id: String(row.class_id || ""),
    render_mode: row.render_mode === "custom" ? "custom" : "template",
    is_default: Boolean(row.is_default),
    is_published: row.is_published === undefined ? true : Boolean(row.is_published),
    cta_label: String(row.cta_label || "Daftar sekarang"),
    countdown_type:
      row.countdown_type === "fixed" || row.countdown_type === "none"
        ? row.countdown_type
        : "evergreen",
    countdown_ends_at: row.countdown_ends_at ? String(row.countdown_ends_at).slice(0, 16) : "",
    countdown_duration_minutes: Number(row.countdown_duration_minutes || 30),
    sales_notification_enabled: Boolean(row.sales_notification_enabled),
    notification_items: notice.items,
    meta_pixel_id: notice.meta_pixel_id,
    custom_html: String(row.custom_html || ""),
    blocks: legacyConfigToBlocks(row, prod?.title),
  };
}

function blockTitle(block: SalesBlock): string {
  const meta = BLOCK_CATALOG.find((c) => c.type === block.type);
  const d = block.data || {};
  const preview =
    d.headline ||
    d.heading ||
    d.label ||
    d.eyebrow ||
    (d.youtube_id ? `YouTube: ${d.youtube_id}` : "") ||
    (d.image_url ? "Gambar" : "");
  return preview ? `${meta?.label || block.type} — ${String(preview).slice(0, 36)}` : meta?.label || block.type;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-white/60">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-white/35">{hint}</span> : null}
    </label>
  );
}

function BlockInspector({
  block,
  onChange,
}: {
  block: SalesBlock;
  onChange: (nextData: Record<string, any>) => void;
}) {
  const d = block.data || {};
  const setD = (patch: Record<string, any>) => onChange({ ...d, ...patch });

  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Badge Atas">
              <input
                className="input-dark w-full"
                value={d.badge || ""}
                onChange={(e) => setD({ badge: e.target.value })}
              />
            </Field>
            <Field label="Rata Teks">
              <select
                className="input-dark w-full"
                value={d.align || "left"}
                onChange={(e) => setD({ align: e.target.value })}
              >
                <option value="left">Rata Kiri</option>
                <option value="center">Rata Tengah</option>
              </select>
            </Field>
          </div>
          <Field label="Headline">
            <input
              className="input-dark w-full"
              value={d.headline || ""}
              onChange={(e) => setD({ headline: e.target.value })}
            />
          </Field>
          <Field label="Highlight Hijau (Opsional)">
            <input
              className="input-dark w-full"
              value={d.highlight || ""}
              onChange={(e) => setD({ highlight: e.target.value })}
              placeholder="Kata yang disorot warna neon"
            />
          </Field>
          <Field label="Subheadline">
            <textarea
              rows={2}
              className="input-dark w-full"
              value={d.subheadline || ""}
              onChange={(e) => setD({ subheadline: e.target.value })}
            />
          </Field>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Label Tombol CTA">
              <input
                className="input-dark w-full"
                value={d.cta_label || ""}
                onChange={(e) => setD({ cta_label: e.target.value })}
              />
            </Field>
            <Field label="URL Gambar Hero (Opsional)">
              <input
                className="input-dark w-full"
                type="url"
                value={d.image_url || ""}
                onChange={(e) => setD({ image_url: e.target.value })}
                placeholder="https://..."
              />
            </Field>
          </div>
        </div>
      );

    case "video":
      return (
        <div className="space-y-3">
          <Field label="Label Section (Opsional)">
            <input
              className="input-dark w-full"
              value={d.heading || ""}
              onChange={(e) => setD({ heading: e.target.value })}
              placeholder="Video Penjelasan"
            />
          </Field>
          <Field label="URL / ID YouTube">
            <input
              className="input-dark w-full"
              value={d.youtube_id || ""}
              onChange={(e) => setD({ youtube_id: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </Field>
          <Field label="Caption Bawah Video (Opsional)">
            <input
              className="input-dark w-full"
              value={d.caption || ""}
              onChange={(e) => setD({ caption: e.target.value })}
            />
          </Field>
        </div>
      );

    case "text":
      return (
        <div className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Eyebrow (Opsional)">
              <input
                className="input-dark w-full"
                value={d.eyebrow || ""}
                onChange={(e) => setD({ eyebrow: e.target.value })}
              />
            </Field>
            <Field label="Rata Teks">
              <select
                className="input-dark w-full"
                value={d.align || "left"}
                onChange={(e) => setD({ align: e.target.value })}
              >
                <option value="left">Rata Kiri</option>
                <option value="center">Rata Tengah</option>
              </select>
            </Field>
          </div>
          <Field label="Judul">
            <input
              className="input-dark w-full"
              value={d.heading || ""}
              onChange={(e) => setD({ heading: e.target.value })}
            />
          </Field>
          <Field label="Isi Teks">
            <textarea
              rows={5}
              className="input-dark w-full"
              value={d.body || ""}
              onChange={(e) => setD({ body: e.target.value })}
            />
          </Field>
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <Field label="URL Gambar">
            <input
              className="input-dark w-full"
              type="url"
              value={d.image_url || ""}
              onChange={(e) => setD({ image_url: e.target.value })}
              placeholder="https://..."
            />
          </Field>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Ukuran">
              <select
                className="input-dark w-full"
                value={d.max_width || "large"}
                onChange={(e) => setD({ max_width: e.target.value })}
              >
                <option value="large">Lebar Penuh</option>
                <option value="medium">Sedang</option>
                <option value="small">Kecil</option>
              </select>
            </Field>
            <Field label="Caption (Opsional)">
              <input
                className="input-dark w-full"
                value={d.caption || ""}
                onChange={(e) => setD({ caption: e.target.value })}
              />
            </Field>
          </div>
        </div>
      );

    case "problems": {
      const items = Array.isArray(d.items) ? d.items : [];
      return (
        <div className="space-y-3">
          <Field label="Label Section">
            <input
              className="input-dark w-full"
              value={d.eyebrow || ""}
              onChange={(e) => setD({ eyebrow: e.target.value })}
            />
          </Field>
          {items.map((item: any, idx: number) => (
            <div key={idx} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-2.5">
              <div className="flex gap-2">
                <input
                  className="input-dark w-14 font-mono text-xs"
                  value={item.label || ""}
                  onChange={(e) =>
                    setD({
                      items: items.map((x: any, i: number) =>
                        i === idx ? { ...x, label: e.target.value } : x,
                      ),
                    })
                  }
                />
                <input
                  className="input-dark flex-1"
                  placeholder="Judul masalah"
                  value={item.title || ""}
                  onChange={(e) =>
                    setD({
                      items: items.map((x: any, i: number) =>
                        i === idx ? { ...x, title: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => setD({ items: items.filter((_: any, i: number) => i !== idx) })}
                  className="btn-danger"
                >
                  ✕
                </button>
              </div>
              <textarea
                rows={2}
                className="input-dark w-full"
                placeholder="Penjelasan..."
                value={item.body || ""}
                onChange={(e) =>
                  setD({
                    items: items.map((x: any, i: number) =>
                      i === idx ? { ...x, body: e.target.value } : x,
                    ),
                  })
                }
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setD({
                items: [
                  ...items,
                  { label: String(items.length + 1).padStart(2, "0"), title: "", body: "" },
                ],
              })
            }
            className="btn-outline"
          >
            + Tambah Masalah
          </button>
        </div>
      );
    }

    case "stats": {
      const items = Array.isArray(d.items) ? d.items : [];
      return (
        <div className="space-y-3">
          <Field label="Label Section">
            <input
              className="input-dark w-full"
              value={d.eyebrow || ""}
              onChange={(e) => setD({ eyebrow: e.target.value })}
            />
          </Field>
          {items.map((item: any, idx: number) => (
            <div key={idx} className="grid grid-cols-[100px_1fr_auto] gap-2">
              <input
                className="input-dark font-mono"
                placeholder="24/7"
                value={item.value || ""}
                onChange={(e) =>
                  setD({
                    items: items.map((x: any, i: number) =>
                      i === idx ? { ...x, value: e.target.value } : x,
                    ),
                  })
                }
              />
              <input
                className="input-dark"
                placeholder="Keterangan"
                value={item.label || ""}
                onChange={(e) =>
                  setD({
                    items: items.map((x: any, i: number) =>
                      i === idx ? { ...x, label: e.target.value } : x,
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() => setD({ items: items.filter((_: any, i: number) => i !== idx) })}
                className="btn-danger"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setD({ items: [...items, { value: "", label: "" }] })}
            className="btn-outline"
          >
            + Tambah Angka
          </button>
        </div>
      );
    }

    case "benefits": {
      const items = Array.isArray(d.items) ? d.items : [];
      return (
        <div className="space-y-3">
          <Field label="Label Section">
            <input
              className="input-dark w-full"
              value={d.eyebrow || ""}
              onChange={(e) => setD({ eyebrow: e.target.value })}
            />
          </Field>
          {items.map((item: any, idx: number) => (
            <div key={idx} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-2.5">
              <div className="flex gap-2">
                <input
                  className="input-dark flex-1"
                  placeholder="Judul benefit"
                  value={item.title || ""}
                  onChange={(e) =>
                    setD({
                      items: items.map((x: any, i: number) =>
                        i === idx ? { ...x, title: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => setD({ items: items.filter((_: any, i: number) => i !== idx) })}
                  className="btn-danger"
                >
                  ✕
                </button>
              </div>
              <textarea
                rows={2}
                className="input-dark w-full"
                placeholder="Deskripsi..."
                value={item.body || ""}
                onChange={(e) =>
                  setD({
                    items: items.map((x: any, i: number) =>
                      i === idx ? { ...x, body: e.target.value } : x,
                    ),
                  })
                }
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setD({ items: [...items, { title: "", body: "" }] })}
            className="btn-outline"
          >
            + Tambah Benefit
          </button>
        </div>
      );
    }

    case "curriculum":
      return (
        <div className="space-y-3">
          <p className="text-xs text-white/50">
            Blok ini otomatis menampilkan daftar modul dari produk yang dipilih (diatur di Course Management).
          </p>
          <Field label="Eyebrow">
            <input
              className="input-dark w-full"
              value={d.eyebrow || ""}
              onChange={(e) => setD({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="Judul">
            <input
              className="input-dark w-full"
              value={d.heading || ""}
              onChange={(e) => setD({ heading: e.target.value })}
            />
          </Field>
        </div>
      );

    case "testimonials": {
      const items = Array.isArray(d.items) ? d.items : [];
      return (
        <div className="space-y-3">
          <Field label="Label Section">
            <input
              className="input-dark w-full"
              value={d.eyebrow || ""}
              onChange={(e) => setD({ eyebrow: e.target.value })}
            />
          </Field>
          {items.map((item: any, idx: number) => (
            <div key={idx} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-2.5">
              <textarea
                rows={2}
                className="input-dark w-full"
                placeholder="Kutipan testimoni..."
                value={item.quote || ""}
                onChange={(e) =>
                  setD({
                    items: items.map((x: any, i: number) =>
                      i === idx ? { ...x, quote: e.target.value } : x,
                    ),
                  })
                }
              />
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  className="input-dark"
                  placeholder="Nama"
                  value={item.name || ""}
                  onChange={(e) =>
                    setD({
                      items: items.map((x: any, i: number) =>
                        i === idx ? { ...x, name: e.target.value } : x,
                      ),
                    })
                  }
                />
                <input
                  className="input-dark"
                  placeholder="Info / Bisnis"
                  value={item.meta || ""}
                  onChange={(e) =>
                    setD({
                      items: items.map((x: any, i: number) =>
                        i === idx ? { ...x, meta: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => setD({ items: items.filter((_: any, i: number) => i !== idx) })}
                  className="btn-danger"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setD({ items: [...items, { quote: "", name: "", meta: "" }] })}
            className="btn-outline"
          >
            + Tambah Testimoni
          </button>
        </div>
      );
    }

    case "pricing":
      return (
        <div className="space-y-3">
          <p className="text-xs text-white/50">
            Harga dan early bird otomatis diambil dari produk yang dipilih di Product Management.
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Eyebrow">
              <input
                className="input-dark w-full"
                value={d.eyebrow || ""}
                onChange={(e) => setD({ eyebrow: e.target.value })}
              />
            </Field>
            <Field label="Label Tombol Checkout">
              <input
                className="input-dark w-full"
                value={d.cta_label || ""}
                onChange={(e) => setD({ cta_label: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Judul Custom (Opsional, default nama produk)">
            <input
              className="input-dark w-full"
              value={d.heading || ""}
              onChange={(e) => setD({ heading: e.target.value })}
            />
          </Field>
          <Field label="Catatan Bawah Tombol">
            <input
              className="input-dark w-full"
              value={d.note || ""}
              onChange={(e) => setD({ note: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-xs text-white/75">
            <input
              type="checkbox"
              checked={d.show_countdown !== false}
              onChange={(e) => setD({ show_countdown: e.target.checked })}
            />
            Tampilkan countdown di dalam kartu harga
          </label>
        </div>
      );

    case "faq": {
      const items = Array.isArray(d.items) ? d.items : [];
      return (
        <div className="space-y-3">
          <Field label="Label Section">
            <input
              className="input-dark w-full"
              value={d.eyebrow || ""}
              onChange={(e) => setD({ eyebrow: e.target.value })}
            />
          </Field>
          {items.map((item: any, idx: number) => (
            <div key={idx} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-2.5">
              <div className="flex gap-2">
                <input
                  className="input-dark flex-1"
                  placeholder="Pertanyaan"
                  value={item.question || ""}
                  onChange={(e) =>
                    setD({
                      items: items.map((x: any, i: number) =>
                        i === idx ? { ...x, question: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => setD({ items: items.filter((_: any, i: number) => i !== idx) })}
                  className="btn-danger"
                >
                  ✕
                </button>
              </div>
              <textarea
                rows={2}
                className="input-dark w-full"
                placeholder="Jawaban..."
                value={item.answer || ""}
                onChange={(e) =>
                  setD({
                    items: items.map((x: any, i: number) =>
                      i === idx ? { ...x, answer: e.target.value } : x,
                    ),
                  })
                }
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setD({ items: [...items, { question: "", answer: "" }] })}
            className="btn-outline"
          >
            + Tambah FAQ
          </button>
        </div>
      );
    }

    case "cta":
      return (
        <div className="space-y-3">
          <Field label="Eyebrow">
            <input
              className="input-dark w-full"
              value={d.eyebrow || ""}
              onChange={(e) => setD({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="Headline Penutup">
            <input
              className="input-dark w-full"
              value={d.headline || ""}
              onChange={(e) => setD({ headline: e.target.value })}
            />
          </Field>
          <Field label="Subheadline">
            <textarea
              rows={2}
              className="input-dark w-full"
              value={d.subheadline || ""}
              onChange={(e) => setD({ subheadline: e.target.value })}
            />
          </Field>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Label Tombol">
              <input
                className="input-dark w-full"
                value={d.cta_label || ""}
                onChange={(e) => setD({ cta_label: e.target.value })}
              />
            </Field>
            <Field label="Link Custom (Kosong = Checkout)">
              <input
                className="input-dark w-full"
                value={d.cta_href || ""}
                onChange={(e) => setD({ cta_href: e.target.value })}
                placeholder="https://..."
              />
            </Field>
          </div>
        </div>
      );

    case "html":
      return (
        <div className="space-y-3">
          <Field label="Label Blok">
            <input
              className="input-dark w-full"
              value={d.label || ""}
              onChange={(e) => setD({ label: e.target.value })}
              placeholder="Custom HTML"
            />
          </Field>
          <Field label="Upload File .html (Opsional)">
            <input
              type="file"
              accept=".html,text/html"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => setD({ html: String(reader.result || "") });
                reader.readAsText(f);
              }}
              className="block w-full text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white"
            />
          </Field>
          <Field label="Kode HTML">
            <textarea
              rows={8}
              className="input-dark w-full font-mono text-xs"
              value={d.html || ""}
              onChange={(e) => setD({ html: e.target.value })}
            />
          </Field>
        </div>
      );
  }
}

export default function SalesPageEditor({
  initial,
  classes,
  lessons,
}: {
  initial: any[];
  classes: any[];
  lessons: Record<string, any[]>;
}) {
  const [rows, setRows] = useState<any[]>(initial);
  const [productFilter, setProductFilter] = useState<string>("all");
  const [form, setForm] = useState<BuilderPageState>(
    initial[0] ? rowToState(initial[0], classes) : blankPage(classes[0]?.id || "", classes[0]?.title || ""),
  );
  const [leftTab, setLeftTab] = useState<"blocks" | "settings">("blocks");
  const [expandedId, setExpandedId] = useState<string | null>(
    initial[0] ? legacyConfigToBlocks(initial[0])[0]?.id ?? null : null,
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragPaletteType, setDragPaletteType] = useState<SalesBlockType | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copiedSlug, setCopiedSlug] = useState("");

  const filteredRows = useMemo(() => {
    if (productFilter === "all") return rows;
    if (productFilter === "unassigned") return rows.filter((r) => !r.class_id);
    return rows.filter((r) => r.class_id === productFilter);
  }, [rows, productFilter]);

  const countByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const k = r.class_id || "unassigned";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [rows]);

  const selectedProduct = useMemo(
    () =>
      classes.find((c) => c.id === form.class_id) || {
        id: "",
        slug: form.slug || "preview",
        title: form.blocks.find((b) => b.type === "hero")?.data?.headline || "Produk XindeLabs",
        description: "",
        price: 499000,
      },
    [classes, form.class_id, form.slug, form.blocks],
  );

  function set<K extends keyof BuilderPageState>(key: K, value: BuilderPageState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  }

  function addBlock(type: SalesBlockType, atIndex?: number) {
    const created = createBlock(type);
    setForm((prev) => {
      const next = [...prev.blocks];
      if (atIndex === undefined || atIndex < 0 || atIndex > next.length) {
        next.push(created);
      } else {
        next.splice(atIndex, 0, created);
      }
      return { ...prev, blocks: next };
    });
    setExpandedId(created.id);
    setStatus(null);
  }

  function updateBlockData(id: string, data: Record<string, any>) {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, data } : b)),
    }));
  }

  function toggleHidden(id: string) {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, hidden: !b.hidden } : b)),
    }));
  }

  function duplicateBlock(idx: number) {
    const src = form.blocks[idx];
    const copy: SalesBlock = {
      id: `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      type: src.type,
      hidden: src.hidden,
      data: structuredClone(src.data),
    };
    const next = [...form.blocks];
    next.splice(idx + 1, 0, copy);
    set("blocks", next);
    setExpandedId(copy.id);
  }

  function removeBlock(id: string) {
    set("blocks", form.blocks.filter((b) => b.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function moveBlock(from: number, to: number) {
    if (from === to || to < 0 || to >= form.blocks.length) return;
    const next = [...form.blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    set("blocks", next);
  }

  function handleDropOnIndex(targetIdx: number) {
    if (dragPaletteType) {
      addBlock(dragPaletteType, targetIdx);
    } else if (dragIndex !== null && dragIndex !== targetIdx) {
      moveBlock(dragIndex, targetIdx);
    }
    setDragIndex(null);
    setDragPaletteType(null);
    setDropTargetIndex(null);
  }

  function startNewVariant() {
    const targetClassId =
      productFilter !== "all" && productFilter !== "unassigned"
        ? productFilter
        : classes[0]?.id || "";
    const prod = classes.find((c) => c.id === targetClassId);
    const count = rows.filter((r) => r.class_id === targetClassId).length;
    const next = blankPage(targetClassId, prod?.title || "");
    next.slug = prod?.slug ? `${prod.slug}-v${count + 1}` : "";
    setForm(next);
    setExpandedId(next.blocks[0]?.id ?? null);
    setLeftTab("settings");
    setStatus(null);
  }

  function duplicateVariant() {
    setForm((prev) => ({
      ...prev,
      id: undefined,
      slug: `${prev.slug || "page"}-copy`,
      is_default: false,
    }));
    setLeftTab("settings");
    setStatus({
      type: "ok",
      text: "Varian diduplikat! Ubah slug di tab Pengaturan lalu klik Simpan.",
    });
  }

  function loadRow(row: any) {
    const next = rowToState(row, classes);
    setForm(next);
    setExpandedId(next.blocks[0]?.id ?? null);
    setStatus(null);
  }

  async function save() {
    if (!form.slug.trim()) {
      setStatus({ type: "err", text: "Slug URL wajib diisi di tab Pengaturan." });
      setLeftTab("settings");
      return;
    }

    setSaving(true);
    setStatus(null);

    const heroBlock = form.blocks.find((b) => b.type === "hero");
    const videoBlock = form.blocks.find((b) => b.type === "video");
    const ctaBlock = form.blocks.find((b) => b.type === "cta");

    const payload = {
      id: form.id,
      slug: form.slug.trim().toLowerCase(),
      class_id: form.class_id || null,
      render_mode: form.render_mode,
      is_default: form.is_default,
      is_published: form.is_published,
      hero_badge: heroBlock?.data?.badge || null,
      headline: heroBlock?.data?.headline || selectedProduct.title || null,
      subheadline: heroBlock?.data?.subheadline || null,
      vsl_youtube_id: extractYoutubeId(videoBlock?.data?.youtube_id || ""),
      cta_label: form.cta_label || heroBlock?.data?.cta_label || "Daftar sekarang",
      final_headline: ctaBlock?.data?.headline || null,
      final_subheadline: ctaBlock?.data?.subheadline || null,
      problem_blocks: form.blocks.find((b) => b.type === "problems")?.data?.items || [],
      stats: form.blocks.find((b) => b.type === "stats")?.data?.items || [],
      benefits: form.blocks.find((b) => b.type === "benefits")?.data?.items || [],
      testimonials: form.blocks.find((b) => b.type === "testimonials")?.data?.items || [],
      faq_items: form.blocks.find((b) => b.type === "faq")?.data?.items || [],
      countdown_type: form.countdown_type,
      countdown_ends_at: form.countdown_ends_at || null,
      countdown_duration_minutes: Number(form.countdown_duration_minutes || 30),
      sales_notification_enabled: form.sales_notification_enabled,
      sales_notification_config: {
        items: form.notification_items.map((x) => x.trim()).filter(Boolean),
        meta_pixel_id: form.meta_pixel_id.replace(/\D/g, ""),
        builder_blocks: form.blocks,
      },
      custom_html: form.custom_html,
      custom_html_position: "mid",
    };

    const r = await fetch("/api/admin/sales-pages", {
      method: form.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus({ type: "err", text: result.error || "Gagal menyimpan landing page." });
    } else {
      const saved = result.data;
      if (saved) {
        setRows((prev) => {
          const exists = prev.some((x) => x.id === saved.id);
          const next = exists
            ? prev.map((x) => (x.id === saved.id ? saved : x))
            : [saved, ...prev];
          return saved.is_default && saved.class_id
            ? next.map((x) =>
                x.id !== saved.id && x.class_id === saved.class_id
                  ? { ...x, is_default: false }
                  : x,
              )
            : next;
        });
        setForm(rowToState(saved, classes));
      }
      setStatus({ type: "ok", text: `Landing page /p/${payload.slug} tersimpan!` });
    }
    setSaving(false);
  }

  async function removeVariant(row: any) {
    if (!window.confirm(`Hapus landing page /p/${row.slug}?`)) return;
    const r = await fetch(`/api/admin/sales-pages?id=${encodeURIComponent(row.id)}`, {
      method: "DELETE",
    });
    if (r.ok) {
      const remaining = rows.filter((x) => x.id !== row.id);
      setRows(remaining);
      if (form.id === row.id) {
        setForm(
          remaining[0]
            ? rowToState(remaining[0], classes)
            : blankPage(classes[0]?.id || "", classes[0]?.title || ""),
        );
      }
      setStatus({ type: "ok", text: `Landing page /p/${row.slug} dihapus.` });
    }
  }

  function copyLink(slug: string) {
    navigator.clipboard?.writeText(`https://xindelabs.web.id/p/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(""), 1800);
  }

  const previewConfig = {
    ...form,
    slug: form.slug || "preview",
    sales_notification_config: {
      items: form.notification_items.filter(Boolean),
      builder_blocks: form.blocks,
    },
  };

  return (
    <div className="space-y-4">
      {/* Top Variant Manager Bar */}
      <div className="panel space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="input-dark text-xs"
            >
              <option value="all">Semua Produk ({rows.length} LP)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({countByProduct.get(c.id) || 0} LP)
                </option>
              ))}
            </select>
            <button type="button" onClick={startNewVariant} className="btn-outline">
              + Buat Varian LP Baru
            </button>
            <button type="button" onClick={duplicateVariant} className="btn-outline">
              Duplikat Varian
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition ${
                showPreview
                  ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]"
                  : "border-white/15 text-white/60"
              }`}
            >
              {showPreview ? "Sembunyikan Preview" : "Tampilkan Live Preview"}
            </button>
            {form.slug ? (
              <a
                href={`/p/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                Buka /p/{form.slug} ↗
              </a>
            ) : null}
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="btn-glow rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Simpan Landing Page"}
            </button>
          </div>
        </div>

        {/* Horizontal Variant Strip */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filteredRows.map((row) => {
            const active = form.id === row.id;
            const prod = classes.find((c) => c.id === row.class_id);
            return (
              <div
                key={row.id}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                  active
                    ? "border-[#00ff88] bg-[#00ff88]/10 text-white"
                    : "border-white/10 bg-white/[.02] text-white/65 hover:border-white/25"
                }`}
              >
                <button type="button" onClick={() => loadRow(row)} className="text-left">
                  <span className="flex items-center gap-1.5 font-mono font-semibold">
                    /p/{row.slug}
                    {row.is_default ? (
                      <span className="rounded bg-[#00ff88]/20 px-1.5 py-0.5 text-[9px] uppercase text-[#00ff88]">
                        utama
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block max-w-[160px] truncate text-[10px] text-white/40">
                    {prod?.title || "Tanpa produk"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => copyLink(row.slug)}
                  className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/55 hover:text-[#00ff88]"
                >
                  {copiedSlug === row.slug ? "✓" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => removeVariant(row)}
                  className="rounded border border-red-400/20 px-1.5 py-0.5 text-[10px] text-red-300/80 hover:bg-red-500/10"
                >
                  ✕
                </button>
              </div>
            );
          })}
          {filteredRows.length === 0 ? (
            <p className="py-1 text-xs text-white/40">
              Belum ada landing page. Klik &ldquo;+ Buat Varian LP Baru&rdquo;.
            </p>
          ) : null}
        </div>
      </div>

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

      {/* Main Split Workspace */}
      <div
        className={`grid items-start gap-5 ${
          showPreview ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)]" : "grid-cols-1"
        }`}
      >
        {/* LEFT: Drag-and-Drop Builder */}
        <div className="panel space-y-4 p-4 sm:p-5">
          {/* Builder Mode Switch */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setLeftTab("blocks")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  leftTab === "blocks"
                    ? "bg-[#00ff88] text-[#051a10]"
                    : "border border-white/10 bg-white/[.03] text-white/65 hover:text-white"
                }`}
              >
                Susun Blok ({form.blocks.length})
              </button>
              <button
                type="button"
                onClick={() => setLeftTab("settings")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  leftTab === "settings"
                    ? "bg-[#00ff88] text-[#051a10]"
                    : "border border-white/10 bg-white/[.03] text-white/65 hover:text-white"
                }`}
              >
                Pengaturan & Countdown
              </button>
            </div>
            <span className="font-mono text-[11px] text-white/40">
              Drag handle ⋮⋮ untuk ubah urutan
            </span>
          </div>

          {leftTab === "settings" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Produk yang Dijual">
                  <select
                    value={form.class_id}
                    onChange={(e) => set("class_id", e.target.value)}
                    className="input-dark w-full"
                  >
                    <option value="">Tanpa produk</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} · /{c.slug}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Slug URL (/p/[slug])">
                  <input
                    className="input-dark w-full font-mono text-xs"
                    value={form.slug}
                    onChange={(e) => set("slug", e.target.value)}
                    placeholder="hermes-v1"
                  />
                </Field>
              </div>

              <Field
                label="Meta Pixel ID (Khusus Sales Page Ini · Opsional)"
                hint="Isi angka Pixel ID Meta Ads khusus untuk landing page ini (mis. 123456789012345). Otomatis melacak PageView, ViewContent, & AddToCart."
              >
                <input
                  className="input-dark w-full font-mono text-xs"
                  inputMode="numeric"
                  value={form.meta_pixel_id}
                  onChange={(e) => set("meta_pixel_id", e.target.value.replace(/\D/g, ""))}
                  placeholder="Contoh: 123456789012345 (kosongkan jika hanya pakai pixel global)"
                />
              </Field>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => set("render_mode", "template")}
                  className={`rounded-xl border p-3 text-left text-xs transition ${
                    form.render_mode === "template"
                      ? "border-[#00ff88] bg-[#00ff88]/10 text-white"
                      : "border-white/10 bg-white/[.02] text-white/60"
                  }`}
                >
                  <b className="block">Drag & Drop Block Builder</b>
                  <span className="mt-0.5 block text-[11px] opacity-70">
                    Susun blok visual bebas + blok Embed HTML
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => set("render_mode", "custom")}
                  className={`rounded-xl border p-3 text-left text-xs transition ${
                    form.render_mode === "custom"
                      ? "border-[#00ff88] bg-[#00ff88]/10 text-white"
                      : "border-white/10 bg-white/[.02] text-white/60"
                  }`}
                >
                  <b className="block">Full Custom HTML Page</b>
                  <span className="mt-0.5 block text-[11px] opacity-70">
                    1 halaman penuh dari kode/file .html + Checkout Mayar
                  </span>
                </button>
              </div>

              {form.render_mode === "custom" ? (
                <div className="space-y-3 rounded-xl border border-[#00ff88]/25 bg-black/25 p-3.5">
                  <Field label="Upload File .html">
                    <input
                      type="file"
                      accept=".html,text/html"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = () => set("custom_html", String(reader.result || ""));
                        reader.readAsText(f);
                      }}
                      className="block w-full text-xs text-white/60"
                    />
                  </Field>
                  <Field label="Kode Full HTML">
                    <textarea
                      rows={10}
                      className="input-dark w-full font-mono text-xs"
                      value={form.custom_html}
                      onChange={(e) => set("custom_html", e.target.value)}
                      placeholder="<!doctype html>..."
                    />
                  </Field>
                </div>
              ) : null}

              <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
                <Field label="Label Tombol CTA Header">
                  <input
                    className="input-dark w-full"
                    value={form.cta_label}
                    onChange={(e) => set("cta_label", e.target.value)}
                  />
                </Field>
                <Field label="Tipe Countdown">
                  <select
                    value={form.countdown_type}
                    onChange={(e) =>
                      set("countdown_type", e.target.value as BuilderPageState["countdown_type"])
                    }
                    className="input-dark w-full"
                  >
                    <option value="evergreen">Evergreen</option>
                    <option value="fixed">Tanggal Tetap</option>
                    <option value="none">Nonaktif</option>
                  </select>
                </Field>
                {form.countdown_type === "evergreen" ? (
                  <Field label="Durasi Evergreen (menit)">
                    <input
                      type="number"
                      min="1"
                      className="input-dark w-full"
                      value={form.countdown_duration_minutes}
                      onChange={(e) =>
                        set("countdown_duration_minutes", Number(e.target.value || 30))
                      }
                    />
                  </Field>
                ) : form.countdown_type === "fixed" ? (
                  <Field label="Countdown Berakhir">
                    <input
                      type="datetime-local"
                      className="input-dark w-full"
                      value={form.countdown_ends_at}
                      onChange={(e) => set("countdown_ends_at", e.target.value)}
                    />
                  </Field>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={form.sales_notification_enabled}
                    onChange={(e) => set("sales_notification_enabled", e.target.checked)}
                  />
                  Aktifkan Live Sales Toast
                </label>
                {form.sales_notification_enabled ? (
                  <div className="space-y-2 pt-1">
                    {form.notification_items.map((txt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          className="input-dark flex-1"
                          value={txt}
                          placeholder="Andi dari Jakarta baru saja daftar"
                          onChange={(e) =>
                            set(
                              "notification_items",
                              form.notification_items.map((x, i) =>
                                i === idx ? e.target.value : x,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "notification_items",
                              form.notification_items.filter((_, i) => i !== idx),
                            )
                          }
                          className="btn-danger"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => set("notification_items", [...form.notification_items, ""])}
                      className="btn-outline"
                    >
                      + Tambah Notifikasi
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-5 border-t border-white/10 pt-4 text-sm text-white/75">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => set("is_default", e.target.checked)}
                  />
                  Landing page utama produk ini
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => set("is_published", e.target.checked)}
                  />
                  Publikasikan
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Draggable Block Palette */}
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#00ff88]">
                  + Klik atau Drag Blok ke Daftar di Bawah
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {BLOCK_CATALOG.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      draggable
                      onDragStart={() => {
                        setDragPaletteType(item.type);
                        setDragIndex(null);
                      }}
                      onDragEnd={() => {
                        setDragPaletteType(null);
                        setDropTargetIndex(null);
                      }}
                      onClick={() => addBlock(item.type)}
                      title={item.desc}
                      className="inline-flex cursor-grab items-center gap-1.5 rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1.5 text-xs text-white/80 transition hover:border-[#00ff88]/50 hover:bg-[#00ff88]/10 hover:text-white active:cursor-grabbing"
                    >
                      <span className="font-mono text-[11px] text-[#00ff88]">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sortable Drag-and-Drop Block List */}
              <div className="space-y-2">
                {form.blocks.map((block, idx) => {
                  const isExpanded = expandedId === block.id;
                  const isDropTarget = dropTargetIndex === idx;
                  return (
                    <div
                      key={block.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dropTargetIndex !== idx) setDropTargetIndex(idx);
                      }}
                      onDragLeave={() => {
                        if (dropTargetIndex === idx) setDropTargetIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnIndex(idx);
                      }}
                      className={`rounded-xl border transition ${
                        isDropTarget
                          ? "border-[#00ff88] bg-[#00ff88]/10 shadow-[0_0_0_2px_rgba(0,255,136,0.25)]"
                          : isExpanded
                            ? "border-[#00ff88]/50 bg-[#0A140E]"
                            : "border-white/10 bg-white/[.02]"
                      } ${block.hidden ? "opacity-55" : ""}`}
                    >
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        {/* Drag Handle */}
                        <span
                          draggable
                          onDragStart={() => {
                            setDragIndex(idx);
                            setDragPaletteType(null);
                          }}
                          onDragEnd={() => {
                            setDragIndex(null);
                            setDropTargetIndex(null);
                          }}
                          title="Tarik untuk memindahkan posisi blok"
                          className="cursor-grab select-none rounded px-1.5 py-1 font-mono text-sm text-white/40 hover:bg-white/10 hover:text-[#00ff88] active:cursor-grabbing"
                        >
                          ⋮⋮
                        </span>

                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : block.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block truncate text-xs font-semibold text-white">
                            {blockTitle(block)}
                          </span>
                        </button>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveBlock(idx, idx - 1)}
                            title="Geser ke atas"
                            className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-white/55 hover:bg-white/10 disabled:opacity-25"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={idx === form.blocks.length - 1}
                            onClick={() => moveBlock(idx, idx + 1)}
                            title="Geser ke bawah"
                            className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-white/55 hover:bg-white/10 disabled:opacity-25"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleHidden(block.id)}
                            title={block.hidden ? "Tampilkan blok" : "Sembunyikan blok"}
                            className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-white/55 hover:bg-white/10"
                          >
                            {block.hidden ? "Tersembunyi" : "Tampil"}
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateBlock(idx)}
                            title="Duplikat blok"
                            className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-white/55 hover:bg-white/10"
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            title="Hapus blok"
                            className="rounded border border-red-400/25 px-1.5 py-0.5 text-[11px] text-red-300 hover:bg-red-500/10"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="border-t border-white/10 p-3.5">
                          <BlockInspector
                            block={block}
                            onChange={(nextData) => updateBlockData(block.id, nextData)}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {/* Drop zone at bottom of list */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTargetIndex(form.blocks.length);
                  }}
                  onDragLeave={() => setDropTargetIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnIndex(form.blocks.length);
                  }}
                  className={`rounded-xl border border-dashed py-4 text-center text-xs transition ${
                    dropTargetIndex === form.blocks.length
                      ? "border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]"
                      : "border-white/15 text-white/35"
                  }`}
                >
                  Tarik blok ke sini untuk menambahkan di bagian paling bawah
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Real-Time Live Preview */}
        {showPreview ? (
          <aside className="overflow-hidden rounded-2xl border border-[#163020] bg-[#050A07] lg:sticky lg:top-4">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0A140E] px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00ff88]" />
                <span className="font-mono text-[11px] text-white/75">
                  Live Preview · /p/{form.slug || "preview"}
                </span>
              </div>
              <div className="flex gap-1">
                {(["desktop", "mobile"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPreviewDevice(d)}
                    className={`rounded-md px-2.5 py-1 font-mono text-[10px] uppercase transition ${
                      previewDevice === d
                        ? "bg-[#00ff88] font-bold text-[#051a10]"
                        : "text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex h-[78vh] justify-center overflow-auto bg-black/50 p-3">
              <div
                onClickCapture={(e: any) => {
                  if (e.target?.closest?.("a")) e.preventDefault();
                }}
                className="origin-top overflow-x-hidden rounded-xl border border-white/10 bg-[#04110D] shadow-2xl"
                style={{
                  width: previewDevice === "mobile" ? 390 : 1200,
                  zoom: previewDevice === "mobile" ? 0.85 : 0.41,
                }}
              >
                <SalesPageClient
                  config={previewConfig}
                  product={selectedProduct}
                  lessons={lessons[form.class_id] || []}
                />
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
