// ============================================================
// HERMES BRIDGE — Koneksi Admin Dashboard <-> Hermes Agent
// Tugas Keenam: Integrasi Hermes Agent
//
// - callHermes(): POST ke webhook n8n "hermes-agent" (sinkron).
// - logAgent()/fetchAgentLogs(): tabel `agent_logs` (Live Activity Log).
// - Slide-over "Hermes AI Command Center": Aktivitas / Aksi Cepat / Chat.
// - openHermesPrompt(): modal instruksi singkat (dipakai Funnel Builder
//   dan Blog Editor untuk tombol "Generate with Hermes AI").
//
// Contract webhook (harus sama dengan workflow n8n):
//   POST { action, payload, source, agent, requested_at }
//   ->  { ok?, output | reply | text | content | result | data{...} }
// ============================================================

import { esc, fmtDateTime, toast } from './context.js';

// Block modular yang sah (harus sama dengan js/modules/funnel-engine.js).
export const VALID_BLOCK_TYPES = [
  'hero', 'video_vsl', 'problem', 'benefit', 'kurikulum',
  'pricing', 'faq', 'cta', 'custom_html_embed'
];

// Contoh shape blok — dikirim sebagai petunjuk ke Hermes supaya output
// langsung bisa dipakai renderer funnel.
export const BLOCK_SCHEMA_HINT = {
  hero: { eyebrow: '', badge: '', title: '', subtitle: '', cta_text: '', cta_anchor: '', image: '' },
  video_vsl: { video_url: '', caption: '' },
  problem: { title: '', description: '', items: [{ title: '', desc: '' }] },
  benefit: { title: '', description: '', items: [{ title: '', desc: '' }] },
  kurikulum: { title: '', description: '', items: [{ title: '', desc: '' }] },
  pricing: {
    title: '', description: '',
    tiers: [{ id: 'yearly', name: '', price: 599000, original_price: 999000, period: '/tahun', badge: '', highlight: true, features: [], cta_text: 'Daftar Sekarang' }]
  },
  faq: { title: '', items: [{ q: '', a: '' }] },
  cta: { title: '', subtitle: '', primary_text: '', secondary_text: '', secondary_url: '', form: true, form_title: '', form_button: '', form_description: '' },
  custom_html_embed: { html: '' }
};

// Aksi cepat yang tampil di slide-over.
export const QUICK_ACTIONS = [
  {
    id: 'generate_seo_article',
    label: 'Generate Artikel SEO Hari Ini',
    icon: '📝',
    desc: 'Hermes bikin draft artikel SEO + publish ke tabel blog_posts.',
    target_type: 'blog_post',
    payload: {
      request: 'generate_seo_article',
      topic: 'topik harian: cara membangun AI Agent untuk sales person',
      publish: true
    }
  },
  {
    id: 'analyze_funnel_bottleneck',
    label: 'Analisa Bottleneck Funnel Minggu Ini',
    icon: '🔍',
    desc: 'Baca pipeline leads 7 hari terakhir, cari stage paling bocor.',
    target_type: 'lead',
    payload: { request: 'analyze_funnel_bottleneck', range_days: 7 }
  },
  {
    id: 'draft_landing_copy',
    label: 'Buatkan Draft Copywriting Landing Page Baru',
    icon: '🧲',
    desc: 'Hasil: draft blok hero + benefits + CTA (siap tempel ke Funnel Builder).',
    target_type: 'funnel',
    payload: { request: 'draft_landing_copy', goal: 'landing page agent AI', tone: 'santai, Bahasa Indonesia' }
  },
  {
    id: 'analyze_leads_daily',
    label: 'Analisa Leads Harian',
    icon: '📊',
    desc: 'Ringkasan jumlah lead, stage, dan konversi hari ini.',
    target_type: 'lead',
    payload: { request: 'analyze_leads_daily', range_days: 1 }
  }
];

// Action id internal (dipakai modul lain).
export const ACTION_GENERATE_BLOCKS = 'generate_funnel_blocks';
export const ACTION_GENERATE_ARTICLE = 'generate_blog_article';
export const ACTION_CHAT = 'chat';
export const ACTION_PING = 'ping';

let ctx = null;
let pollTimer = null;
let logs = [];
let chat = [];
let busy = false;
let lastStatus = null; // null = belum dicek, 'ok' | 'err'

const $ = (id) => document.getElementById(id);

function getCtx() {
  return ctx;
}

function getCfg() {
  if (ctx && ctx.cfg) return ctx.cfg;
  return (typeof window !== 'undefined' && window.XINDE) || {};
}

export function hermesConfigured() {
  const cfg = getCfg();
  const rc = getHermesConfig();
  if (rc.enabled === false) return false;
  if (rc.mode === 'supabase_bus') return true;
  return !!(rc.webhook_url || cfg.HERMES_WEBHOOK);
}

// ============================================================
// KONFIGURASI HERMES — disimpan di tabel `settings` (key=hermes_config)
// ============================================================

export const HERMES_CFG_KEY = 'hermes_config';

export const HERMES_MODES = [
  { id: 'webhook', label: 'Webhook n8n (langsung dari browser)' },
  { id: 'proxy', label: 'Proxy server /api/hermes (token server-side)' },
  { id: 'supabase_bus', label: 'Supabase Bus (agent_tasks)' }
];

let runtimeCfg = null;

function defaultHermesCfg() {
  const cfg = getCfg();
  return {
    mode: 'webhook',
    enabled: true,
    webhook_url: cfg.HERMES_WEBHOOK || '',
    token: '',
    model: cfg.HERMES_MODEL || '',
    agent_name: cfg.HERMES_AGENT_NAME || 'hermes'
  };
}

export function normalizeHermesConfig(raw) {
  let v = raw;
  if (typeof v === 'string') {
    try { v = JSON.parse(v); } catch (e) { v = null; }
  }
  if (!v || typeof v !== 'object') v = {};
  const base = defaultHermesCfg();
  const known = HERMES_MODES.some((m) => m.id === v.mode);
  return {
    mode: known ? v.mode : base.mode,
    enabled: v.enabled !== false,
    webhook_url: typeof v.webhook_url === 'string' ? v.webhook_url : base.webhook_url,
    token: typeof v.token === 'string' ? v.token : base.token,
    model: typeof v.model === 'string' ? v.model : base.model,
    agent_name: v.agent_name || base.agent_name
  };
}

export function getHermesConfig() {
  return runtimeCfg || defaultHermesCfg();
}

export async function loadHermesConfig() {
  const c = getCtx();
  if (!c || !c.client) {
    runtimeCfg = defaultHermesCfg();
    return runtimeCfg;
  }
  try {
    const res = await c.client.from('settings').select('value').eq('key', HERMES_CFG_KEY).maybeSingle();
    if (res.error) throw res.error;
    runtimeCfg = normalizeHermesConfig(res.data ? res.data.value : null);
  } catch (e) {
    console.warn('[hermes] config tidak terbaca, pakai default:', e && e.message);
    runtimeCfg = defaultHermesCfg();
  }
  return runtimeCfg;
}

export async function saveHermesConfig(patch) {
  const c = getCtx();
  const next = normalizeHermesConfig(Object.assign({}, getHermesConfig(), patch || {}));
  runtimeCfg = next;
  if (!c || !c.client) return { ok: false, config: next, error: 'Supabase client belum siap' };

  const attempts = [
    { row: { key: HERMES_CFG_KEY, value: next, updated_at: new Date().toISOString() }, opts: { onConflict: 'key' } },
    { row: { key: HERMES_CFG_KEY, value: next }, opts: { onConflict: 'key' } },
    { row: { key: HERMES_CFG_KEY, value: JSON.stringify(next) }, opts: { onConflict: 'key' } }
  ];
  let lastErr = null;
  for (const a of attempts) {
    try {
      const res = await c.client.from('settings').upsert(a.row, a.opts);
      if (!res.error) return { ok: true, config: next };
      lastErr = res.error;
    } catch (e) {
      lastErr = e;
    }
  }
  const msg = (lastErr && lastErr.message) || 'gagal menyimpan';
  console.warn('[hermes] simpan config gagal:', msg);
  return { ok: false, config: next, error: msg };
}

// ============================================================
// CORE — panggil Hermes Agent
// ============================================================

/**
 * Ambil output dari berbagai bentuk respons n8n/LLM.
 * String biasa, array, atau objek dengan kunci output/reply/text/...
 */
export function pickOutput(data) {
  if (data == null) return '';
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data;
  if (typeof data !== 'object') return String(data);

  const cands = [
    data.output, data.reply, data.text, data.content, data.result, data.answer, data.response,
    data.data && data.data.output, data.data && data.data.reply, data.data && data.data.text,
    data.data && data.data.content, data.data && data.data.result,
    data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content,
    data.choices && data.choices[0] && data.choices[0].text
  ];
  for (const c of cands) {
    if (c !== undefined && c !== null && c !== '') return c;
  }
  return '';
}

// Output Hermes bisa berupa string, array (blok funnel), atau objek (artikel JSON).
export function formatOutput(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return JSON.stringify(value, null, 2);
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return String(value);
  }
}

/**
 * Panggil Hermes Agent secara sinkron.
 * Return: { ok, output, data, raw, error, status, durationMs }
 */
export async function callHermes(action, payload, opts = {}) {
  const cfg = getCfg();
  const rc = getHermesConfig();

  if (rc.enabled === false) {
    return { ok: false, error: 'Hermes dinonaktifkan di Pengaturan Hermes', output: '', durationMs: 0 };
  }
  if (cfg.HERMES_ENABLED === false) {
    return { ok: false, error: 'Hermes Agent dinonaktifkan (HERMES_ENABLED = false)', output: '', durationMs: 0 };
  }

  // Transport 3: bus Supabase (agent_tasks) — Hermes ambil sendiri lalu tulis hasil.
  if (rc.mode === 'supabase_bus') return callViaBus(action, payload, opts);

  // Transport 1: webhook langsung. Transport 2: proxy server (token aman).
  const url = rc.mode === 'proxy' ? '/api/hermes' : (rc.webhook_url || cfg.HERMES_WEBHOOK || '');
  if (!url) {
    return { ok: false, error: 'URL webhook Hermes belum diatur (Pengaturan Hermes)', output: '', durationMs: 0 };
  }

  const timeout = Number(cfg.HERMES_TIMEOUT_MS) || 180000;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => { if (controller) controller.abort(); }, timeout);
  const started = Date.now();

  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (rc.token) headers.Authorization = 'Bearer ' + rc.token;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action,
        payload: payload || {},
        source: opts.source || 'admin',
        agent: rc.agent_name || cfg.HERMES_AGENT_NAME || 'hermes',
        requested_at: new Date().toISOString()
      }),
      signal: controller ? controller.signal : undefined
    });

    const durationMs = Date.now() - started;
    const rawText = await res.text();
    let data = null;
    try { data = rawText ? JSON.parse(rawText) : null; } catch (e) { data = rawText; }

    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || ('HTTP ' + res.status);
      return { ok: false, error: String(msg), status: res.status, durationMs, data };
    }

    const output = pickOutput(data);
    return { ok: true, output, data, durationMs };
  } catch (err) {
    const durationMs = Date.now() - started;
    const msg = err && err.name === 'AbortError'
      ? ('Timeout ' + Math.round(timeout / 1000) + ' detik')
      : ((err && err.message) || 'Gagal menghubungi Hermes Agent');
    return { ok: false, error: msg, durationMs };
  } finally {
    clearTimeout(timer);
  }
}

// Transport 3 — antre tugas di Supabase, tunggu Hermes menulis hasil.
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callViaBus(action, payload, opts = {}) {
  const c = getCtx();
  const rc = getHermesConfig();
  const started = Date.now();
  if (!c || !c.client) {
    return { ok: false, error: 'Supabase client belum siap (bus Hermes)', output: '', durationMs: 0 };
  }
  try {
    const ins = await c.client.from('agent_tasks').insert({
      task_type: action,
      title: (payload && (payload.title || payload.topic || payload.message)) || action,
      prompt: (payload && (payload.prompt || payload.message)) || null,
      payload: Object.assign({}, payload || {}, {
        source: opts.source || 'admin',
        agent: rc.agent_name || 'hermes'
      }),
      status: 'pending',
      source: opts.source || 'admin',
      requested_by: rc.agent_name || 'hermes'
    }).select('id').maybeSingle();
    if (ins.error) throw ins.error;
    const taskId = ins.data && ins.data.id;
    if (!taskId) throw new Error('agent_tasks tidak mengembalikan id');

    const timeout = Number(getCfg().HERMES_TIMEOUT_MS) || 180000;
    const deadline = started + timeout;
    while (Date.now() < deadline) {
      await sleep(2500);
      const chk = await c.client.from('agent_tasks').select('*').eq('id', taskId).maybeSingle();
      if (chk.error) throw chk.error;
      const row = chk.data;
      if (!row) continue;
      const st = String(row.status || '').toLowerCase();
      if (st === 'success' || st === 'done' || st === 'completed') {
        return { ok: true, output: pickOutput(row.result), data: row.result, durationMs: Date.now() - started };
      }
      if (st === 'error' || st === 'failed' || st === 'cancelled') {
        return { ok: false, error: row.error || 'Hermes gagal mengerjakan tugas', data: row, durationMs: Date.now() - started };
      }
    }
    return { ok: false, error: 'Timeout menunggu Hermes lewat bus Supabase', output: '', durationMs: Date.now() - started };
  } catch (err) {
    return {
      ok: false,
      error: (err && err.message) || 'Gagal memakai bus Hermes',
      output: '',
      durationMs: Date.now() - started
    };
  }
}

// ============================================================
// AGENT LOGS — tabel `agent_logs`
// ============================================================

export async function logAgent(row) {
  const c = getCtx();
  if (!c || !c.client) return false;
  const cfg = c.cfg || {};
  const payload = {
    agent_name: cfg.HERMES_AGENT_NAME || 'hermes',
    action: row.action || 'unknown',
    action_label: row.action_label || null,
    status: row.status || 'success',
    trigger_source: row.trigger_source || 'admin',
    target_type: row.target_type || null,
    target_id: row.target_id || null,
    summary: row.summary || null,
    detail: row.detail && typeof row.detail === 'object' ? row.detail : {},
    input: row.input != null ? String(row.input) : null,
    output: row.output != null ? String(row.output) : null,
    duration_ms: row.duration_ms != null ? Number(row.duration_ms) : null
  };
  try {
    const { error } = await c.client.from('agent_logs').insert(payload);
    if (error) {
      console.warn('[hermes] insert agent_logs gagal:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[hermes] insert agent_logs exception:', e && e.message);
    return false;
  }
}

export async function fetchAgentLogs(limit = 30) {
  const c = getCtx();
  if (!c || !c.client) return [];
  try {
    const { data, error } = await c.client
      .from('agent_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[hermes] select agent_logs gagal:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('[hermes] select agent_logs exception:', e && e.message);
    return [];
  }
}

// ============================================================
// BLOCKS — normalisasi output Hermes jadi [{type,data}]
// ============================================================

export function extractBlocks(payload) {
  let src = payload;

  if (typeof src === 'string') {
    const t = src.trim();
    if (!t) return [];
    try { src = JSON.parse(t); } catch (e) { return []; }
  }
  if (!src) return [];
  if (Array.isArray(src)) return normalizeBlockList(src);
  if (typeof src !== 'object') return [];

  if (Array.isArray(src.blocks)) return normalizeBlockList(src.blocks);
  if (src.data && Array.isArray(src.data.blocks)) return normalizeBlockList(src.data.blocks);
  if (src.output !== undefined) return extractBlocks(src.output);
  if (src.result !== undefined) return extractBlocks(src.result);
  if (src.reply !== undefined) return extractBlocks(src.reply);
  if (src.content !== undefined) return extractBlocks(src.content);
  return [];
}

function normalizeBlockList(list) {
  const out = [];
  for (const raw of list) {
    let b = raw;
    if (typeof b === 'string') {
      try { b = JSON.parse(b); } catch (e) { continue; }
    }
    if (!b || typeof b !== 'object' || Array.isArray(b)) continue;

    const type = String(b.type || b.block_type || b.name || '').trim();
    if (!VALID_BLOCK_TYPES.includes(type)) continue;

    let data = b.data || b.content || b.fields || b.payload || b.props || b.body || {};
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = { text: data }; }
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) data = { value: data };

    out.push({ type, data });
  }
  return out;
}

// ============================================================
// PROMPT MODAL — instruksi singkat (dipakai Funnel Builder & Blog Editor)
// ============================================================

let promptModal = null;

/**
 * Buka modal instruksi singkat.
 * opts: { title, subtitle, note, submitLabel, fields:[{key,label,type,placeholder,value,rows}] }
 * Return Promise<{values}|null>
 */
export function openHermesPrompt(opts = {}) {
  return new Promise((resolve) => {
    closePromptModal();

    const root = document.createElement('div');
    root.className = 'a-modal is-open';
    const fields = opts.fields || [];

    root.innerHTML =
      '<div class="a-modal__box a-modal__box--wide">' +
        '<div class="a-card__head"><h3>' + esc(opts.title || 'Generate with Hermes AI') + '</h3>' +
          '<button type="button" class="btn btn--ghost btn--sm" id="hxpClose">✕</button></div>' +
        '<div class="a-modal__body">' +
          (opts.subtitle ? '<p class="l-meta">' + esc(opts.subtitle) + '</p>' : '') +
          (opts.note ? '<pre class="a-hx-note">' + esc(opts.note) + '</pre>' : '') +
          fields.map((f, i) => {
            const id = 'hxpF' + i;
            if (f.type === 'textarea') {
              return '<div class="field"><label>' + esc(f.label || '') + '</label>' +
                '<textarea id="' + id + '" class="a-input" rows="' + (f.rows || 4) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(f.value || '') + '</textarea></div>';
            }
            if (f.type === 'select') {
              const opts = (f.options || []).map((o) => {
                const val = typeof o === 'string' ? o : o.value;
                const lab = typeof o === 'string' ? o : o.label;
                return '<option value="' + esc(val) + '"' + (String(val) === String(f.value) ? ' selected' : '') + '>' + esc(lab) + '</option>';
              }).join('');
              return '<div class="field"><label>' + esc(f.label || '') + '</label>' +
                '<select id="' + id + '" class="a-input">' + opts + '</select>' +
                (f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '') + '</div>';
            }
            if (f.type === 'checkbox') {
              return '<label class="a-check" style="display:flex;gap:8px;align-items:center;margin:10px 0">' +
                '<input id="' + id + '" type="checkbox"' + (f.value ? ' checked' : '') + '> ' + esc(f.label || '') + '</label>';
            }
            return '<div class="field"><label>' + esc(f.label || '') + '</label>' +
              '<input id="' + id + '" class="a-input" type="' + (f.type || 'text') + '" value="' + esc(f.value || '') + '" placeholder="' + esc(f.placeholder || '') + '"></div>';
          }).join('') +
          '<div class="a-modal__actions">' +
            '<button type="button" class="btn btn--ghost" id="hxpCancel">Batal</button>' +
            '<button type="button" class="btn btn--primary" id="hxpSubmit">' + esc(opts.submitLabel || 'Generate') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);
    promptModal = root;

    const values = {};
    fields.forEach((f, i) => {
      const el = $('hxpF' + i);
      if (!el) { values[f.key] = ''; return; }
      values[f.key] = f.type === 'checkbox' ? !!el.checked : (el.value || '');
    });

    function done(result) {
      closePromptModal();
      resolve(result);
    }

    const cancel = $('hxpCancel');
    const close = $('hxpClose');
    const submit = $('hxpSubmit');

    if (cancel) cancel.addEventListener('click', () => done(null));
    if (close) close.addEventListener('click', () => done(null));
    root.addEventListener('click', (e) => { if (e.target === root) done(null); });

    if (submit) {
      submit.addEventListener('click', () => {
        const out = {};
        fields.forEach((f, i) => {
          const el = $('hxpF' + i);
          out[f.key] = !el ? '' : (f.type === 'checkbox' ? !!el.checked : (el.value || ''));
        });
        done(out);
      });
    }

    const first = root.querySelector('.a-modal__body input, .a-modal__body textarea');
    if (first) first.focus();
  });
}

function closePromptModal() {
  if (promptModal && promptModal.parentNode) promptModal.parentNode.removeChild(promptModal);
  promptModal = null;
}

// ============================================================
// SLIDE-OVER — Hermes AI Command Center
// ============================================================

const SLIDE_HTML =
  '<div class="a-slideover" id="hermesSlide" hidden>' +
    '<div class="a-slideover__backdrop" data-hermes-close></div>' +
    '<aside class="a-slideover__panel" role="dialog" aria-modal="true" aria-label="Hermes AI Command Center">' +
      '<header class="a-slideover__head">' +
        '<div>' +
          '<div class="a-slideover__eyebrow">Hermes Agent</div>' +
          '<h2 class="a-slideover__title">Hermes AI Command Center</h2>' +
        '</div>' +
        '<div class="a-slideover__tools">' +
          '<span class="a-hx-pill" id="hxStatus">Belum dicek</span>' +
          '<button type="button" class="a-hx-iconbtn" id="hxPing" title="Tes koneksi">⚡</button>' +
          '<button type="button" class="a-hx-iconbtn" id="hxClose" title="Tutup">✕</button>' +
        '</div>' +
      '</header>' +
      '<nav class="a-hx-tabs" id="hxTabs">' +
        '<button type="button" class="a-hx-tab is-active" data-hxtab="activity">Aktivitas</button>' +
        '<button type="button" class="a-hx-tab" data-hxtab="quick">Aksi Cepat</button>' +
        '<button type="button" class="a-hx-tab" data-hxtab="chat">Chat Admin</button>' +
        '<button type="button" class="a-hx-tab" data-hxtab="settings">Pengaturan</button>' +
      '</nav>' +
      '<div class="a-slideover__body" id="hxBody" data-hxtab="activity"></div>' +
    '</aside>' +
  '</div>';

export function ensureSlideover() {
  if (typeof document === 'undefined') return null;
  let root = $('hermesSlide');
  if (root) return root;

  root = document.createElement('div');
  root.innerHTML = SLIDE_HTML;
  const node = root.firstElementChild;
  document.body.appendChild(node);
  bindSlideover(node);
  return node;
}

function bindSlideover(root) {
  const close = $('hxClose');
  if (close) close.addEventListener('click', () => closeHermes());

  root.addEventListener('click', (e) => {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-hermes-close')) closeHermes();
  });

  const tabs = $('hxTabs');
  if (tabs) {
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest ? e.target.closest('[data-hxtab]') : null;
      if (!btn) return;
      setTab(btn.getAttribute('data-hxtab'));
    });
  }

  const ping = $('hxPing');
  if (ping) ping.addEventListener('click', () => testConnection());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-open')) closeHermes();
  });
}

function setTab(tab) {
  const tabs = document.querySelectorAll('#hxTabs [data-hxtab]');
  tabs.forEach((t) => t.classList.toggle('is-active', t.getAttribute('data-hxtab') === tab));
  const body = $('hxBody');
  if (!body) return;
  body.setAttribute('data-hxtab', tab);
  render();
  if (tab === 'activity') loadLogs();
  if (tab === 'chat') render();
  if (tab === 'settings') {
    loadHermesConfig().then(() => {
      if ($('hxBody') && $('hxBody').getAttribute('data-hxtab') === 'settings') renderSettings();
    });
  }
}

export function openHermes() {
  const root = ensureSlideover();
  if (!root) return;
  root.hidden = false;
  requestAnimationFrame(() => root.classList.add('is-open'));
  render();
  loadLogs();
  startPolling();
}

export function closeHermes() {
  const root = $('hermesSlide');
  if (!root) return;
  root.classList.remove('is-open');
  root.hidden = true;
  stopPolling();
}

export function toggleHermes() {
  const root = $('hermesSlide');
  if (root && root.classList.contains('is-open')) closeHermes();
  else openHermes();
}

// Alias pendek supaya pemanggil tidak salah nama (mis. hermes.open / .close).
export const open = openHermes;
export const close = closeHermes;
export const toggle = toggleHermes;

function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    const root = $('hermesSlide');
    if (!root || !root.classList.contains('is-open')) return stopPolling();
    loadLogs(true);
  }, 15000);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

async function loadLogs(silent) {
  const body = $('hxBody');
  if (body && body.getAttribute('data-hxtab') === 'activity' && !logs.length) {
    body.innerHTML = '<p class="a-empty">Memuat aktivitas…</p>';
  }
  const data = await fetchAgentLogs(30);
  logs = data;
  if (!silent) render();
  else renderLogList();
}

// ============================================================
// RENDER
// ============================================================

function relTime(dt) {
  if (!dt) return '';
  const t = new Date(dt).getTime();
  if (!t) return '';
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'baru saja';
  if (min < 60) return min + ' menit lalu';
  const jam = Math.round(min / 60);
  if (jam < 24) return jam + ' jam lalu';
  const hari = Math.round(jam / 24);
  return hari + ' hari lalu';
}

function render() {
  const body = $('hxBody');
  if (!body) return;
  const tab = body.getAttribute('data-hxtab') || 'activity';
  if (tab === 'activity') renderLogList();
  else if (tab === 'quick') renderQuick();
  else if (tab === 'chat') renderChat();
  else if (tab === 'settings') renderSettings();
}

// ============================================================
// TAB PENGATURAN — transport, endpoint, token, contract test
// ============================================================

function renderSettings() {
  const body = $('hxBody');
  if (!body || body.getAttribute('data-hxtab') !== 'settings') return;

  const rc = getHermesConfig();
  const opts = HERMES_MODES.map((m) =>
    '<option value="' + esc(m.id) + '"' + (m.id === rc.mode ? ' selected' : '') + '>' + esc(m.label) + '</option>'
  ).join('');

  body.innerHTML =
    '<div class="a-hx-toolbar"><b>Pengaturan Hermes Agent</b>' +
      '<button type="button" class="btn btn--ghost btn--sm" id="hxTestContract">Tes Kontrak</button>' +
    '</div>' +
    '<div class="a-hx-settings">' +
      '<label class="a-hx-field"><span>Transport</span>' +
        '<select id="hxMode" class="a-input">' + opts + '</select></label>' +
      '<label class="a-hx-field"><span>Webhook n8n (URL)</span>' +
        '<input id="hxUrl" class="a-input" type="url" placeholder="https://n8n.../webhook/hermes-agent" value="' + esc(rc.webhook_url) + '"></label>' +
      '<label class="a-hx-field"><span>Token (opsional)</span>' +
        '<input id="hxToken" class="a-input" type="password" placeholder="Bearer token webhook" value="' + esc(rc.token) + '"></label>' +
      '<label class="a-hx-field"><span>Model (info)</span>' +
        '<input id="hxModel" class="a-input" type="text" placeholder="mis. nous-research/hermes-3" value="' + esc(rc.model) + '"></label>' +
      '<label class="a-hx-field a-hx-field--row"><span>Aktif</span>' +
        '<input id="hxEnabled" type="checkbox"' + (rc.enabled !== false ? ' checked' : '') + '></label>' +
      '<div class="a-hx-actions">' +
        '<button type="button" class="btn btn--primary btn--sm" id="hxSaveCfg">Simpan Konfigurasi</button>' +
        '<button type="button" class="btn btn--ghost btn--sm" id="hxPing2">Tes Koneksi</button>' +
      '</div>' +
      '<div id="hxCfgMsg" class="a-hx-cfgmsg"></div>' +
      '<p class="a-hx-hint">Kontrak: POST { action, payload, source, agent, requested_at } → { ok, output }<br>' +
      'Mode <b>proxy</b> pakai /api/hermes (token disimpan di env Vercel, tidak terekspos ke browser).<br>' +
      'Mode <b>supabase_bus</b> menulis tugas ke tabel <b>agent_tasks</b>; Hermes memproses lalu mengisi <b>result</b>.' +
      '</p>' +
    '</div>';

  const msg = $('hxCfgMsg');
  const say = (text, kind) => {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'a-hx-cfgmsg' + (kind ? ' a-hx-cfgmsg--' + kind : '');
  };

  const save = $('hxSaveCfg');
  if (save) {
    save.addEventListener('click', async () => {
      const res = await saveHermesConfig({
        mode: ($('hxMode') || {}).value,
        webhook_url: ($('hxUrl') || {}).value || '',
        token: ($('hxToken') || {}).value || '',
        model: ($('hxModel') || {}).value || '',
        enabled: !!($('hxEnabled') || {}).checked
      });
      say(res.ok ? 'Tersimpan di settings.hermes_config ✅' : ('Gagal simpan: ' + (res.error || '')), res.ok ? 'ok' : 'err');
      toast(res.ok ? 'Konfigurasi Hermes disimpan' : ('Gagal simpan konfigurasi: ' + (res.error || '')), res.ok ? 'ok' : 'warn');
    });
  }

  const ping2 = $('hxPing2');
  if (ping2) ping2.addEventListener('click', async () => {
    say('Menguji koneksi…');
    const res = await testConnection();
    say(res.ok ? 'Hermes Agent merespon ✅' : ('Gagal: ' + (res.error || 'tidak ada respons')), res.ok ? 'ok' : 'err');
  });

  const tester = $('hxTestContract');
  if (tester) {
    tester.addEventListener('click', async () => {
      say('Menjalankan tes kontrak…');
      const result = await runContractTest();
      say(result.summary, result.ok ? 'ok' : 'err');
    });
  }
}

// Tes kontrak: cek transport, endpoint, status 2xx, field output, latency.
export async function runContractTest() {
  const rc = getHermesConfig();
  const checks = [];
  const endpoint = rc.mode === 'proxy' ? '/api/hermes' : (rc.webhook_url || '(belum diisi)');

  checks.push({ label: 'Transport', ok: !!rc.mode, detail: rc.mode });
  checks.push({
    label: 'Endpoint',
    ok: rc.mode === 'supabase_bus' ? true : !!(rc.webhook_url || rc.mode === 'proxy'),
    detail: endpoint
  });
  checks.push({ label: 'Agent name', ok: !!rc.agent_name, detail: rc.agent_name });

  const res = await callHermes(ACTION_PING, { probe: true, ts: new Date().toISOString() }, { source: 'admin_contract_test' });

  checks.push({ label: 'Respons sukses', ok: !!res.ok, detail: res.ok ? '200 OK' : (res.error || 'gagal') });
  checks.push({
    label: 'Field output ada',
    ok: res.ok && res.output != null && res.output !== '',
    detail: res.ok ? (res.output === '' ? 'kosong' : 'terisi') : '-'
  });
  checks.push({
    label: 'Latency < 10 detik',
    ok: typeof res.durationMs === 'number' && res.durationMs < 10000,
    detail: (res.durationMs || 0) + ' ms'
  });

  const ok = checks.every((c) => c.ok);
  const summary = (ok ? '✅ Kontrak lolos: ' : '⚠️ Ada yang gagal: ') +
    checks.map((c) => (c.ok ? '✓' : '✗') + ' ' + c.label).join(' · ');

  await logAgent({
    action: 'contract_test',
    action_label: 'Tes Kontrak Hermes',
    status: ok ? 'success' : 'error',
    trigger_source: 'admin_settings',
    target_type: 'hermes',
    summary: summary,
    detail: { checks, mode: rc.mode },
    duration_ms: res.durationMs
  });

  return { ok, checks, summary, res };
}

function renderLogList() {
  const body = $('hxBody');
  if (!body || body.getAttribute('data-hxtab') !== 'activity') return;

  const items = logs.map((l) => {
    const st = String(l.status || 'success');
    const detail = l.detail && typeof l.detail === 'object' ? JSON.stringify(l.detail, null, 2) : '';
    const extra = (l.input || l.output) ? (l.output || l.input) : '';
    return '<div class="a-hx-log a-hx-log--' + esc(st) + '">' +
      '<div class="a-hx-log__top">' +
        '<span class="a-hx-badge a-hx-badge--' + esc(st) + '">' + esc(st) + '</span>' +
        '<b>' + esc(l.action_label || l.action || 'activity') + '</b>' +
        '<span class="a-hx-log__time" title="' + esc(fmtDateTime(l.created_at) || '') + '">' + esc(relTime(l.created_at)) + '</span>' +
      '</div>' +
      (l.summary ? '<div class="a-hx-log__sum">' + esc(l.summary) + '</div>' : '') +
      (l.trigger_source ? '<div class="a-hx-log__target">sumber: ' + esc(l.trigger_source) + (l.target_type ? ' · ' + esc(l.target_type) : '') + (l.target_id ? ' · ' + esc(l.target_id) : '') + '</div>' : (l.target_type ? '<div class="a-hx-log__target">' + esc(l.target_type) + (l.target_id ? ' · ' + esc(l.target_id) : '') + '</div>' : '')) +
      (extra ? '<details class="a-hx-log__detail"><summary>Detail</summary><pre>' + esc(String(extra).slice(0, 4000)) + '</pre></details>' : '') +
      (detail && detail !== '{}' ? '<details class="a-hx-log__detail"><summary>Payload</summary><pre>' + esc(detail.slice(0, 4000)) + '</pre></details>' : '') +
    '</div>';
  }).join('');

  body.innerHTML =
    '<div class="a-hx-toolbar">' +
      '<b>Live Activity Log</b>' +
      '<button type="button" class="btn btn--ghost btn--sm" id="hxRefresh">↻ Refresh</button>' +
    '</div>' +
    '<p class="a-hx-hint">Hermes Agent menulis setiap aksinya ke tabel <code>agent_logs</code>. Daftar diperbarui otomatis tiap 15 detik.</p>' +
    '<div class="a-hx-logs">' +
      (items || '<p class="a-empty">Belum ada aktivitas Hermes Agent. Coba salah satu Aksi Cepat.</p>') +
    '</div>';

  const rf = $('hxRefresh');
  if (rf) rf.addEventListener('click', () => loadLogs());
}

function renderQuick() {
  const body = $('hxBody');
  if (!body || body.getAttribute('data-hxtab') !== 'quick') return;

  body.innerHTML =
    '<div class="a-hx-toolbar"><b>Quick Action Triggers</b><span class="a-hx-hint">Satu klik → Hermes Agent eksekusi.</span></div>' +
    '<div class="a-hx-quick">' +
      QUICK_ACTIONS.map((a) =>
        '<div class="a-hx-card" data-hx-action="' + esc(a.id) + '">' +
          '<div class="a-hx-card__head"><span class="a-hx-card__icon">' + esc(a.icon) + '</span><b>' + esc(a.label) + '</b></div>' +
          '<p class="a-hx-card__desc">' + esc(a.desc) + '</p>' +
          '<div class="a-hx-card__foot">' +
            '<button type="button" class="btn btn--primary btn--sm" data-hx-run="' + esc(a.id) + '">Jalankan</button>' +
            '<span class="a-hx-card__state" data-hx-state="' + esc(a.id) + '"></span>' +
          '</div>' +
          '<div class="a-hx-card__out" data-hx-out="' + esc(a.id) + '" hidden></div>' +
        '</div>'
      ).join('') +
    '</div>';

  body.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-hx-run]') : null;
    if (!btn) return;
    runQuickAction(btn.getAttribute('data-hx-run'));
  });
}

async function runQuickAction(actionId) {
  const act = QUICK_ACTIONS.find((a) => a.id === actionId);
  if (!act || busy) return;

  const stateEl = document.querySelector('[data-hx-state="' + actionId + '"]');
  const outEl = document.querySelector('[data-hx-out="' + actionId + '"]');
  busy = true;
  if (stateEl) stateEl.textContent = '⏳ Menjalankan…';
  if (outEl) { outEl.hidden = false; outEl.textContent = 'Menunggu Hermes Agent…'; }

  const res = await callHermes(act.id, act.payload, { source: 'admin_quick_action' });

  busy = false;
  if (stateEl) stateEl.textContent = res.ok ? '✅ Selesai' : '❌ Gagal';

  if (outEl) {
    outEl.hidden = false;
    outEl.innerHTML = res.ok
      ? '<pre>' + esc(formatOutput(res.output).slice(0, 6000)) + '</pre>'
      : '<p class="a-hx-err">' + esc(res.error || 'Gagal') + '</p>';
  }

  const summary = res.ok
    ? formatOutput(res.output).slice(0, 300)
    : ('Gagal: ' + (res.error || 'tidak diketahui'));

  await logAgent({
    action: act.id,
    action_label: act.label,
    status: res.ok ? 'success' : 'error',
    trigger_source: 'admin_quick_action',
    target_type: act.target_type || null,
    summary,
    detail: act.payload,
    output: res.ok ? formatOutput(res.output).slice(0, 4000) : null,
    duration_ms: res.durationMs
  });

  toast(res.ok ? 'Hermes selesai: ' + act.label : 'Hermes gagal: ' + (res.error || ''), res.ok ? 'ok' : 'warn');
  loadLogs(true);
}

function renderChat() {
  const body = $('hxBody');
  if (!body || body.getAttribute('data-hxtab') !== 'chat') return;

  const bubbles = chat.map((m) => {
    const cls = m.role === 'admin' ? 'a-hx-msg a-hx-msg--admin' : (m.role === 'error' ? 'a-hx-msg a-hx-msg--error' : 'a-hx-msg a-hx-msg--hermes');
    const who = m.role === 'admin' ? 'Admin' : (m.role === 'error' ? 'Gagal' : 'Hermes');
    return '<div class="' + cls + '"><span class="a-hx-msg__who">' + esc(who) + '</span>' +
      '<div class="a-hx-msg__text">' + esc(m.text) + '</div></div>';
  }).join('');

  body.innerHTML =
    '<div class="a-hx-toolbar"><b>Chat Admin</b>' +
      '<button type="button" class="btn btn--ghost btn--sm" id="hxClear">Bersihkan</button></div>' +
    '<div class="a-hx-chat" id="hxChatLog">' +
      (bubbles || '<p class="a-empty">Belum ada percakapan. Kasih instruksi ke Hermes Agent di bawah.</p>') +
    '</div>' +
    '<form class="a-hx-chatbox" id="hxChatForm">' +
      '<textarea id="hxChatInput" class="a-input" rows="3" placeholder="Contoh: Analisa bottleneck funnel https://promo.xindelabs.web.id minggu ini, lalu kasih 3 rekomendasi perbaikan."></textarea>' +
      '<div class="a-hx-chatbox__foot">' +
        '<span class="a-hx-hint">Enter kirim · Shift+Enter baris baru</span>' +
        '<button type="submit" class="btn btn--primary btn--sm" id="hxSend">Kirim</button>' +
      '</div>' +
    '</form>';

  const form = $('hxChatForm');
  const input = $('hxChatInput');
  const clear = $('hxClear');

  if (clear) {
    clear.addEventListener('click', () => { chat = []; renderChat(); });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sendChat();
    });
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    });
  }

  const log = $('hxChatLog');
  if (log) log.scrollTop = log.scrollHeight;
}

async function sendChat() {
  const input = $('hxChatInput');
  if (!input) return;
  const text = (input.value || '').trim();
  if (!text || busy) return;

  input.value = '';
  busy = true;
  chat.push({ role: 'admin', text });
  chat.push({ role: 'hermes', text: '…' });
  renderChat();

  const history = chat.slice(0, -1).map((m) => ({ role: m.role === 'admin' ? 'user' : 'assistant', content: m.text }));
  const res = await callHermes(ACTION_CHAT, { message: text, history }, { source: 'admin_chat' });

  busy = false;
  chat.pop();
  chat.push(res.ok
    ? { role: 'hermes', text: formatOutput(res.output) || '(kosong)' }
    : { role: 'error', text: res.error || 'Gagal menghubungi Hermes Agent' });
  renderChat();

  await logAgent({
    action: ACTION_CHAT,
    action_label: 'Chat Admin',
    status: res.ok ? 'success' : 'error',
    trigger_source: 'admin_chat',
    target_type: 'chat',
    summary: text.slice(0, 300),
    detail: { message: text },
    output: res.ok ? formatOutput(res.output).slice(0, 4000) : null,
    duration_ms: res.durationMs
  });
}

async function testConnection() {
  const pill = $('hxStatus');
  if (pill) { pill.textContent = 'Menguji…'; pill.className = 'a-hx-pill'; }
  const res = await callHermes(ACTION_PING, {}, { source: 'admin_ping' });
  lastStatus = res.ok ? 'ok' : 'err';
  if (pill) {
    pill.textContent = res.ok ? 'Terhubung' : 'Gagal / belum ada workflow';
    pill.className = 'a-hx-pill ' + (res.ok ? 'is-ok' : 'is-err');
  }
  toast(res.ok ? 'Hermes Agent merespon ✅' : 'Hermes Agent tidak merespon: ' + (res.error || ''), res.ok ? 'ok' : 'warn');
  return res;
}

// ============================================================
// INIT
// ============================================================

export function init(context) {
  ctx = context;
  ensureSlideover();
  loadHermesConfig();

  // Helper untuk modul lain: tombol "Generate with Hermes AI" di Funnel
  // Builder / Blog Editor cukup panggil:
  //   const res = await callHermes(ACTION_GENERATE_BLOCKS, payload);
  //   const blocks = extractBlocks(res.output);
}
