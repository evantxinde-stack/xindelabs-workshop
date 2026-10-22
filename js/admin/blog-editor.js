// ============================================================
// BLOG EDITOR — Kelola artikel blog_posts + Generate with Hermes AI
// Tugas Keenam: Integrasi Hermes Agent
//
// Editor minimal: daftar artikel, form (judul/slug/excerpt/cover/tags/
// author/status/content Markdown), publish/unpublish, hapus, preview.
// Tombol "Generate with Hermes AI" mengisi konten Markdown dari Hermes.
// ============================================================

import { esc, fmtDateTime, toast, schemaHint } from './context.js';
import {
  callHermes, logAgent, openHermesPrompt, ACTION_GENERATE_ARTICLE
} from './hermes-bridge.js';

let ctx = null;
let initialized = false;
let posts = [];
let editing = null; // { id, slug, title, ... } atau null untuk artikel baru
let markedReady = false;

const $ = (id) => document.getElementById(id);

const BLOG_HTML = `
  <div class="section-head" style="text-align:left">
    <p class="eyebrow"><span class="dot"></span>admin</p>
    <h2 class="h2">Blog Editor</h2>
    <p class="lead">Tulis, publish, dan generate artikel SEO dengan bantuan Hermes Agent.</p>
  </div>

  <div class="notice notice--warn" id="blogNotice" style="display:none"></div>

  <div class="a-card">
    <div class="a-card__head">
      <h3>Daftar Artikel</h3>
      <div class="a-actions">
        <button type="button" class="btn btn--ghost btn--sm" id="blogRefresh">↻ Refresh</button>
        <button type="button" class="btn btn--primary btn--sm" id="blogNew">+ Artikel Baru</button>
      </div>
    </div>
    <div class="a-table-wrap">
      <table class="a-table">
        <thead><tr><th>Judul</th><th>Slug</th><th>Status</th><th>Update</th><th></th></tr></thead>
        <tbody id="blogListBody"></tbody>
      </table>
    </div>
    <p class="a-empty" id="blogListEmpty" style="display:none">Belum ada artikel.</p>
  </div>

  <div class="a-card" id="blogEditorCard" style="display:none;margin-top:20px">
    <div class="a-card__head">
      <h3 id="blogEditorTitle">Edit Artikel</h3>
      <div class="a-actions">
        <button type="button" class="btn btn--ghost btn--sm" id="blogPreview">Preview</button>
        <button type="button" class="btn btn--ghost btn--sm" id="blogClose">Tutup</button>
      </div>
    </div>

    <div class="admin-grid2">
      <div class="field">
        <label for="blog_title">Judul Artikel</label>
        <input type="text" id="blog_title" class="a-input" placeholder="cth: 5 Cara Bikin AI Agent buat Sales">
      </div>
      <div class="field">
        <label for="blog_slug">Slug (URL)</label>
        <input type="text" id="blog_slug" class="a-input" placeholder="auto-dari-judul">
        <div class="hint">Dipakai di <code>/blog/&lt;slug&gt;</code>. Kosongkan untuk dibuat otomatis.</div>
      </div>
    </div>

    <div class="field">
      <label for="blog_excerpt">Excerpt / Meta Description</label>
      <textarea id="blog_excerpt" class="a-input" rows="2" placeholder="Ringkasan singkat untuk kartu blog &amp; SEO"></textarea>
    </div>

    <div class="admin-grid3">
      <div class="field">
        <label for="blog_cover">Cover Image URL</label>
        <input type="text" id="blog_cover" class="a-input" placeholder="https://…">
      </div>
      <div class="field">
        <label for="blog_author">Author</label>
        <input type="text" id="blog_author" class="a-input" placeholder="Xinde Labs">
      </div>
      <div class="field">
        <label for="blog_tags">Tags (pisahkan koma)</label>
        <input type="text" id="blog_tags" class="a-input" placeholder="ai-agent, sales">
      </div>
    </div>

    <div class="field">
      <label for="blog_content">Konten (Markdown)</label>
      <div class="a-hx-genbar">
        <button type="button" class="btn btn--primary btn--sm" id="blogHermes">✨ Generate with Hermes AI</button>
        <span class="hint" id="blogHermesState">Hermes menulis draft artikel (Markdown) sesuai instruksi.</span>
      </div>
      <textarea id="blog_content" class="a-input" rows="18" placeholder="## Subjudul&#10;&#10;Isi artikel…"></textarea>
    </div>

    <div class="admin-grid3">
      <div class="field">
        <label for="blog_status">Status</label>
        <select id="blog_status" class="a-input">
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </div>
      <div class="field" style="align-self:end">
        <button type="button" class="btn btn--primary" id="blogSave">Simpan Artikel</button>
      </div>
      <div class="field" style="align-self:end">
        <button type="button" class="btn btn--ghost" id="blogDelete">Hapus</button>
      </div>
    </div>

    <div id="blogPreviewWrap" style="display:none;margin-top:18px">
      <div class="admin-block__head"><label>Preview</label></div>
      <div class="a-hx-preview" id="blogPreviewBody"></div>
    </div>
  </div>
`;

export function ensurePanel() {
  const panel = document.getElementById('panelBlog');
  if (!panel) return;
  if (panel.dataset.adminBlog === '1') return;
  panel.innerHTML = BLOG_HTML;
  panel.dataset.adminBlog = '1';
}

export function init(context) {
  if (initialized) { ctx = context; return; }
  ctx = context;
  initialized = true;
  ensurePanel();

  const rf = $('blogRefresh');
  if (rf) rf.addEventListener('click', () => refresh());

  const nw = $('blogNew');
  if (nw) nw.addEventListener('click', () => openEditor(null));

  const close = $('blogClose');
  if (close) close.addEventListener('click', () => closeEditor());

  const save = $('blogSave');
  if (save) save.addEventListener('click', () => savePost());

  const del = $('blogDelete');
  if (del) del.addEventListener('click', () => deletePost());

  const prev = $('blogPreview');
  if (prev) prev.addEventListener('click', () => togglePreview());

  const hermes = $('blogHermes');
  if (hermes) hermes.addEventListener('click', () => generateWithHermes());

  const title = $('blog_title');
  if (title) {
    title.addEventListener('blur', () => {
      const slugEl = $('blog_slug');
      if (slugEl && !slugEl.value.trim()) slugEl.value = slugify(title.value);
    });
  }
}

export function load() {
  return refresh();
}

export async function refresh() {
  if (!ctx || !ctx.client) return;
  const notice = $('blogNotice');
  try {
    const { data, error } = await ctx.client
      .from('blog_posts')
      .select('id,slug,title,excerpt,cover_image,author,tags,status,published_at,updated_at,created_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    posts = data || [];
    renderList();
    if (notice) notice.style.display = 'none';
  } catch (e) {
    if (notice) {
      notice.style.display = '';
      notice.innerHTML = 'Gagal memuat artikel: ' + esc(e && e.message ? e.message : e) + schemaHint(e);
    }
  }
}

function renderList() {
  const body = $('blogListBody');
  if (!body) return;
  const empty = $('blogListEmpty');
  if (empty) empty.style.display = posts.length ? 'none' : '';

  body.innerHTML = posts.map((p) => {
    const isPub = p.status === 'published';
    return '<tr>' +
      '<td><b>' + esc(p.title || '(tanpa judul)') + '</b>' +
        (p.excerpt ? '<div class="hint">' + esc(String(p.excerpt).slice(0, 90)) + '</div>' : '') + '</td>' +
      '<td><code>' + esc(p.slug || '') + '</code></td>' +
      '<td><span class="a-hx-badge a-hx-badge--' + (isPub ? 'success' : 'draft') + '">' + esc(p.status || 'draft') + '</span></td>' +
      '<td>' + esc(fmtDateTime(p.updated_at || p.published_at || p.created_at) || '—') + '</td>' +
      '<td class="a-actions">' +
        '<button type="button" class="btn btn--ghost btn--sm" data-blog-edit="' + esc(p.id) + '">Edit</button>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-blog-pub="' + esc(p.id) + '">' + (isPub ? 'Unpublish' : 'Publish') + '</button>' +
        (isPub ? '<a class="btn btn--ghost btn--sm" href="/blog/' + encodeURIComponent(p.slug || '') + '" target="_blank" rel="noopener">Lihat</a>' : '') +
      '</td>' +
    '</tr>';
  }).join('');

  body.addEventListener('click', (e) => {
    const ed = e.target.closest ? e.target.closest('[data-blog-edit]') : null;
    if (ed) {
      const p = posts.find((x) => x.id === ed.getAttribute('data-blog-edit'));
      if (p) openEditor(p);
      return;
    }
    const pub = e.target.closest ? e.target.closest('[data-blog-pub]') : null;
    if (pub) togglePublish(pub.getAttribute('data-blog-pub'));
  });
}

async function openEditor(post) {
  editing = post || { id: null, slug: '', title: '', excerpt: '', cover_image: '', author: 'Xinde Labs', tags: [], status: 'draft' };
  const card = $('blogEditorCard');
  if (card) card.style.display = '';

  const t = $('blogEditorTitle');
  if (t) t.textContent = post ? 'Edit Artikel' : 'Artikel Baru';

  if (post) {
    // Ambil content lengkap (list tidak mengambil kolom content).
    try {
      const { data } = await ctx.client.from('blog_posts').select('*').eq('id', post.id).maybeSingle();
      if (data) editing = Object.assign({}, post, data);
    } catch (e) { /* pakai data list */ }
  }

  setVal('blog_title', editing.title || '');
  setVal('blog_slug', editing.slug || '');
  setVal('blog_excerpt', editing.excerpt || '');
  setVal('blog_cover', editing.cover_image || '');
  setVal('blog_author', editing.author || 'Xinde Labs');
  setVal('blog_tags', Array.isArray(editing.tags) ? editing.tags.join(', ') : (editing.tags || ''));
  setVal('blog_content', editing.content || '');
  const st = $('blog_status');
  if (st) st.value = editing.status || 'draft';

  const del = $('blogDelete');
  if (del) del.style.display = editing.id ? '' : 'none';

  const wrap = $('blogPreviewWrap');
  if (wrap) wrap.style.display = 'none';

  const card2 = $('blogEditorCard');
  if (card2 && typeof card2.scrollIntoView === 'function') {
    card2.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function closeEditor() {
  editing = null;
  const card = $('blogEditorCard');
  if (card) card.style.display = 'none';
}

function setVal(id, val) {
  const el = $(id);
  if (el) el.value = val == null ? '' : val;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function collectForm() {
  const tagsRaw = ($('blog_tags') || {}).value || '';
  const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
  const status = ($('blog_status') || {}).value || 'draft';
  const row = {
    title: (($('blog_title') || {}).value || '').trim(),
    slug: (($('blog_slug') || {}).value || '').trim() || slugify((($('blog_title') || {}).value || '')),
    excerpt: (($('blog_excerpt') || {}).value || '').trim(),
    cover_image: (($('blog_cover') || {}).value || '').trim(),
    author: (($('blog_author') || {}).value || '').trim() || 'Xinde Labs',
    tags,
    content: (($('blog_content') || {}).value || ''),
    status
  };
  if (status === 'published' && !row.published_at) row.published_at = new Date().toISOString();
  return row;
}

async function savePost() {
  if (!ctx || !ctx.client) return;
  const row = collectForm();
  if (!row.title) return toast('Judul artikel wajib diisi.', 'warn');
  if (!row.slug) return toast('Slug artikel wajib diisi.', 'warn');

  const btn = $('blogSave');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan…'; }

  try {
    let saved;
    if (editing && editing.id) {
      const { data, error } = await ctx.client.from('blog_posts').update(row).eq('id', editing.id).select().maybeSingle();
      if (error) throw error;
      saved = data;
    } else {
      const { data, error } = await ctx.client.from('blog_posts').insert(row).select().maybeSingle();
      if (error) throw error;
      saved = data;
    }
    toast('Artikel disimpan.', 'ok');
    editing = saved || Object.assign({ id: (saved || {}).id }, row);
    await refresh();
  } catch (e) {
    toast('Gagal menyimpan: ' + (e && e.message ? e.message : e), 'warn');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Artikel'; }
  }
}

async function deletePost() {
  if (!ctx || !ctx.client || !editing || !editing.id) return;
  if (!confirm('Hapus artikel "' + (editing.title || '') + '"?')) return;
  try {
    const { error } = await ctx.client.from('blog_posts').delete().eq('id', editing.id);
    if (error) throw error;
    toast('Artikel dihapus.', 'ok');
    closeEditor();
    await refresh();
  } catch (e) {
    toast('Gagal hapus: ' + (e && e.message ? e.message : e), 'warn');
  }
}

async function togglePublish(id) {
  if (!ctx || !ctx.client) return;
  const p = posts.find((x) => x.id === id);
  if (!p) return;
  const next = p.status === 'published' ? 'draft' : 'published';
  const patch = { status: next };
  if (next === 'published') patch.published_at = new Date().toISOString();
  try {
    const { error } = await ctx.client.from('blog_posts').update(patch).eq('id', id);
    if (error) throw error;
    toast(next === 'published' ? 'Artikel dipublish.' : 'Artikel dikembalikan ke draft.', 'ok');
    await refresh();
  } catch (e) {
    toast('Gagal update status: ' + (e && e.message ? e.message : e), 'warn');
  }
}

// ------------------------------------------------------------
// PREVIEW
// ------------------------------------------------------------

function ensureMarked() {
  if (markedReady) return Promise.resolve(typeof window.marked === 'function');
  if (typeof window !== 'undefined' && window.marked) { markedReady = true; return Promise.resolve(true); }
  if (typeof document === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/marked@12/marked.min.js';
    s.onload = () => { markedReady = true; resolve(true); };
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

async function togglePreview() {
  const wrap = $('blogPreviewWrap');
  const body = $('blogPreviewBody');
  if (!wrap || !body) return;
  if (wrap.style.display !== 'none') { wrap.style.display = 'none'; return; }

  const content = (($('blog_content') || {}).value) || '';
  const ok = await ensureMarked();
  if (ok && window.marked) {
    try {
      body.innerHTML = window.marked.parse(content);
    } catch (e) {
      body.textContent = content;
    }
  } else {
    body.innerHTML = '<pre>' + esc(content) + '</pre>';
  }
  wrap.style.display = '';
}

// ------------------------------------------------------------
// GENERATE WITH HERMES AI
// ------------------------------------------------------------

/**
 * Normalisasi output Hermes jadi { title, slug, excerpt, tags, content }.
 * Mendukung: objek JSON, string JSON, front-matter markdown, atau markdown polos.
 */
export function parseArticle(output) {
  if (!output) return null;

  if (typeof output === 'object' && !Array.isArray(output)) {
    return normalizeArticle(output);
  }

  const text = String(output).trim();
  if (!text) return null;

  if (text.charAt(0) === '{') {
    try { return normalizeArticle(JSON.parse(text)); } catch (e) { /* fallthrough */ }
  }

  // Front-matter YAML sederhana: --- key: value ---
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (fm) {
    const meta = {};
    fm[1].split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (m) meta[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
    return normalizeArticle({
      title: meta.title,
      slug: meta.slug,
      excerpt: meta.excerpt || meta.description,
      tags: meta.tags,
      content: fm[2].trim()
    });
  }

  return normalizeArticle({ content: text });
}

function normalizeArticle(o) {
  const content = o.content || o.markdown || o.body || o.article || o.text || '';
  let tags = o.tags || o.keywords || [];
  if (typeof tags === 'string') tags = tags.split(',');
  if (!Array.isArray(tags)) tags = [];
  return {
    title: String(o.title || '').trim(),
    slug: String(o.slug || '').trim(),
    excerpt: String(o.excerpt || o.subtitle || o.description || o.summary || '').trim(),
    tags: tags.map((t) => String(t).trim()).filter(Boolean),
    content: String(content).trim()
  };
}

export async function generateWithHermes() {
  const btn = $('blogHermes');
  const stateEl = $('blogHermesState');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Hermes menulis…'; }
  if (stateEl) stateEl.textContent = 'Mengirim instruksi ke Hermes Agent…';

  const answers = await openHermesPrompt({
    title: 'Generate Artikel dengan Hermes AI',
    subtitle: 'Hermes Agent menulis draft artikel (Markdown) yang bisa langsung kamu edit & publish.',
    submitLabel: 'Generate Artikel',
    fields: [
      { key: 'topic', label: 'Topik artikel', type: 'text', placeholder: 'cth: cara follow-up lead yang sudahRp 2 juta tapi belum bayar' },
      { key: 'keyword', label: 'Target keyword SEO', type: 'text', placeholder: 'cth: ai agent untuk sales' },
      { key: 'tone', label: 'Gaya bahasa', type: 'text', value: 'santai, Bahasa Indonesia, contoh praktis' },
      { key: 'length', label: 'Panjang artikel', type: 'text', value: '800-1200 kata' },
      { key: 'extra', label: 'Instruksi tambahan', type: 'textarea', rows: 3, placeholder: 'mis. bandingkan 3 tool, tutup dengan CTA daftar course' }
    ]
  });

  if (!answers) {
    if (btn) { btn.disabled = false; btn.textContent = '✨ Generate with Hermes AI'; }
    if (stateEl) stateEl.textContent = 'Dibatalkan.';
    return;
  }

  const payload = {
    request: 'generate_blog_article',
    topic: answers.topic || '',
    keyword: answers.keyword || '',
    tone: answers.tone || '',
    length: answers.length || '',
    extra: answers.extra || '',
    current_title: (($('blog_title') || {}).value) || ''
  };

  const res = await callHermes(ACTION_GENERATE_ARTICLE, payload, { source: 'blog_editor' });

  if (btn) { btn.disabled = false; btn.textContent = '✨ Generate with Hermes AI'; }

  if (!res.ok) {
    if (stateEl) stateEl.textContent = 'Gagal: ' + (res.error || 'tidak diketahui');
    toast('Hermes gagal: ' + (res.error || ''), 'warn');
    await logAgent({
      action: ACTION_GENERATE_ARTICLE,
      action_label: 'Generate Artikel Blog',
      status: 'error',
      trigger_source: 'blog_editor',
      target_type: 'blog_post',
      summary: 'Gagal: ' + (res.error || ''),
      detail: payload,
      duration_ms: res.durationMs
    });
    return;
  }

  const art = parseArticle(res.output);
  if (!art || (!art.content && !art.title)) {
    if (stateEl) stateEl.textContent = 'Hermes tidak mengembalikan konten yang bisa dipakai.';
    toast('Output Hermes tidak bisa dibaca sebagai artikel.', 'warn');
    return;
  }

  if (art.title) setVal('blog_title', art.title);
  if (art.slug) setVal('blog_slug', art.slug);
  else {
    const slugEl = $('blog_slug');
    if (slugEl && !slugEl.value.trim()) slugEl.value = slugify(art.title);
  }
  if (art.excerpt) setVal('blog_excerpt', art.excerpt);
  if (art.tags.length) setVal('blog_tags', art.tags.join(', '));
  if (art.content) setVal('blog_content', art.content);

  if (stateEl) stateEl.textContent = 'Draft siap — cek dulu, lalu Simpan/Publish.';
  toast('Draft artikel dari Hermes siap diedit.', 'ok');

  await logAgent({
    action: ACTION_GENERATE_ARTICLE,
    action_label: 'Generate Artikel Blog',
    status: 'success',
    trigger_source: 'blog_editor',
    target_type: 'blog_post',
    summary: art.title || payload.topic,
    detail: payload,
    output: String(art.content || '').slice(0, 4000),
    duration_ms: res.durationMs
  });
}
