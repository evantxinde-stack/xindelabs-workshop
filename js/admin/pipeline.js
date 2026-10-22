// ============================================================
// PIPELINE LEADS & DROP-OFF MONITOR
// Lihat leads berhenti di tahap mana + follow-up WhatsApp 1 klik.
// ============================================================
import {
  esc, fmtRp, fmtNum, fmtDate, fmtDateTime, resolveRange, rangeToIso,
  computeDropoff, STAGE_ORDER, renderTemplate, waLink, toast
} from './context.js';
import { ensureRecharts, mountChart, chartEl } from './charts.js';

let ctx = null;
let initialized = false;
let state = {
  preset: '30d',
  range: resolveRange('30d'),
  funnel: 'all',
  stage: 'unpaid_invoice',
  loading: false,
  funnels: [],
  leads: [],
  events: [],
  orders: [],
  templates: [],
  modalLead: null,
  modalOrder: null
};
let modalEls = null;

const $ = (id) => document.getElementById(id);

const PIPE_HTML = `
  <div class="section-head" style="text-align:left">
    <p class="eyebrow"><span class="dot"></span>admin</p>
    <h2 class="h2">Pipeline Leads &amp; Drop-off</h2>
    <p class="lead">Lihat di tahap mana leads berhenti, lalu follow-up WhatsApp 1 klik.</p>
  </div>

  <div class="a-range">
    <div class="a-range__presets" id="pipeRange">
      <button type="button" class="a-filter" data-range="7d">7 hari</button>
      <button type="button" class="a-filter is-active" data-range="30d">30 hari</button>
      <button type="button" class="a-filter" data-range="90d">90 hari</button>
      <button type="button" class="a-filter" data-range="all">Semua</button>
    </div>
    <div class="a-range__custom">
      <select id="pipeFunnel" class="a-input"></select>
      <input type="date" id="pipeFrom" class="a-input">
      <span class="l-meta">s/d</span>
      <input type="date" id="pipeTo" class="a-input">
      <button type="button" class="btn btn--ghost btn--sm" id="pipeApply">Terapkan</button>
      <button type="button" class="btn btn--ghost btn--sm" id="pipeRefresh">↻ Refresh</button>
    </div>
  </div>

  <div class="notice notice--warn" id="pipeNotice" style="display:none"></div>
  <div class="d-kpis" id="pipeKpis"></div>

  <div class="a-card">
    <div class="a-card__head"><h3>Drop-off Monitor</h3></div>
    <div class="a-chart" id="pipeChart"></div>
    <p class="a-chart-fallback" id="pipeFallback" style="display:none"></p>
    <div class="a-table-wrap">
      <table class="a-table">
        <thead><tr><th>Tahap</th><th>Leads</th><th>Drop-off</th><th>Konversi</th><th></th></tr></thead>
        <tbody id="pipeStageBody"></tbody>
      </table>
    </div>
  </div>

  <div class="a-card" id="pipeStuckCard">
    <div class="a-card__head">
      <h3>Leads Berhenti <span id="pipeStuckTitle"></span></h3>
      <div class="a-actions">
        <select id="pipeStageSelect" class="a-input"></select>
        <button type="button" class="btn btn--ghost btn--sm" id="pipeManageTpl">Kelola Template WA</button>
      </div>
    </div>
    <div class="a-table-wrap">
      <table class="a-table">
        <thead><tr><th>Nama</th><th>WA</th><th>Subdomain</th><th>Stage</th><th>Update</th><th>Follow-up</th></tr></thead>
        <tbody id="pipeStuckBody"></tbody>
      </table>
    </div>
    <p class="a-empty" id="pipeStuckEmpty" style="display:none">Tidak ada lead yang berhenti di tahap ini.</p>
  </div>

  <div class="a-card" id="pipeTplCard" style="display:none">
    <div class="a-card__head"><h3>Template WA</h3><button type="button" class="btn btn--primary btn--sm" id="pipeAddTpl">+ Template</button></div>
    <p class="l-meta">Gunakan variabel <b>{{name}}</b>, <b>{{subdomain}}</b>, <b>{{payment_url}}</b>.</p>
    <div class="a-table-wrap">
      <table class="a-table">
        <thead><tr><th>Nama</th><th>Stage</th><th>Isi</th><th></th></tr></thead>
        <tbody id="pipeTplBody"></tbody>
      </table>
    </div>
  </div>
`;

export function ensurePanel() {
  const panel = document.getElementById('panelPipeline');
  if (!panel) return;
  if (panel.dataset.adminPipe === '1') return;
  panel.innerHTML = PIPE_HTML;
  panel.dataset.adminPipe = '1';
}

function todayStr(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function init(context) {
  if (initialized) { ctx = context; return; }
  ctx = context;
  initialized = true;
  ensurePanel();

  const savedPreset = localStorage.getItem('xinde_pipe_range') || '30d';
  state.preset = savedPreset;
  state.range = resolveRange(savedPreset);
  if (state.range.start) $('pipeFrom').value = todayStr(state.range.start);
  if (state.range.end) $('pipeTo').value = todayStr(state.range.end);

  document.querySelectorAll('#pipeRange [data-range]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.preset = btn.dataset.range;
      state.range = resolveRange(state.preset);
      if (state.range.start) $('pipeFrom').value = todayStr(state.range.start);
      $('pipeTo').value = todayStr(state.range.end || new Date());
      syncPresetButtons();
      localStorage.setItem('xinde_pipe_range', state.preset);
      refresh();
    });
  });
  syncPresetButtons();

  if ($('pipeApply')) $('pipeApply').addEventListener('click', () => {
    state.preset = 'custom';
    state.range = resolveRange('custom', $('pipeFrom').value, $('pipeTo').value);
    localStorage.setItem('xinde_pipe_range', 'custom');
    syncPresetButtons();
    refresh();
  });
  if ($('pipeRefresh')) $('pipeRefresh').addEventListener('click', refresh);
  if ($('pipeFunnel')) $('pipeFunnel').addEventListener('change', (e) => {
    state.funnel = e.target.value;
    renderAll();
  });
  if ($('pipeStageSelect')) $('pipeStageSelect').addEventListener('change', (e) => {
    state.stage = e.target.value;
    renderStuck();
  });
  if ($('pipeManageTpl')) $('pipeManageTpl').addEventListener('click', () => {
    const card = $('pipeTplCard');
    if (!card) return;
    card.style.display = card.style.display === 'none' ? 'block' : 'none';
    if (card.style.display === 'block') renderTemplates();
  });
  if ($('pipeAddTpl')) $('pipeAddTpl').addEventListener('click', addTemplateRow);

  buildWaModal();
}

function syncPresetButtons() {
  document.querySelectorAll('#pipeRange [data-range]').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.range === state.preset);
  });
}

export function load() {
  refresh();
}

export async function refresh() {
  if (!ctx || !ctx.client || state.loading) return;
  state.loading = true;
  const { from, to } = rangeToIso(state.range);
  const client = ctx.client;

  const funnelsQ = client.from('funnels').select('id,slug,subdomain,name,is_active').order('name');
  const leadsQ = client.from('leads')
    .select('id,name,email,whatsapp,status,current_stage,funnel_slug,ref,created_at,updated_at,last_stage_at,notes')
    .order('created_at', { ascending: false }).limit(3000);
  const eventsQ = client.from('pipeline_events')
    .select('id,lead_id,event_type,meta,created_at')
    .order('created_at', { ascending: false }).limit(6000);
  const ordersQ = client.from('orders')
    .select('id,lead_id,status,amount,payment_url,subdomain,created_at,paid_at')
    .order('created_at', { ascending: false }).limit(3000);
  const tplQ = client.from('wa_templates').select('*').order('created_at', { ascending: true });

  [leadsQ, eventsQ, ordersQ].forEach((q) => {
    if (from) q.gte('created_at', from);
    if (to) q.lte('created_at', to);
  });

  try {
    const [funnelsRes, leadsRes, eventsRes, ordersRes, tplRes] = await Promise.all([
      funnelsQ, leadsQ, eventsQ, ordersQ, tplQ
    ]);
    if (leadsRes.error) throw leadsRes.error;

    state.funnels = funnelsRes.error ? [] : (funnelsRes.data || []);
    state.leads = leadsRes.data || [];
    state.events = eventsRes.error ? [] : (eventsRes.data || []);
    state.orders = ordersRes.error ? [] : (ordersRes.data || []);
    state.templates = tplRes.error ? [] : (tplRes.data || []);

    if (!state.templates.length) state.templates = fallbackTemplates();

    renderFunnelSelect();
    await loadTemplates();
    renderAll();
    renderTemplates();
  } catch (err) {
    console.error('[pipeline]', err);
    const notice = $('pipeNotice');
    if (notice) {
      notice.style.display = 'block';
      notice.innerHTML = '⚠️ Gagal load pipeline: <b style="color:inherit">' + esc(err.message || '') + '</b>';
    }
  } finally {
    state.loading = false;
  }
}

function fallbackTemplates() {
  const list = (ctx.cfg && ctx.cfg.FOLLOWUP_TEMPLATES) || [];
  return list.map((t, i) => ({
    id: 'fallback-' + i,
    key: 'fallback_' + i,
    name: t.label || 'Template ' + (i + 1),
    stage: 'any',
    content: t.text || '',
    is_active: true
  }));
}

async function loadTemplates() {
  // Sudah ikut query utama; kalau kosong pakai fallback.
  if (!state.templates.length) state.templates = fallbackTemplates();
}

function renderFunnelSelect() {
  const sel = $('pipeFunnel');
  if (!sel) return;
  const current = state.funnel;
  sel.innerHTML = '<option value="all">Semua subdomain</option>' + state.funnels.map((f) =>
    '<option value="' + esc(f.slug || f.subdomain) + '">' + esc((f.name ? f.name + ' · ' : '') + (f.subdomain || f.slug)) + '</option>'
  ).join('');
  if ([...sel.options].some((o) => o.value === current)) sel.value = current;
  else state.funnel = 'all';
}

function scopedLeads() {
  return state.leads.filter((l) => state.funnel === 'all' || (l.funnel_slug || l.ref || '') === state.funnel);
}

function scopedOrders(leads) {
  const ids = new Set(leads.map((l) => String(l.id)));
  return state.orders.filter((o) => !o.lead_id || ids.has(String(o.lead_id)));
}

function renderAll() {
  const leads = scopedLeads();
  const orders = scopedOrders(leads);
  const result = computeDropoff(leads, state.events, orders);
  state.dropoff = result;
  renderKpis(leads, result);
  renderChart(result);
  renderStageTable(result);
  renderStageSelect();
  renderStuck();

  const tpl = $('pipeTplCard');
  if (tpl) renderTemplates();
}

function renderKpis(leads, result) {
  const el = $('pipeKpis');
  if (!el) return;
  const byKey = {};
  result.stages.forEach((s) => { byKey[s.key] = s; });
  const paid = byKey.paid ? byKey.paid.reached : 0;
  const conv = leads.length ? Math.round((paid / leads.length) * 100) : 0;
  const kpis = [
    { label: 'Leads', val: fmtNum(leads.length), sub: state.range.label },
    { label: 'Opt-in', val: fmtNum(byKey.opt_in ? byKey.opt_in.reached : 0), sub: 'isi form' },
    { label: 'Nonton', val: fmtNum(byKey.watching_tutorial ? byKey.watching_tutorial.reached : 0), sub: 'video VSL' },
    { label: 'Checkout', val: fmtNum(byKey.checkout_initiated ? byKey.checkout_initiated.reached : 0), sub: 'klik bayar' },
    { label: 'Unpaid', val: fmtNum(byKey.unpaid_invoice ? byKey.unpaid_invoice.reached : 0), sub: 'invoice dibuat' },
    { label: 'Paid', val: fmtNum(paid), sub: 'konversi ' + conv + '%', big: true }
  ];
  el.innerHTML = kpis.map((k) =>
    '<div class="d-kpi' + (k.big ? ' is-big' : '') + '"><span>' + esc(k.label) + '</span><b>' + k.val + '</b><div class="sub">' + esc(k.sub) + '</div></div>'
  ).join('');
}

async function renderChart(result) {
  const el = $('pipeChart');
  const fallback = $('pipeFallback');
  if (!el) return;
  let ok = false;
  try { await ensureRecharts(); ok = !!window.Recharts; } catch (e) { ok = false; }

  if (!ok) {
    el.style.display = 'none';
    if (fallback) {
      fallback.style.display = 'block';
      fallback.textContent = result.stages.map((s) => s.label + ': ' + s.reached).join(' · ');
    }
    return;
  }
  el.style.display = 'block';
  if (fallback) fallback.style.display = 'none';
  const data = result.stages.map((s) => ({ name: s.label, reached: s.reached }));
  mountChart(el, 'BarChart', [
    chartEl('CartesianGrid', { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,.08)', horizontal: false }),
    chartEl('XAxis', { type: 'number', allowDecimals: false, tick: { fontSize: 10, fill: '#8a9a8f' }, axisLine: false, tickLine: false }),
    chartEl('YAxis', { type: 'category', dataKey: 'name', width: 110, tick: { fontSize: 10, fill: '#8a9a8f' }, axisLine: false, tickLine: false }),
    chartEl('Tooltip', { contentStyle: tooltipStyle(), labelStyle: { color: '#e8f5ec' } }),
    chartEl('Bar', { dataKey: 'reached', name: 'Leads', fill: '#22c55e', radius: [0, 4, 4, 0], barSize: 16 })
  ], { data, layout: 'vertical', margin: { top: 8, right: 16, left: 0, bottom: 0 } });
}

function tooltipStyle() {
  return { background: '#0b1710', border: '1px solid rgba(34,197,94,.3)', borderRadius: 8, fontSize: 12 };
}

function renderStageTable(result) {
  const body = $('pipeStageBody');
  if (!body) return;
  body.innerHTML = result.stages.map((s) => {
    const isActive = state.stage === s.key;
    return '<tr class="' + (isActive ? 'is-selected' : '') + '">' +
      '<td><b>' + esc(s.label) + '</b></td>' +
      '<td>' + fmtNum(s.reached) + '</td>' +
      '<td>' + (s.dropped ? '<span class="a-drop">-' + fmtNum(s.dropped) + ' (' + s.droppedPct + '%)</span>' : '—') + '</td>' +
      '<td>' + s.convFromStart + '%</td>' +
      '<td><button type="button" class="btn btn--ghost btn--sm stage-view" data-stage="' + esc(s.key) + '">Lihat leads</button></td>' +
      '</tr>';
  }).join('');

  body.querySelectorAll('.stage-view').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.stage = btn.dataset.stage;
      const sel = $('pipeStageSelect');
      if (sel) sel.value = state.stage;
      renderStageTable(result);
      renderStuck();
      const stuck = $('pipeStuckCard');
      if (stuck) stuck.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderStageSelect() {
  const sel = $('pipeStageSelect');
  if (!sel) return;
  sel.innerHTML = STAGE_ORDER.map((s) =>
    '<option value="' + esc(s.key) + '"' + (state.stage === s.key ? ' selected' : '') + '>' + esc(s.label) + '</option>'
  ).join('');
}

function latestOrderForLead(leadId) {
  const list = state.orders
    .filter((o) => String(o.lead_id) === String(leadId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list.find((o) => o.status === 'pending') || list[0] || null;
}

function renderStuck() {
  const body = $('pipeStuckBody');
  const empty = $('pipeStuckEmpty');
  const title = $('pipeStuckTitle');
  const result = state.dropoff || { byStage: {} };
  const list = (result.byStage && result.byStage[state.stage]) || [];
  const stageLabel = (STAGE_ORDER.find((s) => s.key === state.stage) || {}).label || state.stage;
  if (title) title.textContent = '· ' + stageLabel + ' (' + list.length + ')';
  if (!body) return;

  if (!list.length) {
    body.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  body.innerHTML = list
    .sort((a, b) => new Date(b.last_stage_at || b.updated_at || b.created_at) - new Date(a.last_stage_at || a.updated_at || a.created_at))
    .slice(0, 300)
    .map((l) => {
      const wa = l.whatsapp
        ? '<button type="button" class="btn btn--primary btn--sm stuck-wa" data-lead="' + esc(l.id) + '">WA →</button>'
        : '<span class="l-meta">tanpa WA</span>';
      return '<tr>' +
        '<td><div class="l-name">' + esc(l.name || '—') + '</div><div class="l-meta">' + esc(l.email || '') + '</div></td>' +
        '<td>' + esc(l.whatsapp || '—') + '</td>' +
        '<td>' + esc(l.funnel_slug || l.ref || '—') + '</td>' +
        '<td><span class="a-badge">' + esc(stageLabel) + '</span></td>' +
        '<td class="l-meta">' + esc(fmtDateTime(l.last_stage_at || l.updated_at || l.created_at)) + '</td>' +
        '<td>' + wa + '</td>' +
        '</tr>';
    }).join('');

  body.querySelectorAll('.stuck-wa').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lead = state.leads.find((l) => String(l.id) === btn.dataset.lead);
      if (lead) openWaForLead(lead, latestOrderForLead(lead.id));
    });
  });
}

// ---------------- WA Modal ----------------

function buildWaModal() {
  if (document.getElementById('waModal')) {
    modalEls = {
      root: $('waModal'), tpl: $('waTpl'), text: $('waText'), info: $('waInfo'),
      send: $('waSend'), close: $('waClose'), cancel: $('waCancel')
    };
    bindWaModal();
    return;
  }
  const root = document.createElement('div');
  root.id = 'waModal';
  root.className = 'a-modal';
  root.innerHTML =
    '<div class="a-modal__box">' +
      '<div class="a-card__head"><h3>Follow-up WhatsApp</h3><button type="button" class="btn btn--ghost btn--sm" id="waClose">✕</button></div>' +
      '<div class="a-modal__body">' +
        '<p class="l-meta" id="waInfo"></p>' +
        '<div class="field"><label>Template</label><select id="waTpl" class="a-input"></select></div>' +
        '<div class="field"><label>Pesan (bisa diedit)</label><textarea id="waText" rows="9" class="a-input"></textarea></div>' +
        '<div class="a-modal__actions">' +
          '<button type="button" class="btn btn--ghost" id="waCancel">Batal</button>' +
          '<button type="button" class="btn btn--primary" id="waSend">Kirim via WhatsApp</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);
  modalEls = {
    root, tpl: $('waTpl'), text: $('waText'), info: $('waInfo'),
    send: $('waSend'), close: $('waClose'), cancel: $('waCancel')
  };
  bindWaModal();
}

function bindWaModal() {
  const m = modalEls;
  if (!m || !m.root) return;
  const close = () => { m.root.classList.remove('is-open'); };
  if (m.close) m.close.addEventListener('click', close);
  if (m.cancel) m.cancel.addEventListener('click', close);
  m.root.addEventListener('click', (e) => { if (e.target === m.root) close(); });
  if (m.tpl) m.tpl.addEventListener('change', () => fillWaText());
  if (m.send) m.send.addEventListener('click', sendWa);
}

function templateVars(lead, order) {
  const slug = lead.funnel_slug || lead.ref || state.funnel || '';
  const paymentUrl = (order && order.payment_url) || lead.payment_url || '';
  const fallbackUrl = slug ? location.origin + '/checkout?funnel=' + encodeURIComponent(slug) : '';
  return {
    name: lead.name || 'Kak',
    subdomain: slug || 'xindelabs',
    payment_url: paymentUrl || fallbackUrl || '-'
  };
}

export function openWaForLead(lead, order) {
  if (!lead) return;
  buildWaModal();
  state.modalLead = lead;
  state.modalOrder = order || null;

  if (!state.templates.length) state.templates = fallbackTemplates();
  const stage = lead.current_stage || state.stage;
  const relevant = state.templates.filter((t) => t.is_active !== false && (!t.stage || t.stage === 'any' || t.stage === stage));
  const list = relevant.length ? relevant : state.templates;

  modalEls.tpl.innerHTML = list.map((t, i) =>
    '<option value="' + esc(t.id || t.key || i) + '" data-index="' + i + '">' + esc(t.name || ('Template ' + (i + 1))) + '</option>'
  ).join('');
  modalEls.tpl.dataset.list = '1';
  modalEls._list = list;

  const vars = templateVars(lead, order);
  modalEls.info.textContent = (lead.name || '—') + ' · ' + (lead.whatsapp || 'tanpa WA') + ' · ' + (vars.subdomain || '—');

  fillWaText();
  modalEls.root.classList.add('is-open');
}

function fillWaText() {
  if (!modalEls || !state.modalLead) return;
  const list = modalEls._list || state.templates;
  const idx = Number(modalEls.tpl.selectedOptions[0]?.dataset.index || 0);
  const tpl = list[idx] || list[0] || { content: '' };
  modalEls.text.value = renderTemplate(tpl.content, templateVars(state.modalLead, state.modalOrder));
  modalEls._tpl = tpl;
}

async function sendWa() {
  if (!modalEls || !state.modalLead) return;
  const text = modalEls.text.value.trim();
  const link = waLink(state.modalLead.whatsapp, text);
  if (!link) { toast('Nomor WhatsApp lead tidak valid.', 'warn'); return; }
  window.open(link, '_blank');

  const lead = state.modalLead;
  try {
    await ctx.client.from('leads')
      .update({ status: 'follow_up', updated_at: new Date().toISOString() })
      .eq('id', lead.id);
    await ctx.client.from('pipeline_events').insert({
      lead_id: lead.id,
      event_type: 'follow_up_wa',
      meta: {
        template: modalEls._tpl ? (modalEls._tpl.name || modalEls._tpl.key) : 'manual',
        stage: lead.current_stage || state.stage,
        subdomain: lead.funnel_slug || ''
      }
    });
    lead.status = 'follow_up';
    toast('Follow-up WA dibuka & tercatat.', 'ok');
  } catch (e) {
    console.warn('[pipeline] gagal mencatat follow-up:', e);
  }
  modalEls.root.classList.remove('is-open');
  renderAll();
}

// ---------------- Template Manager ----------------

function renderTemplates() {
  const body = $('pipeTplBody');
  if (!body) return;
  if (!state.templates.length) {
    body.innerHTML = '<tr><td colspan="4" class="a-empty">Belum ada template WA.</td></tr>';
    return;
  }
  body.innerHTML = state.templates.map((t, i) => {
    const isFallback = String(t.id || '').startsWith('fallback-');
    return '<tr data-idx="' + i + '">' +
      '<td><input class="a-input tpl-name" value="' + esc(t.name || '') + '"></td>' +
      '<td><select class="a-input tpl-stage">' +
        ['any'].concat(STAGE_ORDER.map((s) => s.key)).map((st) =>
          '<option value="' + st + '"' + ((t.stage || 'any') === st ? ' selected' : '') + '>' + st + '</option>'
        ).join('') +
      '</select></td>' +
      '<td><textarea class="a-input tpl-content" rows="3">' + esc(t.content || '') + '</textarea>' +
        '<div class="l-meta" style="margin-top:4px">Variabel: {{name}}, {{subdomain}}, {{payment_url}}</div></td>' +
      '<td>' +
        '<button type="button" class="btn btn--primary btn--sm tpl-save">Simpan</button> ' +
        '<button type="button" class="btn btn--ghost btn--sm tpl-del"' + (isFallback ? ' disabled' : '') + '>Hapus</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  body.querySelectorAll('tr[data-idx]').forEach((tr) => {
    const idx = Number(tr.dataset.idx);
    tr.querySelector('.tpl-save').addEventListener('click', () => saveTemplate(idx, tr));
    tr.querySelector('.tpl-del').addEventListener('click', () => deleteTemplate(idx));
  });
}

async function saveTemplate(idx, tr) {
  const t = state.templates[idx];
  if (!t) return;
  const name = tr.querySelector('.tpl-name').value.trim() || 'Template WA';
  const stage = tr.querySelector('.tpl-stage').value || 'any';
  const content = tr.querySelector('.tpl-content').value;
  const payload = {
    name,
    stage,
    content,
    is_active: true,
    updated_at: new Date().toISOString()
  };
  try {
    if (String(t.id || '').startsWith('fallback-')) {
      payload.key = 'custom_' + Date.now();
      const { data, error } = await ctx.client.from('wa_templates').insert(payload).select().single();
      if (error) throw error;
      state.templates[idx] = data;
    } else {
      const { error } = await ctx.client.from('wa_templates').update(payload).eq('id', t.id);
      if (error) throw error;
      Object.assign(t, payload);
    }
    toast('Template tersimpan.', 'ok');
    renderTemplates();
  } catch (e) {
    toast('Gagal simpan template: ' + (e.message || e), 'warn');
  }
}

async function deleteTemplate(idx) {
  const t = state.templates[idx];
  if (!t || String(t.id || '').startsWith('fallback-')) return;
  if (!confirm('Hapus template "' + (t.name || '') + '"?')) return;
  try {
    const { error } = await ctx.client.from('wa_templates').delete().eq('id', t.id);
    if (error) throw error;
    state.templates.splice(idx, 1);
    renderTemplates();
    toast('Template dihapus.', 'ok');
  } catch (e) {
    toast('Gagal hapus template: ' + (e.message || e), 'warn');
  }
}

function addTemplateRow() {
  state.templates.push({
    id: 'fallback-' + Date.now(),
    key: 'draft_' + Date.now(),
    name: 'Template Baru',
    stage: 'any',
    content: 'Halo {{name}}! ...',
    is_active: true
  });
  renderTemplates();
}
