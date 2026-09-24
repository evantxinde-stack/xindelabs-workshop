/* ============================================================
   LP RENDER — shared renderer untuk landing page (section-based)
   Dipakai oleh: page.html, index.html (produksi) & admin.html
   (live preview). Satu sumber kebenaran untuk:
     - SECTION_TYPES (skema field editor)
     - renderSection / renderSections / renderNav / renderFooter
     - normalizeLegacy (konversi konten lama → sections)
   ============================================================ */
window.LPRender = (function () {
  var cfg = window.XINDE;

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function youtubeId(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    var m = /(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(raw);
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{6,}$/.test(raw)) return raw;
    return '';
  }

  // "angka|label\n..." → [{n,l}] ATAU terima array langsung
  function parseStats(input) {
    if (Array.isArray(input)) {
      return input.map(function (s2) {
        if (typeof s2 === 'string') return trimStat(s2);
        return { n: s2 && s2.n, l: s2 && s2.l };
      });
    }
    return String(input || '').split(/\r?\n/).map(trimStat).filter(function (s) { return s.n; });
  }
  function trimStat(line) {
    var parts = String(line || '').split('|');
    return { n: (parts[0] || '').trim(), l: (parts[1] || '').trim() };
  }

  // ---------- Gaya visual per section (semua tipe bisa pakai) ----------
  var STYLE_FIELDS = [
    { key: 'pad_top', label: 'Padding Atas (px)', type: 'number' },
    { key: 'pad_bottom', label: 'Padding Bawah (px)', type: 'number' },
    { key: 'bg_color', label: 'Warna Background', type: 'color' },
    { key: 'text_color', label: 'Warna Teks', type: 'color' },
    { key: 'accent', label: 'Warna Aksen (override)', type: 'color' },
    { key: 'max_width', label: 'Max Lebar Konten (px)', type: 'number' },
    { key: 'radius', label: 'Radius Sudut (px)', type: 'number' },
    { key: 'align', label: 'Perataan', type: 'select', options: ['', 'left', 'center', 'right'] },
    { key: 'hide_mobile', label: 'Sembunyikan di HP', type: 'toggle' },
    { key: 'hide_desktop', label: 'Sembunyikan di Desktop', type: 'toggle' }
  ];

  function defaultStyles() {
    var out = {};
    STYLE_FIELDS.forEach(function (f) {
      out[f.key] = (f.type === 'toggle') ? false : '';
    });
    return out;
  }

  // Inline style dari s.style (whitelist, bukan raw CSS)
  function styleAttr(s) {
    var st = (s && s.style) || {};
    var parts = [];
    if (st.pad_top !== '' && st.pad_top != null) parts.push('padding-top:' + Number(st.pad_top) + 'px');
    if (st.pad_bottom !== '' && st.pad_bottom != null) parts.push('padding-bottom:' + Number(st.pad_bottom) + 'px');
    if (st.bg_color) parts.push('background-color:' + esc(st.bg_color));
    if (st.text_color) parts.push('color:' + esc(st.text_color));
    if (st.radius !== '' && st.radius != null) parts.push('border-radius:' + Number(st.radius) + 'px');
    if (st.accent) parts.push('--green:' + esc(st.accent));
    if (st.align) parts.push('text-align:' + esc(st.align));
    return parts.join(';');
  }

  function sectionCls(s, base) {
    var st = (s && s.style) || {};
    var cls = base || '';
    if (st.hide_mobile) cls += ' hide-m';
    if (st.hide_desktop) cls += ' hide-d';
    return cls.trim();
  }

  // Wrap semantik: <section class="section"><div class="wrap" style="..."></section>
  function openWrap(s, maxW) {
    var inner = '';
    if (maxW) { inner += 'style="max-width:' + Number(maxW) + 'px"'; }
    var a = s.anchor ? ' id="' + esc(s.anchor) + '"' : '';
    var d = s.id ? ' data-sec="' + esc(s.id) + '"' : '';
    return '<section class="' + sectionCls(s, 'section') + '"' + a + d + ' style="' + styleAttr(s) + '"><div class="wrap" ' + inner + '>';
  }
  function closeWrap() { return '</div></section>'; }

  // ---------- Skema field per tipe ----------
  // type field: text | textarea | number | select | color | url | toggle | list
  // list: { key, label, addLabel, itemLabel, sub: [fields] }
  var TYPES = {
    hero: {
      label: 'Hero', icon: '🏠',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Judul (boleh HTML)', type: 'textarea' },
        { key: 'subtitle', label: 'Subjudul', type: 'textarea' },
        { key: 'cta_text', label: 'Text Tombol Utama', type: 'text' },
        { key: 'cta_link', label: 'Link Tombol Utama', type: 'url' },
        { key: 'cta2_text', label: 'Text Tombol Kedua', type: 'text' },
        { key: 'cta2_link', label: 'Link Tombol Kedua', type: 'url' },
        { key: 'anchor', label: 'Baris Harga/Badge (boleh HTML)', type: 'textarea' },
        { key: 'show_timer', label: 'Tampilkan Countdown Inline', type: 'toggle' }
      ]
    },
    text: {
      label: 'Teks', icon: '✍️',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'body', label: 'Isi (boleh HTML)', type: 'textarea' },
        { key: 'align', label: 'Perataan', type: 'select', options: ['left', 'center', 'right'] }
      ]
    },
    image: {
      label: 'Gambar', icon: '🖼️',
      fields: [
        { key: 'src', label: 'URL Gambar', type: 'url' },
        { key: 'alt', label: 'Alt Text', type: 'text' },
        { key: 'caption', label: 'Caption', type: 'text' },
        { key: 'max_width', label: 'Max Width (px)', type: 'number' },
        { key: 'radius', label: 'Radius (px)', type: 'number' }
      ]
    },
    youtube: {
      label: 'Video YouTube', icon: '▶️',
      fields: [
        { key: 'video_id', label: 'YouTube Link atau Video ID', type: 'text', placeholder: 'cth: https://youtu.be/abc123 atau abc123' },
        { key: 'title', label: 'Judul Video', type: 'text' },
        { key: 'caption', label: 'Caption', type: 'text' }
      ]
    },
    video_row: {
      label: 'Video + Poin', icon: '🎬',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'video_id', label: 'YouTube Link atau ID', type: 'text' },
        { key: 'profile_name', label: 'Nama Profil', type: 'text' },
        { key: 'profile_role', label: 'Role Profil', type: 'text' },
        { key: 'caption', label: 'Caption Video', type: 'text' },
        { key: 'points', label: 'Poin (satu per baris)', type: 'textarea' }
      ]
    },
    cta: {
      label: 'CTA / Closing', icon: '🎯',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Judul (boleh HTML)', type: 'textarea' },
        { key: 'subtitle', label: 'Subjudul', type: 'textarea' },
        { key: 'btn_text', label: 'Text Tombol', type: 'text' },
        { key: 'btn_link', label: 'Link Tombol', type: 'url' },
        { key: 'anchor', label: 'Baris Harga (boleh HTML)', type: 'textarea' }
      ]
    },
    pricing: {
      label: 'Pricing', icon: '💰',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'badge', label: 'Badge Kartu Lifetime', type: 'text' },
        { key: 'yearly_tier', label: 'Tier Tahunan (mono)', type: 'text' },
        { key: 'yearly_label', label: 'Label Akses Tahunan', type: 'text' },
        { key: 'yearly_price', label: 'Harga Tahunan (Rp)', type: 'number' },
        { key: 'yearly_anchor', label: 'Anchor Tahunan', type: 'text' },
        { key: 'yearly_link', label: 'Link Tombol Tahunan', type: 'url' },
        { key: 'yearly_features', label: 'Fitur Tahunan', type: 'list', addLabel: '+ Fitur', sub: [{ key: 'text', label: 'Fitur', type: 'text' }] },
        { key: 'lifetime_tier', label: 'Tier Lifetime (mono)', type: 'text' },
        { key: 'lifetime_label', label: 'Label Akses Lifetime', type: 'text' },
        { key: 'lifetime_price', label: 'Harga Lifetime (Rp)', type: 'number' },
        { key: 'lifetime_anchor', label: 'Anchor Lifetime', type: 'text' },
        { key: 'lifetime_link', label: 'Link Tombol Lifetime', type: 'url' },
        { key: 'lifetime_features', label: 'Fitur Lifetime', type: 'list', addLabel: '+ Fitur', sub: [{ key: 'text', label: 'Fitur', type: 'text' }] }
      ]
    },
    stats: {
      label: 'Statistik', icon: '📊',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'items', label: 'Statistik', type: 'list', addLabel: '+ Statistik', sub: [{ key: 'n', label: 'Angka', type: 'text' }, { key: 'l', label: 'Label', type: 'text' }] },
        { key: 'disclaimer', label: 'Disclaimer', type: 'text' }
      ]
    },
    terminal: {
      label: 'Terminal Modul', icon: '⌨️',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'bar_title', label: 'Judul Terminal Bar', type: 'text' },
        { key: 'cmd', label: 'Perintah Terminal', type: 'text' },
        { key: 'items', label: 'Modul', type: 'list', addLabel: '+ Modul', sub: [{ key: 'level', label: 'Level (beginner/level-up/pro/bonus)', type: 'text' }, { key: 'title', label: 'Judul Modul', type: 'text' }] },
        { key: 'foot', label: 'Baris Footer Terminal (boleh HTML)', type: 'textarea' }
      ]
    },
    rows: {
      label: 'List Manfaat', icon: '📋',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'items', label: 'Baris', type: 'list', addLabel: '+ Baris', sub: [{ key: 'word', label: 'Judul Row', type: 'text' }, { key: 'desc', label: 'Deskripsi', type: 'textarea' }] }
      ]
    },
    cards: {
      label: 'Grid Kartu', icon: '🗂️',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'lead', label: 'Lead Paragraph', type: 'textarea' },
        { key: 'items', label: 'Kartu', type: 'list', addLabel: '+ Kartu', sub: [{ key: 'name', label: 'Nama', type: 'text' }, { key: 'who', label: 'Untuk Siapa', type: 'text' }, { key: 'prob', label: 'Deskripsi', type: 'textarea' }] }
      ]
    },
    testimonials: {
      label: 'Testimoni (multi)', icon: '💬',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'items', label: 'Testimoni', type: 'list', addLabel: '+ Testimoni', sub: [{ key: 'quote', label: 'Kutipan', type: 'textarea' }, { key: 'name', label: 'Nama / Peran', type: 'text' }] },
        { key: 'note', label: 'Catatan Bawah', type: 'text' }
      ]
    },
    split: {
      label: 'Foto + Teks (Founder)', icon: '👤',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'image', label: 'URL Foto', type: 'url' },
        { key: 'alt', label: 'Alt Foto', type: 'text' },
        { key: 'paragraphs', label: 'Paragraf', type: 'list', addLabel: '+ Paragraf', sub: [{ key: 'text', label: 'Paragraf (boleh HTML)', type: 'textarea' }] }
      ]
    },
    voucher: {
      label: 'Tabel Voucher', icon: '🏷️',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'title', label: 'Judul Tabel', type: 'text' },
        { key: 'items', label: 'Baris Voucher', type: 'list', addLabel: '+ Baris', sub: [
          { key: 'code', label: 'Kode', type: 'text' },
          { key: 'slots', label: 'Kuota', type: 'text' },
          { key: 'orig', label: 'Harga Asli', type: 'text' },
          { key: 'disc', label: 'Harga Diskon', type: 'text' },
          { key: 'hot', label: 'Highlight', type: 'toggle' },
          { key: 'full', label: 'Baris Full Price', type: 'toggle' },
          { key: 'life', label: 'Baris Lifetime', type: 'toggle' }
        ] },
        { key: 'note', label: 'Catatan Bawah', type: 'text' }
      ]
    },
    faq: {
      label: 'FAQ', icon: '❓',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading (boleh HTML)', type: 'textarea' },
        { key: 'items', label: 'FAQ', type: 'list', addLabel: '+ FAQ', sub: [{ key: 'q', label: 'Pertanyaan', type: 'text' }, { key: 'a', label: 'Jawaban', type: 'textarea' }] }
      ]
    },
    comm: {
      label: 'Form Komunitas', icon: '✉️',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Judul (boleh HTML)', type: 'textarea' },
        { key: 'lead', label: 'Lead Paragraph', type: 'textarea' },
        { key: 'points', label: 'Poin (satu per baris)', type: 'textarea' },
        { key: 'btn_text', label: 'Text Tombol', type: 'text' },
        { key: 'success_title', label: 'Judul Sukses', type: 'text' },
        { key: 'success_text', label: 'Teks Sukses', type: 'textarea' }
      ]
    },
    divider: { label: 'Pemisah', icon: '➖', fields: [] },
    embed: {
      label: 'Embed (HTML bebas)', icon: '🧩',
      fields: [
        { key: 'html', label: 'HTML / iframe / script', type: 'textarea' }
      ]
    }
  };

  // ---------- Default data per tipe ----------
  var DEFAULTS = {
    hero: {
      eyebrow: 'untuk sales person · tanpa coding',
      title: 'Bangun Karyawan Super Pintar — <span class="hl">Bantu semua kerjaan lo 24/7 No Baper</span>',
      subtitle: 'Bukan cuma ChatGPT. Lo bakal punya agent yang follow-up calon client otomatis, riset prospek dalam 30 detik, bikin 10 caption promosi dalam 1 menit, dan jawab objeksi "mahal", "nanti dulu", "pikir-pikir". <b>Tanpa coding.</b>',
      cta_text: 'Daftar Course', cta_link: 'checkout.html',
      cta2_text: 'Liat gimana caranya', cta2_link: '#video',
      anchor: 'mulai <b>Rp 599.000/tahun</b> · ≈Rp 1.600/hari · akses 24/7 dari HP',
      show_timer: true
    },
    text: { eyebrow: '', heading: '', body: 'Tulis konten lo di sini.', align: 'left' },
    image: { src: '', alt: '', caption: '', max_width: '', radius: '' },
    youtube: { video_id: '', title: '', caption: '' },
    video_row: { eyebrow: 'liat agentnya jalan', heading: '2 menit buat mikir ulang.', video_id: 'M7lc1UVf-VE', profile_name: 'Xinde Labs', profile_role: 'AI agent for every need', caption: '', points: 'agent jalan 24/7: follow-up, balas, konten, rekap\ndari input sampai output — satu workflow utuh\nloop engineering: bikin agent makin akurat\nsesuai kebutuhan lo — sales, bisnis, admin, konten' },
    cta: { eyebrow: '', title: 'Siap mulai?', subtitle: 'Daftar sekarang, garansi 7 hari.', btn_text: 'Daftar Course', btn_link: 'checkout.html', anchor: '' },
    pricing: {
      eyebrow: 'pricing', heading: 'Pilih cara lo mulai.',
      badge: 'TERBAIK · SELAMANYA',
      yearly_tier: 'Tahunan', yearly_label: 'Akses 1 tahun', yearly_price: 599000, yearly_anchor: '≈ Rp 1.600/hari — lebih murah dari segelas kopi', yearly_link: 'checkout.html',
      yearly_features: [
        { text: 'Semua 10 modul video (9 inti + 1 bonus)' },
        { text: 'AI Bot Tanya Jawab' },
        { text: 'Prompt library + komunitas Discord' },
        { text: 'AI News + use-case update' }
      ],
      lifetime_tier: 'Lifetime · sekali bayar', lifetime_label: 'Akses selamanya', lifetime_price: 999000, lifetime_anchor: 'Ga perlu mikir renew — update use-case terus masuk', lifetime_link: 'checkout.html',
      lifetime_features: [
        { text: 'Semua fitur Tahunan' },
        { text: 'Akses permanen, tanpa renew' },
        { text: 'Semua use-case update masa depan gratis' },
        { text: 'Prioritas jawaban bot + badge lifetime' }
      ]
    },
    stats: { eyebrow: 'bukan klaim kosong', heading: 'Kenapa agent, bukan cuma ChatGPT.', disclaimer: '', items: [
      { n: '24/7', l: 'Agent jalan terus — follow-up, balas, konten, rekap: ga nunggu lo online' },
      { n: '10x', l: 'Lebih banyak pekerjaan kehabisan per hari, tanpa lo ketik ulang' },
      { n: '30 menit', l: 'Waktu bikin agent pertama lo, step-by-step tanpa coding' },
      { n: '10', l: 'Modul video (9 inti + 1 bonus) — dari mindset sampai algoritma' }
    ] },
    terminal: { eyebrow: 'isi course-nya', heading: 'Yang bakal lo bangun.', bar_title: 'hermes-agent — modules', cmd: 'ls modules/ --published', foot: '10 modul video (9 inti + 1 bonus) · beginner → pro · <b>terakhir update: 13 Agu</b> · <b>modul baru tiap bulan</b>', items: [
      { level: 'beginner', title: 'Mindset Using AI Agent: Dari Ngejar Semua Leads Sendiri ke Jadi Pengarah' },
      { level: 'beginner', title: 'Intro ke AI Agent + Kenalan 5 Jenis Hermes Agent' },
      { level: 'beginner', title: 'Bahasa Agent: Cara "Ngomong" ke AI Biar Nurut' },
      { level: 'level-up', title: 'Blueprint 5 Tahap + Kerangka Frontend-Backend-Database' },
      { level: 'level-up', title: 'Build Your First Smart Worker — Demo End-to-End + Agent Pertama Lo' },
      { level: 'level-up', title: 'Loop Engineering: Bikin Agent Makin Akurat' },
      { level: 'level-up', title: 'Hubungin Hermes Agent ke Channel Kerja Nyata Lo (WA & Email)' },
      { level: 'pro', title: 'Uji & Perbaiki: Kalau Agent Salah Jawab' },
      { level: 'pro', title: 'Jaga Hermes Agent Lo Biar Ga Kacau (+ Rencana 30 Hari)' },
      { level: 'bonus', title: 'Algoritma by Design: Bikin Agent Lo Bisa Ambil Keputusan Bercabang' }
    ] },
    rows: { eyebrow: 'apa yang lo dapet', heading: 'Tujuh hal. Semuanya kepake.', items: [
      { word: 'Video Course', desc: '10 modul step-by-step (9 inti + 1 bonus), mobile-friendly, bisa diulang kapan aja. Lo liat prosesnya dari nol sampe jadi.' },
      { word: 'AI Bot Tanya Jawab', desc: 'Bingung di tengah jalan? Tanya bot, jawabannya dikasih dalam konteks kebutuhan & proyek lo — bukan teori umum.' },
      { word: 'Kumpulan Prompt', desc: 'Prompt siap pakai: follow-up, riset, konten, sampai customer care — ganti konteks lo, langsung jalan.' },
      { word: 'Komunitas Discord', desc: 'Live Q&A + update konten rutin bareng member lain yang sefrekuensi.' },
      { word: 'AI News', desc: 'Update tools AI terbaru yang relevan sama kebutuhan & pekerjaan lo — tanpa lo mantau sendiri.' },
      { word: 'Use-case Update', desc: 'Contoh agent baru tiap bulan. Biar lo ga ketinggalan dan terus naik level.' },
      { word: 'Rencana Aksi Tiap Modul', desc: 'Bukan cuma nonton lalu lupa. Tiap modul ditutup dengan langkah konkret yang harus langsung lo kerjain di kerjaan lo hari itu juga.' }
    ] },
    testimonials: { eyebrow: 'kata member', heading: 'Bukan kami yang ngomong.', note: 'ditampilin apa adanya — isi kursus & nama diubah demi privasi.', items: [
      { quote: 'Bikin agent buat rekap invoice & jadwal tim, jalan otomatis di WhatsApp. Sekarang ga ada inbox yang kelewat. Saya bukan IT dan tetep bisa.', name: 'pemilik jasa, Semarang' },
      { quote: 'Follow-up WA 40 calon client yang tadinya makan seharian, sekarang cuma 5 menit. Agent yang jawab, saya yang review.', name: 'agen properti, Surabaya' },
      { quote: 'Caption buat 6 platform yang tadinya mikir seharian, sekarang kelar 1 jam. Saya tinggal review & posting.', name: 'content creator' }
    ] },
    split: { eyebrow: 'dari latar non-IT · yang bikin sistem sendiri', heading: 'Kenapa gw bikin ini.', image: '', alt: 'Founder Xinde Labs', paragraphs: [] },
    voucher: { eyebrow: '', heading: '', title: 'Build Your Own Agent — Voucher Diskon', note: 'Masukkan kode voucher di halaman checkout untuk dapat harga diskon.', items: [
      { code: 'EARLYBIRD', slots: '5 orang', orig: 'Rp 599.000', disc: 'Rp 199.000', hot: true, full: false, life: false },
      { code: 'FASE01', slots: '10 orang', orig: 'Rp 599.000', disc: 'Rp 299.000', hot: false, full: false, life: false },
      { code: 'FASE02', slots: '20 orang', orig: 'Rp 599.000', disc: 'Rp 399.000', hot: false, full: false, life: false },
      { code: 'FASE03', slots: '30 orang', orig: 'Rp 599.000', disc: 'Rp 499.000', hot: false, full: false, life: false },
      { code: 'FULL PRICE', slots: '—', orig: '', disc: 'Rp 599.000', hot: false, full: true, life: false },
      { code: 'LIFETIME50', slots: '2 orang', orig: 'Rp 999.000', disc: 'Rp 599.000', hot: false, full: false, life: true }
    ] },
    faq: { eyebrow: 'faq', heading: 'Masih ragu? Ini jawabannya.', items: [] },
    comm: { eyebrow: 'gratis · buat semua sales', title: 'Join Komunitas <span class="hl">AI Connect Circle</span> GRATIS!', lead: 'Forum sales person Indonesia yang lagi naik level pakai AI — tanya-jawab, sharing prompt, diskusi use-case, dan update tools terbaru tiap minggu.', points: 'gratis selamanya · tanpa kartu kredit\nshare & curi prompt terbaik dari sesama sales\nupdate AI tools buat closing tiap minggu', btn_text: 'Gabung Gratis', success_title: 'Selamat datang di Circle! 🎉', success_text: 'Makasih <b>{nama}</b>. Link invite <b>AI Connect Circle</b> dikirim ke WhatsApp & email lo — cek juga folder spam.' },
    divider: {},
    embed: { html: '' }
  };

  function deepCopy(o) { return JSON.parse(JSON.stringify(o)); }

  function sectionDefaults(type) {
    return deepCopy(DEFAULTS[type] || {});
  }

  function newSection(type) {
    var uid = (type + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    return { id: uid, type: type, data: sectionDefaults(type), style: defaultStyles() };
  }

  function sectionTypeMeta(type) {
    return TYPES[type] || { label: type, icon: '🗂️', fields: [] };
  }

  // ---------- Rendering per tipe ----------
  function checkIcon() {
    return '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function renderList(html, items) {
    return (items || []).map(function (it) {
      return '<li>' + (typeof it === 'string' ? html(it) : html(it && it.text)) + '</li>';
    }).join('');
  }

  function renderHero(d, s, ctx) {
    var h = esc, fmt = ctx.fmt;
    var py = Number(d.yearly_price) || (cfg.PRICES && cfg.PRICES.yearly && cfg.PRICES.yearly.harga) || 0;
    var ctaLink = (d.cta_link && d.cta_link !== '#checkout') ? d.cta_link : ctx.checkoutHref;
    var cta2 = (d.cta2_text && d.cta2_link) ? '<a href="' + h(d.cta2_link) + '" class="btn btn--ghost">' + h(d.cta2_text) + '</a>' : '';
    var anchor = d.anchor
      ? '<p class="hero__anchor">' + (d.anchor || '') + '</p>'
      : (py ? '<p class="hero__anchor">mulai <b>Rp ' + fmt.format(py) + '/tahun</b> · akses 24/7 dari HP</p>' : '');
    var a = s.anchor ? ' id="' + esc(s.anchor) + '"' : '';
    var ds = s.id ? ' data-sec="' + esc(s.id) + '"' : '';
    return '<section class="hero ' + sectionCls(s) + '"' + a + ds + ' style="' + styleAttr(s) + '">' +
      '<div class="hero__glow" aria-hidden="true"></div>' +
      '<div class="hero__gridline" aria-hidden="true"></div>' +
      '<div class="wrap hero__in">' +
        '<p class="eyebrow"><span class="dot dot--pulse"></span>' + h(d.eyebrow || '') + '</p>' +
        '<h1>' + (d.title || '') + '</h1>' +
        (d.subtitle ? '<p class="hero__sub">' + (d.subtitle || '') + '</p>' : '') +
        '<div class="hero__cta">' +
          '<a href="' + h(ctaLink) + '" class="btn btn--primary">' + h(d.cta_text || 'Daftar Course') + ' <span class="arw" aria-hidden="true"><span class="arw__glyph">→</span></span></a>' +
          cta2 +
        '</div>' +
        anchor +
      '</div>' +
    '</section>';
  }

  function renderTextSec(s, d) {
    var h = esc, rev = ' reveal';
    var align = d.align || 'left';
    var style = 'text-align:' + align + ';max-width:760px;margin-left:auto;margin-right:auto';
    var html = '';
    if (d.eyebrow) html += '<p class="eyebrow eyebrow--center' + rev + '" style="text-align:' + align + '"><span class="dot"></span>' + h(d.eyebrow) + '</p>';
    if (d.heading) html += '<h2 class="h2' + rev + '" style="' + style + '">' + (d.heading) + '</h2>';
    if (d.body) html += '<div class="sec-text' + rev + '" style="text-align:' + align + ';max-width:640px;margin:0 auto">' + (d.body) + '</div>';
    return openWrap(s, s.style && s.style.max_width) + html + closeWrap();
  }

  function renderImageSec(s, d) {
    var h = esc, rev = ' reveal';
    var style = d.max_width ? ' max-width:' + Number(d.max_width) + 'px;margin:0 auto;' : '';
    if (d.radius) style += 'border-radius:' + Number(d.radius) + 'px;';
    return openWrap(s) +
      '<div class="sec-media' + rev + '" style="' + style + '">' +
        (d.src ? '<img src="' + h(d.src) + '" alt="' + h(d.alt || '') + '" loading="lazy" />' : '') +
        (d.caption ? '<p class="sec-media__cap">' + h(d.caption) + '</p>' : '') +
      '</div>' + closeWrap();
  }

  function renderYoutubeSec(s, d) {
    var h = esc, rev = ' reveal';
    var vid = youtubeId(d.video_id);
    var inner = vid
      ? '<div class="video__frame"><iframe src="https://www.youtube.com/embed/' + h(vid) + '" title="' + h(d.title || 'YouTube video') + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>'
      : '<div class="sec-media__cap">· isi Video ID di editor ·</div>';
    return openWrap(s) +
      '<div class="sec-media sec-media--video' + rev + '">' +
        inner +
        (d.title ? '<p class="sec-media__cap">' + h(d.title) + '</p>' : '') +
      '</div>' + closeWrap();
  }

  function renderVideoRow(s, d, ctx) {
    var h = esc, rev = ' reveal';
    var vid = youtubeId(d.video_id);
    var points = String(d.points || '').split(/\r?\n/).filter(Boolean)
      .map(function (p) { return '<li>' + h(p) + '</li>'; }).join('');
    var stage = vid
      ? '<div class="video__frame"><iframe src="https://www.youtube.com/embed/' + h(vid) + '" title="' + h(d.profile_name || 'Video') + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>'
      : '<div class="video__thumb" style="position:relative"><div class="video__frame"></div></div>';
    return '<section class="section ' + sectionCls(s) + '"' + (s.anchor ? ' id="' + esc(s.anchor) + '"' : '') + (s.id ? ' data-sec="' + esc(s.id) + '"' : '') + ' style="' + styleAttr(s) + '"><div class="wrap">' +
      (d.eyebrow ? '<p class="eyebrow reveal"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
      (d.heading ? '<h2 class="h2 reveal">' + (d.heading) + '</h2>' : '') +
      '<div class="video__row">' +
        '<div class="video__side reveal d1">' +
          '<div class="profile">' +
            '<div class="profile__avatar">x</div>' +
            '<div><div class="profile__name">' + h(d.profile_name || '') + '</div><div class="profile__role">' + h(d.profile_role || '') + '</div></div>' +
          '</div>' +
          (points ? '<ul class="points">' + points + '</ul>' : '') +
        '</div>' +
        '<div class="video__stage reveal d2">' + stage +
          (d.caption ? '<p class="video__cap">' + h(d.caption) + '</p>' : '') +
        '</div>' +
      '</div>' +
    '</div></section>';
  }

  function renderCtaSec(s, d, ctx) {
    var h = esc, rev = ' reveal';
    var href = (d.btn_link && d.btn_link !== '#checkout') ? d.btn_link : ctx.checkoutHref;
    return '<section class="closing ' + sectionCls(s) + '"' + (s.anchor ? ' id="' + esc(s.anchor) + '"' : '') + (s.id ? ' data-sec="' + esc(s.id) + '"' : '') + ' style="' + styleAttr(s) + '">' +
      '<div class="closing__glow" aria-hidden="true"></div>' +
      '<div class="wrap reveal">' +
        (d.eyebrow ? '<p class="eyebrow eyebrow--center"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
        '<h2>' + (d.title || '') + '</h2>' +
        (d.subtitle ? '<p class="sec-cta__sub">' + h(d.subtitle) + '</p>' : '') +
        '<a href="' + h(href) + '" class="btn btn--primary btn--block" style="max-width:360px">' + h(d.btn_text || 'Daftar Course') + ' <span class="arw" aria-hidden="true"><span class="arw__glyph">→</span></span></a>' +
        (d.anchor ? '<p class="hero__anchor" style="text-align:center">' + (d.anchor) + '</p>' : '') +
      '</div></section>';
  }

  function renderPricingSec(s, d, ctx) {
    var h = esc, fmt = ctx.fmt, rev = ' reveal';
    var py = Number(d.yearly_price) || (cfg.PRICES && cfg.PRICES.yearly && cfg.PRICES.yearly.harga) || 0;
    var pl = Number(d.lifetime_price) || (cfg.PRICES && cfg.PRICES.lifetime && cfg.PRICES.lifetime.harga) || 0;
    var yl = d.yearly_link && d.yearly_link !== '#checkout' ? d.yearly_link : ctx.checkoutHref;
    var ll = d.lifetime_link && d.lifetime_link !== '#checkout' ? d.lifetime_link : ctx.checkoutHref;
    var yF = (d.yearly_features || []).map(function (f) {
      return '<li>' + checkIcon() + (typeof f === 'string' ? h(f) : h(f && f.text)) + '</li>';
    }).join('');
    var lF = (d.lifetime_features || []).map(function (f) {
      return '<li>' + checkIcon() + (typeof f === 'string' ? h(f) : h(f && f.text)) + '</li>';
    }).join('');
    var yList = yF ? '<ul class="pcard__list">' + yF + '</ul>' : '';
    var lList = lF ? '<ul class="pcard__list">' + lF + '</ul>' : '';
    var badge = d.badge ? '<span class="pcard__badge">' + h(d.badge) + '</span>' : '';
    return '<section class="section pricing ' + sectionCls(s) + '"' + (s.anchor ? ' id="' + esc(s.anchor) + '"' : '') + (s.id ? ' data-sec="' + esc(s.id) + '"' : '') + ' style="' + styleAttr(s) + '"><div class="wrap">' +
      (d.eyebrow ? '<p class="eyebrow eyebrow--center' + rev + '"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
      (d.heading ? '<h2 class="h2' + rev + '" style="text-align:center">' + (d.heading) + '</h2>' : '') +
      '<div class="pricing__grid' + rev + '">' +
        '<div class="pcard"><div class="pcard__tier">' + h(d.yearly_tier || 'Tahunan') + '</div>' +
          '<div class="pcard__title">' + h(d.yearly_label || 'Akses 1 tahun') + '</div>' +
          '<div class="pcard__price">Rp ' + fmt.format(py) + '<small>/tahun</small></div>' +
          (d.yearly_anchor ? '<div class="pcard__anchor">' + h(d.yearly_anchor) + '</div>' : '') +
          yList +
          '<a href="' + h(yl) + '" class="btn btn--ghost btn--block">Pilih Tahunan</a>' +
        '</div>' +
        '<div class="pcard pcard--best">' + badge +
          '<div class="pcard__tier">' + h(d.lifetime_tier || 'Lifetime · sekali bayar') + '</div>' +
          '<div class="pcard__title">' + h(d.lifetime_label || 'Akses selamanya') + '</div>' +
          '<div class="pcard__price">Rp ' + fmt.format(pl) + '<small>sekali</small></div>' +
          (d.lifetime_anchor ? '<div class="pcard__anchor">' + h(d.lifetime_anchor) + '</div>' : '') +
          lList +
          '<a href="' + h(ll) + '" class="btn btn--primary btn--block">Pilih Lifetime <span class="arw" aria-hidden="true"><span class="arw__glyph">→</span></span></a>' +
        '</div>' +
      '</div></div></section>';
  }

  function renderStatsSec(s, d) {
    var h = esc, rev = ' reveal';
    var items = parseStats(d.items).map(function (s2) {
      return '<div class="stat"><div class="stat__num">' + (s2.n || '') + '</div>' + (s2.l ? '<div class="stat__lbl">' + h(s2.l) + '</div>' : '') + '</div>';
    }).join('');
    return openWrap(s) +
      (d.eyebrow ? '<p class="eyebrow eyebrow--center' + rev + '"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
      (d.heading ? '<h2 class="h2' + rev + '" style="text-align:center">' + (d.heading) + '</h2>' : '') +
      '<div class="stats__grid' + rev + '">' + items + '</div>' +
      (d.disclaimer ? '<p class="proof__disclaimer">' + h(d.disclaimer) + '</p>' : '') +
      closeWrap();
  }

  function renderTerminalSec(s, d) {
    var h = esc, rev = ' reveal';
    var lines = (d.items || []).map(function (m) {
      return '<div class="mod-line">' + (m.level ? '<span class="lv lv-' + h(m.level.toLowerCase()) + '">' + h(m.level) + '</span> · ' : '') + h(m.title || '') + '</div>';
    }).join('');
    return openWrap(s) +
      (d.eyebrow ? '<p class="eyebrow eyebrow--center' + rev + '"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
      (d.heading ? '<h2 class="h2' + rev + '" style="text-align:center">' + (d.heading) + '</h2>' : '') +
      '<div class="terminal' + rev + '">' +
        '<div class="terminal__bar"><i></i><i></i><i></i><span class="terminal__title">' + h(d.bar_title || '') + '</span></div>' +
        '<div class="terminal__body">' +
          (d.cmd ? '<div class="terminal__cmd">' + h(d.cmd) + '</div>' : '') +
          lines +
          '<div class="mod-rule"></div>' +
          '<div class="mod-foot">' + (d.foot || '') + '</div>' +
        '</div>' +
      '</div>' + closeWrap();
  }

  function renderRowsSec(s, d) {
    var h = esc, rev = ' reveal';
    var list = (d.items || []).map(function (it) {
      return '<div class="benefit"><div class="benefit__word">' + h(it && it.word) + ' <span class="arw">→</span></div><div class="benefit__desc">' + (it && it.desc ? it.desc : '') + '</div></div>';
    }).join('');
    return openWrap(s) +
      (d.eyebrow ? '<p class="eyebrow eyebrow--center' + rev + '"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
      (d.heading ? '<h2 class="h2' + rev + '" style="text-align:center">' + (d.heading) + '</h2>' : '') +
      '<div class="reveal" style="max-width:760px;margin:0 auto">' + list + '</div>' +
      closeWrap();
  }

  function renderCardsSec(s, d) {
    var h = esc, rev = ' reveal';
    var grid = (d.items || []).map(function (u) {
      return '<div class="ucard"><div class="ucard__name">' + h(u && u.name) + '</div><div class="ucard__who">' + h(u && u.who) + '</div><div class="ucard__prob">' + (u && u.prob ? u.prob : '') + '</div></div>';
    }).join('');
    return openWrap(s) +
      (d.eyebrow ? '<p class="eyebrow eyebrow--center' + rev + '"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
      (d.heading ? '<h2 class="h2' + rev + '" style="text-align:center">' + (d.heading) + '</h2>' : '') +
      (d.lead ? '<p class="lead reveal" style="text-align:center;max-width:720px;margin:0 auto 40px">' + (d.lead) + '</p>' : '') +
      '<div class="usecase reveal">' + grid + '</div>' +
      closeWrap();
  }

  function renderTestimonialsSec(s, d) {
    var h = esc, rev = ' reveal';
    var grid = (d.items || []).map(function (t) {
      return '<article class="tcard"><div class="tbubble">' + (t && t.quote ? t.quote : '') + '</div>' +
        '<div class="tcard__by">member · ' + h(t && t.name) + '</div></article>';
    }).join('');
    return openWrap(s) +
      (d.eyebrow ? '<p class="eyebrow eyebrow--center' + rev + '"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
      (d.heading ? '<h2 class="h2' + rev + '" style="text-align:center">' + (d.heading) + '</h2>' : '') +
      '<div class="tgrid' + rev + '">' + grid + '</div>' +
      (d.note ? '<p class="tnote">' + h(d.note) + '</p>' : '') +
      closeWrap();
  }

  function renderSplitSec(s, d) {
    var h = esc, rev = ' reveal';
    var paras = (d.paragraphs || []).map(function (p) {
      return '<p>' + (typeof p === 'string' ? p : (p && p.text ? p.text : '')) + '</p>';
    }).join('');
    return openWrap(s) +
      (d.eyebrow ? '<p class="eyebrow eyebrow--center' + rev + '"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
      (d.heading ? '<h2 class="h2 grad founder__title' + rev + '" style="text-align:center">' + (d.heading) + '</h2>' : '') +
      '<div class="founder__grid">' +
        (d.image ? '<div class="founder__photo reveal"><img src="' + h(d.image) + '" alt="' + h(d.alt || '') + '" /></div>' : '') +
        '<div class="founder__text reveal d1">' + paras + '</div>' +
      '</div>' + closeWrap();
  }

  function renderVoucherSec(s, d) {
    var h = esc, rev = ' reveal';
    var rows = (d.items || []).map(function (v) {
      var cls = 'vtier';
      if (v && v.hot) cls += ' vtier--hot';
      if (v && v.full) cls += ' vtier--full';
      if (v && v.life) cls += ' vtier--life';
      return '<div class="' + cls + '">' +
        '<span class="vtier__code">' + h(v && v.code) + '</span>' +
        '<span class="vtier__slots">' + h(v && v.slots) + '</span>' +
        '<span class="vtier__orig">' + (v && v.orig && v.orig !== '' ? v.orig : '') + '</span>' +
        '<span class="vtier__disc">' + h(v && v.disc) + '</span>' +
      '</div>';
    }).join('');
    return openWrap(s) +
      (d.eyebrow ? '<p class="eyebrow eyebrow--center' + rev + '"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
      (d.heading ? '<h2 class="h2' + rev + '" style="text-align:center">' + (d.heading) + '</h2>' : '') +
      '<div class="voucher-tiers' + rev + '">' +
        (d.title ? '<h3 class="voucher-tiers__title">' + h(d.title) + '</h3>' : '') +
        '<div class="voucher-tiers__table">' +
          '<div class="vtier vtier--head"><span class="vtier__code">Kode</span><span class="vtier__slots">Kuota</span><span class="vtier__orig">Harga</span><span class="vtier__disc">Harga Diskon</span></div>' +
          rows +
        '</div>' +
        (d.note ? '<p class="voucher-tiers__note">' + h(d.note) + '</p>' : '') +
      '</div>' + closeWrap();
  }

  function renderFaqSec(s, d) {
    var h = esc, rev = ' reveal';
    var items = d.items || [];
    var list = items.map(function (f) {
      return '<div class="faq__item"><button class="faq__q">' + h(f.q || '') + '</button><div class="faq__a"><div>' + (f && f.a ? f.a : '') + '</div></div></div>';
    }).join('');
    return openWrap(s) +
      (d.eyebrow ? '<p class="eyebrow eyebrow--center' + rev + '"><span class="dot"></span>' + h(d.eyebrow) + '</p>' : '') +
      (d.heading ? '<h2 class="h2' + rev + '" style="text-align:center">' + (d.heading) + '</h2>' : '') +
      '<div class="faq' + rev + '">' + list + '</div>' +
      closeWrap();
  }

  function renderCommSec(s, d) {
    var h = esc, rev = ' reveal';
    var points = String(d.points || '').split(/\r?\n/).filter(Boolean)
      .map(function (p) { return '<li>' + h(p) + '</li>'; }).join('');
    return openWrap(s) +
      '<div class="comm__grid">' +
        '<div class="comm__info reveal">' +
          (d.eyebrow ? '<p class="eyebrow"><span class="dot dot--pulse"></span>' + h(d.eyebrow) + '</p>' : '') +
          (d.title ? '<h2 class="h2">' + (d.title) + '</h2>' : '') +
          (d.lead ? '<p class="lead">' + (d.lead) + '</p>' : '') +
          (points ? '<ul class="points">' + points + '</ul>' : '') +
        '</div>' +
        '<div class="comm__card reveal d1">' +
          '<form id="commForm" novalidate>' +
            '<div class="field"><label for="commName">Nama Lengkap</label><input type="text" id="commName" placeholder="cth: Budi Santoso" autocomplete="name" required /><div class="err-msg">Nama wajib diisi.</div></div>' +
            '<div class="field"><label for="commEmail">Email Aktif</label><input type="email" id="commEmail" placeholder="cth: budi@gmail.com" autocomplete="email" required /><div class="err-msg">Email aktif wajib diisi.</div></div>' +
            '<div class="field"><label for="commWhatsapp">No. WhatsApp</label><input type="tel" id="commWhatsapp" placeholder="cth: 0812 3456 7890" autocomplete="tel" required /><div class="err-msg">No. WhatsApp wajib diisi.</div></div>' +
            '<div class="notice notice--warn form-error" id="commError"></div>' +
            '<button type="submit" class="btn btn--primary btn--block" id="commSubmit">' + h(d.btn_text || 'Gabung Gratis') + ' <span class="arw" aria-hidden="true"><span class="arw__glyph">→</span></span></button>' +
          '</form>' +
          '<div id="commDone" style="display:none"><div class="lead-done"><h3>' + h(d.success_title || 'Selamat datang di Circle! 🎉') + '</h3><p>' + (d.success_text || '') + '</p></div></div>' +
        '</div>' +
      '</div>' + closeWrap();
  }

  function renderEmbedSec(s, d) {
    return '<div class="sec-embed"><div class="wrap">' + (d.html || '') + '</div></div>';
  }

  function renderSection(s, ctx) {
    if (!s || !s.type) return '';
    var d = s.data || {};
    switch (s.type) {
      case 'hero': return renderHero(d, s, ctx);
      case 'text': return renderTextSec(s, d);
      case 'image': return renderImageSec(s, d);
      case 'youtube': return renderYoutubeSec(s, d);
      case 'video_row': return renderVideoRow(s, d, ctx);
      case 'cta': return renderCtaSec(s, d, ctx);
      case 'pricing': return renderPricingSec(s, d, ctx);
      case 'stats': return renderStatsSec(s, d);
      case 'terminal': return renderTerminalSec(s, d);
      case 'rows': return renderRowsSec(s, d);
      case 'cards': return renderCardsSec(s, d);
      case 'testimonials': return renderTestimonialsSec(s, d);
      case 'split': return renderSplitSec(s, d);
      case 'voucher': return renderVoucherSec(s, d);
      case 'faq': return renderFaqSec(s, d);
      case 'comm': return renderCommSec(s, d);
      case 'divider': return '<div class="sec-divider"><hr /></div>';
      case 'embed': return renderEmbedSec(s, d);
      default: return '';
    }
  }

  // ---------- Nav & Footer (dari meta) ----------
  function mergeMeta(meta) {
    var def = (cfg.DEFAULT_LANDING && cfg.DEFAULT_LANDING.meta) || {};
    var m = Object.assign({}, def, meta || {});
    m.nav = Object.assign({}, def.nav || {}, (meta && meta.nav) || {});
    m.nav.links = ((m.nav && m.nav.links) || []);
    m.nav.cta = Object.assign({ text: 'Daftar Course', href: 'checkout.html' }, m.nav && m.nav.cta);
    m.footer = Object.assign({}, (def && def.footer) || {}, (meta && meta.footer) || {});
    m.footer.links = (m.footer && m.footer.links) || [];
    return m;
  }

  function renderNav(meta, ctx) {
    var m = mergeMeta(meta);
    var links = m.nav.links || [];
    var logo = m.nav.logo || 'xindelabs';
    var logoDot = (m.nav.logo_dot != null) ? m.nav.logo_dot : '.';
    var html = '<div class="nav__links" id="navLinks">' + links.map(function (l) {
      return '<a class="nav__link" href="' + esc(l.href || '#') + '">' + esc(l.label || '') + '<span class="pdot"><i></i></span></a>';
    }).join('') + '</div>';
    var ctaTxt = (m.nav.cta && m.nav.cta.text) || 'Daftar Course';
    var ctaHref = (m.nav.cta && m.nav.cta.href) || ctx.checkoutHref;
    var cta = '<div class="nav__cta-desktop"><a href="' + esc(ctaHref) + '" class="btn btn--primary btn--sm">' + esc(ctaTxt) + '</a></div>';
    var burger = links.length ? '<button class="hamburger" id="hamburger" aria-label="Menu">☰</button>' : '';
    return '<header class="nav"><div class="nav__in">' +
      '<a href="' + esc((m.home_href) || 'index.html') + '" class="wordmark">' + esc(logo) + '<span>' + (logoDot || '') + '</span></a>' +
      '<div class="nav__right">' + (links.length ? html : '') + cta + burger + '</div>' +
    '</div></header>';
  }

  function renderFooter(meta, ctx) {
    var m = mergeMeta(meta);
    var links = (m.footer && m.footer.links) || [];
    var copy = (m.footer && m.footer.copy) || '© ' + new Date().getFullYear() + ' Xinde Labs';
    return '<footer class="footer"><div class="footer__in">' +
      '<span class="footer__copy">' + esc(copy) + '</span>' +
      '<div class="footer__links">' + links.map(function (l) {
        var ext = /^https?:/.test(l.href) && l.href.indexOf(location.host) === -1;
        return '<a href="' + esc(l.href || '#') + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l.label || '') + '</a>';
      }).join('') + '</div>' +
    '</div></footer>';
  }

  // ---------- Render keseluruhan body sections ----------
  function renderSections(content, ctx) {
    var secs = content.sections || [];
    var out = '';
    secs.forEach(function (s, i) {
      out += renderSection(s, ctx);
      if (s.type === 'hero' && i === 0 && s.data && s.data.show_timer) {
        out += '<div class="wrap"><div class="timer-inline" id="timerInline" style="display:none"><span class="timer-inline__icon">⏰</span><span class="timer-inline__label">Promo berakhir dalam</span><span class="timer__countdown">--:--:--</span></div></div>';
      }
    });
    return out;
  }

  // ---------- Konversi konten lama → sections ----------
  function normalizeLegacy(v) {
    var secs = [];
    if (Array.isArray(v.sections) && v.sections.length) {
      return deepCopy(v.sections).map(function (s) {
        s.style = Object.assign(defaultStyles(), s.style || {});
        return s;
      });
    }
    var uid = (function () { var c = 0; return function (t) { return t + '_' + Date.now() + '_' + (c++); }; })();
    var m = v.meta || {};
    if (v.hero_title || v.hero_subtitle || m.eyebrow) {
      secs.push({
        id: uid('hero'), type: 'hero', style: defaultStyles(), data: {
          eyebrow: m.eyebrow || 'untuk sales person · tanpa coding',
          title: v.hero_title || '',
          subtitle: v.hero_subtitle || '',
          cta_text: 'Daftar Course', cta_link: 'checkout.html',
          cta2_text: 'Liat gimana caranya', cta2_link: '#video',
          anchor: '', show_timer: true
        }
      });
    }
    var vid = v.video_youtube_id ? youtubeId(v.video_youtube_id) : '';
    if (vid) {
      secs.push({ id: uid('video_row'), type: 'video_row', style: defaultStyles(), data: {
        eyebrow: v.video_caption || 'liat agentnya jalan',
        heading: '2 menit buat mikir ulang.',
        video_id: vid, profile_name: 'Xinde Labs', profile_role: 'AI agent for every need',
        caption: v.video_caption || '', points: ''
      }});
    }
    if (Array.isArray(v.testimonials) && v.testimonials.length) {
      secs.push({ id: uid('testimonials'), type: 'testimonials', style: defaultStyles(), data: {
        eyebrow: 'kata member', heading: 'Bukan kami yang ngomong.',
        items: v.testimonials.map(function (t) { return { quote: t.quote, name: t.name }; }),
        note: ''
      }});
    }
    if (Array.isArray(v.usecases) && v.usecases.length) {
      secs.push({ id: uid('cards'), type: 'cards', style: defaultStyles(), data: {
        eyebrow: '5 contoh hermes agent', heading: 'Hermes Agent bisa dibikin buat kebutuhan apa aja.',
        lead: '', items: v.usecases.map(function (u) { return { name: u.name, who: u.who, prob: u.prob }; })
      }});
    }
    if (v.price_yearly || v.price_lifetime) {
      secs.push({ id: uid('pricing'), type: 'pricing', style: defaultStyles(), data: Object.assign(sectionDefaults('pricing'), {
        yearly_price: v.price_yearly || 0, lifetime_price: v.price_lifetime || 0
      }) });
    }
    if (Array.isArray(v.faqs) && v.faqs.length) {
      secs.push({ id: uid('faq'), type: 'faq', style: defaultStyles(), data: {
        eyebrow: 'faq', heading: 'Masih ragu? Ini jawabannya.',
        items: v.faqs.map(function (f) { return { q: f.q, a: f.a }; })
      }});
    }
    secs.push({ id: uid('cta'), type: 'cta', style: defaultStyles(), data: {
      eyebrow: '', title: 'Berhenti kerjain semuanya sendiri.<br /><span class="hl">Hermes Agent lo yang follow-up, riset, dan closing.</span>',
      subtitle: '', btn_text: 'Daftar Course', btn_link: 'checkout.html', anchor: ''
    }});
    return secs;
  }

  // ---------- Merge: pastikan semua section default selalu ada ----------
  // Dipakai untuk landing utama: kalau CMS cuma menyimpan sebagian section
  // (mis. hasil save parsial), section yang kurang diisi dari DEFAULT_LANDING
  // sehingga komponen seperti founder story, voucher, comm, dll tidak pernah
  // hilang dari halaman. Section CMS menang per tipe; urutan ikut desain default.
  function mergeDefaults(sections) {
    var def = (cfg.DEFAULT_LANDING && cfg.DEFAULT_LANDING.sections) || [];
    if (!def.length) return sections || [];
    var src = Array.isArray(sections) ? sections.slice() : [];
    var pools = {};
    src.forEach(function (s) {
      if (!s || !s.type) return;
      (pools[s.type] = pools[s.type] || []).push(s);
    });
    var out = [];
    def.forEach(function (d) {
      var t = d.type;
      var s = (pools[t] && pools[t].length) ? pools[t].shift() : deepCopy(d);
      if (!s.style) s.style = Object.assign(defaultStyles(), {});
      out.push(s);
    });
    Object.keys(pools).forEach(function (t) {
      pools[t].forEach(function (s) { out.push(s); });
    });
    return out;
  }

  function makeContext(meta, defaults) {
    var accent = (meta && meta.accent) || '#00ff88';
    var slug = (meta && meta.slug) || 'utama';
    var checkoutHref = 'checkout.html?slug=' + encodeURIComponent(slug);
    return {
      accent: accent,
      slug: slug,
      checkoutHref: checkoutHref,
      fmt: new Intl.NumberFormat('id-ID'),
      cfg: cfg
    };
  }

  // Menyiapkan content: normalize meta + sections
  function prepare(content) {
    var m = mergeMeta(content && content.meta);
    var s = normalizeLegacy(content || {});
    return { meta: m, sections: s };
  }

  return {
    TYPES: TYPES,
    STYLE_FIELDS: STYLE_FIELDS,
    defaultStyles: defaultStyles,
    sectionDefaults: sectionDefaults,
    newSection: newSection,
    sectionTypeMeta: sectionTypeMeta,
    esc: esc,
    youtubeId: youtubeId,
    parseStats: parseStats,
    styleAttr: styleAttr,
    sectionCls: sectionCls,
    renderSection: renderSection,
    renderSections: renderSections,
    renderNav: renderNav,
    renderFooter: renderFooter,
    mergeMeta: mergeMeta,
    makeContext: makeContext,
    prepare: prepare,
    normalizeLegacy: normalizeLegacy,
    mergeDefaults: mergeDefaults
  };
})();