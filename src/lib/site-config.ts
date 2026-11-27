import { SERVICE_LINES } from "@/lib/services";

export type StatItem = {
  v: string;
  k: string;
};

export type EditableServiceLine = {
  slug: string;
  number: string;
  title: string;
  short: string;
  description: string;
  points: string[];
};

export type MethodStep = {
  title: string;
  desc: string;
};

export type SiteConfig = {
  global: {
    wa_admin_number: string;
    instagram_handle: string;
    instagram_url: string;
    header_cta_label: string;
    header_cta_href: string;
    footer_tagline_highlight: string;
    footer_tagline_rest: string;
  };
  home: {
    hero_eyebrow: string;
    hero_title_line1: string;
    hero_title_highlight: string;
    hero_subtitle: string;
    hero_subtitle_hand: string;
    hero_primary_cta_label: string;
    hero_primary_cta_href: string;
    hero_secondary_cta_label: string;
    hero_secondary_cta_href: string;
    founder_image: string;
    founder_caption: string;
    stats: StatItem[];
    about_eyebrow: string;
    about_title: string;
    about_title_highlight: string;
    about_p1: string;
    about_p2: string;
    about_quote: string;
    track_record: string[];
    work_eyebrow: string;
    work_title: string;
    work_title_highlight: string;
    learn_eyebrow: string;
    learn_title: string;
    learn_title_highlight: string;
    learn_desc: string;
    learn_cta_label: string;
    contact_eyebrow: string;
    contact_title: string;
    contact_title_highlight: string;
    contact_desc: string;
    contact_form_eyebrow: string;
    contact_form_title: string;
    contact_form_desc: string;
  };
  service: {
    eyebrow: string;
    title: string;
    title_highlight: string;
    subtitle: string;
    consult_eyebrow: string;
    consult_title: string;
    consult_desc: string;
    cta_title: string;
    cta_desc: string;
    wa_prefill_text: string;
    lines: EditableServiceLine[];
  };
  learn: {
    flagship_slug: string;
    hero_eyebrow: string;
    hero_title_prefix: string;
    hero_title_highlight: string;
    hero_title_suffix: string;
    hero_desc: string;
    hero_desc_hand: string;
    hero_price_note: string;
    hero_badges: string[];
    problem_eyebrow: string;
    problem_title: string;
    problem_p1: string;
    problem_p2: string;
    problem_p3: string;
    curriculum_eyebrow: string;
    curriculum_title: string;
    curriculum_desc: string;
    curriculum_modules: string[];
    fit_eyebrow: string;
    fit_title: string;
    fit_points: string[];
    method_eyebrow: string;
    method_steps: MethodStep[];
    other_eyebrow: string;
    other_title: string;
    closing_eyebrow: string;
    closing_title: string;
  };
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  global: {
    wa_admin_number: "62895335137700",
    instagram_handle: "@xindelabs.id",
    instagram_url: "https://instagram.com/xindelabs.id",
    header_cta_label: "Work with me",
    header_cta_href: "/service",
    footer_tagline_highlight: "Dibangun,",
    footer_tagline_rest: "bukan dipresentasikan.",
  },
  home: {
    hero_eyebrow: "// ai automation · digital selling",
    hero_title_line1: "Yang bikin capek bukan jualannya — tapi",
    hero_title_highlight: "semua yang lo kerjain ulang tiap hari.",
    hero_subtitle:
      "XindeLabs bikin agent AI yang ambil alih kerjaan berulang: follow-up leads, funnel yang nutup penjualan, konten yang terbit tiap hari.",
    hero_subtitle_hand: "Biar lo balik ngurus growth.",
    hero_primary_cta_label: "Work with me →",
    hero_primary_cta_href: "/service",
    hero_secondary_cta_label: "Liat kelasnya",
    hero_secondary_cta_href: "https://learn.xindelabs.web.id",
    founder_image: "/founder.jpg",
    founder_caption: "xinde · founder",
    stats: [
      { v: "24/7", k: "agent aktif di VPS, tanpa disuruh" },
      { v: "< 1 menit", k: "dari payment masuk ke akses LMS terbuka" },
      { v: "3 brand", k: "konten Instagram terbit otomatis tiap hari" },
      { v: "5 niche", k: "campaign Meta Ads dengan evaluasi berkala" },
    ],
    about_eyebrow: "tentang",
    about_title: "Dari kerja manual, jadi",
    about_title_highlight: "sistem yang jalan sendiri.",
    about_p1:
      "Latar belakang saya penjualan, bukan kampus IT. Semua yang saya bangun di sini berawal dari satu masalah yang sama: kerjaan repetitif — follow-up, rekap, posting, hitung — menghabiskan waktu yang seharusnya dipakai untuk tumbuh.",
    about_p2:
      "Sekarang XindeLabs membangun lapisan itu dengan AI: agent otonom yang mengambil pekerjaan operasional, funnel yang mengurus pembayaran sampai akses produk, dan sistem konten yang menjaga brand tetap hidup.",
    about_quote: "Semua angka di atas jalan di bisnis saya sendiri, tiap hari.",
    track_record: [
      "Tim bot hermes yang jalan harian di VPS",
      "Engine Instagram: 3 brand, konten terbit otomatis",
      "Funnel Mayar: bayar → akses LMS dalam hitungan detik",
      "Sistem Meta Ads multi-niche dengan evaluasi berkala",
      "Membership klinik: poin, tier, dan kartu digital",
    ],
    work_eyebrow: "karya",
    work_title: "Yang lo liat di sini",
    work_title_highlight: "sistem yang kepake, bukan mockup.",
    learn_eyebrow: "belajar",
    learn_title: "Cara bangunnya,",
    learn_title_highlight: "diajarkan kebuka.",
    learn_desc:
      "Semua yang dipakai di project nyata ditulis dan diajarkan di classroom XindeLabs: kelas online, tantangan praktik, dan mentoring.",
    learn_cta_label: "Masuk classroom →",
    contact_eyebrow: "kontak",
    contact_title: "Berhenti pakai AI malah nambah kerjaan.",
    contact_title_highlight: "Bikin sistem yang real kerja 24/7 No Baper.",
    contact_desc:
      "Terbuka untuk project automation, infrastruktur agent, sampai build end-to-end — dari satu workflow sampai sistem operasional penuh.",
    contact_form_eyebrow: "// mulai dari sini",
    contact_form_title: "Ceritain bisnisnya",
    contact_form_desc: "Isi 4 field, gw balas langsung via WhatsApp.",
  },
  service: {
    eyebrow: "service",
    title: "Yang bisa gw bangun",
    title_highlight: "buat bisnis lo.",
    subtitle:
      "Semua di bawah ini sudah jalan di bisnis gw sendiri — bukan konsep. Pilih yang paling nyangkut, sisanya bisa nyusul.",
    consult_eyebrow: "work with me",
    consult_title: "Konsultasikan sekarang.",
    consult_desc:
      "Pilih kebutuhan lo, isi kontak. Gw balas langsung buat bahas scope, format, dan langkah paling masuk akal.",
    cta_title: "Mau mulai dari mana?",
    cta_desc:
      "Ceritain kerjaan repetitif yang paling nyita waktu lo. Gw bantu petakan mana yang bisa diotomasi duluan — gratis, 20 menit.",
    wa_prefill_text: "Halo XindeLabs, gw mau bahas project.",
    lines: SERVICE_LINES.map((s) => ({
      slug: s.slug,
      number: s.number,
      title: s.title,
      short: s.short,
      description: s.description,
      points: [...s.points],
    })),
  },
  learn: {
    flagship_slug: "",
    hero_eyebrow: "// xindelabs learn · classroom & digital library",
    hero_title_prefix: "Belajar bangun sistem AI & bisnis digital",
    hero_title_highlight: "langsung dari praktik nyata.",
    hero_title_suffix: "",
    hero_desc:
      "Semua yang dipakai di project nyata XindeLabs dibuka di sini — mulai dari kelas online, workshop live & replay, template siap pakai, sampai bimbingan VIP 1-on-1.",
    hero_desc_hand: "Pilih jalur yang paling pas buat tahap bisnismu.",
    hero_price_note: "akses langsung via member area",
    hero_badges: ["Kelas & modul mandiri", "Workshop live & replay", "Template & akses member area"],
    problem_eyebrow: "01 / Pendekatan belajar",
    problem_title: "Bukan kumpulan teori. Semua dibangun untuk langsung kepake.",
    problem_p1:
      "Banyak orang sudah coba pakai AI, tapi masih berhenti di copy-paste manual dan kerjaan harian tetap numpuk.",
    problem_p2:
      "Di XindeLabs Learn, fokusnya bukan sekadar tahu tools — tapi paham alur kerja, struktur sistem, dan cara menerapkannya langsung ke operasional bisnis.",
    problem_p3:
      "Pilih materi sesuai kebutuhanmu: mulai dari tutorial gratis, kelas mandiri, workshop praktik, hingga pendampingan VIP.",
    curriculum_eyebrow: "02 / Jalur belajar",
    curriculum_title: "Pilih format belajar yang paling cocok buatmu.",
    curriculum_desc:
      "Setiap produk dirancang dengan hasil nyata — tinggal sesuaikan dengan waktu, target, dan kebutuhan timmu.",
    curriculum_modules: [
      "Kelas Online Mandiri — modul video & teks step-by-step yang bisa diikuti kapan saja",
      "Workshop Live & Replay — sesi praktik bareng, studi kasus nyata, dan rekaman penuh",
      "Template & Produk Digital — workflow, prompt, dan toolkit siap pakai biar langsung jalan",
      "VIP & Mentoring 1-on-1 — bimbingan intensif untuk bangun sistem langsung di bisnismu",
    ],
    fit_eyebrow: "03 / Cocok untuk",
    fit_title: "Buat founder, creator, dan tim yang mau kerja lebih rapi.",
    fit_points: [
      "Business owner yang ingin mengotomasi pekerjaan repetitif harian.",
      "Creator & digital seller yang ingin punya funnel dan sistem konten yang konsisten.",
      "Tim operasional/marketing yang butuh panduan praktik AI yang jelas.",
      "Pemula maupun praktisi yang siap langsung praktik, bukan sekadar koleksi materi.",
    ],
    method_eyebrow: "04 / Cara belajarnya",
    method_steps: [
      {
        title: "Pahami",
        desc: "Pelajari kerangka kerja, alur sistem, dan konteks yang benar sebelum menyentuh tools.",
      },
      {
        title: "Bangun",
        desc: "Ikuti panduan langkah demi langkah dan pakai template yang sudah disediakan.",
      },
      {
        title: "Terapkan",
        desc: "Uji langsung di bisnis atau project nyatamu, evaluasi hasil, lalu kembangkan bertahap.",
      },
    ],
    other_eyebrow: "05 / Katalog produk",
    other_title: "Semua kelas, workshop, & program aktif.",
    closing_eyebrow: "Baru mau mulai?",
    closing_title: "Mulai dari katalog atau coba tutorial gratis dulu.",
  },
};

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function strList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  return value.map((v) => String(v ?? "")).filter((v) => v.trim().length > 0);
}

function statsList(value: unknown, fallback: StatItem[]): StatItem[] {
  if (!Array.isArray(value)) return fallback.map((s) => ({ ...s }));
  return value
    .filter((v): v is Record<string, unknown> => Boolean(v && typeof v === "object"))
    .map((v) => ({ v: String(v.v ?? "").trim(), k: String(v.k ?? "").trim() }))
    .filter((v) => v.v || v.k);
}

function serviceLinesList(value: unknown, fallback: EditableServiceLine[]): EditableServiceLine[] {
  if (!Array.isArray(value)) return fallback.map((s) => ({ ...s, points: [...s.points] }));
  const cleaned = value
    .filter((v): v is Record<string, unknown> => Boolean(v && typeof v === "object"))
    .map((v, i) => ({
      slug: String(v.slug ?? "").trim() || `layanan-${i + 1}`,
      number: String(v.number ?? "").trim() || String(i + 1).padStart(2, "0"),
      title: String(v.title ?? "").trim(),
      short: String(v.short ?? "").trim(),
      description: String(v.description ?? "").trim(),
      points: Array.isArray(v.points)
        ? v.points.map((p) => String(p ?? "").trim()).filter(Boolean)
        : [],
    }))
    .filter((v) => v.title.length > 0);
  return cleaned.length ? cleaned : fallback.map((s) => ({ ...s, points: [...s.points] }));
}

function methodStepsList(value: unknown, fallback: MethodStep[]): MethodStep[] {
  if (!Array.isArray(value)) return fallback.map((s) => ({ ...s }));
  const cleaned = value
    .filter((v): v is Record<string, unknown> => Boolean(v && typeof v === "object"))
    .map((v) => ({
      title: String(v.title ?? "").trim(),
      desc: String(v.desc ?? "").trim(),
    }))
    .filter((v) => v.title || v.desc);
  return cleaned.length ? cleaned : fallback.map((s) => ({ ...s }));
}

export function mergeSiteConfig(raw: unknown, waAdminNumber?: string | null): SiteConfig {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const g = src.global && typeof src.global === "object" ? (src.global as Record<string, unknown>) : {};
  const h = src.home && typeof src.home === "object" ? (src.home as Record<string, unknown>) : {};
  const s = src.service && typeof src.service === "object" ? (src.service as Record<string, unknown>) : {};
  const l = src.learn && typeof src.learn === "object" ? (src.learn as Record<string, unknown>) : {};

  const waFromConfig = typeof g.wa_admin_number === "string" ? g.wa_admin_number.trim() : "";
  const waFromSetting = typeof waAdminNumber === "string" ? waAdminNumber.trim() : "";

  return {
    global: {
      wa_admin_number: waFromConfig || waFromSetting || DEFAULT_SITE_CONFIG.global.wa_admin_number,
      instagram_handle: str(g.instagram_handle, DEFAULT_SITE_CONFIG.global.instagram_handle),
      instagram_url: str(g.instagram_url, DEFAULT_SITE_CONFIG.global.instagram_url),
      header_cta_label: str(g.header_cta_label, DEFAULT_SITE_CONFIG.global.header_cta_label),
      header_cta_href: str(g.header_cta_href, DEFAULT_SITE_CONFIG.global.header_cta_href),
      footer_tagline_highlight: str(g.footer_tagline_highlight, DEFAULT_SITE_CONFIG.global.footer_tagline_highlight),
      footer_tagline_rest: str(g.footer_tagline_rest, DEFAULT_SITE_CONFIG.global.footer_tagline_rest),
    },
    home: {
      hero_eyebrow: str(h.hero_eyebrow, DEFAULT_SITE_CONFIG.home.hero_eyebrow),
      hero_title_line1: str(h.hero_title_line1, DEFAULT_SITE_CONFIG.home.hero_title_line1),
      hero_title_highlight: str(h.hero_title_highlight, DEFAULT_SITE_CONFIG.home.hero_title_highlight),
      hero_subtitle: str(h.hero_subtitle, DEFAULT_SITE_CONFIG.home.hero_subtitle),
      hero_subtitle_hand: str(h.hero_subtitle_hand, DEFAULT_SITE_CONFIG.home.hero_subtitle_hand),
      hero_primary_cta_label: str(h.hero_primary_cta_label, DEFAULT_SITE_CONFIG.home.hero_primary_cta_label),
      hero_primary_cta_href: str(h.hero_primary_cta_href, DEFAULT_SITE_CONFIG.home.hero_primary_cta_href),
      hero_secondary_cta_label: str(h.hero_secondary_cta_label, DEFAULT_SITE_CONFIG.home.hero_secondary_cta_label),
      hero_secondary_cta_href: str(h.hero_secondary_cta_href, DEFAULT_SITE_CONFIG.home.hero_secondary_cta_href),
      founder_image: str(h.founder_image, DEFAULT_SITE_CONFIG.home.founder_image),
      founder_caption: str(h.founder_caption, DEFAULT_SITE_CONFIG.home.founder_caption),
      stats: statsList(h.stats, DEFAULT_SITE_CONFIG.home.stats),
      about_eyebrow: str(h.about_eyebrow, DEFAULT_SITE_CONFIG.home.about_eyebrow),
      about_title: str(h.about_title, DEFAULT_SITE_CONFIG.home.about_title),
      about_title_highlight: str(h.about_title_highlight, DEFAULT_SITE_CONFIG.home.about_title_highlight),
      about_p1: str(h.about_p1, DEFAULT_SITE_CONFIG.home.about_p1),
      about_p2: str(h.about_p2, DEFAULT_SITE_CONFIG.home.about_p2),
      about_quote: str(h.about_quote, DEFAULT_SITE_CONFIG.home.about_quote),
      track_record: strList(h.track_record, DEFAULT_SITE_CONFIG.home.track_record),
      work_eyebrow: str(h.work_eyebrow, DEFAULT_SITE_CONFIG.home.work_eyebrow),
      work_title: str(h.work_title, DEFAULT_SITE_CONFIG.home.work_title),
      work_title_highlight: str(h.work_title_highlight, DEFAULT_SITE_CONFIG.home.work_title_highlight),
      learn_eyebrow: str(h.learn_eyebrow, DEFAULT_SITE_CONFIG.home.learn_eyebrow),
      learn_title: str(h.learn_title, DEFAULT_SITE_CONFIG.home.learn_title),
      learn_title_highlight: str(h.learn_title_highlight, DEFAULT_SITE_CONFIG.home.learn_title_highlight),
      learn_desc: str(h.learn_desc, DEFAULT_SITE_CONFIG.home.learn_desc),
      learn_cta_label: str(h.learn_cta_label, DEFAULT_SITE_CONFIG.home.learn_cta_label),
      contact_eyebrow: str(h.contact_eyebrow, DEFAULT_SITE_CONFIG.home.contact_eyebrow),
      contact_title: str(h.contact_title, DEFAULT_SITE_CONFIG.home.contact_title),
      contact_title_highlight: str(h.contact_title_highlight, DEFAULT_SITE_CONFIG.home.contact_title_highlight),
      contact_desc: str(h.contact_desc, DEFAULT_SITE_CONFIG.home.contact_desc),
      contact_form_eyebrow: str(h.contact_form_eyebrow, DEFAULT_SITE_CONFIG.home.contact_form_eyebrow),
      contact_form_title: str(h.contact_form_title, DEFAULT_SITE_CONFIG.home.contact_form_title),
      contact_form_desc: str(h.contact_form_desc, DEFAULT_SITE_CONFIG.home.contact_form_desc),
    },
    service: {
      eyebrow: str(s.eyebrow, DEFAULT_SITE_CONFIG.service.eyebrow),
      title: str(s.title, DEFAULT_SITE_CONFIG.service.title),
      title_highlight: str(s.title_highlight, DEFAULT_SITE_CONFIG.service.title_highlight),
      subtitle: str(s.subtitle, DEFAULT_SITE_CONFIG.service.subtitle),
      consult_eyebrow: str(s.consult_eyebrow, DEFAULT_SITE_CONFIG.service.consult_eyebrow),
      consult_title: str(s.consult_title, DEFAULT_SITE_CONFIG.service.consult_title),
      consult_desc: str(s.consult_desc, DEFAULT_SITE_CONFIG.service.consult_desc),
      cta_title: str(s.cta_title, DEFAULT_SITE_CONFIG.service.cta_title),
      cta_desc: str(s.cta_desc, DEFAULT_SITE_CONFIG.service.cta_desc),
      wa_prefill_text: str(s.wa_prefill_text, DEFAULT_SITE_CONFIG.service.wa_prefill_text),
      lines: serviceLinesList(s.lines, DEFAULT_SITE_CONFIG.service.lines),
    },
    learn: {
      flagship_slug: str(l.flagship_slug, DEFAULT_SITE_CONFIG.learn.flagship_slug),
      hero_eyebrow: str(l.hero_eyebrow, DEFAULT_SITE_CONFIG.learn.hero_eyebrow),
      hero_title_prefix: str(l.hero_title_prefix, DEFAULT_SITE_CONFIG.learn.hero_title_prefix),
      hero_title_highlight: str(l.hero_title_highlight, DEFAULT_SITE_CONFIG.learn.hero_title_highlight),
      hero_title_suffix: str(l.hero_title_suffix, DEFAULT_SITE_CONFIG.learn.hero_title_suffix),
      hero_desc: str(l.hero_desc, DEFAULT_SITE_CONFIG.learn.hero_desc),
      hero_desc_hand: str(l.hero_desc_hand, DEFAULT_SITE_CONFIG.learn.hero_desc_hand),
      hero_price_note: str(l.hero_price_note, DEFAULT_SITE_CONFIG.learn.hero_price_note),
      hero_badges: strList(l.hero_badges, DEFAULT_SITE_CONFIG.learn.hero_badges),
      problem_eyebrow: str(l.problem_eyebrow, DEFAULT_SITE_CONFIG.learn.problem_eyebrow),
      problem_title: str(l.problem_title, DEFAULT_SITE_CONFIG.learn.problem_title),
      problem_p1: str(l.problem_p1, DEFAULT_SITE_CONFIG.learn.problem_p1),
      problem_p2: str(l.problem_p2, DEFAULT_SITE_CONFIG.learn.problem_p2),
      problem_p3: str(l.problem_p3, DEFAULT_SITE_CONFIG.learn.problem_p3),
      curriculum_eyebrow: str(l.curriculum_eyebrow, DEFAULT_SITE_CONFIG.learn.curriculum_eyebrow),
      curriculum_title: str(l.curriculum_title, DEFAULT_SITE_CONFIG.learn.curriculum_title),
      curriculum_desc: str(l.curriculum_desc, DEFAULT_SITE_CONFIG.learn.curriculum_desc),
      curriculum_modules: strList(l.curriculum_modules, DEFAULT_SITE_CONFIG.learn.curriculum_modules),
      fit_eyebrow: str(l.fit_eyebrow, DEFAULT_SITE_CONFIG.learn.fit_eyebrow),
      fit_title: str(l.fit_title, DEFAULT_SITE_CONFIG.learn.fit_title),
      fit_points: strList(l.fit_points, DEFAULT_SITE_CONFIG.learn.fit_points),
      method_eyebrow: str(l.method_eyebrow, DEFAULT_SITE_CONFIG.learn.method_eyebrow),
      method_steps: methodStepsList(l.method_steps, DEFAULT_SITE_CONFIG.learn.method_steps),
      other_eyebrow: str(l.other_eyebrow, DEFAULT_SITE_CONFIG.learn.other_eyebrow),
      other_title: str(l.other_title, DEFAULT_SITE_CONFIG.learn.other_title),
      closing_eyebrow: str(l.closing_eyebrow, DEFAULT_SITE_CONFIG.learn.closing_eyebrow),
      closing_title: str(l.closing_title, DEFAULT_SITE_CONFIG.learn.closing_title),
    },
  };
}

export function formatWaHref(rawNumber: string | null | undefined, prefillText?: string): string | null {
  const digits = String(rawNumber || "").replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  const base = `https://wa.me/${normalized}`;
  return prefillText ? `${base}?text=${encodeURIComponent(prefillText)}` : base;
}
