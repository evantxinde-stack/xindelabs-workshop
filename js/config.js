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

  // ---------------- Landing utama: default sections (fallback CMS) ----------------
  // Sama persis dengan desain index.html saat ini — dipakai kalau site_content
  // belum diisi, dan jadi titik awal saat bikin landing baru di admin.
  const DEFAULT_LANDING = {
    meta: {
      slug: "utama",
      title: "Landing Utama",
      page_title: "Bangun Hermes Agent Lo — Asisten AI Sesuai Kebutuhan Lo, Tanpa Coding",
      accent: "#00ff88",
      is_custom: false,
      nav: {
        logo: "xindelabs",
        logo_dot: ".",
        home_href: "index.html",
        links: [
          { label: "Course", href: "#modules" },
          { label: "Yang Didapat", href: "#benefits" },
          { label: "Harga", href: "#pricing" },
          { label: "Untuk Tim", href: "karyawan.html" },
          { label: "Login", href: "login.html" },
        ],
        cta: { text: "Daftar Course", href: "checkout.html" },
      },
      footer: {
        copy: "© 2026 Xinde Labs · Bangun Hermes Agent — Asisten Digital untuk Sales Person",
        links: [
          { label: "Course", href: "#modules" },
          { label: "Komunitas", href: "#komunitas" },
          { label: "Harga", href: "#pricing" },
          { label: "Untuk Tim", href: "karyawan.html" },
          { label: "Login", href: "login.html" },
          { label: "Instagram", href: "https://instagram.com/xindelabs.id" },
        ],
      },
    },
    sections: [
      {
        id: "hero_main", type: "hero", anchor: "hero",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "bangun AI agent lo · tanpa coding",
          title: "Bangun Hermes Agent Lo — <span class=\"hl\">Asisten AI Sesuai Kebutuhan Lo, Jalan 24/7</span>",
          subtitle:
            "Bukan cuma ChatGPT. Lo bakal belajar fundamental cara bangun AI agent yang kerjain tugas rutin lo — follow-up sales, bikin konten, jawab customer, sampai rekap laporan — dan sesuaikan dengan kebutuhan lo sendiri. Step-by-step, tanpa coding.",
          cta_text: "Daftar Course", cta_link: "checkout.html",
          cta2_text: "Liat gimana caranya", cta2_link: "#video",
          anchor: "mulai <b>Rp 599.000/tahun</b> · ≈Rp 1.600/hari · akses 24/7 dari HP",
          show_timer: true,
        },
      },
      {
        id: "video_main", type: "video_row", anchor: "video",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "liat agentnya jalan",
          heading: "2 menit buat mikir ulang.",
          video_id: VIDEO_YOUTUBE_ID,
          profile_name: "Xinde Labs",
          profile_role: "AI agent for every need",
          caption: "Hermes Agent jalan sendiri — follow-up, konten, jawab customer: semua sesuai kebutuhan lo",
          points:
            "agent jalan 24/7: follow-up, balas, konten, rekap\ndari input sampai output — satu workflow utuh\nloop engineering: bikin agent makin akurat\nsesuai kebutuhan lo — sales, bisnis, admin, konten",
        },
      },
      {
        id: "cards_main", type: "cards", anchor: "usecase",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "5 contoh hermes agent",
          heading: "Hermes Agent bisa dibikin buat kebutuhan apa aja.",
          lead: "Tiap agent dijalankan sebagai proyek utama sepanjang course — lo pilih yang paling nyambung sama kerjaan lo. Sisanya tetap jadi wawasan yang bisa lo adopsi kapan aja.",
          items: [
            { name: "Hermes Sales", who: "tim sales · agency · jualan online", prob: "Follow-up leads, riset prospek, sampai closing — biar ga ada calon customer yang \"nggantung\", konsistensinya tetap terjaga." },
            { name: "Hermes Konten", who: "content creator · personal branding · UMKM", prob: "Dari ide mentah jadi draft konten & caption rutin untuk semua platform — tanpa mikir tiap hari mau posting apa." },
            { name: "Hermes Customer Care", who: "online shop · jasa · retensi customer", prob: "Pertanyaan & komentar customer dibales otomatis 24/7, jawabannya konsisten — ga ada yang kelewat gara-gara telat respons." },
            { name: "Hermes Ops", who: "owner · admin · tim kecil", prob: "Rekap laporan bulanan, urutin data, jadwal, pesan berulang — tugas remeh-remeh kehabisan di agent, lo fokus ke keputusan besar." },
            { name: "Hermes Custom", who: "siapa aja · sesuai kebutuhan lo", prob: "Fundamental yang sama lo arahkan ke kebutuhan spesifik lo — dari agent surat-menyurat, research, sampai sistem bantu keputusan sendiri." },
          ],
        },
      },
      {
        id: "stats_main", type: "stats", anchor: "stats",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "bukan klaim kosong",
          heading: "Kenapa agent, bukan cuma ChatGPT.",
          disclaimer: "* contoh skenario pemakaian — hasil tiap orang beda, tergantung konsistensi & follow-up lo.",
          items: [
            { n: "24/7", l: "Agent jalan terus — follow-up, balas, konten, rekap: ga nunggu lo online" },
            { n: "10x", l: "Lebih banyak pekerjaan kehabisan per hari, tanpa lo ketik ulang" },
            { n: "30 menit", l: "Waktu bikin agent pertama lo, step-by-step tanpa coding" },
            { n: "10", l: "Modul video (9 inti + 1 bonus) — dari mindset sampai algoritma" },
          ],
        },
      },
      {
        id: "terminal_main", type: "terminal", anchor: "modules",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "isi course-nya",
          heading: "Yang bakal lo bangun.",
          bar_title: "hermes-agent — modules",
          cmd: "ls modules/ --published",
          foot: "10 modul video (9 inti + 1 bonus) · beginner → pro · <b>terakhir update: 13 Agu</b> · <b>modul baru tiap bulan</b>",
          items: [
            { level: "beginner", title: "Mindset Using AI Agent: Dari Ngejar Semua Leads Sendiri ke Jadi Pengarah" },
            { level: "beginner", title: "Intro ke AI Agent + Kenalan 5 Jenis Hermes Agent" },
            { level: "beginner", title: "Bahasa Agent: Cara \"Ngomong\" ke AI Biar Nurut" },
            { level: "level-up", title: "Blueprint 5 Tahap + Kerangka Frontend-Backend-Database" },
            { level: "level-up", title: "Build Your First Smart Worker — Demo End-to-End + Agent Pertama Lo" },
            { level: "level-up", title: "Loop Engineering: Bikin Agent Makin Akurat" },
            { level: "level-up", title: "Hubungin Hermes Agent ke Channel Kerja Nyata Lo (WA & Email)" },
            { level: "pro", title: "Uji & Perbaiki: Kalau Agent Salah Jawab" },
            { level: "pro", title: "Jaga Hermes Agent Lo Biar Ga Kacau (+ Rencana 30 Hari)" },
            { level: "bonus", title: "Algoritma by Design: Bikin Agent Lo Bisa Ambil Keputusan Bercabang" },
          ],
        },
      },
      {
        id: "rows_main", type: "rows", anchor: "benefits",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "apa yang lo dapet",
          heading: "Tujuh hal. Semuanya kepake.",
          items: [
            { word: "Video Course", desc: "10 modul step-by-step (9 inti + 1 bonus), mobile-friendly, bisa diulang kapan aja. Lo liat prosesnya dari nol sampe jadi." },
            { word: "AI Bot Tanya Jawab", desc: "Bingung di tengah jalan? Tanya bot, jawabannya dikasih dalam konteks kebutuhan & proyek lo — bukan teori umum." },
            { word: "Kumpulan Prompt", desc: "Prompt siap pakai: follow-up, riset, konten, sampai customer care — ganti konteks lo, langsung jalan." },
            { word: "Komunitas Discord", desc: "Live Q&A + update konten rutin bareng member lain yang sefrekuensi." },
            { word: "AI News", desc: "Update tools AI terbaru yang relevan sama kebutuhan & pekerjaan lo — tanpa lo mantau sendiri." },
            { word: "Use-case Update", desc: "Contoh agent baru tiap bulan. Biar lo ga ketinggalan dan terus naik level." },
            { word: "Rencana Aksi Tiap Modul", desc: "Bukan cuma nonton lalu lupa. Tiap modul ditutup dengan langkah konkret yang harus langsung lo kerjain di kerjaan lo hari itu juga." },
          ],
        },
      },
      {
        id: "testimonials_main", type: "testimonials", anchor: "testimonials",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "kata member",
          heading: "Bukan kami yang ngomong.",
          note: "ditampilin apa adanya — isi kursus & nama diubah demi privasi.",
          items: [
            { quote: "Bikin agent buat rekap invoice & jadwal tim, jalan otomatis di WhatsApp. Sekarang ga ada inbox yang kelewat. Saya bukan IT dan tetep bisa.", name: "pemilik jasa, Semarang" },
            { quote: "Follow-up WA 40 calon client yang tadinya makan seharian, sekarang cuma 5 menit. Agent yang jawab, saya yang review.", name: "agen properti, Surabaya" },
            { quote: "Caption buat 6 platform yang tadinya mikir seharian, sekarang kelar 1 jam. Saya tinggal review & posting.", name: "content creator" },
          ],
        },
      },
      {
        id: "split_main", type: "split", anchor: "founder",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "dari latar non-IT · yang bikin sistem sendiri",
          heading: "Kenapa gw bikin ini.",
          image: "assets/founder.jpg",
          alt: "Founder Xinde Labs",
          paragraphs: [
            { text: "Dulu gw juga sales. Bukan dari IT, bukan dari coding — dari lapangan. Ngejar target, follow-up calon client satu-satu, catat leads di buku note, dan jujur aja: banyak yang bocor. Yang gw catat, yang gw follow, ya itu doang yang closing. Sisanya? Hilang." },
            { text: "Gw orangnya penasaran sama teknologi. Sering mikir: kenapa kerjaan sales masih manual banget? Gw riset, gw coba, gw gagal, gw coba lagi — nyari cara biar kerjaan sales bisa lebih efektif lewat digital." },
            { text: "Terus AI muncul. Dan buat gw — yang ga ngerti koding, bahkan bisa dibilang buta teknologi — ini jawabannya. Follow-up, riset calon client, bikin konten, ngatur pipeline: semua bisa dijalanin sistem. Tanpa gw harus jadi programmer." },
            { text: "Course ini gw bikin dari sudut pandang pemakai, bukan sudut pandang engineer. Step-by-step, no-coding, pake tools yang lo udah punya: HP, WhatsApp, Google Sheets. Gw ga jual teori — gw kasih sistem yang gw pake sendiri. Waktu mulai, proyek gw soal sales, tapi pelajaran fundamentalnya bisa lo pakai buat kebutuhan apa pun: follow-up, konten, customer care, sampai rekap laporan. Makanya gw sengaja ngajarin fundamentalnya dulu — bukan resep kaku. Sekali lo paham cara ngomong ke AI, dapet respons yang lo mau, dan bikin agent makin akurat, lo bebas bikin versi lo sendiri untuk kasus lo sendiri. Gw kasih nama sistem ini <b>Hermes Agent</b> — dan course ini gw bikin biar lo bisa bangun versi lo, step by step. Kalau gw bisa, lo pasti bisa." },
          ],
        },
      },
      {
        id: "pricing_main", type: "pricing", anchor: "pricing",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "pricing",
          heading: "Pilih cara lo mulai.",
          badge: "TERBAIK · SELAMANYA",
          yearly_tier: "Tahunan", yearly_label: "Akses 1 tahun", yearly_price: PRICES.yearly.harga,
          yearly_anchor: "≈ Rp 1.600/hari — lebih murah dari segelas kopi", yearly_link: "checkout.html?tier=yearly",
          yearly_features: [
            { text: "Semua 10 modul video (9 inti + 1 bonus)" },
            { text: "AI Bot Tanya Jawab" },
            { text: "Prompt library + komunitas Discord" },
            { text: "AI News + use-case update" },
          ],
          lifetime_tier: "Lifetime · sekali bayar", lifetime_label: "Akses selamanya", lifetime_price: PRICES.lifetime.harga,
          lifetime_anchor: "Ga perlu mikir renew — update use-case terus masuk", lifetime_link: "checkout.html?tier=lifetime",
          lifetime_features: [
            { text: "Semua fitur Tahunan" },
            { text: "Akses permanen, tanpa renew" },
            { text: "Semua use-case update masa depan gratis" },
            { text: "Prioritas jawaban bot + badge lifetime" },
          ],
        },
      },
      {
        id: "voucher_main", type: "voucher", anchor: "voucher",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "", heading: "",
          title: "Build Your Own Agent — Voucher Diskon",
          note: "Masukkan kode voucher di halaman checkout untuk dapat harga diskon.",
          items: [
            { code: "EARLYBIRD", slots: "5 orang", orig: "<s>Rp 599.000</s>", disc: "Rp 199.000", hot: true, full: false, life: false },
            { code: "FASE01", slots: "10 orang", orig: "<s>Rp 599.000</s>", disc: "Rp 299.000", hot: false, full: false, life: false },
            { code: "FASE02", slots: "20 orang", orig: "<s>Rp 599.000</s>", disc: "Rp 399.000", hot: false, full: false, life: false },
            { code: "FASE03", slots: "30 orang", orig: "<s>Rp 599.000</s>", disc: "Rp 499.000", hot: false, full: false, life: false },
            { code: "FULL PRICE", slots: "—", orig: "", disc: "Rp 599.000", hot: false, full: true, life: false },
            { code: "LIFETIME50", slots: "2 orang", orig: "<s>Rp 999.000</s>", disc: "Rp 599.000", hot: false, full: false, life: true },
          ],
        },
      },
      {
        id: "faq_main", type: "faq", anchor: "faq",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "faq",
          heading: "Pertanyaan yang sering masuk.",
          items: [
            { q: "Saya belum pernah ngoding. Bisa ikut?", a: "Bisa. Course ini memang dibuat untuk sales person non-teknis. Semua pakai tools no-code (ChatGPT/Claude, Google Sheets, WhatsApp, n8n) yang tinggal disetel lewat panduan langkah demi langkah." },
            { q: "Apa bedanya dengan ChatGPT biasa?", a: "ChatGPT cuma bisa dipakai kalau lo buka chat-nya. Hermes Agent yang lo bangun di course ini jalan terus tanpa lo ketik ulang: follow-up otomatis, riset calon client, sampai laporan closing — 24 jam, tanpa capek." },
            { q: "Kenapa bukan pakai OpenClaw / agent open-source yang lagi rame dibahas?", a: "OpenClaw itu powerful tapi jalan sendiri (self-hosted) via terminal, butuh instalasi teknis, dan kalau salah setting ada risiko akses ke file & akun pribadi lo kebuka lebar. Course ini fokus ke Hermes Agent karena setup-nya no-code, tinggal disetel dari HP, dan akses yang dikasih ke agent jelas + terbatas — cocok buat lo yang belum terbiasa ngatur keamanan sistem sendiri. Tujuan lo bukan \"punya agent paling canggih secara teknis,\" tapi \"punya agent yang beneran kepake buat kerjaan sehari-hari.\"" },
            { q: "Ini khusus untuk sales tertentu?", a: "Utamanya agen asuransi, agen properti, sales produk kesehatan/klinik, dan freelancer, tapi framework-nya dipakai semua jenis sales — lo pilih 1 dari 5 jenis Hermes Agent yang paling nyambung sama industri yang lo jual." },
            { q: "Saya harus ngikutin persis cara lo setup Hermes Agent-nya?", a: "Ga harus. Course ini sengaja ngajarin fundamental-nya (kerangka Frontend-Backend-Database), bukan resep kaku \"ikutin klik A-B-C.\" Sekali lo paham polanya, lo bebas pakai tools apapun yang paling nyaman buat gaya kerja lo — yang penting pola 3 lapisannya tetap ada." },
            { q: "Instalasi teknisnya susah ga?", a: "Sesi utama fokus ke pemahaman lewat demo, bukan nonton proses klik-klik instalasi. Instalasi teknis Hermes Agent lo ikuti sendiri lewat tutorial teks step-by-step yang disediakan terpisah, dengan kecepatan lo sendiri." },
            { q: "Paket Tahunan vs Lifetime bedanya apa?", a: "Tahunan Rp 599.000: akses semua konten 1 tahun. Lifetime Rp 999.000: bayar sekali, akses selamanya + dapat update use-case baru tanpa biaya tambahan." },
            { q: "Kalau saya tidak puas, ada refund?", a: "Ada garansi uang kembali 7 hari. Kalau masih belum yakin course ini cocok dalam 7 hari pertama, kirim bukti ke WhatsApp kami dan kami refund penuh tanpa drama." },
            { q: "Bagaimana cara bayarnya?", a: "Bayar via Mayar (transfer bank, QRIS, atau e-wallet). Setelah pembayaran, link course + invite Discord dikirim otomatis ke email lo. Cek juga folder spam." },
            { q: "Berapa lama saya butuh setiap hari?", a: "Cukup 30–45 menit per hari selama 1–2 minggu. Tiap modul maksimal 30 menit, dan bisa diulang kapan saja." },
            { q: "Apakah ada komunitasnya?", a: "Ada. Setiap member masuk Discord Xinde Labs — tempat tanya-jawab, sharing prompt, dan sesi use-case update bareng member lain." },
          ],
        },
      },
      {
        id: "comm_main", type: "comm", anchor: "komunitas",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "gratis · buat semua sales",
          title: "Join Komunitas <span class=\"hl\">AI Connect Circle</span> GRATIS!",
          lead: "Forum sales person Indonesia yang lagi naik level pakai AI — tanya-jawab, sharing prompt, diskusi use-case, dan update tools terbaru tiap minggu.",
          points: "gratis selamanya · tanpa kartu kredit\nshare & curi prompt terbaik dari sesama sales\nupdate AI tools buat closing tiap minggu",
          btn_text: "Gabung Gratis",
          success_title: "Selamat datang di Circle! 🎉",
          success_text: "Makasih <b>{nama}</b>. Link invite <b>AI Connect Circle</b> dikirim ke WhatsApp & email lo — cek juga folder spam.",
        },
      },
      {
        id: "cta_main", type: "cta", anchor: "closing",
        style: { pad_top: "", pad_bottom: "", bg_color: "", text_color: "", accent: "", max_width: "", radius: "", align: "", hide_mobile: false, hide_desktop: false },
        data: {
          eyebrow: "",
          title: "Berhenti kerjain semuanya sendiri.<br /><span class=\"hl\">Hermes Agent lo yang follow-up, riset, dan closing.</span>",
          subtitle: "",
          btn_text: "Daftar Course",
          btn_link: "checkout.html",
          anchor: "Rp 599.000/tahun · <b>Rp 999.000 lifetime</b> · garansi 7 hari",
        },
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
    DEFAULT_LANDING,
    MODULES,
    PRODUCT_KEY,
    FOLLOWUP_TEMPLATES,
    supabaseConfigured() {
      return !this.SUPABASE_URL.includes("XXXX") && !this.SUPABASE_ANON_KEY.startsWith("eyJ...");
    },
  };
})();
