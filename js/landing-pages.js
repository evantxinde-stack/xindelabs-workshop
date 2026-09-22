/* ============================================================
   LANDING PAGES — multi-page management + data access
   Skema tipe section / renderer dipindah ke js/lp-render.js
   (window.LPRender) supaya page.html, index.html, dan admin
   memakai satu sumber yang sama.
   Setiap landing page disimpan di site_content dengan key:
   - 'homepage'          → landing utama (default)
   - 'lp_<slug>'         → landing custom (subdomain/URL)
   value = { ...content biasa, meta: { slug, title, page_title, subdomain, accent, is_custom,
            nav, footer } }
   ============================================================ */
window.LandingPages = (function () {
  var cfg = window.XINDE;
  var R = window.LPRender;

  function metaOf(key, value) {
    var m = (value && value.meta) || {};
    var isCustom = m.is_custom || key.indexOf('lp_') === 0;
    var slug = m.slug || (isCustom ? key.replace(/^lp_/, '') : 'utama');
    return Object.assign({}, R ? R.mergeMeta(null) : {}, m, {
      slug: slug,
      is_custom: isCustom,
      title: m.title || (isCustom ? slug : 'Landing Utama'),
      page_title: m.page_title || '',
      accent: m.accent || '#00ff88',
      created_at: m.created_at || '',
      nav: Object.assign({}, (cfg.DEFAULT_LANDING && cfg.DEFAULT_LANDING.meta && cfg.DEFAULT_LANDING.meta.nav) || {}, m.nav || {}),
      footer: Object.assign({}, (cfg.DEFAULT_LANDING && cfg.DEFAULT_LANDING.meta && cfg.DEFAULT_LANDING.meta.footer) || {}, m.footer || {})
    });
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

  // Untuk preview mode: URL halaman yang bisa menerima draft via postMessage
  function previewUrl(key) {
    if (key === 'homepage') return 'index.html?preview=1';
    var slug = key.replace(/^lp_/, '');
    return 'page.html?slug=' + encodeURIComponent(slug) + '&preview=1';
  }

  return {
    keyOf: keyOf, metaOf: metaOf, listAll: listAll, get: get, accessUrl: accessUrl, previewUrl: previewUrl,
    // Delegasi ke LPRender (backward-compat untuk admin yang lama)
    SECTION_TYPES: R.TYPES,
    sectionDefaults: R.sectionDefaults,
    newSection: R.newSection,
    sectionTypeMeta: R.sectionTypeMeta,
    youtubeId: R.youtubeId
  };
})();