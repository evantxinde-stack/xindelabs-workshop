"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Section } from "../shared";
import {
  FULFILLMENT_OPTIONS,
  PRODUCT_CATEGORY_PRESETS,
  inferDbProductType,
  normalizeProductMeta,
  type DbProductType,
  type FulfillmentType,
  type ProductDownloadLink,
  type ProductMeta,
} from "@/lib/product-meta";

type BillingMode = "single" | "subscription";

type ClassRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image?: string | null;
  price: number | null;
  annual_price?: number | null;
  lifetime_price?: number | null;
  payment_options?: string[];
  product_type: DbProductType;
  is_published: boolean;
  sort_order: number;
  trailer_youtube_id?: string | null;
  member_cross_sell_price?: number | null;
  workshop_meet_url?: string | null;
  workshop_replay_url?: string | null;
  early_bird_price?: number | null;
  early_bird_until?: string | null;
  early_bird_quota?: number | null;
  bump_class_id?: string | null;
  bump_price?: number | null;
  bump_title?: string | null;
  bump_active?: boolean;
  meta?: ProductMeta;
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  product_type: DbProductType;
  category: string;
  fulfillment: FulfillmentType;
  delivery_links: ProductDownloadLink[];
  highlights: string[];
  cta_label: string;
  redirect_after_buy: string;
  price: number | string;
  strike_price: number | string;
  annual_price: number | string;
  lifetime_price: number | string;
  payment_options: string[];
  early_bird_price: number | string;
  early_bird_until: string;
  early_bird_quota: number | string;
  member_cross_sell_price: number | string;
  trailer_youtube_id: string;
  workshop_meet_url: string;
  workshop_replay_url: string;
  sort_order: number | string;
  is_published: boolean;
  bump_active: boolean;
  bump_class_id: string;
  bump_title: string;
  bump_description: string;
  bump_price: number | string;
  bump_strike_price: number | string;
};

const toNumber = (value: unknown) => (value === "" || value == null ? null : Number(value));

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function detectBillingMode(row: ClassRow): BillingMode {
  const hasAnnualOption =
    Array.isArray(row.payment_options) && row.payment_options.includes("annual");
  const hasAnnualPrice = Number(row.annual_price || 0) > 0;
  return hasAnnualOption || hasAnnualPrice ? "subscription" : "single";
}

function blankForm(): FormState {
  return {
    title: "",
    slug: "",
    description: "",
    cover_image: "",
    product_type: "course",
    category: "Kelas Online",
    fulfillment: "lms",
    delivery_links: [],
    highlights: [],
    cta_label: "",
    redirect_after_buy: "",
    price: "",
    strike_price: "",
    annual_price: "",
    lifetime_price: "",
    payment_options: ["lifetime"],
    early_bird_price: "",
    early_bird_until: "",
    early_bird_quota: "",
    member_cross_sell_price: "",
    trailer_youtube_id: "",
    workshop_meet_url: "",
    workshop_replay_url: "",
    sort_order: 0,
    is_published: false,
    bump_active: false,
    bump_class_id: "",
    bump_title: "",
    bump_description: "",
    bump_price: "",
    bump_strike_price: "",
  };
}

function rowToForm(row: ClassRow, mode: BillingMode): FormState {
  const meta = normalizeProductMeta(row.meta, row.product_type);
  const regular = toNumber(row.price);
  const actual = toNumber(row.lifetime_price);
  const hasStrike = mode === "single" && regular != null && actual != null && actual < regular;

  return {
    title: row.title || "",
    slug: row.slug || "",
    description: row.description || "",
    cover_image: row.cover_image || "",
    product_type: row.product_type || "course",
    category: meta.category,
    fulfillment: meta.fulfillment,
    delivery_links: meta.delivery_links,
    highlights: meta.highlights,
    cta_label: meta.cta_label,
    redirect_after_buy: meta.redirect_after_buy,
    price:
      mode === "single"
        ? hasStrike
          ? (actual ?? "")
          : (actual ?? regular ?? "")
        : (regular ?? ""),
    strike_price: hasStrike ? (regular ?? "") : "",
    annual_price: row.annual_price ?? "",
    lifetime_price: row.lifetime_price ?? "",
    payment_options:
      Array.isArray(row.payment_options) && row.payment_options.length
        ? row.payment_options
        : ["lifetime"],
    early_bird_price: row.early_bird_price ?? "",
    early_bird_until: row.early_bird_until || "",
    early_bird_quota: row.early_bird_quota ?? "",
    member_cross_sell_price: row.member_cross_sell_price ?? "",
    trailer_youtube_id: row.trailer_youtube_id || "",
    workshop_meet_url: row.workshop_meet_url || "",
    workshop_replay_url: row.workshop_replay_url || "",
    sort_order: row.sort_order ?? 0,
    is_published: Boolean(row.is_published),
    bump_active: Boolean(row.bump_active),
    bump_class_id: row.bump_class_id || "",
    bump_title: row.bump_title || "",
    bump_description: meta.bump_description,
    bump_price: row.bump_price ?? "",
    bump_strike_price: meta.bump_strike_price ?? "",
  };
}

function buildPayload(form: FormState, mode: BillingMode) {
  const dbType = inferDbProductType(form.category, form.product_type);
  const meta: ProductMeta = normalizeProductMeta(
    {
      category: form.category.trim() || "Produk Digital",
      fulfillment: form.fulfillment,
      delivery_links: form.delivery_links
        .map((l) => ({ label: l.label.trim() || "Download / Buka Akses", url: l.url.trim() }))
        .filter((l) => l.url.length > 0),
      highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
      cta_label: form.cta_label.trim(),
      redirect_after_buy: form.redirect_after_buy.trim(),
      bump_description: form.bump_description.trim(),
      bump_strike_price: toNumber(form.bump_strike_price),
    },
    dbType,
  );

  const base = {
    slug: form.slug.trim().toLowerCase(),
    title: form.title.trim(),
    description: form.description || null,
    cover_image: form.cover_image.trim() || null,
    product_type: dbType,
    is_published: form.is_published,
    sort_order: Number(form.sort_order || 0),
    trailer_youtube_id: form.trailer_youtube_id.trim() || null,
    workshop_meet_url: form.workshop_meet_url.trim() || null,
    workshop_replay_url: form.workshop_replay_url.trim() || null,
    member_cross_sell_price: toNumber(form.member_cross_sell_price),
    bump_active: form.bump_active,
    bump_class_id: form.bump_class_id || null,
    bump_title: form.bump_title.trim() || null,
    bump_price: toNumber(form.bump_price),
    meta,
  };

  if (mode === "single") {
    const selling = toNumber(form.price);
    const strike = toNumber(form.strike_price);
    const hasStrike = strike != null && selling != null && strike > selling;
    return {
      ...base,
      price: hasStrike ? strike : selling,
      lifetime_price: selling,
      annual_price: null,
      payment_options: ["lifetime"],
      early_bird_price: toNumber(form.early_bird_price),
      early_bird_until: form.early_bird_until || null,
      early_bird_quota: toNumber(form.early_bird_quota),
    };
  }

  const annual = toNumber(form.annual_price);
  const lifetime = toNumber(form.lifetime_price);
  const opts = form.payment_options.length ? form.payment_options : ["annual", "lifetime"];
  return {
    ...base,
    price: lifetime ?? annual ?? toNumber(form.price),
    annual_price: annual,
    lifetime_price: lifetime,
    payment_options: opts,
    early_bird_price: null,
    early_bird_until: null,
    early_bird_quota: null,
  };
}

const money = (n: number | null | undefined) =>
  n == null ? "—" : Number(n) === 0 ? "Gratis" : `Rp${Number(n).toLocaleString("id-ID")}`;

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

export default function AdminProductsPage() {
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<ClassRow | null>(null);
  const [billingMode, setBillingMode] = useState<BillingMode>("single");
  const [form, setForm] = useState<FormState>(blankForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copiedSlug, setCopiedSlug] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/classes");
    const j = await r.json().catch(() => ({}));
    setRows(j.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      const cat = normalizeProductMeta(row.meta, row.product_type).category;
      set.add(cat);
    }
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const cat = normalizeProductMeta(row.meta, row.product_type).category;
      if (categoryFilter !== "all" && cat !== categoryFilter) return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      );
    });
  }, [rows, categoryFilter, search]);

  function openEdit(row: ClassRow) {
    const mode = detectBillingMode(row);
    setSelected(row);
    setBillingMode(mode);
    setForm(rowToForm(row, mode));
    setSlugTouched(true);
    setMessage(null);
    setModalOpen(true);
  }

  function openCreate() {
    setSelected(null);
    setBillingMode("single");
    setForm(blankForm());
    setSlugTouched(false);
    setMessage(null);
    setModalOpen(true);
  }

  function applyPreset(preset: (typeof PRODUCT_CATEGORY_PRESETS)[number]) {
    setForm((prev) => ({
      ...prev,
      category: preset.label,
      product_type: preset.dbType,
      fulfillment: preset.fulfillment,
    }));
  }

  function switchBillingMode(next: BillingMode) {
    setBillingMode(next);
    if (next === "subscription") {
      setForm((prev) => ({
        ...prev,
        payment_options: prev.payment_options.includes("annual")
          ? prev.payment_options
          : ["annual", "lifetime"],
        lifetime_price: prev.lifetime_price || prev.price || "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        payment_options: ["lifetime"],
        price: prev.price || prev.lifetime_price || "",
      }));
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload = buildPayload(form, billingMode);
    const method = selected ? "PATCH" : "POST";
    const body = selected ? { ...payload, id: selected.id } : payload;

    const r = await fetch("/api/admin/classes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMessage({ type: "err", text: j.error || "Gagal menyimpan produk." });
    } else {
      setMessage({ type: "ok", text: selected ? "Produk diperbarui!" : "Produk baru dibuat!" });
      await load();
      setModalOpen(false);
    }
    setSaving(false);
  }

  async function remove(row: ClassRow) {
    if (
      !window.confirm(`Hapus produk "${row.title}"? Produk yang pernah terjual akan otomatis diarsipkan.`)
    ) {
      return;
    }
    const r = await fetch(`/api/admin/classes?id=${encodeURIComponent(row.id)}`, {
      method: "DELETE",
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMessage({ type: "err", text: j.error || "Gagal menghapus produk." });
      return;
    }
    setMessage({ type: "ok", text: j.message || "Produk dihapus." });
    setModalOpen(false);
    setSelected(null);
    await load();
  }

  function copyCheckoutUrl(slug: string) {
    const url = `https://xindelabs.web.id/checkout/${slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(""), 1800);
  }

  const showLmsShortcut =
    Boolean(selected) && (form.fulfillment === "lms" || form.fulfillment === "hybrid");
  const showDeliveryLinks = form.fulfillment === "file_link" || form.fulfillment === "hybrid";
  const showEventFields = form.fulfillment === "event" || form.fulfillment === "hybrid";

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#00ff88]">
            // digital product hub
          </p>
          <h1 className="mt-2 text-2xl font-bold">Product Management</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">
            Kelola semua produk digital secara bebas — kategori custom, skema harga dinamis, pengiriman otomatis, dan Order Bump checkout.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/lms/courses" className="btn-outline">
            Course Management (Modul) →
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="btn-glow rounded-lg px-4 py-2 text-xs font-bold"
          >
            + Buat Produk Baru
          </button>
        </div>
      </header>

      {message && !modalOpen ? (
        <div
          className={`mb-4 rounded-xl border px-4 py-2.5 text-sm ${
            message.type === "ok"
              ? "border-[#00ff88]/30 bg-[#00ff88]/10 text-[#86efac]"
              : "border-red-400/30 bg-red-500/10 text-red-200"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {/* Search + Dynamic Category Filter */}
      <div className="panel mb-5 space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk, slug, atau kategori…"
            className="input-dark min-w-[220px] flex-1"
          />
          <span className="font-mono text-xs text-white/45">
            {filtered.length} dari {rows.length} produk
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              categoryFilter === "all"
                ? "border-[#00ff88] bg-[#00ff88] font-bold text-[#04110D]"
                : "border-white/15 text-white/60 hover:border-[#00ff88] hover:text-white"
            }`}
          >
            Semua ({rows.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                categoryFilter === cat
                  ? "border-[#00ff88] bg-[#00ff88] font-bold text-[#04110D]"
                  : "border-white/15 text-white/60 hover:border-[#00ff88] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Full-Width Product Grid */}
      <Section
        title="Daftar Produk Digital"
        sub="Klik Edit untuk mengubah produk di pop-up, atau klik + Buat Produk Baru di atas."
      >
        {loading ? (
          <p className="text-sm text-white/45">Memuat daftar produk…</p>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-white/45">Belum ada produk yang cocok.</p>
            <button type="button" onClick={openCreate} className="btn-outline mt-3">
              + Buat Produk Pertama
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => {
              const meta = normalizeProductMeta(row.meta, row.product_type);
              const isSub = detectBillingMode(row) === "subscription";
              return (
                <article
                  key={row.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[.02] transition hover:border-[#00ff88]/40"
                >
                  {row.cover_image ? (
                    <img
                      src={row.cover_image}
                      alt={row.title}
                      className="aspect-video w-full object-cover"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-[#00ff88]">
                        {meta.category}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${
                          row.is_published
                            ? "border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]"
                            : "border-white/15 text-white/40"
                        }`}
                      >
                        {row.is_published ? "tayang" : "draft"}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-base font-bold text-white">{row.title}</h3>
                    <p className="mt-1 font-mono text-[11px] text-white/40">/{row.slug}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#00ff88]">
                        {money(row.lifetime_price ?? row.price)}
                      </span>
                      <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
                        {isSub ? "Subscription" : "Single"}
                      </span>
                      {row.bump_active ? (
                        <span className="rounded border border-[#00ff88]/30 bg-[#00ff88]/10 px-1.5 py-0.5 font-mono text-[10px] text-[#00ff88]">
                          + Order Bump
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 text-xs">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-lg bg-[#00ff88]/15 px-3 py-1.5 font-semibold text-[#00ff88] hover:bg-[#00ff88]/25"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => copyCheckoutUrl(row.slug)}
                        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-white/65 hover:border-white/30 hover:text-white"
                      >
                        {copiedSlug === row.slug ? "Tersalin ✓" : "Copy Link"}
                      </button>
                      {meta.fulfillment === "lms" || meta.fulfillment === "hybrid" ? (
                        <Link
                          href={`/admin/lms/courses?class_id=${encodeURIComponent(row.id)}`}
                          className="ml-auto font-mono text-[11px] text-white/60 hover:text-[#00ff88]"
                        >
                          Modul →
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>

      {/* POP-UP MODAL FOR CREATE / EDIT PRODUCT */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <div
            aria-hidden
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={selected ? "Edit Produk" : "Buat Produk Baru"}
            className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#163020] bg-[#0A140E] shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00ff88]">
                  {selected ? "// edit produk" : "// produk baru"}
                </p>
                <h2 className="mt-0.5 text-lg font-bold text-white">
                  {selected ? selected.title : "Buat Produk Digital Baru"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup pop-up"
                className="rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-xs text-white/60 hover:bg-white/10 hover:text-white"
              >
                ESC ✕
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form id="product-modal-form" onSubmit={save} className="flex-1 space-y-4 overflow-y-auto p-5">
              {message ? (
                <div
                  className={`rounded-xl border px-3.5 py-2.5 text-sm ${
                    message.type === "ok"
                      ? "border-[#00ff88]/30 bg-[#00ff88]/10 text-[#86efac]"
                      : "border-red-400/30 bg-red-500/10 text-red-200"
                  }`}
                >
                  {message.text}
                </div>
              ) : null}

              {showLmsShortcut && selected ? (
                <div className="flex items-center justify-between rounded-xl border border-[#00ff88]/25 bg-[#00ff88]/[.05] px-3.5 py-2.5 text-xs">
                  <span className="text-white/70">Produk ini memakai modul LMS</span>
                  <Link
                    href={`/admin/lms/courses?class_id=${encodeURIComponent(selected.id)}`}
                    className="font-mono font-semibold text-[#00ff88] hover:underline"
                  >
                    Kelola Modul →
                  </Link>
                </div>
              ) : null}

              {/* 1. Jenis / Kategori Produk */}
              <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/25 p-3.5">
                <span className="block text-xs font-semibold text-white/80">
                  1. Jenis &amp; Kategori Produk (Bisa Custom)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRODUCT_CATEGORY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                        form.category === preset.label
                          ? "border-[#00ff88] bg-[#00ff88]/15 font-semibold text-[#00ff88]"
                          : "border-white/10 bg-white/[.03] text-white/60 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <Field
                  label="Nama Kategori Custom"
                  hint="Pilih preset di atas atau ketik kategori sendiri."
                >
                  <input
                    className="input-dark w-full"
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    required
                  />
                </Field>
              </div>

              {/* 2. Identitas Produk */}
              <div className="space-y-3">
                <Field label="Nama Produk">
                  <input
                    className="input-dark w-full"
                    value={form.title}
                    onChange={(e) => {
                      const nextTitle = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title: nextTitle,
                        slug: slugTouched ? prev.slug : slugify(nextTitle),
                      }));
                    }}
                    placeholder="Mis. Starter Kit AI Agent untuk UMKM"
                    required
                  />
                </Field>
                <div className="grid grid-cols-[1fr_92px] gap-3">
                  <Field label="Slug URL Checkout">
                    <input
                      className="input-dark w-full font-mono text-xs"
                      value={form.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        set("slug", e.target.value);
                      }}
                      placeholder="starter-kit-ai-agent"
                      required
                    />
                  </Field>
                  <Field label="Urutan">
                    <input
                      className="input-dark w-full"
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => set("sort_order", e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Deskripsi Produk">
                  <textarea
                    className="input-dark min-h-20 w-full"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Jelaskan manfaat utama produk ini…"
                  />
                </Field>
                <Field
                  label="Cover kelas (URL gambar)"
                  hint="Tempel URL gambar publik. Disarankan rasio 16:9."
                >
                  <input
                    className="input-dark w-full"
                    type="url"
                    value={form.cover_image}
                    onChange={(e) => set("cover_image", e.target.value)}
                    placeholder="https://.../cover-produk.jpg"
                  />
                  {form.cover_image ? (
                    <img
                      src={String(form.cover_image)}
                      alt="Preview cover"
                      className="mt-2.5 aspect-video w-full rounded-lg object-cover"
                    />
                  ) : null}
                </Field>
              </div>

              {/* 3. Tipe Pembayaran Dinamis */}
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3.5">
                <div>
                  <span className="block text-xs font-semibold text-white/80">
                    2. Tipe Pembayaran
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => switchBillingMode("single")}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                        billingMode === "single"
                          ? "border-[#00ff88] bg-[#00ff88]/15 font-bold text-[#00ff88]"
                          : "border-white/10 bg-white/[.02] text-white/60 hover:border-white/25"
                      }`}
                    >
                      <span className="block">Single Payment</span>
                      <span className="mt-0.5 block text-[10px] font-normal opacity-75">
                        Sekali bayar · coret &amp; early bird
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchBillingMode("subscription")}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                        billingMode === "subscription"
                          ? "border-[#00ff88] bg-[#00ff88]/15 font-bold text-[#00ff88]"
                          : "border-white/10 bg-white/[.02] text-white/60 hover:border-white/25"
                      }`}
                    >
                      <span className="block">Subscription</span>
                      <span className="mt-0.5 block text-[10px] font-normal opacity-75">
                        12 Bulan (Annual) / Lifetime
                      </span>
                    </button>
                  </div>
                </div>

                {billingMode === "single" ? (
                  <div className="space-y-3 border-t border-white/10 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Harga Awal / Jual (Rp)" hint="0 = Gratis">
                        <input
                          className="input-dark w-full"
                          type="number"
                          min="0"
                          value={form.price}
                          onChange={(e) => set("price", e.target.value)}
                          placeholder="mis. 299000"
                        />
                      </Field>
                      <Field label="Harga Coret (Rp)" hint="Opsional, > harga jual">
                        <input
                          className="input-dark w-full"
                          type="number"
                          min="0"
                          value={form.strike_price}
                          onChange={(e) => set("strike_price", e.target.value)}
                          placeholder="mis. 599000"
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Harga Early Bird (Rp)">
                        <input
                          className="input-dark w-full"
                          type="number"
                          min="0"
                          value={form.early_bird_price}
                          onChange={(e) => set("early_bird_price", e.target.value)}
                        />
                      </Field>
                      <Field label="Kuota Early Bird">
                        <input
                          className="input-dark w-full"
                          type="number"
                          min="0"
                          value={form.early_bird_quota}
                          onChange={(e) => set("early_bird_quota", e.target.value)}
                        />
                      </Field>
                    </div>
                    <Field label="Early Bird Berakhir">
                      <input
                        className="input-dark w-full"
                        type="datetime-local"
                        value={form.early_bird_until ? form.early_bird_until.slice(0, 16) : ""}
                        onChange={(e) =>
                          set(
                            "early_bird_until",
                            e.target.value ? new Date(e.target.value).toISOString() : "",
                          )
                        }
                      />
                    </Field>
                    <Field label="Harga Khusus Member (Rp)">
                      <input
                        className="input-dark w-full"
                        type="number"
                        min="0"
                        value={form.member_cross_sell_price}
                        onChange={(e) => set("member_cross_sell_price", e.target.value)}
                      />
                    </Field>
                  </div>
                ) : (
                  <div className="space-y-3 border-t border-white/10 pt-3">
                    <div>
                      <span className="mb-1.5 block text-xs text-white/55">
                        Pilihan paket di checkout
                      </span>
                      <div className="flex gap-4 text-sm text-white/75">
                        {(["annual", "lifetime"] as const).map((opt) => (
                          <label key={opt} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={form.payment_options.includes(opt)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...new Set([...form.payment_options, opt])]
                                  : form.payment_options.filter((x) => x !== opt);
                                set("payment_options", next.length ? next : ["annual"]);
                              }}
                            />
                            {opt === "annual" ? "12 Bulan (Annual)" : "Lifetime"}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Harga 12 Bulan (Rp/tahun)">
                        <input
                          className="input-dark w-full"
                          type="number"
                          min="0"
                          value={form.annual_price}
                          onChange={(e) => set("annual_price", e.target.value)}
                        />
                      </Field>
                      <Field label="Harga Lifetime (Rp)">
                        <input
                          className="input-dark w-full"
                          type="number"
                          min="0"
                          value={form.lifetime_price}
                          onChange={(e) => set("lifetime_price", e.target.value)}
                        />
                      </Field>
                    </div>
                    <Field label="Harga Khusus Member (Rp, opsional)">
                      <input
                        className="input-dark w-full"
                        type="number"
                        min="0"
                        value={form.member_cross_sell_price}
                        onChange={(e) => set("member_cross_sell_price", e.target.value)}
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* 4. Cara Pengiriman / Fulfillment */}
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3.5">
                <Field label="3. Cara Pengiriman Produk Setelah Bayar">
                  <select
                    value={form.fulfillment}
                    onChange={(e) => set("fulfillment", e.target.value as FulfillmentType)}
                    className="input-dark w-full"
                  >
                    {FULFILLMENT_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </Field>

                {showDeliveryLinks ? (
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/70">
                        Link File / Aset Digital (PDF, Notion, Drive, Repo)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          set("delivery_links", [...form.delivery_links, { label: "", url: "" }])
                        }
                        className="btn-outline"
                      >
                        + Tambah File/Link
                      </button>
                    </div>
                    {form.delivery_links.map((link, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_1.3fr_auto] gap-2">
                        <input
                          className="input-dark"
                          value={link.label}
                          placeholder="Label file"
                          onChange={(e) =>
                            set(
                              "delivery_links",
                              form.delivery_links.map((x, i) =>
                                i === idx ? { ...x, label: e.target.value } : x,
                              ),
                            )
                          }
                        />
                        <input
                          className="input-dark"
                          type="url"
                          value={link.url}
                          placeholder="https://..."
                          onChange={(e) =>
                            set(
                              "delivery_links",
                              form.delivery_links.map((x, i) =>
                                i === idx ? { ...x, url: e.target.value } : x,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "delivery_links",
                              form.delivery_links.filter((_, i) => i !== idx),
                            )
                          }
                          className="btn-danger"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {showEventFields ? (
                  <div className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2">
                    <Field label="Link Meeting Live">
                      <input
                        className="input-dark w-full"
                        value={form.workshop_meet_url}
                        onChange={(e) => set("workshop_meet_url", e.target.value)}
                        placeholder="https://meet.google.com/..."
                      />
                    </Field>
                    <Field label="Link Rekaman Replay">
                      <input
                        className="input-dark w-full"
                        value={form.workshop_replay_url}
                        onChange={(e) => set("workshop_replay_url", e.target.value)}
                        placeholder="https://..."
                      />
                    </Field>
                  </div>
                ) : null}

                <div className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2">
                  <Field label="Video Trailer (Opsional)">
                    <input
                      className="input-dark w-full"
                      value={form.trailer_youtube_id}
                      onChange={(e) => set("trailer_youtube_id", e.target.value)}
                      placeholder="YouTube ID"
                    />
                  </Field>
                  <Field label="Label Tombol Beli (Opsional)">
                    <input
                      className="input-dark w-full"
                      value={form.cta_label}
                      onChange={(e) => set("cta_label", e.target.value)}
                      placeholder="Mis. Beli Sekarang / Download"
                    />
                  </Field>
                </div>
              </div>

              {/* 5. Order Bump (Unified Checkout Add-on) */}
              <div className="space-y-3 rounded-xl border border-[#00ff88]/25 bg-[#07150E]/70 p-3.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#00ff88]">
                  <input
                    type="checkbox"
                    checked={form.bump_active}
                    onChange={(e) => set("bump_active", e.target.checked)}
                  />
                  4. Aktifkan Order Bump (Penawaran Tambahan di Halaman Checkout)
                </label>

                {form.bump_active ? (
                  <div className="space-y-3 border-t border-white/10 pt-3">
                    <Field label="Produk Tambahan (Order Bump)">
                      <select
                        value={form.bump_class_id}
                        onChange={(e) => set("bump_class_id", e.target.value)}
                        className="input-dark w-full"
                      >
                        <option value="">Pilih produk tambahan…</option>
                        {rows
                          .filter((r) => r.id !== selected?.id)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title} ({money(r.lifetime_price ?? r.price)})
                            </option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Judul Penawaran Order Bump">
                      <input
                        className="input-dark w-full"
                        value={form.bump_title}
                        onChange={(e) => set("bump_title", e.target.value)}
                        placeholder="Mis. Tambahkan Template Workflow AI Siap Pakai!"
                      />
                    </Field>
                    <Field label="Deskripsi Singkat">
                      <textarea
                        rows={2}
                        className="input-dark w-full"
                        value={form.bump_description}
                        onChange={(e) => set("bump_description", e.target.value)}
                        placeholder="Hemat 70% khusus saat checkout hari ini saja."
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Harga Spesial Bump (Rp)">
                        <input
                          className="input-dark w-full"
                          type="number"
                          min="0"
                          value={form.bump_price}
                          onChange={(e) => set("bump_price", e.target.value)}
                          placeholder="mis. 99000"
                        />
                      </Field>
                      <Field label="Harga Coret Bump (Opsional)">
                        <input
                          className="input-dark w-full"
                          type="number"
                          min="0"
                          value={form.bump_strike_price}
                          onChange={(e) => set("bump_strike_price", e.target.value)}
                          placeholder="mis. 299000"
                        />
                      </Field>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/45">
                    Centang untuk menampilkan kotak penawaran produk tambahan 1-klik di halaman checkout.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 pt-1 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => set("is_published", e.target.checked)}
                />
                Publikasikan (tampil di katalog &amp; bisa dibeli)
              </label>
            </form>

            {/* Modal Sticky Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/30 px-5 py-3.5">
              <div>
                {selected ? (
                  <button
                    type="button"
                    onClick={() => remove(selected)}
                    className="rounded-lg border border-red-400/30 px-3.5 py-2 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Hapus / Arsipkan
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="product-modal-form"
                  disabled={saving}
                  className="btn-glow rounded-lg px-5 py-2 text-xs font-bold disabled:opacity-50"
                >
                  {saving ? "Menyimpan…" : selected ? "Simpan Perubahan" : "Buat Produk"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
