/**
 * Satu sumber kebenaran lini jasa — dipakai Main Hub dan /service.
 * ponytail: hardcoded di sini dulu; kalau admin perlu edit harga/lini, pindah ke tabel `settings`.
 */
export const SERVICE_LINES = [
  {
    slug: "pelatihan-ai-bisnis",
    number: "01",
    title: "Pelatihan AI for Business/Company",
    short: "Tim lo langsung bisa pakai AI untuk kerjaan nyata.",
    description:
      "Pelatihan in-house untuk tim perusahaan: dari dasar AI agent sampai praktik langsung di alur kerja sendiri. Materi dipotong sesuai divisi — sales, operasional, marketing, atau admin.",
    points: [
      "Kelas in-house atau online, satu sampai tiga hari",
      "Praktik langsung di studi kasus perusahaan lo",
      "Materi, template prompt, dan skill siap pakai",
      "Pendampingan pasca-pelatihan dan rekap hasil belajar",
    ],
    price: "mulai Rp 8jt/hari (grup)",
  },
  {
    slug: "ai-event-speaker",
    number: "02",
    title: "AI Event Speaker",
    short: "Isi event, seminar, atau webinar soal AI.",
    description:
      "Sesi 45–90 menit berisi demo agent hidup, bukan slide teori: apa yang benar-benar bisa dikerjakan AI hari ini, dan di mana batasnya. Cocok untuk seminar kampus, gathering komunitas, atau event perusahaan.",
    points: [
      "Sesi 45–90 menit + tanya jawab",
      "Demo live (agent, otomasi, konten)",
      "Topik disesuaikan audiens: pemula sampai teknis",
      "Rekaman, materi, dan foto publikasi untuk penyelenggara",
    ],
    price: "mulai Rp 5jt/sesi",
  },
  {
    slug: "instalasi-ai",
    number: "03",
    title: "Instalasi AI untuk Bisnis",
    short: "Agent AI dipasang di operasional lo, jalan 24/7.",
    description:
      "AI dipasang di operasional yang sudah jalan: agent yang follow-up leads, rekap, lapor, dan jawab — tanpa lo suruh tiap hari. Sistem lama tetap dipakai, cuma ditambah lapisan otomatis di atasnya.",
    points: [
      "Agent Hermes jalan di server sendiri (VPS)",
      "Integrasi WhatsApp, email, dan Sheets yang sudah dipakai",
      "Setup, migrasi data, dan pendampingan tim",
      "Jadwal, rekap, dan laporan otomatis",
    ],
    price: "mulai Rp 3,5jt setup + Rp 750rb/bln",
  },
  {
    slug: "automation-bisnis",
    number: "04",
    title: "Automation Bisnis",
    short: "Funnel, checkout, akses produk, laporan — semua otomatis.",
    description:
      "Kerjaan yang lo ulang tiap hari dipindah ke sistem: landing → payment gateway → akses produk, plus tagihan, reminder, dan laporan. Bayar masuk, akses terbuka dalam hitungan detik.",
    points: [
      "Funnel multi-step (gratis → berbayar)",
      "Mayar, QRIS, dan hosted invoice",
      "Auto-grant akses LMS setelah pembayaran",
      "Reminder, tagihan berulang, dan laporan berkala",
    ],
    price: "mulai Rp 4,5jt",
  },
  {
    slug: "vibe-marketing",
    number: "05",
    title: "Vibe Marketing",
    short: "Konten dan iklan jalan sendiri, per brand.",
    description:
      "Riset hook, produksi carousel, posting terjadwal, auto-DM, dan Meta Ads yang dites terstruktur. Satu sistem untuk banyak brand — konsisten tanpa nambah orang.",
    points: [
      "Konten multi-brand terjadwal otomatis",
      "Carousel, caption, dan hook dari data riset",
      "Meta Ads testing + evaluasi H+3/H+5/H+7",
      "Auto-DM keyword dan follow-up leads",
    ],
    price: "mulai Rp 2,5jt + Rp 1jt/bln",
  },
  {
    slug: "pembuatan-aplikasi",
    number: "06",
    title: "Pembuatan Aplikasi Bisnis",
    short: "Aplikasi, LMS, dan member area yang dipakai tiap hari.",
    description:
      "Aplikasi yang menjawab alur bisnis nyata: katalog produk, member area, LMS, tier dan poin, sampai dashboard internal. Dibangun di atas stack yang lo bisa rawat sendiri.",
    points: [
      "Next.js + Supabase, deploy Vercel",
      "LMS: kelas, progress, sertifikat digital",
      "Membership: tier, poin, voucher, affiliate",
      "Integrasi WhatsApp, email, dan pembayaran",
    ],
    price: "mulai Rp 6jt",
  },
] as const;

export type ServiceLine = (typeof SERVICE_LINES)[number];
