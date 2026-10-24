// ============================================================
// SUBDOMAIN & FUNNEL BUILDER
// CRUD funnel, step, modular block / custom HTML, order bump & upsell.
// ============================================================
import { esc, toast, schemaHint } from './context.js';
import {
  callHermes, extractBlocks, formatOutput, logAgent, openHermesPrompt,
  ACTION_GENERATE_BLOCKS, BLOCK_SCHEMA_HINT
} from './hermes-bridge.js';

const $ = (id) => document.getElementById(id);

const FUNNEL_HTML = `
  <div class="section-head" style="text-align:left">
    <p class="eyebrow"><span class="dot"></span>admin</p>
    <h2 class="h2">Subdomain &amp; Funnel Builder</h2>
    <p class="lead">Kelola subdomain, susun step funnel, blok modular, order bump, dan upsell.</p>
  </div>

  <div class="notice notice--warn" id="fbNotice" style="display:none"></div>

  <div class="a-funnel-layout">
    <aside class="a-funnel-list">
      <div class="a-card__head">
        <h3>Funnel</h3>
        <button type="button" class="btn btn--primary btn--sm" id="fbAdd">+ Baru</button>
      </div>
      <div id="fbNewForm" class="a-newform" style="display:none">
        <input id="fbNewName" class="a-input" placeholder="Nama funnel">
        <input id="fbNewSub" class="a-input" placeholder="subdomain (cth: promo)">
        <input id="fbNewSlug" class="a-input" placeholder="slug (opsional)">
        <div class="a-actions">
          <button type="button" class="btn btn--primary btn--sm" id="fbCreate">Buat</button>
          <button type="button" class="btn btn--ghost btn--sm" id="fbCancelNew">Batal</button>
        </div>
      </div>
      <div id="fbList"></div>
    </aside>

    <section id="fbEditor" class="a-funnel-editor">
      <p class="a-empty" id="fbEmpty">Pilih funnel di kiri untuk mulai edit.</p>
      <div id="fbForm" style="display:none"></div>
    </section>
  </div>
`;

const STEP_TYPES = ['landing', 'video', 'checkout', 'upsell', 'thankyou'];

const BLOCK_TYPES = [
  { value: 'hero', label: 'Hero' },
  { value: 'video_vsl', label: 'Video VSL' },
  { value: 'problem', label: 'Problem' },
  { value: 'benefit', label: 'Benefit' },
  { value: 'kurikulum', label: 'Kurikulum' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'faq', label: 'FAQ' },
  { value: 'cta', label: 'CTA / Opt-in' },
  { value: 'custom_html_embed', label: 'Custom HTML' }
];

const DEFAULT_SETTINGS = {
  checkout_mode: 'embedded',
  skip_upsell: false,
  webhook_url: '',
  order_bump: {
    enabled: true,
    label: 'Order Bump - Tambahan Spesial',
    price: 149000,
    description: 'Bonus eksklusif khusus pembelian ini'
  },
  upsell: {
    enabled: true,
    eyebrow: 'ONE-TIME OFFER',
    headline: 'Tunggu Dulu, Ada Penawaran Khusus Untuk Kamu',
    description: 'Tambahkan ini ke pesanan kamu dengan harga spesial sebelum melanjutkan',
    title: 'VIP Upgrade Bundle',
    price: 497000,
    compare_price: 997000,
    cta: 'Ya, Tambahkan ke Pesanan',
    items: ['Akses Template Eksklusif', 'Swipe File Siap Pakai', 'Prioritas Support 30 Hari', 'Bonus Group Private']
  }
};

let ctx = null;
let initialized = false;
let state = { funnels: [], steps: [], selectedId: null, draft: null, loading: false };

export function ensurePanel() {
  const panel = document.getElementById('panelFunnels');
  if (!panel) return;
  if (panel.dataset.adminFunnel === '1') return;
  panel.innerHTML = FUNNEL_HTML;
  panel.dataset.adminFunnel = '1';
}

export function init(context) {
  if (initialized) { ctx = context; return; }
  ctx = context;
  initialized = true;
  ensurePanel();

  $('fbAdd').addEventListener('click', () => {
    $('fbNewForm').style.display = 'block';
    $('fbNewName').focus();
  });
  $('fbCancelNew').addEventListener('click', () => {
    $('fbNewForm').style.display = 'none';
  });
  $('fbCreate').addEventListener('click', createFunnel);
  $('fbNewSub').addEventListener('keydown', (e) => { if (e.key === 'Enter') createFunnel(); });

  bindEditorEvents();
}

export function load() {
  refresh();
}

export async function refresh() {
  if (!ctx || !ctx.client || state.loading) return;
  state.loading = true;
  try {
    const [fRes, sRes] = await Promise.all([
      ctx.client.from('funnels').select('*').order('created_at', { ascending: true }),
      ctx.client.from('funnel_steps').select('*').order('sort', { ascending: true })
    ]);
    if (fRes.error) throw fRes.error;
    state.funnels = fRes.data || [];
    state.steps = sRes.error ? [] : (sRes.data || []);

    const saved = localStorage.getItem('xinde_fb_selected');
    const found = state.funnels.find((f) => String(f.id) === String(state.selectedId || saved));
    state.selectedId = found ? found.id : (state.funnels[0] ? state.funnels[0].id : null);

    renderList();
    renderEditor();
  } catch (err) {
    console.error('[funnel-builder]', err);
    const notice = $('fbNotice');
    if (notice) {
      notice.style.display = 'block';
      notice.innerHTML = '⚠️ Gagal load funnel: <b style="color:inherit">' + esc(err.message || '') + '</b>. ' +
        'Pastikan tabel <span style="font-family:var(--font-mono)">funnels</span> &amp; ' +
        '<span style="font-family:var(--font-mono)">funnel_steps</span> sudah dibuat.' + schemaHint(err);
    }
  } finally {
    state.loading = false;
  }
}

function renderList() {
  const el = $('fbList');
  if (!el) return;
  if (!state.funnels.length) {
    el.innerHTML = '<p class="a-empty">Belum ada funnel. Klik "+ Baru".</p>';
    return;
  }
  el.innerHTML = state.funnels.map((f) => {
    const steps = state.steps.filter((s) => String(s.funnel_id) === String(f.id)).length;
    const active = String(f.id) === String(state.selectedId);
    return '<button type="button" class="a-funnel-item' + (active ? ' is-active' : '') + '" data-id="' + esc(f.id) + '">' +
      '<span class="a-funnel-item__dot' + (f.is_active ? ' is-on' : '') + '"></span>' +
      '<span class="a-funnel-item__main"><b>' + esc(f.name || f.slug || 'Funnel') + '</b>' +
      '<span class="l-meta">' + esc(f.subdomain || f.slug || '—') + ' · ' + steps + ' step</span></span>' +
    '</button>';
  }).join('');

  el.querySelectorAll('.a-funnel-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      collectDraftFromDom();
      state.selectedId = btn.dataset.id;
      localStorage.setItem('xinde_fb_selected', state.selectedId);
      renderList();
      renderEditor();
    });
  });
}

function buildDraft(funnel) {
  const settings = Object.assign({}, DEFAULT_SETTINGS, funnel.settings || {});
  settings.order_bump = Object.assign({}, DEFAULT_SETTINGS.order_bump, (funnel.settings && funnel.settings.order_bump) || {});
  settings.upsell = Object.assign({}, DEFAULT_SETTINGS.upsell, (funnel.settings && funnel.settings.upsell) || {});
  if (!Array.isArray(settings.upsell.items)) settings.upsell.items = DEFAULT_SETTINGS.upsell.items.slice();

  const steps = state.steps
    .filter((s) => String(s.funnel_id) === String(funnel.id))
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((s) => ({
      id: s.id,
      sort: s.sort,
      slug: s.slug || '',
      type: s.type || 'landing',
      title: s.title || '',
      is_active: s.is_active !== false,
      blocks: (Array.isArray(s.blocks) ? s.blocks : []).map((b) => ({
        type: b.type || 'hero',
        data: b.data && typeof b.data === 'object' ? b.data : (b.data || {})
      }))
    }));

  return {
    id: funnel.id,
    name: funnel.name || '',
    slug: funnel.slug || '',
    subdomain: funnel.subdomain || '',
    meta_pixel_id: funnel.meta_pixel_id || '',
    thankyou_url: funnel.thankyou_url || '',
    upsell_url: funnel.upsell_url || '',
    currency: funnel.currency || 'IDR',
    is_active: funnel.is_active !== false,
    settings,
    steps
  };
}

function renderEditor() {
  const draft = state.funnels.find((f) => String(f.id) === String(state.selectedId));
  const form = $('fbForm');
  const empty = $('fbEmpty');
  if (!draft) {
    state.draft = null;
    if (form) form.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  if (form) form.style.display = 'block';

  state.draft = buildDraft(draft);
  const d = state.draft;
  const s = d.settings;
  const bump = s.order_bump;
  const up = s.upsell;

  form.innerHTML =
    '<div class="a-card">' +
      '<div class="a-card__head"><h3>Pengaturan Subdomain</h3>' +
        '<div class="a-actions">' +
          '<button type="button" class="btn btn--ghost btn--sm" id="fbPreview">Preview ↗</button>' +
          '<button type="button" class="btn btn--ghost btn--sm" id="fbDelete">Hapus Funnel</button>' +
        '</div>' +
      '</div>' +
      '<div class="admin-grid3">' +
        field('Nama Funnel', 'fb_name', d.name) +
        field('Slug', 'fb_slug', d.slug, 'promo') +
        field('Subdomain', 'fb_subdomain', d.subdomain, 'promo') +
        field('Meta Pixel ID', 'fb_pixel', d.meta_pixel_id, '921699146613715') +
        field('Currency', 'fb_currency', d.currency, 'IDR') +
        field('Thank You URL', 'fb_thankyou', d.thankyou_url, '/thankyou') +
        field('Upsell URL', 'fb_upsell_url', d.upsell_url, '/upsell') +
      '</div>' +
      '<label class="a-check" style="margin-top:12px"><input type="checkbox" id="fb_active"' + (d.is_active ? ' checked' : '') + '> Funnel aktif</label>' +
    '</div>' +

    '<div class="a-card">' +
      '<div class="a-card__head"><h3>Checkout, Order Bump &amp; Upsell</h3></div>' +
      '<div class="admin-grid3">' +
        '<div class="field"><label>Mode Checkout</label><select id="fb_mode" class="a-input">' +
          '<option value="embedded"' + (s.checkout_mode === 'embedded' ? ' selected' : '') + '>Embedded (modal)</option>' +
          '<option value="standalone"' + (s.checkout_mode === 'standalone' ? ' selected' : '') + '>Standalone (/checkout)</option>' +
        '</select></div>' +
        field('Webhook Payment URL', 'fb_webhook', s.webhook_url, 'https://n8n.../webhook/create-payment') +
        '<div class="field"><label>&nbsp;</label><label class="a-check"><input type="checkbox" id="fb_skip_upsell"' + (s.skip_upsell ? ' checked' : '') + '> Lewati halaman upsell</label></div>' +
      '</div>' +

      '<div class="a-subhead">Order Bump</div>' +
      '<div class="admin-grid3">' +
        '<div class="field"><label>&nbsp;</label><label class="a-check"><input type="checkbox" id="fb_bump_enabled"' + (bump.enabled !== false ? ' checked' : '') + '> Aktifkan order bump</label></div>' +
        field('Label Order Bump', 'fb_bump_label', bump.label) +
        field('Harga Bump (Rp)', 'fb_bump_price', bump.price, '149000', 'number') +
      '</div>' +
      '<div class="field"><label>Deskripsi Order Bump</label><input id="fb_bump_desc" class="a-input" value="' + esc(bump.description || '') + '"></div>' +

      '<div class="a-subhead">Upsell</div>' +
      '<div class="admin-grid3">' +
        '<div class="field"><label>&nbsp;</label><label class="a-check"><input type="checkbox" id="fb_up_enabled"' + (up.enabled !== false ? ' checked' : '') + '> Aktifkan upsell</label></div>' +
        field('Judul Upsell', 'fb_up_title', up.title) +
        field('Eyebrow', 'fb_up_eyebrow', up.eyebrow) +
      '</div>' +
      '<div class="field"><label>Headline</label><input id="fb_up_headline" class="a-input" value="' + esc(up.headline || '') + '"></div>' +
      '<div class="field"><label>Deskripsi</label><input id="fb_up_desc" class="a-input" value="' + esc(up.description || '') + '"></div>' +
      '<div class="admin-grid3">' +
        field('Harga Upsell (Rp)', 'fb_up_price', up.price, '497000', 'number') +
        field('Harga Coret (Rp)', 'fb_up_compare', up.compare_price, '997000', 'number') +
        field('CTA Upsell', 'fb_up_cta', up.cta) +
      '</div>' +
      '<div class="field"><label>Item Upsell (satu per baris)</label><textarea id="fb_up_items" class="a-input" rows="4">' + esc((up.items || []).join('\n')) + '</textarea></div>' +
    '</div>' +

    '<div class="a-card">' +
      '<div class="a-card__head"><h3>Step Funnel</h3>' +
        '<button type="button" class="btn btn--primary btn--sm" id="fbAddStep">+ Tambah Step</button>' +
      '</div>' +
      '<div id="fbSteps"></div>' +
    '</div>' +

    '<div class="admin-tools">' +
      '<button type="button" class="btn btn--primary" id="fbSave">Simpan Funnel</button>' +
      '<span class="hint" id="fbSaveState"></span>' +
    '</div>';

  renderSteps();

  $('fbSave').addEventListener('click', saveFunnel);
  // Perbaikan preview: buka di subdomain-nya langsung (bukan /?subdomain=),
  // karena halaman admin ini berjalan di host admin. (localhost/preview Vercel
  // tetap boleh pakai param ?subdomain= untuk uji lokal.)
  $('fbPreview').addEventListener('click', () => {
    collectDraftFromDom();
    const sub = state.draft.subdomain || state.draft.slug;
    if (!sub) return toast('Isi subdomain dulu.', 'warn');
    const h = String(window.location.hostname || '');
    const isLocal = h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.endsWith('.vercel.app');
    const url = isLocal
      ? window.location.origin + '/?subdomain=' + encodeURIComponent(sub)
      : 'https://' + encodeURIComponent(sub) + '.xindelabs.web.id/';
    window.open(url, '_blank');
  });
  $('fbDelete').addEventListener('click', deleteFunnel);
  $('fbAddStep').addEventListener('click', addStep);
}

function field(label, id, value, placeholder, type) {
  return '<div class="field"><label>' + esc(label) + '</label><input id="' + id + '" class="a-input" type="' + (type || 'text') + '" value="' + esc(value == null ? '' : value) + '" placeholder="' + esc(placeholder || '') + '"></div>';
}

function renderSteps() {
  const host = $('fbSteps');
  if (!host || !state.draft) return;
  const steps = state.draft.steps;
  if (!steps.length) {
    host.innerHTML = '<p class="a-empty">Belum ada step. Klik "+ Tambah Step".</p>';
    return;
  }
  host.innerHTML = steps.map((step, si) =>
    '<div class="a-step" data-si="' + si + '">' +
      '<div class="a-step__head">' +
        '<span class="a-step__num">' + (si + 1) + '</span>' +
        '<input class="a-input s-title" value="' + esc(step.title || '') + '" placeholder="Judul step">' +
        '<input class="a-input s-slug" value="' + esc(step.slug || '') + '" placeholder="slug-step">' +
        '<select class="a-input s-type">' + STEP_TYPES.map((t) =>
          '<option value="' + t + '"' + (step.type === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>' +
        '<label class="a-check"><input type="checkbox" class="s-active"' + (step.is_active !== false ? ' checked' : '') + '> aktif</label>' +
        '<div class="a-actions">' +
          '<button type="button" class="btn btn--ghost btn--sm s-hermes" title="Generate blok step ini dengan Hermes AI">✨ Hermes</button>' +
          '<button type="button" class="btn btn--ghost btn--sm s-up" title="Naik">↑</button>' +
          '<button type="button" class="btn btn--ghost btn--sm s-down" title="Turun">↓</button>' +
          '<button type="button" class="btn btn--ghost btn--sm s-del">Hapus</button>' +
        '</div>' +
      '</div>' +
      '<div class="a-blocks">' +
        step.blocks.map((b, bi) => blockCard(b, bi)).join('') +
      '</div>' +
      '<div class="a-step__add">' +
        '<select class="a-input add-block-type">' + BLOCK_TYPES.map((t) =>
          '<option value="' + t.value + '">' + t.label + '</option>').join('') + '</select>' +
        '<button type="button" class="btn btn--ghost btn--sm s-add-block">+ Blok</button>' +
      '</div>' +
    '</div>'
  ).join('');
}

function blockCard(block, bi) {
  const meta = BLOCK_TYPES.find((t) => t.value === block.type) || BLOCK_TYPES[0];
  return '<div class="a-block" data-bi="' + bi + '" data-type="' + esc(block.type) + '">' +
    '<div class="a-block__head">' +
      '<b>' + esc(meta.label) + '</b>' +
      '<div class="a-actions">' +
        '<button type="button" class="btn btn--ghost btn--sm blk-up" title="Naik">↑</button>' +
        '<button type="button" class="btn btn--ghost btn--sm blk-down" title="Turun">↓</button>' +
        '<button type="button" class="btn btn--ghost btn--sm blk-del">Hapus</button>' +
      '</div>' +
    '</div>' +
    '<div class="a-block__body">' +
      '<div class="a-block__guided">' + guidedFields(block) + '</div>' +
      '<details class="a-block__json"><summary>Advanced JSON</summary>' +
        '<textarea class="a-input blk-json" rows="6">' + esc(JSON.stringify(block.data || {}, null, 2)) + '</textarea>' +
      '</details>' +
    '</div>' +
  '</div>';
}

// ---------------- Guided fields ----------------

function inputF(label, f, val, type, ph) {
  return '<div class="field"><label>' + esc(label) + '</label><input class="a-input" data-f="' + f + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(ph || '') + '"></div>';
}
function textF(label, f, val, rows) {
  return '<div class="field"><label>' + esc(label) + '</label><textarea class="a-input" data-f="' + f + '" rows="' + (rows || 3) + '">' + esc(val == null ? '' : val) + '</textarea></div>';
}

function guidedFields(block) {
  const d = block.data || {};
  switch (block.type) {
    case 'hero':
      return '<div class="admin-grid3">' +
        inputF('Eyebrow', 'eyebrow', d.eyebrow) + inputF('Badge', 'badge', d.badge) + inputF('CTA Text', 'cta_text', d.cta_text) +
        '</div>' + inputF('Judul', 'title', d.title) + textF('Subtitle', 'subtitle', d.subtitle) +
        inputF('CTA Anchor', 'cta_anchor', d.cta_anchor) + inputF('Gambar URL', 'image', d.image);

    case 'video_vsl':
      return inputF('Video URL', 'video_url', d.video_url, 'url', 'https://...mp4') +
        inputF('Caption', 'caption', d.caption);

    case 'problem':
    case 'benefit':
    case 'kurikulum':
      return inputF('Judul', 'title', d.title) + textF('Deskripsi', 'description', d.description, 2) +
        itemsEditor(d.items, false);

    case 'pricing':
      return inputF('Judul', 'title', d.title) + textF('Deskripsi', 'description', d.description, 2) +
        tiersEditor(d.tiers);

    case 'faq':
      return inputF('Judul', 'title', d.title) + itemsEditor(d.items, true);

    case 'cta':
      return inputF('Judul', 'title', d.title) + textF('Subtitle', 'subtitle', d.subtitle, 2) +
        '<div class="admin-grid3">' +
          inputF('Primary Text', 'primary_text', d.primary_text) +
          inputF('Secondary Text', 'secondary_text', d.secondary_text) +
          inputF('Secondary URL', 'secondary_url', d.secondary_url) +
        '</div>' +
        '<label class="a-check"><input type="checkbox" data-f="form"' + (d.form !== false ? ' checked' : '') + '> Tampilkan form opt-in</label>' +
        '<div class="admin-grid3" style="margin-top:10px">' +
          inputF('Form Title', 'form_title', d.form_title) +
          inputF('Form Button', 'form_button', d.form_button) +
          inputF('Form Description', 'form_description', d.form_description) +
        '</div>';

    case 'custom_html_embed':
      return textF('HTML (script ikut dijalankan)', 'html', d.html, 10);

    default:
      return textF('Data JSON', 'raw', JSON.stringify(d, null, 2), 6);
  }
}

function itemsEditor(items, isFaq) {
  const list = Array.isArray(items) ? items : [];
  const rows = list.map((it) => itemRow(it, isFaq)).join('');
  return '<div class="a-items">' + rows + '</div>' +
    '<button type="button" class="btn btn--ghost btn--sm row-add">+ Tambah Item</button>';
}

function itemRow(it, isFaq) {
  it = it || {};
  return '<div class="a-row" data-row>' +
    '<input class="a-input" data-f="' + (isFaq ? 'q' : 'title') + '" value="' + esc(isFaq ? (it.q || it.question || '') : (it.title || it.label || '')) + '" placeholder="' + (isFaq ? 'Pertanyaan' : 'Judul') + '">' +
    '<textarea class="a-input" data-f="' + (isFaq ? 'a' : 'desc') + '" rows="2" placeholder="' + (isFaq ? 'Jawaban' : 'Deskripsi') + '">' + esc(isFaq ? (it.a || it.answer || '') : (it.desc || it.description || '')) + '</textarea>' +
    '<button type="button" class="btn btn--ghost btn--sm row-del">✕</button>' +
  '</div>';
}

function tiersEditor(tiers) {
  const list = Array.isArray(tiers) ? tiers : [];
  return '<div class="a-tiers">' + list.map(tierRow).join('') + '</div>' +
    '<button type="button" class="btn btn--ghost btn--sm tier-add">+ Tambah Tier</button>';
}

function tierRow(t) {
  t = t || {};
  return '<div class="a-tier" data-tier>' +
    '<div class="admin-grid3">' +
      '<div class="field"><label>ID</label><input class="a-input" data-f="id" value="' + esc(t.id || '') + '" placeholder="starter"></div>' +
      '<div class="field"><label>Nama</label><input class="a-input" data-f="name" value="' + esc(t.name || '') + '"></div>' +
      '<div class="field"><label>Harga (Rp)</label><input class="a-input" data-f="price" type="number" value="' + esc(t.price == null ? '' : t.price) + '"></div>' +
    '</div>' +
    '<div class="admin-grid3">' +
      '<div class="field"><label>Harga Coret</label><input class="a-input" data-f="original_price" type="number" value="' + esc(t.original_price == null ? '' : t.original_price) + '"></div>' +
      '<div class="field"><label>Periode</label><input class="a-input" data-f="period" value="' + esc(t.period || '') + '" placeholder="sekali bayar"></div>' +
      '<div class="field"><label>Badge</label><input class="a-input" data-f="badge" value="' + esc(t.badge || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>CTA Text</label><input class="a-input" data-f="cta_text" value="' + esc(t.cta_text || '') + '"></div>' +
    '<div class="field"><label>Fitur (satu per baris)</label><textarea class="a-input" data-f="features" rows="3">' + esc((Array.isArray(t.features) ? t.features : []).join('\n')) + '</textarea></div>' +
    '<div class="a-tier__foot">' +
      '<label class="a-check"><input type="checkbox" data-f="highlight"' + (t.highlight ? ' checked' : '') + '> Paling populer</label>' +
      '<button type="button" class="btn btn--ghost btn--sm tier-del">✕ Hapus Tier</button>' +
    '</div>' +
  '</div>';
}

// ---------------- Read DOM ----------------

function readScalar(scope) {
  const data = {};
  scope.querySelectorAll('[data-f]').forEach((el) => {
    const f = el.dataset.f;
    if (el.closest('[data-row]') || el.closest('[data-tier]')) return;
    if (el.type === 'checkbox') data[f] = el.checked;
    else if (el.type === 'number') data[f] = el.value === '' ? null : Number(el.value);
    else data[f] = el.value;
  });
  return data;
}

function readBlock(blockEl) {
  const type = blockEl.dataset.type;
  const guided = blockEl.querySelector('.a-block__guided');
  const data = readScalar(guided);

  if (['problem', 'benefit', 'kurikulum', 'faq'].includes(type)) {
    const isFaq = type === 'faq';
    data.items = Array.from(guided.querySelectorAll('.a-items [data-row]')).map((row) => {
      const a = row.querySelector('[data-f="' + (isFaq ? 'q' : 'title') + '"]');
      const b = row.querySelector('[data-f="' + (isFaq ? 'a' : 'desc') + '"]');
      return isFaq
        ? { q: a ? a.value : '', a: b ? b.value : '' }
        : { title: a ? a.value : '', desc: b ? b.value : '' };
    }).filter((it) => (isFaq ? (it.q || it.a) : (it.title || it.desc)));
  }

  if (type === 'pricing') {
    data.tiers = Array.from(guided.querySelectorAll('.a-tiers [data-tier]')).map((row) => {
      const get = (f) => row.querySelector('[data-f="' + f + '"]');
      const val = (f) => { const el = get(f); return el ? el.value : ''; };
      const num = (f) => { const v = val(f); return v === '' ? null : Number(v); };
      return {
        id: val('id').trim(),
        name: val('name').trim(),
        price: num('price') || 0,
        original_price: num('original_price'),
        period: val('period').trim(),
        badge: val('badge').trim(),
        cta_text: val('cta_text').trim(),
        highlight: !!(get('highlight') && get('highlight').checked),
        features: val('features').split('\n').map((x) => x.trim()).filter(Boolean)
      };
    });
  }

  return data;
}

function collectDraftFromDom() {
  const d = state.draft;
  if (!d) return;
  const form = $('fbForm');
  if (!form || form.style.display === 'none') return;

  const val = (id) => { const el = $(id); return el ? el.value : ''; };
  const checked = (id) => { const el = $(id); return el ? el.checked : false; };

  d.name = val('fb_name').trim();
  d.slug = val('fb_slug').trim();
  d.subdomain = val('fb_subdomain').trim();
  d.meta_pixel_id = val('fb_pixel').trim();
  d.currency = val('fb_currency').trim() || 'IDR';
  d.thankyou_url = val('fb_thankyou').trim();
  d.upsell_url = val('fb_upsell_url').trim();
  d.is_active = checked('fb_active');

  d.settings.checkout_mode = val('fb_mode') || 'embedded';
  d.settings.webhook_url = val('fb_webhook').trim();
  d.settings.skip_upsell = checked('fb_skip_upsell');
  d.settings.order_bump = {
    enabled: checked('fb_bump_enabled'),
    label: val('fb_bump_label').trim(),
    price: Number(val('fb_bump_price')) || 0,
    description: val('fb_bump_desc').trim()
  };
  d.settings.upsell = {
    enabled: checked('fb_up_enabled'),
    eyebrow: val('fb_up_eyebrow').trim(),
    headline: val('fb_up_headline').trim(),
    description: val('fb_up_desc').trim(),
    title: val('fb_up_title').trim(),
    price: Number(val('fb_up_price')) || 0,
    compare_price: Number(val('fb_up_compare')) || 0,
    cta: val('fb_up_cta').trim(),
    items: val('fb_up_items').split('\n').map((x) => x.trim()).filter(Boolean)
  };

  Array.from(form.querySelectorAll('#fbSteps .a-step')).forEach((stepEl) => {
    const si = Number(stepEl.dataset.si);
    const step = d.steps[si];
    if (!step) return;
    step.title = stepEl.querySelector('.s-title').value;
    step.slug = stepEl.querySelector('.s-slug').value;
    step.type = stepEl.querySelector('.s-type').value;
    step.is_active = stepEl.querySelector('.s-active').checked;
    step.blocks = Array.from(stepEl.querySelectorAll(':scope > .a-blocks > .a-block')).map((bEl) => ({
      type: bEl.dataset.type,
      data: readBlock(bEl)
    }));
  });
}

// ---------------- Events (delegation) ----------------

function bindEditorEvents() {
  const form = $('fbForm');
  if (!form) return;

  form.addEventListener('input', (e) => {
    const blockEl = e.target.closest('.a-block');
    if (!blockEl) return;
    if (e.target.classList.contains('blk-json')) return;
    if (!e.target.matches('[data-f]')) return;
    syncBlockJson(blockEl);
  });

  form.addEventListener('change', (e) => {
    const blockEl = e.target.closest('.a-block');
    if (blockEl && e.target.classList.contains('blk-json')) {
      applyJsonToBlock(blockEl);
      return;
    }
    if (blockEl && e.target.matches('[data-f]')) syncBlockJson(blockEl);
  });

  form.addEventListener('click', (e) => {
    const stepEl = e.target.closest('.a-step');
    const blockEl = e.target.closest('.a-block');

    if (e.target.matches('.s-add-block')) {
      collectDraftFromDom();
      const si = Number(stepEl.dataset.si);
      const type = stepEl.querySelector('.add-block-type').value;
      state.draft.steps[si].blocks.push({ type, data: blockDefaults(type) });
      renderSteps();
      return;
    }
    if (e.target.matches('.s-hermes')) {
      const si = Number(stepEl.dataset.si);
      generateStepWithHermes(si);
      return;
    }
    if (e.target.matches('.s-up') || e.target.matches('.s-down')) {
      collectDraftFromDom();
      const si = Number(stepEl.dataset.si);
      move(state.draft.steps, si, e.target.matches('.s-up') ? -1 : 1);
      renderSteps();
      return;
    }
    if (e.target.matches('.s-del')) {
      collectDraftFromDom();
      const si = Number(stepEl.dataset.si);
      if (!confirm('Hapus step ini?')) return;
      state.draft.steps.splice(si, 1);
      renderSteps();
      return;
    }
    if (e.target.matches('.blk-up') || e.target.matches('.blk-down')) {
      collectDraftFromDom();
      const si = Number(stepEl.dataset.si);
      const bi = Number(blockEl.dataset.bi);
      move(state.draft.steps[si].blocks, bi, e.target.matches('.blk-up') ? -1 : 1);
      renderSteps();
      return;
    }
    if (e.target.matches('.blk-del')) {
      collectDraftFromDom();
      const si = Number(stepEl.dataset.si);
      const bi = Number(blockEl.dataset.bi);
      if (!confirm('Hapus blok ini?')) return;
      state.draft.steps[si].blocks.splice(bi, 1);
      renderSteps();
      return;
    }
    if (e.target.matches('.row-add')) {
      collectDraftFromDom();
      const si = Number(stepEl.dataset.si);
      const bi = Number(blockEl.dataset.bi);
      const type = state.draft.steps[si].blocks[bi].type;
      if (!Array.isArray(state.draft.steps[si].blocks[bi].data.items)) state.draft.steps[si].blocks[bi].data.items = [];
      state.draft.steps[si].blocks[bi].data.items.push(type === 'faq' ? { q: '', a: '' } : { title: '', desc: '' });
      renderSteps();
      return;
    }
    if (e.target.matches('.row-del')) {
      collectDraftFromDom();
      const si = Number(stepEl.dataset.si);
      const bi = Number(blockEl.dataset.bi);
      const rowEl = e.target.closest('[data-row]');
      const rows = Array.from(blockEl.querySelectorAll('.a-items [data-row]'));
      const ri = rows.indexOf(rowEl);
      if (ri >= 0) state.draft.steps[si].blocks[bi].data.items.splice(ri, 1);
      renderSteps();
      return;
    }
    if (e.target.matches('.tier-add')) {
      collectDraftFromDom();
      const si = Number(stepEl.dataset.si);
      const bi = Number(blockEl.dataset.bi);
      if (!Array.isArray(state.draft.steps[si].blocks[bi].data.tiers)) state.draft.steps[si].blocks[bi].data.tiers = [];
      state.draft.steps[si].blocks[bi].data.tiers.push({ id: 'tier-' + Date.now(), name: 'Tier Baru', price: 0, features: [] });
      renderSteps();
      return;
    }
    if (e.target.matches('.tier-del')) {
      collectDraftFromDom();
      const si = Number(stepEl.dataset.si);
      const bi = Number(blockEl.dataset.bi);
      const tierEl = e.target.closest('[data-tier]');
      const tiers = Array.from(blockEl.querySelectorAll('.a-tiers [data-tier]'));
      const ti = tiers.indexOf(tierEl);
      if (ti >= 0) state.draft.steps[si].blocks[bi].data.tiers.splice(ti, 1);
      renderSteps();
      return;
    }
  });
}

function syncBlockJson(blockEl) {
  const data = readBlock(blockEl);
  const stepEl = blockEl.closest('.a-step');
  if (stepEl && state.draft) {
    const si = Number(stepEl.dataset.si);
    const bi = Number(blockEl.dataset.bi);
    const block = state.draft.steps[si] && state.draft.steps[si].blocks[bi];
    if (block) block.data = data;
  }
  const json = blockEl.querySelector('.blk-json');
  if (json) json.value = JSON.stringify(data, null, 2);
}

function applyJsonToBlock(blockEl) {
  const json = blockEl.querySelector('.blk-json');
  let parsed;
  try {
    parsed = JSON.parse(json.value || '{}');
  } catch (e) {
    toast('JSON tidak valid: ' + e.message, 'warn');
    return;
  }
  const stepEl = blockEl.closest('.a-step');
  if (!stepEl || !state.draft) return;
  const si = Number(stepEl.dataset.si);
  const bi = Number(blockEl.dataset.bi);
  const block = state.draft.steps[si].blocks[bi];
  block.data = parsed && parsed.data ? parsed.data : parsed;
  renderSteps();
}

function move(arr, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= arr.length) return;
  const tmp = arr[index];
  arr[index] = arr[target];
  arr[target] = tmp;
}

function addStep() {
  collectDraftFromDom();
  if (!state.draft) return;
  const n = state.draft.steps.length + 1;
  state.draft.steps.push({
    slug: 'step-' + n,
    type: 'landing',
    title: 'Step ' + n,
    is_active: true,
    blocks: [{ type: 'hero', data: blockDefaults('hero') }]
  });
  renderSteps();
}

// ------------------------------------------------------------
// GENERATE WITH HERMES AI — susunan blok modular untuk satu step
// ------------------------------------------------------------

async function generateStepWithHermes(si) {
  if (!state.draft) return;
  collectDraftFromDom();

  const d = state.draft;
  const step = d.steps[si];
  if (!step) return;

  const answers = await openHermesPrompt({
    title: 'Generate Step Funnel dengan Hermes AI',
    subtitle: 'Hermes menyusun susunan blok modular (JSON) untuk step ini — hasil langsung masuk ke editor blok.',
    note: 'Funnel: ' + (d.name || d.subdomain || '—') +
      '\nStep: ' + (step.title || step.slug || '—') + ' (' + (step.type || 'landing') + ')' +
      '\nBlok existing: ' + (step.blocks.length ? step.blocks.map((b) => b.type).join(', ') : 'belum ada'),
    submitLabel: 'Generate Blok',
    fields: [
      { key: 'brief', label: 'Instruksi singkat', type: 'textarea', rows: 4, placeholder: 'cth. step opt-in leads: fokus demo agent, tampilkan garansi 30 hari, CTA isi nama + email' },
      { key: 'cta', label: 'Target CTA step ini', type: 'text', placeholder: 'cth. isi nama & email untuk mulai' },
      {
        key: 'mode', label: 'Mode', type: 'select', value: 'replace',
        options: [
          { value: 'replace', label: 'Ganti semua blok di step ini' },
          { value: 'append', label: 'Tambahkan ke blok yang ada' }
        ],
        hint: 'Blok hasil generate tetap bisa diedit manual (guided form + Advanced JSON).'
      },
      { key: 'types', label: 'Tipe blok yang diizinkan (pisahkan koma, kosong = semua)', type: 'text', placeholder: 'hero, benefit, pricing, faq, cta' }
    ]
  });

  if (!answers) return;

  const allowed = String(answers.types || '').split(',').map((s) => s.trim()).filter(Boolean);
  const payload = {
    request: 'generate_funnel_blocks',
    brief: answers.brief || '',
    cta: answers.cta || '',
    mode: answers.mode || 'replace',
    funnel: { name: d.name || '', slug: d.slug || '', subdomain: d.subdomain || '' },
    step: { title: step.title || '', slug: step.slug || '', type: step.type || 'landing', is_active: step.is_active !== false },
    existing_blocks: step.blocks,
    allowed_block_types: allowed.length ? allowed : Object.keys(BLOCK_SCHEMA_HINT),
    block_schema: BLOCK_SCHEMA_HINT,
    output_format: 'JSON array of {type, data}'
  };

  const res = await callHermes(ACTION_GENERATE_BLOCKS, payload, { source: 'funnel_builder' });

  if (!res.ok) {
    toast('Hermes gagal: ' + (res.error || ''), 'warn');
    await logAgent({
      action: ACTION_GENERATE_BLOCKS,
      action_label: 'Generate Blok Funnel',
      status: 'error',
      trigger_source: 'funnel_builder',
      target_type: 'funnel',
      target_id: String(d.id || ''),
      summary: 'Gagal: ' + (res.error || ''),
      detail: { brief: answers.brief || '' },
      duration_ms: res.durationMs
    });
    return;
  }

  let blocks = extractBlocks(res.output);
  if (allowed.length) blocks = blocks.filter((b) => allowed.includes(b.type));

  if (!blocks.length) {
    toast('Hermes tidak mengembalikan blok yang valid (tipe tidak dikenal / JSON rusak).', 'warn');
    await logAgent({
      action: ACTION_GENERATE_BLOCKS,
      action_label: 'Generate Blok Funnel',
      status: 'error',
      trigger_source: 'funnel_builder',
      target_type: 'funnel',
      target_id: String(d.id || ''),
      summary: 'Output tidak bisa diparse menjadi blok valid',
      detail: { brief: answers.brief || '', raw: formatOutput(res.output).slice(0, 1500) },
      duration_ms: res.durationMs
    });
    return;
  }

  if (answers.mode === 'append') step.blocks = step.blocks.concat(blocks);
  else step.blocks = blocks;

  renderSteps();

  const saveState = $('fbSaveState');
  if (saveState) saveState.textContent = 'Blok dari Hermes belum disimpan — klik "Simpan Funnel".';

  toast(blocks.length + ' blok dibuat oleh Hermes (' + blocks.map((b) => b.type).join(', ') + ').', 'ok');

  await logAgent({
    action: ACTION_GENERATE_BLOCKS,
    action_label: 'Generate Blok Funnel',
    status: 'success',
    trigger_source: 'funnel_builder',
    target_type: 'funnel',
    target_id: String(d.id || ''),
    summary: (d.subdomain || d.name || '') + ' · step ' + (step.title || step.slug || '') + ' · ' + blocks.length + ' blok',
    detail: { brief: answers.brief || '', mode: answers.mode || 'replace', blocks: blocks.map((b) => b.type) },
    output: JSON.stringify(blocks).slice(0, 4000),
    duration_ms: res.durationMs
  });
}

function blockDefaults(type) {
  switch (type) {
    case 'hero':
      return { eyebrow: '', title: 'Judul Hero', subtitle: '', cta_text: 'Mulai Sekarang', cta_anchor: 'cta', image: '', badge: '' };
    case 'video_vsl':
      return { video_url: '', caption: '' };
    case 'problem':
      return { title: 'Masalah yang Sering Dihadapi', description: '', items: [{ title: 'Masalah 1', desc: '' }] };
    case 'benefit':
      return { title: 'Manfaat yang Akan Kamu Dapatkan', description: '', items: [{ title: 'Manfaat 1', desc: '' }] };
    case 'kurikulum':
      return { title: 'Kurikulum', description: '', items: [{ title: 'Modul 1', desc: '' }] };
    case 'pricing':
      return {
        title: 'Pilih Paket',
        description: '',
        tiers: [{
          id: 'starter', name: 'Starter', price: 299000, original_price: 499000,
          period: 'sekali bayar', badge: '', highlight: true, cta_text: 'Ambil Paket',
          features: ['Akses penuh', 'Update gratis']
        }]
      };
    case 'faq':
      return { title: 'Pertanyaan yang Sering Muncul', items: [{ q: 'Pertanyaan?', a: '' }] };
    case 'cta':
      return {
        title: 'Siap Mulai Sekarang?', subtitle: '', primary_text: 'Daftar Sekarang',
        secondary_text: '', secondary_url: '', form: true,
        form_title: 'Dapatkan Akses Tutorial Gratis', form_description: '',
        form_button: 'Kirim & Dapatkan Akses'
      };
    case 'custom_html_embed':
      return { html: '<div style="padding:24px;text-align:center">Custom HTML</div>' };
    default:
      return {};
  }
}

// ---------------- Create / Save / Delete ----------------

function slugify(s) {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function createFunnel() {
  const name = $('fbNewName').value.trim();
  const sub = slugify($('fbNewSub').value || name);
  const slug = slugify($('fbNewSlug').value || sub);
  if (!name || !sub) return toast('Nama & subdomain wajib diisi.', 'warn');

  const btn = $('fbCreate');
  btn.disabled = true;
  try {
    const { data, error } = await ctx.client.from('funnels').insert({
      name,
      slug,
      subdomain: sub,
      is_active: true,
      currency: 'IDR',
      settings: DEFAULT_SETTINGS
    }).select().single();
    if (error) throw error;
    $('fbNewName').value = '';
    $('fbNewSub').value = '';
    $('fbNewSlug').value = '';
    $('fbNewForm').style.display = 'none';
    state.selectedId = data.id;
    localStorage.setItem('xinde_fb_selected', data.id);
    toast('Funnel dibuat.', 'ok');
    await refresh();
  } catch (e) {
    toast('Gagal buat funnel: ' + (e.message || e), 'warn');
  } finally {
    btn.disabled = false;
  }
}

async function saveFunnel() {
  collectDraftFromDom();
  const d = state.draft;
  if (!d) return;
  if (!d.name.trim() || !(d.subdomain.trim() || d.slug.trim())) {
    return toast('Nama & subdomain wajib diisi.', 'warn');
  }
  const btn = $('fbSave');
  const stateEl = $('fbSaveState');
  btn.disabled = true;
  if (stateEl) stateEl.textContent = 'Menyimpan…';

  try {
    const payload = {
      name: d.name.trim(),
      slug: slugify(d.slug || d.subdomain),
      subdomain: slugify(d.subdomain || d.slug),
      meta_pixel_id: d.meta_pixel_id || null,
      thankyou_url: d.thankyou_url || null,
      upsell_url: d.upsell_url || null,
      currency: d.currency || 'IDR',
      is_active: d.is_active !== false,
      settings: d.settings
    };
    if (d.id) payload.id = d.id;

    const { data: funnel, error: fErr } = await ctx.client.from('funnels').upsert(payload).select().single();
    if (fErr) throw fErr;

    const stepRows = d.steps.map((s, i) => {
      const row = {
        funnel_id: funnel.id,
        sort: i + 1,
        slug: slugify(s.slug || ('step-' + (i + 1))),
        type: s.type || 'landing',
        title: s.title || ('Step ' + (i + 1)),
        is_active: s.is_active !== false,
        blocks: s.blocks || []
      };
      if (s.id) row.id = s.id;
      return row;
    });

    if (stepRows.length) {
      const { error: sErr } = await ctx.client.from('funnel_steps').upsert(stepRows);
      if (sErr) throw sErr;
    }

    const keep = stepRows.map((r) => r.id).filter(Boolean);
    let delQ = ctx.client.from('funnel_steps').delete().eq('funnel_id', funnel.id);
    if (keep.length) delQ = delQ.not('id', 'in', '(' + keep.join(',') + ')');
    const { error: dErr } = await delQ;
    if (dErr) throw dErr;

    state.selectedId = funnel.id;
    localStorage.setItem('xinde_fb_selected', funnel.id);
    if (stateEl) stateEl.textContent = 'Tersimpan ' + new Date().toLocaleTimeString('id-ID');
    toast('Funnel tersimpan.', 'ok');
    await refresh();
  } catch (e) {
    if (stateEl) stateEl.textContent = '';
    toast('Gagal simpan funnel: ' + (e.message || e), 'warn');
  } finally {
    btn.disabled = false;
  }
}

async function deleteFunnel() {
  if (!state.draft || !state.draft.id) return;
  const name = state.draft.name || state.draft.subdomain;
  if (!confirm('Hapus funnel "' + name + '" beserta semua step-nya?')) return;
  try {
    const { error } = await ctx.client.from('funnels').delete().eq('id', state.draft.id);
    if (error) throw error;
    state.selectedId = null;
    localStorage.removeItem('xinde_fb_selected');
    toast('Funnel dihapus.', 'ok');
    await refresh();
  } catch (e) {
    toast('Gagal hapus funnel: ' + (e.message || e), 'warn');
  }
}
