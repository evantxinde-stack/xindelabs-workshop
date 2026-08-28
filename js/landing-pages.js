/* ============================================================
   LANDING PAGES — multi-page management
   Setiap landing page disimpan di site_content dengan key:
   - 'homepage'          → landing utama (default)
   - 'lp_<slug>'         → landing custom (subdomain/URL)
   value = { ...content biasa, meta: { slug, title, page_title, subdomain, accent, is_custom } }
   ============================================================ */
window.LandingPages = (function () {
  var cfg = window.XINDE;

  function metaOf(key, value) {
    var m = (value && value.meta) || {};
    var isCustom = m.is_custom || key.indexOf('lp_') === 0;
    var slug = m.slug || (isCustom ? key.replace(/^lp_/, '') : 'utama');
    return {
      slug: slug,
      is_custom: isCustom,
      title: m.title || (isCustom ? slug : 'Landing Utama'),
      page_title: m.page_title || '',
      subdomain: m.subdomain || '',
      accent: m.accent || '#00ff88',
      accent_label: m.accent_label || 'hijau',
      created_at: m.created_at || ''
    };
  }

  function keyOf(slug) {
    if (!slug || slug === 'utama') return 'homepage';
    return 'lp_' + slug;
  }

  // Fetch semua landing pages (list)
  function listAll() {
    return fetch(cfg.SUPABASE_URL + '/rest/v1/site_content?select=key,value,updated_at&order=updated_at.desc', {
      headers: { 'apikey': cfg.SUPABASE_ANON_KEY }
    }).then(function (r) { return r.json(); }).then(function (rows) {
      var arr = (rows || []).map(function (row) {
        var v = row.value || {};
        var m = metaOf(row.key, v);
        return {
          key: row.key,
          slug: m.slug,
          title: m.title,
          is_custom: m.is_custom,
          subdomain: m.subdomain,
          accent: m.accent,
          updated_at: row.updated_at,
          isFilled: !!(v.hero_title) || !!(Array.isArray(v.sections) && v.sections.length)
        };
      });
      return arr;
    });
  }

  // Ambil satu landing berdasarkan slug
  function get(slug) {
    var key = keyOf(slug);
    return fetch(cfg.SUPABASE_URL + '/rest/v1/site_content?key=eq.' + encodeURIComponent(key) + '&select=key,value', {
      headers: { 'apikey': cfg.SUPABASE_ANON_KEY }
    }).then(function (r) { return r.json(); }).then(function (rows) {
      if (!rows || !rows[0]) return null;
      return Object.assign({}, rows[0].value || {}, { meta: metaOf(key, rows[0].value || {}) });
    });
  }

  // Teks link akses landing page
  function accessUrl(key) {
    var base = (location.protocol === 'https:') ? location.protocol : 'http:';
    if (key === 'homepage') return base + '//' + location.host + '/index.html';
    var slug = key.replace(/^lp_/, '');
    return base + '//' + location.host + '/page.html?slug=' + encodeURIComponent(slug);
  }

  /* ============================================================
     SECTION-BASED BUILDER
     Tiap landing page bisa punya value.sections: array of section.
     Section types: hero, text, image, youtube, cta, pricing,
                    testimonial, faq, stats, divider, embed
     ============================================================ */

  // Definisi tipe section + field yang bisa diedit
  var SECTION_TYPES = {
    hero: {
      label: 'Hero',
      icon: '🏠',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Judul (boleh HTML)', type: 'textarea' },
        { key: 'subtitle', label: 'Subjudul', type: 'textarea' },
        { key: 'cta_text', label: 'Text Tombol CTA', type: 'text' },
        { key: 'cta_link', label: 'Link Tombol CTA', type: 'text' }
      ]
    },
    text: {
      label: 'Teks',
      icon: '✍️',
      fields: [
        { key: 'heading', label: 'Heading', type: 'text' },
        { key: 'body', label: 'Isi (boleh HTML)', type: 'textarea' },
        { key: 'align', label: 'Perataan', type: 'select', options: ['left', 'center', 'right'] }
      ]
    },
    image: {
      label: 'Gambar',
      icon: '🖼️',
      fields: [
        { key: 'src', label: 'URL Gambar', type: 'text' },
        { key: 'alt', label: 'Alt Text', type: 'text' },
        { key: 'caption', label: 'Caption', type: 'text' },
        { key: 'max_width', label: 'Max Width (px)', type: 'number' }
      ]
    },
    youtube: {
      label: 'Video YouTube',
      icon: '▶️',
      fields: [
        { key: 'video_id', label: 'YouTube Video ID', type: 'text' },
        { key: 'caption', label: 'Caption', type: 'text' }
      ]
    },
    cta: {
      label: 'CTA',
      icon: '🎯',
      fields: [
        { key: 'title', label: 'Judul', type: 'text' },
        { key: 'subtitle', label: 'Subjudul', type: 'text' },
        { key: 'btn_text', label: 'Text Tombol', type: 'text' },
        { key: 'btn_link', label: 'Link Tombol', type: 'text' }
      ]
    },
    pricing: {
      label: 'Pricing',
      icon: '💰',
      fields: [
        { key: 'yearly_label', label: 'Label Paket Tahunan', type: 'text' },
        { key: 'yearly_price', label: 'Harga Tahunan (Rp)', type: 'number' },
        { key: 'lifetime_label', label: 'Label Paket Lifetime', type: 'text' },
        { key: 'lifetime_price', label: 'Harga Lifetime (Rp)', type: 'number' }
      ]
    },
    testimonial: {
      label: 'Testimoni',
      icon: '💬',
      fields: [
        { key: 'quote', label: 'Kutipan', type: 'textarea' },
        { key: 'name', label: 'Nama / Peran', type: 'text' }
      ]
    },
    faq: {
      label: 'FAQ',
      icon: '❓',
      fields: [
        { key: 'q', label: 'Pertanyaan', type: 'text' },
        { key: 'a', label: 'Jawaban', type: 'textarea' }
      ]
    },
    stats: {
      label: 'Statistik',
      icon: '📊',
      fields: [
        { key: 'items', label: 'Statistik (satu per baris, format: angka|label)', type: 'textarea', multiline: true }
      ]
    },
    divider: {
      label: 'Pemisah',
      icon: '➖',
      fields: []
    },
    embed: {
      label: 'Embed (HTML bebas)',
      icon: '🧩',
      fields: [
        { key: 'html', label: 'HTML / iframe / script', type: 'textarea' }
      ]
    }
  };

  // Template defaults per tipe section
  function sectionDefaults(type) {
    var d = {
      hero: { eyebrow: 'untuk sales person · tanpa coding', title: 'Bangun Karyawan Super Pintar — <span class="hl">Bantu semua kerjaan lo 24/7 No Baper</span>', subtitle: 'Bukan cuma ChatGPT. Agent lo yang follow-up, riset, dan closing — tanpa coding.', cta_text: 'Daftar Course →', cta_link: '#checkout' },
      text: { heading: '', body: 'Tulis konten lo di sini.', align: 'left' },
      image: { src: '', alt: '', caption: '', max_width: '' },
      youtube: { video_id: '', caption: '' },
      cta: { title: 'Siap mulai?', subtitle: 'Daftar sekarang, garansi 7 hari.', btn_text: 'Daftar Course →', btn_link: '#checkout' },
      pricing: { yearly_label: 'Tahunan', yearly_price: 599000, lifetime_label: 'Lifetime', lifetime_price: 999000 },
      testimonial: { quote: '', name: '' },
      faq: { q: '', a: '' },
      stats: { items: '500|member aktif\n40|prospek berhasil ditutup' },
      divider: {},
      embed: { html: '' }
    };
    return JSON.parse(JSON.stringify(d[type] || {}));
  }

  function newSection(type) {
    var uid = (type + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    return { id: uid, type: type, data: sectionDefaults(type) };
  }

  function sectionTypeMeta(type) {
    return SECTION_TYPES[type] || { label: type, icon: '🗂️', fields: [] };
  }

  return {
    keyOf: keyOf, metaOf: metaOf, listAll: listAll, get: get, accessUrl: accessUrl,
    SECTION_TYPES: SECTION_TYPES,
    sectionDefaults: sectionDefaults,
    newSection: newSection,
    sectionTypeMeta: sectionTypeMeta
  };
})();
