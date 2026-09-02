/* ============================================================
   Meta Pixel — base code RESMI Meta (fbq.queue structure)
   Pixel ID dari config.js (window.XINDE.PIXEL_ID)
   Fix 2026-08-31: ganti base code custom (array) → official snippet,
   karena library fbevents 2.9.x menolak queue versi lama
   ("Multiple pixels with conflicting versions" → event tidak pernah terkirim).
   ============================================================ */
(function () {
  if (!window.XINDE) return;
  var pixelId = window.XINDE.PIXEL_ID;
  if (!pixelId) return;

  // ===== Base code RESMI Meta (fbq.queue structure) =====
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', pixelId);
  fbq('track', 'PageView');
})();
