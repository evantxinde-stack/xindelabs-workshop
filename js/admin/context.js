// ============================================================
// ADMIN SHARED CONTEXT & PURE HELPERS
// Dipakai oleh modul dashboard / pipeline / funnel builder / lms.
// Fungsi pure di file ini bisa dites tanpa DOM.
// ============================================================

export const STAGE_ORDER = [
  { key: 'landing_view', label: 'Landing View' },
  { key: 'opt_in', label: 'Opt-in' },
  { key: 'watching_tutorial', label: 'Nonton Tutorial' },
  { key: 'checkout_initiated', label: 'Checkout' },
  { key: 'unpaid_invoice', label: 'Invoice Dibuat' },
  { key: 'paid', label: 'Paid' }
];

export const PAID_STATUSES = ['bayar', 'paid', 'fast_track_paid', 'vip_paid', 'joined_group'];

export function esc(s = '') {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

// Error Supabase yang berarti skema DB belum lengkap (kolom/tabel hilang).
export function isSchemaError(err) {
  const code = String((err && err.code) || '');
  const msg = String((err && (err.message || err.details || err.hint)) || err || '');
  return /does not exist|schema cache|PGRST20[45]|42P01|42703|42883|not found in schema/i.test(code + ' ' + msg);
}

// Petunjuk perbaikan untuk error skema.
export function schemaHint(err) {
  if (!isSchemaError(err)) return '';
  return ' <b>Skema database belum lengkap.</b> Jalankan <code>sql/migrate_2026_admin.sql</code> di Supabase SQL Editor, lalu muat ulang halaman.';
}

export function fmtRp(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

export function fmtNum(n) {
  return Number(n || 0).toLocaleString('id-ID');
}

export function fmtDate(dt, opts) {
  if (!dt) return '—';
  const d = dt instanceof Date ? dt : new Date(dt);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(dt) {
  if (!dt) return '—';
  const d = dt instanceof Date ? dt : new Date(dt);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function dayKey(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return '';
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * @param {'7d'|'30d'|'90d'|'all'|'custom'} preset
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 */
export function resolveRange(preset, from, to) {
  const now = new Date();
  if (preset === 'custom' && from && to) {
    return {
      preset,
      start: startOfDay(new Date(from + 'T00:00:00')),
      end: endOfDay(new Date(to + 'T00:00:00')),
      label: fmtDate(from) + ' – ' + fmtDate(to)
    };
  }
  if (preset === 'all') {
    return { preset, start: null, end: null, label: 'Semua waktu' };
  }
  const days = preset === '90d' ? 90 : preset === '7d' ? 7 : 30;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  return {
    preset: preset || '30d',
    start,
    end: endOfDay(now),
    label: days + ' hari terakhir'
  };
}

export function inRange(dt, range) {
  if (!range || (!range.start && !range.end)) return true;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return false;
  if (range.start && d < range.start) return false;
  if (range.end && d > range.end) return false;
  return true;
}

export function rangeToIso(range) {
  return {
    from: range && range.start ? range.start.toISOString() : null,
    to: range && range.end ? range.end.toISOString() : null
  };
}

/**
 * Deret harian: jumlah leads, paid, dan revenue.
 * @returns {{day:string,label:string,leads:number,paid:number,revenue:number}[]}
 */
export function buildDailySeries(leads, orders, range, maxDays = 120) {
  const leadList = Array.isArray(leads) ? leads : [];
  const orderList = Array.isArray(orders) ? orders : [];

  let start = range && range.start ? new Date(range.start) : null;
  let end = range && range.end ? new Date(range.end) : new Date();
  if (!start) {
    const dates = leadList.concat(orderList)
      .map((x) => new Date(x.created_at || x.paid_at))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a - b);
    start = dates.length ? startOfDay(dates[0]) : startOfDay(end);
    const cap = startOfDay(new Date(end.getTime() - (maxDays - 1) * 86400000));
    if (start < cap) start = cap;
  }
  start = startOfDay(start);
  end = startOfDay(end);

  const leadsByDay = {};
  leadList.forEach((l) => {
    const k = dayKey(l.created_at);
    leadsByDay[k] = (leadsByDay[k] || 0) + 1;
  });
  const paidByDay = {};
  const revenueByDay = {};
  orderList.forEach((o) => {
    if (o.status !== 'paid') return;
    const k = dayKey(o.paid_at || o.created_at);
    paidByDay[k] = (paidByDay[k] || 0) + 1;
    revenueByDay[k] = (revenueByDay[k] || 0) + (Number(o.amount) || 0);
  });

  const out = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 400) {
    const k = dayKey(cursor);
    out.push({
      day: k,
      label: cursor.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      leads: leadsByDay[k] || 0,
      paid: paidByDay[k] || 0,
      revenue: revenueByDay[k] || 0
    });
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return out;
}

function stageIndexOf(lead) {
  let idx = 0;
  const stage = lead && lead.current_stage;
  const fromStage = STAGE_ORDER.findIndex((s) => s.key === stage);
  if (fromStage > idx) idx = fromStage;
  if (lead && PAID_STATUSES.includes(lead.status)) idx = STAGE_ORDER.length - 1;
  return idx;
}

/**
 * Hitung drop-off per stage dari pipeline_events + current_stage + paid order.
 * @returns {{stages:Array, byStage:Object<string, Array>}}
 */
export function computeDropoff(leads, events, orders) {
  const leadList = Array.isArray(leads) ? leads : [];
  const eventList = Array.isArray(events) ? events : [];
  const orderList = Array.isArray(orders) ? orders : [];

  const paidLeadIds = new Set(
    orderList.filter((o) => o.status === 'paid' && o.lead_id).map((o) => String(o.lead_id))
  );

  const maxByLead = {};
  leadList.forEach((l) => {
    maxByLead[String(l.id)] = stageIndexOf(l);
  });

  eventList.forEach((ev) => {
    const id = ev.lead_id ? String(ev.lead_id) : null;
    if (!id || maxByLead[id] === undefined) return;
    const idx = STAGE_ORDER.findIndex((s) => s.key === ev.event_type);
    if (idx > maxByLead[id]) maxByLead[id] = idx;
  });

  leadList.forEach((l) => {
    if (paidLeadIds.has(String(l.id))) maxByLead[String(l.id)] = STAGE_ORDER.length - 1;
  });

  const reached = STAGE_ORDER.map(() => 0);
  const byStage = {};
  STAGE_ORDER.forEach((s) => { byStage[s.key] = []; });

  leadList.forEach((l) => {
    const max = maxByLead[String(l.id)] || 0;
    for (let i = 0; i <= max; i++) reached[i]++;
    byStage[STAGE_ORDER[max].key].push(l);
  });

  const stages = STAGE_ORDER.map((s, i) => {
    const count = reached[i];
    const prev = i === 0 ? count : reached[i - 1];
    const dropped = Math.max(0, prev - count);
    return {
      key: s.key,
      label: s.label,
      reached: count,
      dropped,
      droppedPct: prev ? Math.round((dropped / prev) * 100) : 0,
      convFromStart: leadList.length ? Math.round((count / leadList.length) * 100) : 0,
      convFromPrev: prev ? Math.round((count / prev) * 100) : 0
    };
  });

  return { stages, byStage, maxByLead };
}

export function funnelKeyOf(lead) {
  return (lead && (lead.funnel_slug || lead.subdomain)) || 'default';
}

/**
 * Konversi & revenue per subdomain/funnel.
 */
export function computeSubdomainConversion(leads, orders, funnels) {
  const leadList = Array.isArray(leads) ? leads : [];
  const orderList = Array.isArray(orders) ? orders : [];
  const funnelList = Array.isArray(funnels) ? funnels : [];

  const paidLeadIds = new Set(
    orderList.filter((o) => o.status === 'paid' && o.lead_id).map((o) => String(o.lead_id))
  );
  const revenueByLead = {};
  orderList.forEach((o) => {
    if (o.status !== 'paid' || !o.lead_id) return;
    const id = String(o.lead_id);
    revenueByLead[id] = (revenueByLead[id] || 0) + (Number(o.amount) || 0);
  });

  const buckets = {};
  function bucket(key) {
    if (!buckets[key]) {
      buckets[key] = { key, label: key, leads: 0, paid: 0, revenue: 0, conv: 0 };
    }
    return buckets[key];
  }

  // Semua funnel terdaftar, walau belum ada lead
  funnelList.forEach((f) => {
    const key = f.slug || f.subdomain || f.id;
    const b = bucket(key);
    b.label = f.name ? `${f.name} (${f.subdomain || f.slug})` : (f.subdomain || f.slug || key);
  });

  leadList.forEach((l) => {
    const key = funnelKeyOf(l);
    const b = bucket(key);
    b.leads++;
    const isPaid = paidLeadIds.has(String(l.id)) || PAID_STATUSES.includes(l.status);
    if (isPaid) {
      b.paid++;
      b.revenue += revenueByLead[String(l.id)] || 0;
    }
  });

  Object.values(buckets).forEach((b) => {
    b.conv = b.leads ? Math.round((b.paid / b.leads) * 100) : 0;
  });

  return Object.values(buckets).sort((a, b) => b.leads - a.leads || b.conv - a.conv);
}

/**
 * Total revenue: paid orders + legacy member paid yang emailnya belum
 * punya order (biar nggak dobel hitung).
 */
export function sumRevenue(orders, members, prices) {
  const orderList = Array.isArray(orders) ? orders : [];
  const memberList = Array.isArray(members) ? members : [];
  const priceMap = {
    yearly: (prices && prices.yearly && (prices.yearly.harga || prices.yearly.price)) || 599000,
    lifetime: (prices && prices.lifetime && (prices.lifetime.harga || prices.lifetime.price)) || 999000
  };

  const paidOrders = orderList.filter((o) => o.status === 'paid');
  const ordersRevenue = paidOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const orderedEmails = new Set();
  paidOrders.forEach((o) => {
    const em = (o.leads && o.leads.email) || o.email;
    if (em) orderedEmails.add(String(em).toLowerCase());
  });

  let legacyRevenue = 0;
  let legacyCount = 0;
  memberList.forEach((m) => {
    if (m.status !== 'paid') return;
    if (m.email && orderedEmails.has(String(m.email).toLowerCase())) return;
    legacyCount++;
    legacyRevenue += Number(m.tier === 'lifetime' ? priceMap.lifetime : priceMap.yearly) || 0;
  });

  return {
    total: ordersRevenue + legacyRevenue,
    ordersRevenue,
    legacyRevenue,
    paidOrderCount: paidOrders.length,
    legacyCount
  };
}

/**
 * Ganti variabel template WA.
 * Mendukung {{name}} / {{subdomain}} / {{payment_url}} dan format lama {nama}.
 */
export function renderTemplate(content, vars) {
  const map = {
    name: (vars && vars.name) || '',
    subdomain: (vars && vars.subdomain) || '',
    payment_url: (vars && vars.payment_url) || ''
  };
  return String(content == null ? '' : content)
    .replace(/\{\{\s*(name|nama)\s*\}\}/gi, map.name)
    .replace(/\{\{\s*subdomain\s*\}\}/gi, map.subdomain)
    .replace(/\{\{\s*payment_url\s*\}\}/gi, map.payment_url)
    .replace(/\{\s*(nama|name)\s*\}/gi, map.name)
    .replace(/\{\s*subdomain\s*\}/gi, map.subdomain)
    .replace(/\{\s*payment_url\s*\}/gi, map.payment_url);
}

export function normalizeWa(raw) {
  let digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  else if (digits.startsWith('8')) digits = '62' + digits;
  return digits;
}

export function waLink(raw, text) {
  const n = normalizeWa(raw);
  if (!n) return '';
  return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
}

export function toast(msg, type = 'ok') {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('aToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aToast';
    el.className = 'a-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'a-toast is-' + type + ' show';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = 'a-toast is-' + type; }, 3200);
}

export function createContext(client, cfg) {
  return { client, cfg: cfg || window.XINDE || {}, esc, fmtRp, fmtNum, fmtDate, fmtDateTime, toast };
}

export function debounce(fn, ms = 250) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}
