/* ============================================================
   CONFIG — Build Your Own Personalized Agent
   Semua nilai yang bisa berubah di sini (bukan di HTML).
   ============================================================ */

window.XINDE = (function () {
  // Meta Pixel
  const PIXEL_ID = "921699146613715";

  // n8n webhook (SUDAH LIVE — contract PRD §5)
  const N8N_WEBHOOK = "https://n8n.43-133-131-126.sslip.io/webhook/create-payment";

  // Supabase (project live)
  const SUPABASE_URL = "https://qxzvmnbhplgmspdxdbmg.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4enZtbmJocGxnbXNwZHhkYm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MDQyMjksImV4cCI6MjEwMjE4MDIyOX0.19lSzSLuNeFyDQ1r-3hYP50j01f1GeaC4ZSqWI-ajs8";

  // Placeholder YouTube (ganti / isi via CMS nanti)
  const VIDEO_YOUTUBE_ID = "M7lc1UVf-VE";

  // Harga
  const PRICES = {
    yearly: { harga: 599000, label: "Rp 599.000 / tahun" },
    lifetime: { harga: 999000, label: "Rp 999.000 / lifetime" },
  };

  // ---------------- Konten default (fallback CMS §6) ----------------
  const DEFAULT_CONTENT = {
    hero_title: "Bangun Karyawan Super Pintar — <span class='hl'>Bantu semua kerjaan lo 24/7 No Baper</span>",
    hero_subtitle:
      "Bukan cuma ChatGPT. Lo bakal punya agent yang follow-up calon client otomatis, riset prospek dalam 30 detik, bikin 10 caption promosi dalam 1 menit, dan jawab objeksi “mahal”, “nanti dulu”, “pikir-pikir”. <b>Tanpa coding.</b>",
    video_caption: "intro.mp4 — kenapa sales person butuh AI agent sendiri (2:45)",
    price_yearly: 599000,
    price_lifetime: 999000,
    discord_link: "https://discord.gg/xindelabs",
    whatsapp_link: "https://wa.me/6281234567890",
    instagram_handle: "@xindelabs.id",
    testimonials: [
      {
        quote:
          "Follow-up WA 40 calon client yang tadinya makan seharian, sekarang cuma 5 menit. Agent yang jawab, saya yang closing.",
        name: "Rudi, Agen Properti Surabaya",
      },
      {
        quote:
          "Saya orang marketing, bukan IT. Setup agent pertama saya selesai 1 malam sambil nonton video modul. Beneran no-coding.",
        name: "Maya, Freelance Sales",
      },
      {
        quote:
          "Objeksi “nanti dulu” itu yang paling sering. Sekarang agent saya yang handle, jawabannya konsisten dan ga ngecewain prospek.",
        name: "Andi, Agen Asuransi Jakarta",
      },
    ],
    faqs: [
      {
        q: "Saya belum pernah ngoding. Bisa ikut?",
        a: "Bisa. Course ini memang dibuat untuk sales person non-teknis. Semua pakai tools no-code (ChatGPT/Claude, Google Sheets, WhatsApp, n8n) yang tinggal disetel lewat panduan langkah demi langkah.",
      },
      {
        q: "Apa bedanya dengan ChatGPT biasa?",
        a: "ChatGPT cuma bisa dipakai kalau lo buka chat-nya. Agent yang lo bangun di course ini jalan terus tanpa lo ketik ulang: follow-up otomatis, riset calon client, sampai laporan closing — 24 jam, tanpa capek.",
      },
      {
        q: "Ini khusus untuk sales tertentu?",
        a: "Utamanya agen asuransi, agen properti, dan freelancer, tapi framework-nya dipakai semua jenis sales: kursus, b2b, jasa, sampai reseller.",
      },
      {
        q: "Paket Tahunan vs Lifetime bedanya apa?",
        a: "Tahunan Rp 599.000: akses semua konten 1 tahun. Lifetime Rp 999.000: bayar sekali, akses selamanya + dapat update use-case baru tanpa biaya tambahan.",
      },
      {
        q: "Kalau saya tidak puas, ada refund?",
        a: "Ada garansi uang kembali 7 hari. Kalau masih belum yakin course ini cocok dalam 7 hari pertama, kirim bukti ke WhatsApp kami dan kami refund penuh tanpa drama.",
      },
      {
        q: "Bagaimana cara bayarnya?",
        a: "Bayar via Mayar (transfer bank, QRIS, atau e-wallet). Setelah pembayaran, link course + invite Discord dikirim otomatis ke email lo. Cek juga folder spam.",
      },
      {
        q: "Berapa lama saya butuh setiap hari?",
        a: "Cukup 30–45 menit per hari selama 1–2 minggu. Tiap modul maksimal 30 menit, dan bisa diulang kapan saja.",
      },
      {
        q: "Apakah ada komunitasnya?",
        a: "Ada. Setiap member masuk Discord Xinde Labs — tempat tanya-jawab, sharing prompt, dan sesi use-case update bareng member lain.",
      },
    ],
  };

  // ---------------- Modul (member area §7) ----------------
  const MODULES = [
    { level: "beginner", title: "Kenalan sama AI Agent: Bukan Cuma ChatGPT", duration: "12 menit", video_id: "M7lc1UVf-VE" },
    { level: "beginner", title: "Setup Agent Pertama Lo dalam 30 Menit", duration: "28 menit", video_id: "M7lc1UVf-VE" },
    { level: "beginner", title: "Bikin Agent Follow-up WA yang Bales Sendiri", duration: "35 menit", video_id: "M7lc1UVf-VE" },
    { level: "level-up", title: "Agent Riset Calon Client", duration: "26 menit", video_id: "M7lc1UVf-VE" },
    { level: "level-up", title: "Agent Konten: 10 Caption Promosi dalam 1 Menit", duration: "22 menit", video_id: "M7lc1UVf-VE" },
    { level: "level-up", title: "Agent Objeksi: Jawab Mahal, Nanti Dulu, Pikir-pikir", duration: "30 menit", video_id: "M7lc1UVf-VE" },
    { level: "level-up", title: "Hubungin Agent ke WhatsApp & Email", duration: "24 menit", video_id: "M7lc1UVf-VE" },
    { level: "pro", title: "Agent Rekap: Laporan Closing Otomatis", duration: "20 menit", video_id: "M7lc1UVf-VE" },
    { level: "pro", title: "Cara Ngatur Banyak Agent Biar Ga Kacau", duration: "27 menit", video_id: "M7lc1UVf-VE" },
  ];

  const PRODUCT_KEY = "build-your-own-personalized-agent";

  // ---------------- Template follow-up WA (admin leads §8) ----------------
  // {nama} = nama lead, {nama_lo} = nama lo/team (ganti di sini)
  const FOLLOWUP_TEMPLATES = [
    {
      label: "Follow-up 1 · Pertama kenalan",
      text:
        "Halo {nama}! 👋 Makasih udah daftar di halaman course Xinde Labs.\n\nSekalian ngenalin: course ini ngajarin lo bikin AI Agent pribadi — yang follow-up calon client otomatis, riset prospek ±30 detik, dan jawab objeksi “mahal / nanti dulu / pikir-pikir”. Tanpa coding.\n\nBoleh gue tanya dulu, bidang sales lo apa ya? Biar gue kasih contoh yang paling nyambung. 😊",
    },
    {
      label: "Follow-up 2 · Ngejual benefit",
      text:
        "Halo {nama}, masih gue follow — hari ini lagi apa nih? 😄\n\nSekadar remind, ini yang lo dapet dari course-nya:\n• 9 modul video step-by-step (beginner → pro)\n• Bot tanya-jawab khusus sales\n• Prompt library yang tinggal copy-paste\n• Komunitas Discord + update use-case tiap bulan\n\nRata-rata member mulai bangun agent pertamanya malam pertama. Ada yang mau ditanyain dulu sebelum daftar?",
    },
    {
      label: "Follow-up 3 · Social proof",
      text:
        "Halo {nama}, ini update dari Xinde Labs 👀\n\nBeberapa member baru cerita: follow-up 40 calon client yang biasanya makan seharian, sekarang kelar 5 menit karena agent yang handle. Ada juga yang bilang setup pertama selesai 1 malam sambil nonton modul — padahal dia bukan IT.\n\nKalau mereka bisa, lo juga bisa. Mau mulai dari paket mana, Tahunan atau Lifetime?",
    },
    {
      label: "Follow-up 4 · Dorongan terbatas",
      text:
        "Halo {nama}, kabar baik! 🎁\n\nBuat yang masih mikir, masih ada garansi uang kembali 7 hari — jadi nggak ada risiko. Coba dulu 7 hari, nggak cocok? Full refund, tanpa drama.\n\nHarga mulai Rp 599.000/tahun (≈ Rp 1.600/hari — lebih murah dari kopi). Lifetime Rp 999.000, sekali bayar, akses selamanya + update use-case gratis. Mau gue bantu proses daftarnya?",
    },
    {
      label: "Follow-up 5 · Closing terakhir",
      text:
        "Halo {nama}, ini follow-up terakhir dari gue 🙏\n\nSejujurnya gue nggak mau maksa, tapi kesempatan dapet akses ini nggak bakal buka terus-terusan. Setiap minggu slot keanggotaan di-batasin biar komunitasnya tetap nyaman.\n\nKalau hari ini dirasa belum waktunya, nggak apa-apa. Kapan-kapan butuh bantuan soal AI buat sales, chat gue aja ya. Semoga harinya lancar! 😊",
    },
  ];

  return {
    PIXEL_ID,
    N8N_WEBHOOK,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    VIDEO_YOUTUBE_ID,
    PRICES,
    DEFAULT_CONTENT,
    MODULES,
    PRODUCT_KEY,
    FOLLOWUP_TEMPLATES,
    supabaseConfigured() {
      return !this.SUPABASE_URL.includes("XXXX") && !this.SUPABASE_ANON_KEY.startsWith("eyJ...");
    },
  };
})();
