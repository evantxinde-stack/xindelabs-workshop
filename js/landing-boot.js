/* ============================================================
   LANDING BOOT — satu bootstrap untuk semua landing page
   Dipakai oleh index.html (landing utama / homepage) dan
   page.html (sub landing custom).

   Menyatukan perilaku yang tadinya diduplikat di dua file:
     - render (buildPage + mergeDefaults utk utama) via LPRender
     - form leads komunitas (commForm) — jalan di SEMUA landing
     - preview mode admin (postMessage lp-draft)
     - loader: homepage → key 'homepage'
               custom  → key 'lp_<slug>' (fallback row legacy '<slug>')
     - fallback: utama → DEFAULT_LANDING penuh (13 section)
                 custom kosong → default minimal hero + cta
   ============================================================ */
window.LandingBoot = (function () {
  var cfg = window.XINDE;
  var R = window.LPRender;
  window.__LP_MODE = true;

  var IS_PREVIEW = new URLSearchParams(window.location.search).get('preview') === '1';
  var CURRENT = { main: false, slug: 'utama' };

  // ---------------- helpers form leads ----------------
  function normPhone(p) {
    var d = String(p).replace(/[^\d]/g, '');
    if (!d) return '';
    if (d[0] === '0') d = '62' + d.slice(1);
    else if (d[0] !== '6' && d[0] !== '9') d = '62' + d;
    return d;
  }
  function markInvalid(field) {
    if (!field) return;
    var f = field.closest('.field');
    if (!f) return;
    f.classList.add('invalid');
    field.addEventListener('input', function () { f.classList.remove('invalid'); }, { once: true });
  }
  function saveLead(payload, onDone, onFail) {
    if (!cfg.supabaseConfigured() || !window.supabase) { onDone(); return; }
    var client = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    client.from('leads').insert(payload).then(function (r) {
      if (r.error) return onFail('Gagal simpan data: ' + (r.error.message || 'coba lagi'));
      onDone();
    }).catch(function () { onFail('Gagal daftar, coba lagi.'); });
  }

  function applyAccent(accent) {
    if (!accent) return;
    var st = document.createElement('style');
    st.textContent = ':root{--green:' + accent + '}.hl{color:' + accent + '}';
    document.head.appendChild(st);
  }

  // ---------------- Render ----------------
  function buildPage(content, opts) {
    var main = !!(opts && opts.main);
    var ctx = R.makeContext(content.meta);
    applyAccent(ctx.accent);

    if (content.meta && content.meta.page_title) {
      document.title = content.meta.page_title;
      var d = document.getElementById('pageDesc');
      if (d && content.meta.page_desc) d.setAttribute('content', content.meta.page_desc);
    }

    // Landing utama: pastikan semua section default selalu ada (tidak hilang)
    var secs = main ? R.mergeDefaults(content.sections) : (Array.isArray(content.sections) ? content.sections : []);
    var contentOut = R.prepare({ meta: content.meta, sections: secs });
    document.getElementById('lpNav').innerHTML = R.renderNav(contentOut.meta, ctx);
    document.getElementById('lpRoot').innerHTML = R.renderSections(contentOut, ctx);
    document.getElementById('lpFooter').innerHTML = R.renderFooter(contentOut.meta, ctx);
    bindInteractions();
  }

  function bindInteractions() {
    var rev = document.getElementById('lpRoot').querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && rev.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.1 });
      rev.forEach(function (el) { io.observe(el); });
    }

    var burger = document.getElementById('hamburger');
    if (burger) {
      burger.onclick = function () { document.getElementById('navLinks').classList.toggle('open'); };
    }
  }

  // ============ Event delegation ============
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.faq__q');
    if (btn) {
      var item = btn.closest('.faq__item');
      if (item) item.classList.toggle('open');
    }
  });

  // ============ Form Komunitas Gratis → tabel leads (source: komunitas) ============
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.id !== 'commForm') return;
    e.preventDefault();
    var name = document.getElementById('commName').value.trim();
    var email = document.getElementById('commEmail').value.trim();
    var phoneRaw = document.getElementById('commWhatsapp').value.trim();
    var btn = document.getElementById('commSubmit');
    var err = document.getElementById('commError');

    var ok = true;
    if (!name) { markInvalid(document.getElementById('commName')); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { markInvalid(document.getElementById('commEmail')); ok = false; }
    if (!normPhone(phoneRaw)) { markInvalid(document.getElementById('commWhatsapp')); ok = false; }
    if (!ok) return;

    err.classList.remove('show');
    btn.disabled = true;
    btn.textContent = 'Mengirim…';

    var done = function () {
      document.getElementById('commDoneName').textContent = name;
      form.style.display = 'none';
      document.getElementById('commDone').style.display = 'block';
    };
    var fail = function (msg) {
      btn.disabled = false;
      btn.textContent = 'Gabung Gratis →';
      err.textContent = '⚠️ ' + (msg || 'Gagal daftar, coba lagi.');
      err.classList.add('show');
    };

    saveLead({
      name: name,
      email: email,
      whatsapp: normPhone(phoneRaw),
      status: 'belum',
      source: 'komunitas'
    }, done, fail);
  });

  // ============ Preview mode (embedded di admin) ============
  function embeddedReceive(e) {
    if (!e.data || e.data.type !== 'lp-draft') return;
    buildPage(e.data.content || { meta: {}, sections: [] }, { main: CURRENT.main });
  }

  // ============ Loader ============
  function fetchKey(key) {
    return fetch(cfg.SUPABASE_URL + '/rest/v1/site_content?key=eq.' + encodeURIComponent(key) + '&select=key,value', {
      headers: { 'apikey': cfg.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY }
    }).then(function (r) { return r.json(); }).then(function (rows) {
      return (rows && rows[0] && rows[0].value) ? rows[0].value : null;
    }).catch(function () { return null; });
  }

  function contentFrom(v, slug, main) {
    var meta = Object.assign({}, cfg.DEFAULT_LANDING.meta || {}, (v && v.meta) || {});
    if (!main) meta = Object.assign({}, meta, { slug: slug, is_custom: true });
    var sections = (v && Array.isArray(v.sections) && v.sections.length) ? v.sections : [];
    return { meta: meta, sections: sections };
  }

  function minimalSections(slug) {
    var label = String(slug).replace(/[_-]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }).trim();
    if (!label) label = 'Custom';
    var st = R.defaultStyles();
    return {
      meta: { slug: slug, title: label, page_title: label + ' — Xinde Labs', accent: '#00ff88', is_custom: true },
      sections: [
        { id: 'hero', type: 'hero', anchor: 'hero', style: st, data: {
          eyebrow: 'xindelabs · landing page',
          title: 'Landing <span class="hl">Halaman ' + label + '</span>',
          subtitle: 'Halaman ini belum diisi kontennya. Atur lewat menu Landing Page di admin.',
          cta_text: 'Kembali ke Beranda',
          cta_link: 'index.html',
          cta2_text: '', cta2_link: '', anchor: '', show_timer: false
        } },
        { id: 'cta', type: 'cta', anchor: 'closing', style: st, data: {
          eyebrow: '', title: 'Belum ada konten di halaman ini.<br /><span class="hl">Buka menu Landing Page di admin untuk mengaturnya.</span>',
          subtitle: '', btn_text: 'Kembali ke Beranda', btn_link: 'index.html', anchor: ''
        } }
      ]
    };
  }

  function buildFallback() {
    if (CURRENT.main) {
      buildPage(contentFrom(cfg.DEFAULT_LANDING, 'utama', true), { main: true });
    } else {
      buildPage(minimalSections(CURRENT.slug), { main: false });
    }
  }

  function loadLanding(slug, main) {
    CURRENT.main = main;
    CURRENT.slug = slug || 'utama';

    if (IS_PREVIEW) {
      window.addEventListener('message', embeddedReceive);
      setTimeout(function () {
        if (!document.getElementById('lpRoot').innerHTML) buildFallback();
      }, 1500);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'lp-ready', href: window.location.href }, '*');
      }
      return;
    }

    if (!cfg.supabaseConfigured()) { buildFallback(); return; }

    // Utama → key 'homepage'; custom → 'lp_<slug>' lalu fallback row '<slug>' (legacy)
    var keys = main ? ['homepage'] : ['lp_' + CURRENT.slug, CURRENT.slug];
    var chain = Promise.resolve(null);
    keys.forEach(function (k) {
      chain = chain.then(function (found) { return found ? found : fetchKey(k); });
    });
    chain.then(function (v) {
      if (v) buildPage(contentFrom(v, CURRENT.slug, main), { main: main });
      else buildFallback();
    }).catch(function () { buildFallback(); });
  }

  function init(opts) {
    opts = opts || {};
    document.documentElement.classList.add('js');
    loadLanding(opts.slug || 'utama', !!opts.main);
  }

  return {
    init: init,
    buildPage: buildPage,
    buildFallback: buildFallback
  };
})();