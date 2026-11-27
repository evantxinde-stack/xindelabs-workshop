export type DbProductType = "course" | "workshop" | "vip" | "bundle";

export type FulfillmentType = "lms" | "file_link" | "event" | "community" | "hybrid";

export type ProductDownloadLink = {
  label: string;
  url: string;
};

export type ProductUpsellConfig = {
  enabled: boolean;
  class_id: string;
  badge: string;
  headline: string;
  description: string;
  cta_label: string;
};

export type ProductCrossSellConfig = {
  enabled: boolean;
  heading: string;
  class_ids: string[];
};

export type ProductMeta = {
  category: string; // bebas / custom: "Kelas", "E-Book", "Template", "Toolkit", dll.
  fulfillment: FulfillmentType;
  delivery_links: ProductDownloadLink[];
  highlights: string[];
  cta_label: string;
  redirect_after_buy: string;
  bump_description: string;
  bump_strike_price: number | null;
  upsell: ProductUpsellConfig;
  cross_sell: ProductCrossSellConfig;
};

export const PRODUCT_CATEGORY_PRESETS: {
  label: string;
  dbType: DbProductType;
  fulfillment: FulfillmentType;
  desc: string;
}[] = [
  { label: "Kelas Online", dbType: "course", fulfillment: "lms", desc: "Materi modul video/teks di LMS" },
  { label: "E-Book & File Digital", dbType: "course", fulfillment: "file_link", desc: "PDF, panduan, aset download" },
  { label: "Template & Source Code", dbType: "course", fulfillment: "file_link", desc: "Notion, n8n, prompt, repo" },
  { label: "Workshop / Webinar", dbType: "workshop", fulfillment: "event", desc: "Sesi live + link replay" },
  { label: "Coaching / VIP 1-on-1", dbType: "vip", fulfillment: "community", desc: "Mentoring & akses eksklusif" },
  { label: "Bundle Paket", dbType: "bundle", fulfillment: "hybrid", desc: "Gabungan beberapa produk" },
  { label: "Membership / Komunitas", dbType: "vip", fulfillment: "community", desc: "Akses grup & update rutin" },
];

export const FULFILLMENT_OPTIONS: { key: FulfillmentType; label: string; desc: string }[] = [
  { key: "lms", label: "Akses LMS / Modul", desc: "Member otomatis dapat akses modul di /learn" },
  { key: "file_link", label: "File / Link Download", desc: "Berisi link file PDF, Notion, Drive, atau repo" },
  { key: "event", label: "Live Event / Workshop", desc: "Link meeting (Zoom/Meet) + link rekaman replay" },
  { key: "community", label: "Komunitas / Coaching", desc: "Akses grup, Discord, atau sesi 1-on-1" },
  { key: "hybrid", label: "Kombinasi (Semua)", desc: "LMS + file download + link event sekaligus" },
];

export function defaultCategoryForDbType(dbType?: string | null): string {
  if (dbType === "workshop") return "Workshop / Webinar";
  if (dbType === "vip") return "Coaching / VIP 1-on-1";
  if (dbType === "bundle") return "Bundle Paket";
  return "Kelas Online";
}

export function defaultFulfillmentForDbType(dbType?: string | null): FulfillmentType {
  if (dbType === "workshop") return "event";
  if (dbType === "vip") return "community";
  if (dbType === "bundle") return "hybrid";
  return "lms";
}

export function inferDbProductType(category: string, fallback: DbProductType = "course"): DbProductType {
  const lower = category.trim().toLowerCase();
  if (!lower) return fallback;
  if (/workshop|webinar|live|event|seminar/.test(lower)) return "workshop";
  if (/vip|coaching|mentoring|1-on-1|konsultasi|membership|komunitas/.test(lower)) return "vip";
  if (/bundle|paket|all.?access/.test(lower)) return "bundle";
  return "course";
}

export function normalizeProductMeta(raw: unknown, dbType?: string | null): ProductMeta {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const category =
    typeof src.category === "string" && src.category.trim()
      ? src.category.trim()
      : defaultCategoryForDbType(dbType);

  const validFulfillments: FulfillmentType[] = ["lms", "file_link", "event", "community", "hybrid"];
  const fulfillment: FulfillmentType =
    typeof src.fulfillment === "string" &&
    validFulfillments.includes(src.fulfillment as FulfillmentType)
      ? (src.fulfillment as FulfillmentType)
      : defaultFulfillmentForDbType(dbType);

  const delivery_links = Array.isArray(src.delivery_links)
    ? src.delivery_links
        .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
        .map((x) => ({
          label: String(x.label ?? "").trim() || "Download / Buka Akses",
          url: String(x.url ?? "").trim(),
        }))
        .filter((x) => x.url.length > 0)
    : [];

  const highlights = Array.isArray(src.highlights)
    ? src.highlights.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];

  const upRaw =
    src.upsell && typeof src.upsell === "object" ? (src.upsell as Record<string, unknown>) : {};
  const csRaw =
    src.cross_sell && typeof src.cross_sell === "object"
      ? (src.cross_sell as Record<string, unknown>)
      : {};

  const strikeNum =
    src.bump_strike_price === "" || src.bump_strike_price == null
      ? null
      : Number(src.bump_strike_price);

  return {
    category,
    fulfillment,
    delivery_links,
    highlights,
    cta_label: typeof src.cta_label === "string" ? src.cta_label.trim() : "",
    redirect_after_buy:
      typeof src.redirect_after_buy === "string" ? src.redirect_after_buy.trim() : "",
    bump_description:
      typeof src.bump_description === "string" ? src.bump_description.trim() : "",
    bump_strike_price: strikeNum != null && Number.isFinite(strikeNum) && strikeNum > 0 ? strikeNum : null,
    upsell: {
      enabled: Boolean(upRaw.enabled),
      class_id: typeof upRaw.class_id === "string" ? upRaw.class_id.trim() : "",
      badge:
        typeof upRaw.badge === "string" && upRaw.badge.trim()
          ? upRaw.badge.trim()
          : "PENAWARAN KHUSUS PEMBELI",
      headline: typeof upRaw.headline === "string" ? upRaw.headline.trim() : "",
      description: typeof upRaw.description === "string" ? upRaw.description.trim() : "",
      cta_label:
        typeof upRaw.cta_label === "string" && upRaw.cta_label.trim()
          ? upRaw.cta_label.trim()
          : "Ambil Penawaran Upgrade →",
    },
    cross_sell: {
      enabled: Boolean(csRaw.enabled),
      heading:
        typeof csRaw.heading === "string" && csRaw.heading.trim()
          ? csRaw.heading.trim()
          : "Sering dibeli bersamaan",
      class_ids: Array.isArray(csRaw.class_ids)
        ? csRaw.class_ids.map((x) => String(x ?? "").trim()).filter(Boolean)
        : [],
    },
  };
}
