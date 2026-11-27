"use client";

import { useState } from "react";
import {
  DEFAULT_SITE_CONFIG,
  type EditableServiceLine,
  type SiteConfig,
} from "@/lib/site-config";

type TabKey = "global" | "home" | "service" | "learn";

type ClassOption = {
  slug: string;
  title: string;
  product_type: string;
};

const TABS: { key: TabKey; label: string; previewHref: string; previewLabel: string }[] = [
  { key: "global", label: "Global & Kontak", previewHref: "/", previewLabel: "Lihat Homepage ↗" },
  { key: "home", label: "Homepage (/)", previewHref: "/", previewLabel: "Lihat Homepage ↗" },
  { key: "service", label: "Service (/service)", previewHref: "/service", previewLabel: "Lihat Service ↗" },
  { key: "learn", label: "Learn (/learn)", previewHref: "/learn", previewLabel: "Lihat Learn ↗" },
];

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
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-white/70">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-white/40">{hint}</span> : null}
    </label>
  );
}

function StringListEditor({
  items,
  placeholder,
  addLabel,
  onChange,
}: {
  items: string[];
  placeholder: string;
  addLabel: string;
  onChange: (next: string[]) => void;
}) {
  const update = (idx: number, val: string) =>
    onChange(items.map((item, i) => (i === idx ? val : item)));
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-6 shrink-0 font-mono text-xs text-[#00ff88]">
            {String(idx + 1).padStart(2, "0")}
          </span>
          <input
            value={item}
            placeholder={placeholder}
            onChange={(e) => update(idx, e.target.value)}
            className="input-dark flex-1"
          />
          <button
            type="button"
            onClick={() => move(idx, -1)}
            disabled={idx === 0}
            className="rounded border border-white/10 px-2 py-1.5 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => move(idx, 1)}
            disabled={idx === items.length - 1}
            className="rounded border border-white/10 px-2 py-1.5 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30"
          >
            ↓
          </button>
          <button type="button" onClick={() => remove(idx)} className="btn-danger">
            Hapus
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="btn-outline"
      >
        + {addLabel}
      </button>
    </div>
  );
}

export default function SiteSettingsEditor({
  initialConfig,
  classes,
}: {
  initialConfig: SiteConfig;
  classes: ClassOption[];
}) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [tab, setTab] = useState<TabKey>("global");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const activeTabMeta = TABS.find((t) => t.key === tab) ?? TABS[0];

  function patchSection<K extends TabKey>(section: K, patch: Partial<SiteConfig[K]>) {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...patch },
    }));
    setStatus(null);
  }

  function resetCurrentTab() {
    setConfig((prev) => ({
      ...prev,
      [tab]: structuredClone(DEFAULT_SITE_CONFIG[tab]),
    }));
    setStatus({
      type: "ok",
      text: `Tab "${activeTabMeta.label}" dikembalikan ke default (klik Simpan untuk menerapkan ke situs).`,
    });
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: "err", text: json.error || "Gagal menyimpan pengaturan." });
      } else {
        if (json.config) setConfig(json.config);
        setStatus({
          type: "ok",
          text: "Tersimpan! Perubahan langsung aktif di frontend.",
        });
      }
    } catch {
      setStatus({ type: "err", text: "Koneksi gagal saat menyimpan pengaturan." });
    } finally {
      setSaving(false);
    }
  }

  function updateServiceLine(idx: number, patch: Partial<EditableServiceLine>) {
    const next = config.service.lines.map((line, i) => (i === idx ? { ...line, ...patch } : line));
    patchSection("service", { lines: next });
  }

  function moveServiceLine(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= config.service.lines.length) return;
    const next = [...config.service.lines];
    [next[idx], next[target]] = [next[target], next[idx]];
    const renumbered = next.map((line, i) => ({
      ...line,
      number: String(i + 1).padStart(2, "0"),
    }));
    patchSection("service", { lines: renumbered });
  }

  function removeServiceLine(idx: number) {
    const next = config.service.lines
      .filter((_, i) => i !== idx)
      .map((line, i) => ({ ...line, number: String(i + 1).padStart(2, "0") }));
    patchSection("service", { lines: next });
  }

  function addServiceLine() {
    const nextNum = String(config.service.lines.length + 1).padStart(2, "0");
    patchSection("service", {
      lines: [
        ...config.service.lines,
        {
          slug: `layanan-${config.service.lines.length + 1}`,
          number: nextNum,
          title: "Layanan Baru",
          short: "Deskripsi singkat untuk kartu di homepage.",
          description: "Penjelasan lengkap layanan yang tampil di halaman /service.",
          points: ["Poin deliverable pertama"],
        },
      ],
    });
  }

  return (
    <div className="space-y-5">
      {/* Top tab & action bar */}
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-[#00ff88] text-[#051a10]"
                  : "border border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={activeTabMeta.previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            {activeTabMeta.previewLabel}
          </a>
          <button type="button" onClick={resetCurrentTab} className="btn-outline">
            Reset Tab
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="btn-glow rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {status ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            status.type === "ok"
              ? "border-[#00ff88]/30 bg-[#00ff88]/10 text-[#86efac]"
              : "border-red-400/30 bg-red-500/10 text-red-200"
          }`}
        >
          {status.text}
        </div>
      ) : null}

      {/* TAB 1: GLOBAL */}
      {tab === "global" && (
        <div className="panel space-y-5 p-5">
          <div>
            <h2 className="panel-title">Kontak & Identitas Global</h2>
            <p className="mt-1 text-xs text-white/45">
              Nomor WhatsApp di sini otomatis tersinkron ke Homepage, halaman Service, dan key <code>wa_admin_number</code>.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Nomor WhatsApp Admin"
              hint="Format internasional tanpa +, misal 62895335137700"
            >
              <input
                value={config.global.wa_admin_number}
                onChange={(e) => patchSection("global", { wa_admin_number: e.target.value })}
                className="input-dark w-full"
              />
            </Field>
            <Field label="Handle Instagram">
              <input
                value={config.global.instagram_handle}
                onChange={(e) => patchSection("global", { instagram_handle: e.target.value })}
                className="input-dark w-full"
              />
            </Field>
            <Field label="URL Instagram">
              <input
                value={config.global.instagram_url}
                onChange={(e) => patchSection("global", { instagram_url: e.target.value })}
                className="input-dark w-full"
              />
            </Field>
            <Field label="Label Tombol CTA Header">
              <input
                value={config.global.header_cta_label}
                onChange={(e) => patchSection("global", { header_cta_label: e.target.value })}
                className="input-dark w-full"
              />
            </Field>
            <Field label="Link Tombol CTA Header">
              <input
                value={config.global.header_cta_href}
                onChange={(e) => patchSection("global", { header_cta_href: e.target.value })}
                className="input-dark w-full"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tagline Footer (Hijau)">
                <input
                  value={config.global.footer_tagline_highlight}
                  onChange={(e) =>
                    patchSection("global", { footer_tagline_highlight: e.target.value })
                  }
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Tagline Footer (Lanjutan)">
                <input
                  value={config.global.footer_tagline_rest}
                  onChange={(e) =>
                    patchSection("global", { footer_tagline_rest: e.target.value })
                  }
                  className="input-dark w-full"
                />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOMEPAGE */}
      {tab === "home" && (
        <div className="space-y-5">
          <section className="panel space-y-4 p-5">
            <h2 className="panel-title">Hero Section</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Eyebrow (Teks Monospace Atas)">
                <input
                  value={config.home.hero_eyebrow}
                  onChange={(e) => patchSection("home", { hero_eyebrow: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="URL Foto Founder" hint="Default: /founder.jpg">
                <input
                  value={config.home.founder_image}
                  onChange={(e) => patchSection("home", { founder_image: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Headline Baris 1 (Putih)">
                <input
                  value={config.home.hero_title_line1}
                  onChange={(e) => patchSection("home", { hero_title_line1: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Headline Highlight (Hijau Neon)">
                <input
                  value={config.home.hero_title_highlight}
                  onChange={(e) => patchSection("home", { hero_title_highlight: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Subheadline">
                  <textarea
                    rows={3}
                    value={config.home.hero_subtitle}
                    onChange={(e) => patchSection("home", { hero_subtitle: e.target.value })}
                    className="input-dark w-full"
                  />
                </Field>
              </div>
              <Field label="Aksen Tulisan Tangan (Handwriting)">
                <input
                  value={config.home.hero_subtitle_hand}
                  onChange={(e) => patchSection("home", { hero_subtitle_hand: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Caption Bawah Foto Founder">
                <input
                  value={config.home.founder_caption}
                  onChange={(e) => patchSection("home", { founder_caption: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Label Tombol Utama">
                <input
                  value={config.home.hero_primary_cta_label}
                  onChange={(e) =>
                    patchSection("home", { hero_primary_cta_label: e.target.value })
                  }
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Link Tombol Utama">
                <input
                  value={config.home.hero_primary_cta_href}
                  onChange={(e) =>
                    patchSection("home", { hero_primary_cta_href: e.target.value })
                  }
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Label Tombol Sekunder">
                <input
                  value={config.home.hero_secondary_cta_label}
                  onChange={(e) =>
                    patchSection("home", { hero_secondary_cta_label: e.target.value })
                  }
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Link Tombol Sekunder">
                <input
                  value={config.home.hero_secondary_cta_href}
                  onChange={(e) =>
                    patchSection("home", { hero_secondary_cta_href: e.target.value })
                  }
                  className="input-dark w-full"
                />
              </Field>
            </div>
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="panel-title">Angka Statistik (4 Kolom)</h2>
            <div className="space-y-2.5">
              {config.home.stats.map((st, idx) => (
                <div key={idx} className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
                  <input
                    value={st.v}
                    placeholder="Nilai (mis. 24/7)"
                    onChange={(e) => {
                      const next = config.home.stats.map((x, i) =>
                        i === idx ? { ...x, v: e.target.value } : x,
                      );
                      patchSection("home", { stats: next });
                    }}
                    className="input-dark"
                  />
                  <input
                    value={st.k}
                    placeholder="Keterangan"
                    onChange={(e) => {
                      const next = config.home.stats.map((x, i) =>
                        i === idx ? { ...x, k: e.target.value } : x,
                      );
                      patchSection("home", { stats: next });
                    }}
                    className="input-dark"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchSection("home", {
                        stats: config.home.stats.filter((_, i) => i !== idx),
                      })
                    }
                    className="btn-danger"
                  >
                    Hapus
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patchSection("home", {
                    stats: [...config.home.stats, { v: "", k: "" }],
                  })
                }
                className="btn-outline"
              >
                + Tambah Statistik
              </button>
            </div>
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="panel-title">Section 01 — Tentang & Track Record</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Judul Bagian 1">
                <input
                  value={config.home.about_title}
                  onChange={(e) => patchSection("home", { about_title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Judul Highlight (Hijau)">
                <input
                  value={config.home.about_title_highlight}
                  onChange={(e) =>
                    patchSection("home", { about_title_highlight: e.target.value })
                  }
                  className="input-dark w-full"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Paragraf 1">
                  <textarea
                    rows={3}
                    value={config.home.about_p1}
                    onChange={(e) => patchSection("home", { about_p1: e.target.value })}
                    className="input-dark w-full"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Paragraf 2">
                  <textarea
                    rows={3}
                    value={config.home.about_p2}
                    onChange={(e) => patchSection("home", { about_p2: e.target.value })}
                    className="input-dark w-full"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Quote Highlight">
                  <input
                    value={config.home.about_quote}
                    onChange={(e) => patchSection("home", { about_quote: e.target.value })}
                    className="input-dark w-full"
                  />
                </Field>
              </div>
            </div>
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium text-white/70">Daftar Track Record ($ whoami)</p>
              <StringListEditor
                items={config.home.track_record}
                placeholder="Isi poin track record"
                addLabel="Tambah Track Record"
                onChange={(next) => patchSection("home", { track_record: next })}
              />
            </div>
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="panel-title">Heading Karya, Belajar, & Kontak</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Karya — Judul">
                <input
                  value={config.home.work_title}
                  onChange={(e) => patchSection("home", { work_title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Karya — Highlight">
                <input
                  value={config.home.work_title_highlight}
                  onChange={(e) =>
                    patchSection("home", { work_title_highlight: e.target.value })
                  }
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Belajar — Judul">
                <input
                  value={config.home.learn_title}
                  onChange={(e) => patchSection("home", { learn_title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Belajar — Highlight">
                <input
                  value={config.home.learn_title_highlight}
                  onChange={(e) =>
                    patchSection("home", { learn_title_highlight: e.target.value })
                  }
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Belajar — Deskripsi">
                <textarea
                  rows={2}
                  value={config.home.learn_desc}
                  onChange={(e) => patchSection("home", { learn_desc: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Belajar — Label Tombol">
                <input
                  value={config.home.learn_cta_label}
                  onChange={(e) => patchSection("home", { learn_cta_label: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Kontak — Judul">
                <input
                  value={config.home.contact_title}
                  onChange={(e) => patchSection("home", { contact_title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Kontak — Highlight">
                <input
                  value={config.home.contact_title_highlight}
                  onChange={(e) =>
                    patchSection("home", { contact_title_highlight: e.target.value })
                  }
                  className="input-dark w-full"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Kontak — Deskripsi">
                  <textarea
                    rows={2}
                    value={config.home.contact_desc}
                    onChange={(e) => patchSection("home", { contact_desc: e.target.value })}
                    className="input-dark w-full"
                  />
                </Field>
              </div>
              <Field label="Form Kontak — Judul">
                <input
                  value={config.home.contact_form_title}
                  onChange={(e) => patchSection("home", { contact_form_title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Form Kontak — Deskripsi">
                <input
                  value={config.home.contact_form_desc}
                  onChange={(e) => patchSection("home", { contact_form_desc: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: SERVICE */}
      {tab === "service" && (
        <div className="space-y-5">
          <section className="panel space-y-4 p-5">
            <h2 className="panel-title">Header & CTA Halaman Service</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Judul Utama">
                <input
                  value={config.service.title}
                  onChange={(e) => patchSection("service", { title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Judul Highlight (Hijau)">
                <input
                  value={config.service.title_highlight}
                  onChange={(e) => patchSection("service", { title_highlight: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Subjudul">
                  <textarea
                    rows={2}
                    value={config.service.subtitle}
                    onChange={(e) => patchSection("service", { subtitle: e.target.value })}
                    className="input-dark w-full"
                  />
                </Field>
              </div>
              <Field label="Judul Box Konsultasi">
                <input
                  value={config.service.consult_title}
                  onChange={(e) => patchSection("service", { consult_title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Teks Prefill WhatsApp">
                <input
                  value={config.service.wa_prefill_text}
                  onChange={(e) => patchSection("service", { wa_prefill_text: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Deskripsi Box Konsultasi">
                  <textarea
                    rows={2}
                    value={config.service.consult_desc}
                    onChange={(e) => patchSection("service", { consult_desc: e.target.value })}
                    className="input-dark w-full"
                  />
                </Field>
              </div>
              <Field label="Judul Box CTA Bawah">
                <input
                  value={config.service.cta_title}
                  onChange={(e) => patchSection("service", { cta_title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Deskripsi Box CTA Bawah">
                <input
                  value={config.service.cta_desc}
                  onChange={(e) => patchSection("service", { cta_desc: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
            </div>
          </section>

          <section className="panel space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="panel-title">Daftar Lini Jasa (Sinkron ke Homepage & /service)</h2>
                <p className="mt-0.5 text-xs text-white/45">
                  Perubahan di sini otomatis memperbarui kartu layanan di Homepage maupun halaman /service.
                </p>
              </div>
              <button type="button" onClick={addServiceLine} className="btn-outline">
                + Tambah Layanan
              </button>
            </div>

            <div className="space-y-4">
              {config.service.lines.map((line, idx) => (
                <div
                  key={`${line.slug}-${idx}`}
                  className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[#00ff88]">
                      {line.number} · #{line.slug}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveServiceLine(idx, -1)}
                        disabled={idx === 0}
                        className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveServiceLine(idx, 1)}
                        disabled={idx === config.service.lines.length - 1}
                        className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeServiceLine(idx)}
                        className="btn-danger"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Judul Layanan">
                      <input
                        value={line.title}
                        onChange={(e) => updateServiceLine(idx, { title: e.target.value })}
                        className="input-dark w-full"
                      />
                    </Field>
                    <Field label="Slug Anchor (#slug)">
                      <input
                        value={line.slug}
                        onChange={(e) => updateServiceLine(idx, { slug: e.target.value })}
                        className="input-dark w-full font-mono text-xs"
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Ringkasan Singkat (Tampil di Homepage)">
                        <input
                          value={line.short}
                          onChange={(e) => updateServiceLine(idx, { short: e.target.value })}
                          className="input-dark w-full"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Deskripsi Lengkap (Tampil di /service)">
                        <textarea
                          rows={2}
                          value={line.description}
                          onChange={(e) => updateServiceLine(idx, { description: e.target.value })}
                          className="input-dark w-full"
                        />
                      </Field>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-white/65">Poin Deliverable</p>
                    <StringListEditor
                      items={line.points}
                      placeholder="Poin deliverable"
                      addLabel="Tambah Poin"
                      onChange={(points) => updateServiceLine(idx, { points })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: LEARN */}
      {tab === "learn" && (
        <div className="space-y-5">
          <section className="panel space-y-4 p-5">
            <h2 className="panel-title">Hero & Kelas Flagship (/learn)</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Kelas Flagship Utama"
                hint="Dipakai untuk tombol checkout & harga utama di halaman /learn"
              >
                {classes.length > 0 ? (
                  <select
                    value={config.learn.flagship_slug}
                    onChange={(e) => patchSection("learn", { flagship_slug: e.target.value })}
                    className="input-dark w-full"
                  >
                    {!classes.some((c) => c.slug === config.learn.flagship_slug) ? (
                      <option value={config.learn.flagship_slug}>
                        {config.learn.flagship_slug} (custom)
                      </option>
                    ) : null}
                    {classes.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title} ({c.slug})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={config.learn.flagship_slug}
                    onChange={(e) => patchSection("learn", { flagship_slug: e.target.value })}
                    className="input-dark w-full font-mono text-xs"
                  />
                )}
              </Field>
              <Field label="Eyebrow Hero">
                <input
                  value={config.learn.hero_eyebrow}
                  onChange={(e) => patchSection("learn", { hero_eyebrow: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <div className="grid grid-cols-3 gap-2 md:col-span-2">
                <Field label="Judul Awal">
                  <input
                    value={config.learn.hero_title_prefix}
                    onChange={(e) => patchSection("learn", { hero_title_prefix: e.target.value })}
                    className="input-dark w-full"
                  />
                </Field>
                <Field label="Highlight (Hijau)">
                  <input
                    value={config.learn.hero_title_highlight}
                    onChange={(e) =>
                      patchSection("learn", { hero_title_highlight: e.target.value })
                    }
                    className="input-dark w-full"
                  />
                </Field>
                <Field label="Judul Akhir">
                  <input
                    value={config.learn.hero_title_suffix}
                    onChange={(e) => patchSection("learn", { hero_title_suffix: e.target.value })}
                    className="input-dark w-full"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Deskripsi Hero">
                  <textarea
                    rows={2}
                    value={config.learn.hero_desc}
                    onChange={(e) => patchSection("learn", { hero_desc: e.target.value })}
                    className="input-dark w-full"
                  />
                </Field>
              </div>
              <Field label="Aksen Tulisan Tangan">
                <input
                  value={config.learn.hero_desc_hand}
                  onChange={(e) => patchSection("learn", { hero_desc_hand: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Catatan di Samping Harga">
                <input
                  value={config.learn.hero_price_note}
                  onChange={(e) => patchSection("learn", { hero_price_note: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-white/70">Badge Bawah Hero</p>
              <StringListEditor
                items={config.learn.hero_badges}
                placeholder="Mis. 10 modul inti"
                addLabel="Tambah Badge"
                onChange={(hero_badges) => patchSection("learn", { hero_badges })}
              />
            </div>
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="panel-title">01 / Masalahnya</h2>
            <Field label="Judul">
              <input
                value={config.learn.problem_title}
                onChange={(e) => patchSection("learn", { problem_title: e.target.value })}
                className="input-dark w-full"
              />
            </Field>
            <Field label="Paragraf 1">
              <textarea
                rows={2}
                value={config.learn.problem_p1}
                onChange={(e) => patchSection("learn", { problem_p1: e.target.value })}
                className="input-dark w-full"
              />
            </Field>
            <Field label="Paragraf 2">
              <textarea
                rows={2}
                value={config.learn.problem_p2}
                onChange={(e) => patchSection("learn", { problem_p2: e.target.value })}
                className="input-dark w-full"
              />
            </Field>
            <Field label="Paragraf Penekanan (Bold)">
              <input
                value={config.learn.problem_p3}
                onChange={(e) => patchSection("learn", { problem_p3: e.target.value })}
                className="input-dark w-full"
              />
            </Field>
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="panel-title">02 / Kurikulum Modul</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Judul Section">
                <input
                  value={config.learn.curriculum_title}
                  onChange={(e) => patchSection("learn", { curriculum_title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Deskripsi Section">
                <input
                  value={config.learn.curriculum_desc}
                  onChange={(e) => patchSection("learn", { curriculum_desc: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
            </div>
            <StringListEditor
              items={config.learn.curriculum_modules}
              placeholder="Nama modul"
              addLabel="Tambah Modul"
              onChange={(curriculum_modules) => patchSection("learn", { curriculum_modules })}
            />
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="panel-title">03 / Cocok Kalau & Penutup</h2>
            <Field label="Judul Cocok Kalau">
              <input
                value={config.learn.fit_title}
                onChange={(e) => patchSection("learn", { fit_title: e.target.value })}
                className="input-dark w-full"
              />
            </Field>
            <StringListEditor
              items={config.learn.fit_points}
              placeholder="Kriteria peserta"
              addLabel="Tambah Poin"
              onChange={(fit_points) => patchSection("learn", { fit_points })}
            />
            <div className="grid gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
              <Field label="Judul Produk Lain">
                <input
                  value={config.learn.other_title}
                  onChange={(e) => patchSection("learn", { other_title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
              <Field label="Judul CTA Penutup">
                <input
                  value={config.learn.closing_title}
                  onChange={(e) => patchSection("learn", { closing_title: e.target.value })}
                  className="input-dark w-full"
                />
              </Field>
            </div>
          </section>
        </div>
      )}

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="btn-glow rounded-lg px-6 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
        </button>
      </div>
    </div>
  );
}
