/* ============================================================
   Meta Pixel — di-load di semua halaman (PRD §5)
   ============================================================ */
(function () {
  if (!window.XINDE) return;
  var pixelId = window.XINDE.PIXEL_ID;
  if (!pixelId) return;

  var f = window._fbq = (window._fbq || []);
  if (!f.loaded) {
    f.loaded = true;
    f.version = '2.0';
    f.queue = [];
  }
  window.fbq = function () { f.push(arguments); };

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  var first = document.getElementsByTagName('script')[0];
  first.parentNode.insertBefore(s, first);

  fbq('init', pixelId);
  fbq('track', 'PageView');
})();
