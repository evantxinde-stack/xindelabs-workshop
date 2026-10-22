/* ============================================================
   Affiliate referral tracker
   - Baca ?ref=KODE dari URL, simpan di cookie + localStorage (30 hari)
   - Hitung 1 klik per kode per sesi browser (via RPC Supabase)
   - checkout.html pakai window.XINDE_AFF.getRef() buat dikirim ke n8n
   ============================================================ */
(function () {
  var COOKIE = 'xinde_ref';
  var LS_KEY = 'xinde_ref';
  var SS_KEY = 'xinde_ref_sent';
  var MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

  function norm(v) {
    return String(v == null ? '' : v).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
  }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function setCookie(name, value, maxAge) {
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; Max-Age=' + maxAge + '; Path=/; SameSite=Lax' + secure;
  }

  function save(code) {
    setCookie(COOKIE, code, MAX_AGE);
    try { localStorage.setItem(LS_KEY, code); } catch (e) {}
  }

  function read() {
    var c = norm(getCookie(COOKIE));
    if (c) return c;
    try { return norm(localStorage.getItem(LS_KEY)); } catch (e) { return ''; }
  }

  function track(code) {
    var cfg = window.XINDE;
    if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
    try { if (sessionStorage.getItem(SS_KEY) === code) return; } catch (e) {}
    fetch(cfg.SUPABASE_URL + '/rest/v1/rpc/affiliate_track_click', {
      method: 'POST',
      headers: {
        'apikey': cfg.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_code: code }),
      keepalive: true
    }).then(function () {
      try { sessionStorage.setItem(SS_KEY, code); } catch (e) {}
    }).catch(function () {});
  }

  var ref = '';
  try {
    ref = norm(new URLSearchParams(location.search).get('ref'));
  } catch (e) {}

  if (ref) {
    save(ref);
    track(ref);
  }

  window.XINDE_AFF = {
    getRef: function () { return read(); },
    code: read()
  };
})();
