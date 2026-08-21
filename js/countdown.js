/* ============================================================
   COUNTDOWN TIMER — sticky bar + inline
   Target date di-set di TARGET_DATE di bawah.
   ============================================================ */
(function () {
  var TARGET_DATE = '2026-08-31T23:59:59+07:00';

  function getTimeLeft() {
    var diff = new Date(TARGET_DATE).getTime() - Date.now();
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

  render();
  setInterval(render, 1000);
})();
