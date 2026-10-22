// ============================================================
// DASHBOARD OVERVIEW
// Filter tanggal, KPI, grafik Recharts, konversi per subdomain,
// leads harian, dan daftar unpaid invoice.
// ============================================================
import {
  esc, fmtRp, fmtNum, fmtDate, fmtDateTime, resolveRange, rangeToIso,
  buildDailySeries, computeSubdomainConversion, sumRevenue, toast
} from './context.js';
import { ensureRecharts, mountChart, chartEl } from './charts.js';

let ctx = null;
let state = {
  preset: '30d',
  from: '',
  to: '',
  range: resolveRange('30d'),
  loading: false,
  data: null
};
let initialized = false;

const $ = (id) => document.getElementById(id);

const DASH_HTML = `
  <div class="section-head" style="text-align:left">
    <p class="eyebrow"><span class="dot"></span>admin</p>
    <h2 class="h2">Dashboard Overview</h2>
    <p class="lead">Revenue, konversi per subdomain, leads harian, dan invoice belum dibayar.</p>
  </div>

  <div class="a-range">
    <div class="a-range__presets" id="dashRange">
      <button type="button" class="a-filter" data-range="7d">7 hari</button>
      <button type="button" class="a-filter is-active" data-range="30d">30 hari</button>
      <button type="button" class="a-filter" data-range="90d">90 hari</button>
      <button type="button" class="a-filter" data-range="all">Semua</button>
    </div>
    <div class="a-range__custom">
      <input type="date" id="dashFrom" class="a-input">
      <span class="l-meta">s/d</span>
      <input type="date" id="dashTo" class="a-input">
      <button type="button" class="btn btn--ghost btn--sm" id="dashApplyRange">Terapkan</button>
      <button type="button" class="btn btn--ghost btn--sm" id="dashRefresh">↻ Refresh</button>
    </div>
  </div>

  <div class="notice notice--warn" id="dashNotice" style="display:none"></div>
  <div class="d-kpis" id="dashKpis"></div>

  <div class="a-card">
    <div class="a-card__head"><h3>Leads Harian</h3><span class="l-meta" id="dashLeadsMeta"></span></div>
    <div class="a-chart" id="dashLeadsChart"></div>
    <p class="a-chart-fallback" id="dashLeadsFallback" style="display:none"></p>
  </div>

  <div class="d-cols">
    <div class="a-card">
      <div class="a-card__head"><h3>Konversi per Subdomain</h3></div>
      <div class="a-chart" id="dashConvChart"></div>
      <p class="a-chart-fallback" id="dashConvFallback" style="display:none"></p>
      <div class="a-table-wrap">
        <table class="a-table">
          <thead><tr><th>Subdomain</th><th>Leads</th><th>Paid</th><th>Konversi</th><th>Revenue</th></tr></thead>
          <tbody id="dashConvBody"></tbody>
        </table>
      </div>
    </div>
    <div class="a-card">
      <div class="a-card__head"><h3>Revenue Harian</h3></div>
      <div class="a-chart" id="dashRevChart"></div>
      <p class="a-chart-fallback" id="dashRevFallback" style="display:none"></p>
    </div>
  </div>

  <div class="a-card">
    <div class="a-card__head"><h3>Unpaid Invoice</h3><span class="a-badge" id="dashUnpaidCount">0</span></div>
    <div class="a-table-wrap">
      <table class="a-table">
        <thead><tr><th>Lead</th><th>Subdomain</th><th>Paket</th><th>Nominal</th><th>Umur</th><th>Aksi</th></tr></thead>
        <tbody id="dashUnpaidBody"></tbody>
      </table>
    </div>
    <p class="a-empty" id="dashUnpaidEmpty" style="display:none">Tidak ada invoice belum dibayar.</p>
  </div>

  <div class="d-cols">
    <div class="a-card"><div class="a-card__head"><h3>Lead Terbaru</h3></div><table class="d-recent"><tbody id="dashRecentLeads"></tbody></table></div>
    <div class="a-card"><div class="a-card__head"><h3>Member Terbaru</h3></div><table class="d-recent"><tbody id="dashRecentMembers"></tbody></table></div>
  </div>
`;

function todayStr(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function ensurePanel() {
  const panel = document.getElementById('panelDashboard');
  if (!panel) return;
  if (panel.dataset.adminDash === '1') return;
  panel.innerHTML = DASH_HTML;
  panel.dataset.adminDash = '1';
}

export function init(context) {
  if (initialized) { ctx = context; return; }
  ctx = context;
  initialized = true;
  ensurePanel();

  const savedPreset = localStorage.getItem('xinde_dash_range') || '30d';
  state.preset = savedPreset;
  state.range = resolveRange(savedPreset);
  state.from = state.range.start ? todayStr(state.range.start) : '';
  state.to = state.range.end ? todayStr(state.range.end) : todayStr();

  document.querySelectorAll('#dashRange [data-range]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.preset = btn.dataset.range;
      state.range = resolveRange(state.preset);
      if (state.range.start) state.from = todayStr(state.range.start);
      state.to = state.range.end ? todayStr(state.range.end) : todayStr();
      $('dashFrom').value = state.from;
      $('dashTo').value = state.to;
      syncPresetButtons();
      localStorage.setItem('xinde_dash_range', state.preset);
      refresh();
    });
  });

  const apply = $('dashApplyRange');
  if (apply) apply.addEventListener('click', () => {
    state.preset = 'custom';
    state.from = $('dashFrom').value;
    state.to = $('dashTo').value;
    state.range = resolveRange('custom', state.from, state.to);
    localStorage.setItem('xinde_dash_range', 'custom');
    syncPresetButtons();
    refresh();
  });

  const refreshBtn = $('dashRefresh');
  if (refreshBtn) refreshBtn.addEventListener('click', refresh);

  if ($('dashFrom')) $('dashFrom').value = state.from;
  if ($('dashTo')) $('dashTo').value = state.to;
  syncPresetButtons();
}

function syncPresetButtons() {
  document.querySelectorAll('#dashRange [data-range]').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.range === state.preset);
  });
}

export function load() {
  if (!ctx || !ctx.client) return;
  refresh();
}

export async function refresh() {
  if (!ctx || !ctx.client || state.loading) return;
  state.loading = true;
  const notice = $('dashNotice');
  if (notice) notice.style.display = 'none';

  const { from, to } = rangeToIso(state.range);
  const client = ctx.client;

  const leadsQ = client.from('leads')
    .select('id,name,email,whatsapp,status,current_stage,funnel_slug,created_at,utm_source')
    .order('created_at', { ascending: false }).limit(2000);
  const ordersQ = client.from('orders')
    .select('id,lead_id,product,tier,amount,bump_amount,subdomain,payment_url,status,created_at,paid_at,leads(name,email,whatsapp,funnel_slug)')
    .order('created_at', { ascending: false }).limit(2000);
  const funnelsQ = client.from('funnels').select('id,slug,subdomain,name,is_active');
  const membersQ = client.from('members').select('id,email,status,tier,created_at').eq('status', 'paid').limit(2000);
  const unpaidQ = client.from('orders')
    .select('id,lead_id,product,tier,amount,bump_amount,subdomain,payment_url,status,created_at,leads(name,email,whatsapp,funnel_slug)')
    .eq('status', 'pending').order('created_at', { ascending: false }).limit(50);
  const recentLeadsQ = client.from('leads')
    .select('id,name,email,status,current_stage,created_at')
    .order('created_at', { ascending: false }).limit(6);
  const recentMembersQ = client.from('members')
    .select('id,email,status,tier,created_at')
    .order('created_at', { ascending: false }).limit(6);

  [leadsQ, ordersQ, unpaidQ].forEach((q) => {
    if (from) q.gte('created_at', from);
    if (to) q.lte('created_at', to);
  });

  try {
    const [leadsRes, ordersRes, funnelsRes, membersRes, unpaidRes, recentLeadsRes, recentMembersRes] = await Promise.all([
      leadsQ, ordersQ, funnelsQ, membersQ, unpaidQ, recentLeadsQ, recentMembersQ
    ]);

    if (leadsRes.error) throw leadsRes.error;
    if (ordersRes.error && !/relation|does not exist/i.test(ordersRes.error.message || '')) throw ordersRes.error;

    state.data = {
      leads: leadsRes.data || [],
      orders: ordersRes.error ? [] : (ordersRes.data || []),
      funnels: funnelsRes.error ? [] : (funnelsRes.data || []),
      members: membersRes.error ? [] : (membersRes.data || []),
      unpaid: unpaidRes.error ? [] : (unpaidRes.data || []),
      recentLeads: recentLeadsRes.error ? [] : (recentLeadsRes.data || []),
      recentMembers: recentMembersRes.error ? [] : (recentMembersRes.data || [])
    };

    renderKpis();
    renderRecent();
    renderUnpaid();
    await renderCharts();
  } catch (err) {
    console.error('[dashboard]', err);
    if (notice) {
      notice.style.display = 'block';
      notice.innerHTML = '⚠️ Gagal load dashboard: <b style="color:inherit">' + esc(err.message || '') + '</b>. ' +
        'Pastikan SQL <span style="font-family:var(--font-mono)">supabase_unified_schema.sql</span> sudah dijalankan.';
    }
  } finally {
    state.loading = false;
  }
}

function renderKpis() {
  const d = state.data || {};
  const leads = d.leads || [];
  const orders = d.orders || [];
  const rev = sumRevenue(orders, d.members, ctx.cfg && ctx.cfg.PRICES);
  const paidLeadIds = new Set(orders.filter((o) => o.status === 'paid' && o.lead_id).map((o) => String(o.lead_id)));
  const paidLeads = leads.filter((l) => paidLeadIds.has(String(l.id)) || ['bayar', 'paid', 'fast_track_paid', 'vip_paid'].includes(l.status)).length;
  const conv = leads.length ? Math.round((paidLeads / leads.length) * 100) : 0;
  const unpaidAmount = (d.unpaid || []).reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const aov = rev.paidOrderCount ? Math.round(rev.ordersRevenue / rev.paidOrderCount) : 0;

  const kpis = [
    { label: 'Total Revenue', val: fmtRp(rev.total), sub: 'order ' + fmtRp(rev.ordersRevenue) + (rev.legacyRevenue ? ' · legacy ' + fmtRp(rev.legacyRevenue) : ''), big: true },
    { label: 'Leads', val: fmtNum(leads.length), sub: state.range.label },
    { label: 'Paid Orders', val: fmtNum(rev.paidOrderCount), sub: 'legacy member ' + fmtNum(rev.legacyCount) },
    { label: 'Konversi', val: conv + '%', sub: paidLeads + ' dari ' + leads.length + ' lead' },
    { label: 'Avg Order Value', val: fmtRp(aov), sub: 'dari order paid' },
    { label: 'Unpaid Invoice', val: fmtNum((d.unpaid || []).length), sub: fmtRp(unpaidAmount) + ' tertahan' }
  ];

  const el = $('dashKpis');
  if (!el) return;
  el.innerHTML = kpis.map((k) =>
    '<div class="d-kpi' + (k.big ? ' is-big' : '') + '"><span>' + esc(k.label) + '</span><b>' + k.val + '</b><div class="sub">' + esc(k.sub) + '</div></div>'
  ).join('');
}

function renderRecent() {
  const d = state.data || {};
  const leadEl = $('dashRecentLeads');
  const memberEl = $('dashRecentMembers');
  if (leadEl) {
    const rows = (d.recentLeads || []).map((l) =>
      '<tr><td><div class="d-name">' + esc(l.name || '—') + '</div>' +
      '<div class="d-sub">' + esc(l.email || '—') + ' · ' + esc(fmtDateTime(l.created_at)) + '</div></td>' +
      '<td><span class="d-badge st-' + esc(l.status || 'baru') + '">' + esc(l.status || '—') + '</span></td></tr>'
    ).join('');
    leadEl.innerHTML = rows || '<tr><td class="a-empty">Belum ada lead.</td></tr>';
  }
  if (memberEl) {
    const rows = (d.recentMembers || []).map((m) =>
      '<tr><td><div class="d-name">' + esc(m.email || '—') + '</div>' +
      '<div class="d-sub">' + (m.tier === 'lifetime' ? 'Lifetime' : 'Tahunan') + ' · ' + esc(fmtDate(m.created_at)) + '</div></td>' +
      '<td><span class="d-badge st-' + esc(m.status || '') + '">' + esc(m.status || '—') + '</span></td></tr>'
    ).join('');
    memberEl.innerHTML = rows || '<tr><td class="a-empty">Belum ada member.</td></tr>';
  }
}

function renderUnpaid() {
  const list = (state.data && state.data.unpaid) || [];
  const countEl = $('dashUnpaidCount');
  if (countEl) countEl.textContent = list.length;
  const body = $('dashUnpaidBody');
  const empty = $('dashUnpaidEmpty');
  if (!body) return;
  if (!list.length) {
    body.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  body.innerHTML = list.map((o) => {
    const lead = o.leads || {};
    const ageDays = Math.max(0, Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86400000));
    const pay = o.payment_url
      ? '<a class="btn btn--primary btn--sm" target="_blank" rel="noopener" href="' + esc(o.payment_url) + '">Bayar →</a>'
      : '<span class="l-meta">—</span>';
    const wa = lead.whatsapp
      ? '<button type="button" class="btn btn--ghost btn--sm unpaid-wa" data-order="' + esc(o.id) + '">WA →</button>'
      : '';
    return '<tr>' +
      '<td><div class="l-name">' + esc(lead.name || '—') + '</div><div class="l-meta">' + esc(lead.email || lead.whatsapp || '') + '</div></td>' +
      '<td>' + esc(o.subdomain || lead.funnel_slug || '—') + '</td>' +
      '<td>' + esc(o.product || o.tier || '—') + '</td>' +
      '<td><b>' + fmtRp(o.amount) + '</b></td>' +
      '<td>' + ageDays + ' hari</td>' +
      '<td><div class="a-actions">' + pay + wa + '</div></td>' +
      '</tr>';
  }).join('');

  body.querySelectorAll('.unpaid-wa').forEach((btn) => {
    btn.addEventListener('click', () => {
      const order = list.find((o) => String(o.id) === btn.dataset.order);
      if (!order) return;
      const lead = Object.assign({}, order.leads || {}, {
        funnel_slug: (order.leads && order.leads.funnel_slug) || order.subdomain,
        payment_url: order.payment_url
      });
      const pipeline = window.__ADMIN_MODULES__ && window.__ADMIN_MODULES__.pipeline;
      if (pipeline && pipeline.openWaForLead) pipeline.openWaForLead(lead, order);
      else toast('Modul pipeline belum siap.', 'warn');
    });
  });
}

async function renderCharts() {
  const d = state.data || {};
  const series = buildDailySeries(d.leads, d.orders, state.range);
  const conv = computeSubdomainConversion(d.leads, d.orders, d.funnels);

  const leadsMeta = $('dashLeadsMeta');
  if (leadsMeta) {
    const total = series.reduce((s, x) => s + x.leads, 0);
    leadsMeta.textContent = fmtNum(total) + ' lead · ' + state.range.label;
  }

  let ok = false;
  try {
    await ensureRecharts();
    ok = true;
  } catch (e) {
    console.warn('[dashboard] Recharts gagal dimuat:', e);
  }

  if (ok && window.Recharts) {
    paintLeadsChart(series);
    paintConvChart(conv);
    paintRevenueChart(series);
    ['dashLeadsFallback', 'dashConvFallback', 'dashRevFallback'].forEach((id) => {
      const el = $(id);
      if (el) el.style.display = 'none';
    });
    ['dashLeadsChart', 'dashConvChart', 'dashRevChart'].forEach((id) => {
      const el = $(id);
      if (el) el.style.display = 'block';
    });
  } else {
    ['dashLeadsChart', 'dashConvChart', 'dashRevChart'].forEach((id) => {
      const el = $(id);
      if (el) el.style.display = 'none';
    });
    fallbackText('dashLeadsFallback', series.map((s) => s.label + ': ' + s.leads).join(' · '));
    fallbackText('dashConvFallback', conv.map((c) => c.key + ': ' + c.conv + '%').join(' · '));
    fallbackText('dashRevFallback', series.map((s) => s.label + ': ' + fmtRp(s.revenue)).join(' · '));
  }

  renderConvTable(conv);
}

function fallbackText(id, text) {
  const el = $(id);
  if (!el) return;
  el.style.display = 'block';
  el.textContent = text || 'Belum ada data.';
}

function paintLeadsChart(series) {
  const el = $('dashLeadsChart');
  if (!el) return;
  mountChart(el, 'AreaChart', [
    chartEl('defs', null,
      chartEl('linearGradient', { id: 'gradLeads', x1: '0', y1: '0', x2: '0', y2: '1' },
        chartEl('stop', { offset: '5%', stopColor: '#22c55e', stopOpacity: 0.35 }),
        chartEl('stop', { offset: '95%', stopColor: '#22c55e', stopOpacity: 0 })
      )
    ),
    chartEl('CartesianGrid', { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,.08)' }),
    chartEl('XAxis', { dataKey: 'label', tick: { fontSize: 10, fill: '#8a9a8f' }, axisLine: false, tickLine: false, interval: 'preserveStartEnd' }),
    chartEl('YAxis', { allowDecimals: false, tick: { fontSize: 10, fill: '#8a9a8f' }, axisLine: false, tickLine: false, width: 32 }),
    chartEl('Tooltip', { contentStyle: tooltipStyle(), labelStyle: { color: '#e8f5ec' } }),
    chartEl('Area', { type: 'monotone', dataKey: 'leads', name: 'Leads', stroke: '#22c55e', strokeWidth: 2, fill: 'url(#gradLeads)' }),
    chartEl('Line', { type: 'monotone', dataKey: 'paid', name: 'Paid', stroke: '#38bdf8', strokeWidth: 2, dot: false })
  ], { data: series, margin: { top: 8, right: 12, left: 0, bottom: 0 } });
}

function paintConvChart(conv) {
  const el = $('dashConvChart');
  if (!el) return;
  const data = conv.slice(0, 8).map((c) => ({ name: c.key, conv: c.conv, leads: c.leads, paid: c.paid }));
  mountChart(el, 'BarChart', [
    chartEl('CartesianGrid', { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,.08)', horizontal: false }),
    chartEl('XAxis', { type: 'number', domain: [0, 100], tick: { fontSize: 10, fill: '#8a9a8f' }, axisLine: false, tickLine: false, unit: '%' }),
    chartEl('YAxis', { type: 'category', dataKey: 'name', width: 92, tick: { fontSize: 10, fill: '#8a9a8f' }, axisLine: false, tickLine: false }),
    chartEl('Tooltip', { contentStyle: tooltipStyle(), labelStyle: { color: '#e8f5ec' }, formatter: (v) => v + '%' }),
    chartEl('Bar', { dataKey: 'conv', name: 'Konversi', fill: '#22c55e', radius: [0, 4, 4, 0], barSize: 16 })
  ], { data, layout: 'vertical', margin: { top: 8, right: 16, left: 0, bottom: 0 } });
}

function paintRevenueChart(series) {
  const el = $('dashRevChart');
  if (!el) return;
  mountChart(el, 'AreaChart', [
    chartEl('defs', null,
      chartEl('linearGradient', { id: 'gradRev', x1: '0', y1: '0', x2: '0', y2: '1' },
        chartEl('stop', { offset: '5%', stopColor: '#38bdf8', stopOpacity: 0.35 }),
        chartEl('stop', { offset: '95%', stopColor: '#38bdf8', stopOpacity: 0 })
      )
    ),
    chartEl('CartesianGrid', { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,.08)' }),
    chartEl('XAxis', { dataKey: 'label', tick: { fontSize: 10, fill: '#8a9a8f' }, axisLine: false, tickLine: false, interval: 'preserveStartEnd' }),
    chartEl('YAxis', { tick: { fontSize: 10, fill: '#8a9a8f' }, axisLine: false, tickLine: false, width: 44, tickFormatter: (v) => v >= 1000000 ? (v / 1000000) + 'jt' : (v >= 1000 ? Math.round(v / 1000) + 'rb' : v) }),
    chartEl('Tooltip', { contentStyle: tooltipStyle(), labelStyle: { color: '#e8f5ec' }, formatter: (v) => fmtRp(v) }),
    chartEl('Area', { type: 'monotone', dataKey: 'revenue', name: 'Revenue', stroke: '#38bdf8', strokeWidth: 2, fill: 'url(#gradRev)' })
  ], { data: series, margin: { top: 8, right: 12, left: 0, bottom: 0 } });
}

function tooltipStyle() {
  return { background: '#0b1710', border: '1px solid rgba(34,197,94,.3)', borderRadius: 8, fontSize: 12 };
}

function renderConvTable(conv) {
  const body = $('dashConvBody');
  if (!body) return;
  if (!conv.length) {
    body.innerHTML = '<tr><td colspan="5" class="a-empty">Belum ada data funnel.</td></tr>';
    return;
  }
  body.innerHTML = conv.map((c) =>
    '<tr>' +
      '<td><b>' + esc(c.key) + '</b><div class="l-meta">' + esc(c.label || '') + '</div></td>' +
      '<td>' + fmtNum(c.leads) + '</td>' +
      '<td>' + fmtNum(c.paid) + '</td>' +
      '<td><b>' + c.conv + '%</b></td>' +
      '<td>' + fmtRp(c.revenue) + '</td>' +
    '</tr>'
  ).join('');
}
