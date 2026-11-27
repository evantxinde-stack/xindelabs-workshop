export type SalesBlockType =
  | "hero"
  | "video"
  | "text"
  | "image"
  | "problems"
  | "stats"
  | "benefits"
  | "curriculum"
  | "testimonials"
  | "pricing"
  | "faq"
  | "cta"
  | "html";

export type SalesBlock = {
  id: string;
  type: SalesBlockType;
  hidden?: boolean;
  data: Record<string, any>;
};

export const BLOCK_CATALOG: {
  type: SalesBlockType;
  label: string;
  icon: string;
  desc: string;
}[] = [
  { type: "hero", label: "Hero", icon: "✦", desc: "Judul utama, subjudul, & tombol CTA" },
  { type: "video", label: "Video / VSL", icon: "▶", desc: "Embed YouTube video sales letter" },
  { type: "text", label: "Teks / Copy", icon: "¶", desc: "Judul & paragraf copywriting" },
  { type: "image", label: "Gambar", icon: "▣", desc: "Banner, screenshot, atau bukti hasil" },
  { type: "problems", label: "Masalah", icon: "!", desc: "Daftar pain point calon pembeli" },
  { type: "stats", label: "Statistik", icon: "#", desc: "Angka pencapaian / social proof" },
  { type: "benefits", label: "Benefit", icon: "✓", desc: "Yang didapat pembeli" },
  { type: "curriculum", label: "Kurikulum", icon: "☰", desc: "Otomatis tampilkan modul produk" },
  { type: "testimonials", label: "Testimoni", icon: "“", desc: "Review & kutipan member" },
  { type: "pricing", label: "Pricing Box", icon: "Rp", desc: "Harga produk, countdown & checkout" },
  { type: "faq", label: "FAQ", icon: "?", desc: "Pertanyaan & jawaban accordion" },
  { type: "cta", label: "CTA Penutup", icon: "→", desc: "Ajakan beli di bagian bawah" },
  { type: "html", label: "Embed HTML", icon: "</>", desc: "Kode HTML / widget custom bebas" },
];

export function createBlock(type: SalesBlockType): SalesBlock {
  const id = `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  switch (type) {
    case "hero":
      return {
        id,
        type,
        data: {
          badge: "// penawaran terbatas",
          headline: "Headline utama yang langsung kena masalah",
          highlight: "",
          subheadline: "Jelaskan hasil nyata yang akan didapatkan pembeli setelah bergabung.",
          cta_label: "Daftar sekarang",
          align: "left",
          image_url: "",
        },
      };
    case "video":
      return {
        id,
        type,
        data: {
          heading: "",
          youtube_id: "",
          caption: "",
        },
      };
    case "text":
      return {
        id,
        type,
        data: {
          eyebrow: "",
          heading: "Subjudul Copywriting",
          body: "Tulis cerita, penjelasan, atau poin-poin penting di sini.\n\nPisahkan paragraf dengan baris kosong.",
          align: "left",
        },
      };
    case "image":
      return {
        id,
        type,
        data: {
          image_url: "",
          caption: "",
          max_width: "large",
        },
      };
    case "problems":
      return {
        id,
        type,
        data: {
          eyebrow: "Masalah yang diselesaikan",
          items: [
            { label: "01", title: "Kerjaan repetitif menyita waktu", body: "Setiap hari habis untuk hal teknis yang sama berulang kali." },
          ],
        },
      };
    case "stats":
      return {
        id,
        type,
        data: {
          eyebrow: "Yang sudah berjalan",
          items: [
            { value: "24/7", label: "Sistem aktif berjalan otomatis" },
            { value: "< 1 mnt", label: "Akses langsung terbuka setelah bayar" },
          ],
        },
      };
    case "benefits":
      return {
        id,
        type,
        data: {
          eyebrow: "Yang kamu dapat",
          items: [
            { title: "Materi praktik step-by-step", body: "Langsung bangun sistem nyata, bukan sekadar teori." },
          ],
        },
      };
    case "curriculum":
      return {
        id,
        type,
        data: {
          eyebrow: "Isi materinya",
          heading: "Yang bakal kamu bangun, modul per modul.",
        },
      };
    case "testimonials":
      return {
        id,
        type,
        data: {
          eyebrow: "Kata member",
          items: [
            { quote: "Setelah ikut ini, workflow tim saya jadi jauh lebih cepat dan rapi.", name: "Member XindeLabs", meta: "Business Owner" },
          ],
        },
      };
    case "pricing":
      return {
        id,
        type,
        data: {
          eyebrow: "Investasi",
          heading: "",
          cta_label: "Amankan akses sekarang",
          note: "Pembayaran via Mayar · akses langsung setelah pembayaran masuk",
          show_countdown: true,
        },
      };
    case "faq":
      return {
        id,
        type,
        data: {
          eyebrow: "FAQ",
          items: [
            { question: "Apakah cocok untuk pemula?", answer: "Ya, semua dijelaskan dari nol langkah demi langkah." },
          ],
        },
      };
    case "cta":
      return {
        id,
        type,
        data: {
          eyebrow: "Mulai sekarang",
          headline: "Berhenti kerjain semuanya sendiri.",
          subheadline: "Bangun sistem yang jalan buat kamu, bukan sebaliknya.",
          cta_label: "Daftar sekarang",
          cta_href: "",
        },
      };
    case "html":
      return {
        id,
        type,
        data: {
          label: "Custom HTML",
          html: "<div style=\"padding:24px;border:1px solid rgba(0,255,136,.3);border-radius:16px;text-align:center\">\n  <p style=\"color:#00ff88;font-weight:bold\">Blok Custom HTML</p>\n</div>",
        },
      };
  }
}

export function extractYoutubeId(raw: unknown): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop() || "";
    }
  } catch {}
  return s;
}

export function getBlocksFromConfig(config: any): SalesBlock[] | null {
  let notice = config?.sales_notification_config;
  if (typeof notice === "string") {
    try {
      notice = JSON.parse(notice);
    } catch {
      notice = {};
    }
  }
  const raw = notice?.builder_blocks;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((b: any, i: number) => ({
      id: String(b?.id || `blk_${i}`),
      type: (b?.type || "text") as SalesBlockType,
      hidden: Boolean(b?.hidden),
      data: b?.data && typeof b.data === "object" ? b.data : {},
    }));
  }
  return null;
}

/** Convert legacy sales_page_config row into editable drag-and-drop blocks. */
export function legacyConfigToBlocks(config: any, productTitle?: string): SalesBlock[] {
  const existing = getBlocksFromConfig(config);
  if (existing) return existing;

  const blocks: SalesBlock[] = [];
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);

  blocks.push({
    ...createBlock("hero"),
    data: {
      badge: String(config?.hero_badge || "// penawaran khusus"),
      headline: String(config?.headline || productTitle || "Headline Utama"),
      highlight: "",
      subheadline: String(config?.subheadline || ""),
      cta_label: String(config?.cta_label || "Daftar sekarang"),
      align: "left",
      image_url: "",
    },
  });

  if (config?.vsl_youtube_id) {
    blocks.push({
      ...createBlock("video"),
      data: { heading: "", youtube_id: String(config.vsl_youtube_id), caption: "" },
    });
  }

  if (config?.custom_html && config?.custom_html_position === "hero") {
    blocks.push({
      ...createBlock("html"),
      data: { label: "Embed HTML (Atas)", html: String(config.custom_html) },
    });
  }

  if (arr(config?.problem_blocks).length > 0) {
    blocks.push({
      ...createBlock("problems"),
      data: { eyebrow: "Masalah yang diselesaikan", items: arr(config.problem_blocks) },
    });
  }

  if (arr(config?.stats).length > 0) {
    blocks.push({
      ...createBlock("stats"),
      data: { eyebrow: "Yang sudah berjalan", items: arr(config.stats) },
    });
  }

  blocks.push(createBlock("curriculum"));

  if (arr(config?.benefits).length > 0) {
    blocks.push({
      ...createBlock("benefits"),
      data: { eyebrow: "Yang kamu dapat", items: arr(config.benefits) },
    });
  }

  if (arr(config?.testimonials).length > 0) {
    blocks.push({
      ...createBlock("testimonials"),
      data: { eyebrow: "Kata member", items: arr(config.testimonials) },
    });
  }

  if (config?.custom_html && (!config?.custom_html_position || config?.custom_html_position === "mid")) {
    blocks.push({
      ...createBlock("html"),
      data: { label: "Embed HTML (Tengah)", html: String(config.custom_html) },
    });
  }

  blocks.push({
    ...createBlock("pricing"),
    data: {
      eyebrow: "Pricing",
      heading: "",
      cta_label: String(config?.cta_label || "Daftar sekarang"),
      note: "Pembayaran via Mayar · akses setelah pembayaran masuk",
      show_countdown: config?.countdown_type !== "none",
    },
  });

  if (arr(config?.faq_items).length > 0) {
    blocks.push({
      ...createBlock("faq"),
      data: { eyebrow: "FAQ", items: arr(config.faq_items) },
    });
  }

  if (config?.custom_html && config?.custom_html_position === "last") {
    blocks.push({
      ...createBlock("html"),
      data: { label: "Embed HTML (Bawah)", html: String(config.custom_html) },
    });
  }

  blocks.push({
    ...createBlock("cta"),
    data: {
      eyebrow: "Mulai",
      headline: String(config?.final_headline || "Berhenti kerjain semuanya sendiri."),
      subheadline: String(
        config?.final_subheadline || "Bangun sistem yang jalan buat kamu, bukan sebaliknya.",
      ),
      cta_label: String(config?.cta_label || "Daftar sekarang"),
      cta_href: "",
    },
  });

  return blocks;
}
