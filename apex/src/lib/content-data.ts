export type PageKey = "tutorial" | "vip" | "fast_track" | "join_group";

export const PAGES: { key: PageKey; label: string }[] = [
  { key: "tutorial", label: "Tutorial Hermes" },
  { key: "vip", label: "Bimbingan VIP" },
  { key: "fast_track", label: "Video Workshop" },
  { key: "join_group", label: "Join Group" },
];

export type BlockType =
  | "hero"
  | "feature_list"
  | "feature_grid"
  | "pricing"
  | "faq"
  | "testimonials"
  | "cta_card"
  | "lead_form"
  | "youtube"
  | "heading"
  | "text"
  | "image"
  | "html"
  | "custom_page"
  | "spacer";

export type BlockProps = Record<string, string>;

export type Block = {
  id?: string;
  block_type: BlockType;
  sort_order: number;
  props: BlockProps;
};

export type FieldMeta = {
  key: string;
  label: string;
  multiline?: boolean;
  url?: boolean;
  rows?: number;
  select?: { value: string; label: string }[];
  showIf?: { key: string; value: string };
  /** Saat ada: field disunting sebagai list item terstruktur (tambah/hapus item), bukan textarea. */
  items?: { value: string; label: string }[];
};

export const BLOCK_TYPES: Record<BlockType, { label: string; fields: FieldMeta[] }> = {
  hero: {
    label: "Hero · Judul Halaman",
    fields: [
      { key: "badge", label: "Badge" },
      { key: "title_a", label: "Judul (baris 1)" },
      { key: "title_b", label: "Judul (baris 2)" },
      { key: "subtitle", label: "Deskripsi", multiline: true },
      { key: "bullets", label: "Keunggulan", items: [{ value: "bullet", label: "Keunggulan" }] },
      { key: "center", label: "Tata Letak", select: [{ value: "0", label: "Rata kiri" }, { value: "1", label: "Tengah" }] },
      { key: "form", label: "Form Capture Lead", select: [{ value: "0", label: "Tidak tampil" }, { value: "1", label: "Tampilkan form (2 kolom)" }] },
      { key: "form_title", label: "Judul Form", showIf: { key: "form", value: "1" } },
      { key: "form_subtitle", label: "Deskripsi Form", multiline: true, showIf: { key: "form", value: "1" } },
      { key: "button_txt", label: "Teks Tombol Form", showIf: { key: "form", value: "1" } },
      { key: "button_txt_loading", label: "Teks Tombol (saat loading)", showIf: { key: "form", value: "1" } },
      { key: "button_note", label: "Catatan Bawah Tombol", showIf: { key: "form", value: "1" } },
    ],
  },
  feature_list: {
    label: "Daftar Fitur",
    fields: [
      { key: "section_title", label: "Judul Section" },
      { key: "features", label: "Fitur", items: [{ value: "title", label: "Nama Fitur" }, { value: "desc", label: "Deskripsi (opsional)" }] },
    ],
  },
  faq: {
    label: "FAQ (Tanya Jawab)",
    fields: [
      { key: "section_title", label: "Judul Section" },
      { key: "items", label: "Pertanyaan & Jawaban", items: [{ value: "q", label: "Pertanyaan" }, { value: "a", label: "Jawaban" }] },
    ],
  },
  feature_grid: {
    label: "Grid Kartu Fitur",
    fields: [
      { key: "section_title", label: "Judul Section" },
      { key: "items", label: "Kartu", items: [{ value: "title", label: "Judul Kartu" }, { value: "desc", label: "Deskripsi" }, { value: "link", label: "Link (opsional)" }] },
    ],
  },
  pricing: {
    label: "Tabel Harga (Plan)",
    fields: [
      { key: "section_title", label: "Judul Section" },
      { key: "items", label: "Plan", items: [{ value: "plan", label: "Nama Plan" }, { value: "price", label: "Harga" }, { value: "period", label: "Periode (ops.)" }, { value: "features", label: "Fitur (pisah ';')" }, { value: "cta_txt", label: "Teks Tombol" }, { value: "cta_href", label: "Link Tombol" }] },
    ],
  },
  testimonials: {
    label: "Testimoni / Review",
    fields: [
      { key: "section_title", label: "Judul Section" },
      { key: "items", label: "Ulasan", items: [{ value: "quote", label: "Isi Ulasan" }, { value: "name", label: "Nama / Peran" }] },
    ],
  },
  cta_card: {
    label: "Kartu Penawaran (CTA)",
    fields: [
      { key: "offer_title", label: "Judul Penawaran" },
      { key: "offer_points", label: "Poin Penawaran", items: [{ value: "point", label: "Poin" }] },
      { key: "price", label: "Harga" },
      { key: "price_was", label: "Harga Coret (harga lama, opsional)" },
      { key: "urgency", label: "Badge Slot/Keterbatasan (opsional)" },
      { key: "slots_total", label: "Total Slot (opsional, angka)" },
      { key: "slots_left", label: "Slot Tersisa (opsional, angka)" },
      { key: "cta_txt", label: "Teks Tombol CTA" },
      { key: "cta_href", label: "Link Tombol CTA" },
      { key: "cta_external", label: "Buka di Tab Baru", select: [{ value: "0", label: "Tidak" }, { value: "1", label: "Ya" }] },
      { key: "secondary_txt", label: "Teks Tombol Sekunder" },
      { key: "secondary_href", label: "Link Tombol Sekunder" },
      { key: "secondary_external", label: "Sekunder: Tab Baru", select: [{ value: "0", label: "Tidak" }, { value: "1", label: "Ya" }] },
    ],
  },
  lead_form: {
    label: "Form Capture Lead",
    fields: [
      { key: "form_title", label: "Judul Form" },
      { key: "form_subtitle", label: "Deskripsi Form", multiline: true },
      { key: "button_txt", label: "Teks Tombol" },
      { key: "button_txt_loading", label: "Teks Tombol (saat loading)" },
      { key: "button_note", label: "Catatan Bawah Tombol" },
    ],
  },
  youtube: {
    label: "Video YouTube",
    fields: [{ key: "url", label: "Link Video", url: true }],
  },
  heading: {
    label: "Heading (Sub Judul)",
    fields: [
      { key: "text", label: "Teks" },
      { key: "level", label: "Level", select: [{ value: "h2", label: "H2" }, { value: "h3", label: "H3" }] },
    ],
  },
  text: {
    label: "Teks / Paragraf",
    fields: [
      { key: "content", label: "Isi (mendukung HTML sederhana)", multiline: true, rows: 6 },
      { key: "center", label: "Tata Letak", select: [{ value: "0", label: "Rata kiri" }, { value: "1", label: "Tengah" }] },
    ],
  },
  image: {
    label: "Gambar",
    fields: [
      { key: "url", label: "URL Gambar", url: true },
      { key: "alt", label: "Teks Alternatif" },
      { key: "caption", label: "Caption" },
    ],
  },
  html: {
    label: "HTML Bebas (embed apa saja)",
    fields: [{ key: "code", label: "HTML / Kode Embed", multiline: true, rows: 8 }],
  },
  custom_page: {
    label: "Halaman HTML Ganti Semua",
    fields: [{ key: "html", label: "HTML Halaman (gantikan semua section)", multiline: true, rows: 14 }],
  },
  spacer: {
    label: "Spacer (jarak kosong)",
    fields: [{ key: "height", label: "Tinggi (px, kosong = 48px)" }],
  },
};

export const DEFAULT_BLOCKS: Record<PageKey, Block[]> = {
  tutorial: [
    {
      block_type: "hero",
      sort_order: 0,
      props: {
        badge: "Tutorial Gratis",
        title_a: "Tutorial Hermes",
        title_b: "Bangun Agent AI pertamamu",
        subtitle:
          "Pelajari cara membangun agent AI dari nol dengan materi ringkas, langkah demi langkah, yang langsung bisa kamu praktekan.",
        bullets: "Materi ringkas dan fokus, tanpa basa-basi\nLangsung dipraktekkan, bukan cuma teori\nBisa dikerjakan dari HP maupun laptop",
        center: "0",
        form: "1",
        form_title: "Ambil Tutorial Gratis",
        form_subtitle: "Isi data di bawah, materi dikirim langsung ke email kamu.",
        button_txt: "Ambil Tutorial Gratis",
        button_txt_loading: "Memproses…",
        button_note: "Gratis selamanya. Tanpa kartu kredit.",
      },
    },
  ],
  vip: [
    {
      block_type: "hero",
      sort_order: 0,
      props: {
        badge: "Bimbingan VIP",
        title_a: "Dibimbing Langsung",
        title_b: "Sampai Paham",
        subtitle:
          "Untuk yang tidak mau belajar sendiri dan ingin hasil lebih cepat, Bimbingan VIP mendampingi kamu 1-on-1.",
        center: "0",
        form: "0",
      },
    },
    { block_type: "youtube", sort_order: 1, props: { url: "" } },
    {
      block_type: "feature_list",
      sort_order: 2,
      props: {
        section_title: "What You Get",
        features:
          "Mentor 1-on-1|Sesi private bersama mentor\nReview pekerjaan|Portofolio dan proyekmu dievaluasi langsung\nAkses grup VIP|Komunitas eksklusif peserta VIP\nSesi live bulanan|Tanya jawab & studi kasus\nModul bonus|Materi di luar tutorial gratis",
      },
    },
    {
      block_type: "cta_card",
      sort_order: 3,
      props: {
        offer_title: "Penawaran Hari Ini",
        offer_points: "4 sesi mentor 1-on-1\nAkses penuh seluruh modul & bonus\nKarena baru mulai: harga intro",
        price: "Rp2.999.000",
        cta_txt: "Ya, Saya Mau Bimbingan VIP",
        cta_href: "/checkout/vip",
        cta_external: "0",
        secondary_txt: "Tidak, cukup Tutorial Gratis saja",
        secondary_href: "/fast-track",
        secondary_external: "0",
      },
    },
  ],
  fast_track: [
    {
      block_type: "hero",
      sort_order: 0,
      props: {
        badge: "Video Workshop",
        title_a: "Belajar Membangun Agent AI,",
        title_b: "Langsung Dipraktikkan",
        subtitle:
          "Video workshop terstruktur untuk membangun agent AI yang bantu kerjaan lo 24/7 — tanpa coding, dari nol sampai deploy.",
        center: "0",
        form: "0",
      },
    },
    { block_type: "youtube", sort_order: 1, props: { url: "" } },
    {
      block_type: "feature_list",
      sort_order: 2,
      props: {
        section_title: "What You Get",
        features:
          "9 modul video step-by-step|Dari nol sampai deploy\nTemplate agent siap pakai|Tinggal modifikasi\nAkses tahunan / seumur hidup|Sesuai paket yang dipilih\nGrup Workshop|Tanya sesama peserta",
      },
    },
    {
      block_type: "cta_card",
      sort_order: 3,
      props: {
        offer_title: "Offer Stack",
        offer_points:
          "9 modul video workshop\nSource code & template lengkap\nPaket tahunan atau lifetime\nHarga sekali bayar",
        price: "Rp599.000 / tahun · Rp999.000 lifetime",
        cta_txt: "Ya, Saya Mau Video Workshop",
        cta_href: "/checkout/fast_track",
        cta_external: "0",
        secondary_txt: "Tidak, cukup yang gratis saja",
        secondary_href: "/join-group",
        secondary_external: "0",
      },
    },
  ],
  join_group: [
    {
      block_type: "hero",
      sort_order: 0,
      props: {
        badge: "",
        title_a: "Gabung Komunitas",
        title_b: "Gratis",
        subtitle:
          "Belajar tetap bisa bareng-bareng di grup komunitas. Saling bantu, share progres, dan dapat info tutorial terbaru.",
        center: "1",
        form: "0",
      },
    },
    {
      block_type: "cta_card",
      sort_order: 1,
      props: {
        offer_title: "",
        offer_points: "",
        price: "",
        cta_txt: "Gabung via WhatsApp",
        cta_href: "https://wa.me/?text=Aku%20mau%20gabung%20komunitas",
        cta_external: "1",
        secondary_txt: "",
        secondary_href: "",
        secondary_external: "0",
      },
    },
    {
      block_type: "text",
      sort_order: 2,
      props: { content: "Link grup final akan diganti di konfigurasi.", center: "1" },
    },
  ],
};

export function lines(v: string | undefined): string[] {
  return (v ?? "").split("\n").filter(Boolean);
}

/** Parse baris list item "a|b" jadi pasangan terstruktur (untuk item 2 kolom). */
export function kv(v: string | undefined): { a: string; b: string }[] {
  return lines(v).map((line) => {
    const [a, ...rest] = line.split("|");
    return { a: (a ?? "").trim(), b: rest.join("|").trim() };
  });
}

/** Parse item jadi array kolom (untuk item >2 kolom). */
export function rows(v: string | undefined): string[][] {
  return lines(v).map((l) => l.split("|").map((s) => s.trim()));
}

export function youtubeId(url: string | undefined): string | null {
  return url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1] ?? null;
}

export function leadUrl(href: string, lead?: string): string {
  if (!lead || !href.startsWith("/")) return href;
  return `${href}${href.includes("?") ? "&" : "?"}lead=${encodeURIComponent(lead)}`;
}