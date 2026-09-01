/* ============================================================
   COUNTDOWN TIMER — sticky bar + inline
   Waktu akhir promo bisa di-set dari Admin CMS:
   - site_content (key homepage atau lp_<slug>)
     value.promo_countdown_until :
       'datetime+07:00' → countdown ke tanggal itu
       '' (kosong)      → pakai default (TARGET_DATE di bawah)
       'OFF'            → matikan total (tidak tampil)
   ============================================================ */
(function () {
  var TARGET_DATE = '2026-08-31T23:59:59+07:00';
  var targetDate = TARGET_DATE;

  function getTimeLeft() {
    if (!targetDate) return null;
    var diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000)
    };
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function formatTime(t) {
    if (!t) return null;
    var parts = [];
    if (t.days > 0) parts.push(t.days + ' hari');
    parts.push(pad(t.hours) + ':' + pad(t.minutes) + ':' + pad(t.seconds));
    return parts.join(' ');
  }

  function render() {
    var t = getTimeLeft();
    var display = formatTime(t);

    var sticky = document.getElementById('timerSticky');
    var inline = document.getElementById('timerInline');
    var inlineCheckout = document.getElementById('timerInlineCheckout');

    if (!t) {
      if (sticky) sticky.style.display = 'none';
      if (inline) inline.style.display = 'none';
      if (inlineCheckout) inlineCheckout.style.display = 'none';
      return;
    }

    if (sticky) {
      sticky.querySelector('.timer__countdown').textContent = display;
      sticky.style.display = '';
    }
    if (inline) {
      inline.querySelector('.timer__countdown').textContent = display;
      inline.style.display = '';
    }
    if (inlineCheckout) {
      inlineCheckout.querySelector('.timer__countdown').textContent = display;
      inlineCheckout.style.display = '';
    }
  }

  // Ambil nilai promo_countdown_until dari satu row content
  function applyCMS(v) {
    if (!v) return;
    if (!Object.prototype.hasOwnProperty.call(v, 'promo_countdown_until')) return;
    var cut = v.promo_countdown_until;
    if (cut === 'OFF' || cut === 'off' || cut === 'OFFLINE') { targetDate = null; return; }
    if (!cut) { targetDate = TARGET_DATE; return; }
    var t = new Date(cut).getTime();
    if (!isNaN(t)) { targetDate = cut; return; }
    targetDate = TARGET_DATE;
  }

  // Tentukan landing yang sedang dibuka (untuk page.html) atau homepage
  function resolveRefs() {
    var q = new URLSearchParams(location.search).get('slug');
    var slug = null;
    if (q && q !== 'utama') slug = q;
    if (!slug) {
      var h = String(location.hostname).split('.')[0];
      if (h && h !== 'www' && h !== 'xindelabs-workshop' && h !== 'xindelabs' && h !== 'localhost' && h !== '127.0.0.1') slug = h;
    }
    return slug ? { key: 'lp_' + slug } : null;
  }

  function loadCountdownFromCMS() {
    var cfg = window.XINDE;
    if (!cfg || !cfg.supabaseConfigured || !cfg.supabaseConfigured()) return;

    var headers = { 'apikey': cfg.SUPABASE_ANON_KEY };
    var landing = resolveRefs();

    var home = fetch(cfg.SUPABASE_URL + '/rest/v1/site_content?key=eq.homepage&select=value', { headers: headers })
      .then(function (r) { return r.json(); }).then(function (rows) {
        return (rows && rows[0] && rows[0].value) || null;
      }).catch(function () { return null; });

    var lp = landing ? fetch(cfg.SUPABASE_URL + '/rest/v1/site_content?key=eq.' + encodeURIComponent(landing.key) + '&select=value', { headers: headers })
      .then(function (r) { return r.json(); }).then(function (rows) {
        return (rows && rows[0] && rows[0].value) || null;
      }).catch(function () { return null; }) : Promise.resolve(null);

    Promise.all([home, lp]).then(function (res) {
      var homeV = res[0];
      var lpV = res[1];
      // Prioritas: landing punya value sendiri → pakai itu; kalau landing kosong/null,
      // pakai value homepage. Kalau dua-duanya tidak ada field → fallback default.
      var used = false;
      if (lpV && Object.prototype.hasOwnProperty.call(lpV, 'promo_countdown_until')) {
        applyCMS(lpV); used = true;
      } else if (homeV && Object.prototype.hasOwnProperty.call(homeV, 'promo_countdown_until')) {
        applyCMS(homeV); used = true;
      }
      if (used) render();
    });
  }

  render();
  loadCountdownFromCMS();
  setInterval(render, 1000);
})();
