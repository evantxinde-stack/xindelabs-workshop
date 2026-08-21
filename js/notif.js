/* ============================================================
   SALES NOTIFICATION — social proof popup
   Real leads dari Supabase + fallback random.
   ============================================================ */
(function () {
  var cfg = window.XINDE;
  var FALLBACK_DATA = [
    { name: 'Budi S.', city: 'Jakarta', minutes: 3 },
    { name: 'Maya R.', city: 'Surabaya', minutes: 7 },
    { name: 'Andi K.', city: 'Bandung', minutes: 12 },
    { name: 'Rina W.', city: 'Medan', minutes: 18 },
    { name: 'Dimas P.', city: 'Yogyakarta', minutes: 25 },
    { name: 'Sari L.', city: 'Semarang', minutes: 31 },
    { name: 'Fajar H.', city: 'Makassar', minutes: 42 },
    { name: 'Nina T.', city: 'Palembang', minutes: 55 },
    { name: 'Hendra J.', city: 'Denpasar', minutes: 68 },
    { name: 'Lia M.', city: 'Balikpapan', minutes: 80 },
    { name: 'Rizky A.', city: 'Malang', minutes: 95 },
    { name: 'Putri D.', city: 'Bogor', minutes: 110 }
  ];

  var realLeads = [];
  var shownIndex = 0;

  function timeAgo(minutes) {
    if (minutes < 1) return 'baru saja';
    if (minutes < 60) return minutes + ' menit lalu';
    var h = Math.floor(minutes / 60);
    if (h < 24) return h + ' jam lalu';
    var d = Math.floor(h / 24);
    return d + ' hari lalu';
  }

  function showNotif(name, city, minutes) {
    var el = document.getElementById('salesNotif');
    if (!el) return;
    el.querySelector('.notif__name').textContent = name;
    el.querySelector('.notif__city').textContent = city;
    el.querySelector('.notif__time').textContent = timeAgo(minutes);
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 5000);
  }

  function pickAndShow() {
    var pool = realLeads.length ? realLeads : FALLBACK_DATA;
    var item = pool[shownIndex % pool.length];
    shownIndex++;
    showNotif(item.name, item.city, item.minutes || item.minutes_ago);
  }

  function fetchLeads() {
    if (!cfg || !cfg.supabaseConfigured() || !window.supabase) return;
    var client = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    client.from('leads').select('name, whatsapp, created_at, email')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(function (res) {
        if (res.error || !res.data || !res.data.length) return;
        realLeads = res.data
          .filter(function (r) { return r.name; })
          .map(function (r) {
            var mins = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 60000);
            var name = r.name.trim();
            var display = name.length > 12 ? name.substring(0, 10) + '.' : name;
            var cityMatch = r.email ? r.email.split('@')[1] : '';
            return { name: display, city: 'Indonesia', minutes: Math.max(1, mins) };
          });
      })
      .catch(function () {});
  }

  fetchLeads();

  function loop() {
    pickAndShow();
    var delay = 35000 + Math.random() * 30000;
    setTimeout(loop, delay);
  }

  setTimeout(loop, 8000);
})();
