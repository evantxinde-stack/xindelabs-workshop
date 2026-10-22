// ============================================================
// BLOG MODULE — /blog (list) & /blog/:slug (detail)
// Sumber data: tabel `blog_posts` (status = 'published')
// ============================================================
import { supabase, isSupabaseConfigured } from '../config/supabase-client.js';

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return '';
  }
};

const FALLBACK_POSTS = [
  {
    slug: 'membangun-ai-agent-untuk-sales-person',
    title: 'Membangun AI Agent untuk Sales Person',
    excerpt: 'Panduan praktis bikin agent pertama tanpa ngoding sama sekali.',
    content: '<p>AI Agent bukan cuma ChatGPT yang lo buka manual. Dengan agent yang sudah di-wire ke workflow, follow-up jalan terus 24/7.</p><p>Mulai dari satu use case paling nyambung: follow-up calon client yang telat Eduard.</p>',    published_at: new Date().toISOString(),
    tags: ['ai-agent', 'sales']
  }
];

/**
 * Ambil slug dari pathname: /blog/:slug atau /blog?slug=...
 */
function getSlugFromLocation() {
  const path = window.location.pathname.replace(/\/+$/, '');
  const m = path.match(/\/blog\/([^/]+)$/);
  if (m) return decodeURIComponent(m[1]);
  const params = new URLSearchParams(window.location.search);
  return params.get('slug');
}

async function fetchPosts() {
  if (!isSupabaseConfigured()) return FALLBACK_POSTS;
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug,title,excerpt,cover_image,published_at,tags,author')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return data && data.length ? data : FALLBACK_POSTS;
  } catch (e) {
    return FALLBACK_POSTS;
  }
}

async function fetchPost(slug) {
  if (!isSupabaseConfigured()) {
    return FALLBACK_POSTS.find((p) => p.slug === slug) || null;
  }
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (e) {
    return null;
  }
}

// ------------------------------------------------------------------
// RENDER LIST
// ------------------------------------------------------------------
async function renderList(root) {
  const posts = await fetchPosts();

  root.innerHTML = `
    <div class="section-head" style="text-align:center; margin-bottom:56px;">
      <span class="eyebrow" style="justify-content:center; width:100%;"><span class="dot"></span> blog hermes agent</span>
      <h1 class="h1" style="font-size:clamp(34px,5vw,54px); margin-bottom:14px;">Catatan Builds &amp; Sistem</h1>
      <p class="lead lead--center">Cara bikin AI Agent, personal brand, dan funnel yang beneran jalan.</p>
    </div>
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:22px;">
      ${posts.map((p, i) => `
        <article class="card reveal ${i % 3 === 1 ? 'd1' : i % 3 === 2 ? 'd2' : ''}" style="overflow:hidden;">
          ${p.cover_image ? `<img src="${esc(p.cover_image)}" alt="${esc(p.title)}" style="width:100%; height:190px; object-fit:cover;">` : ''}
          <div style="padding:24px; display:flex; flex-direction:column; gap:12px; height:100%;">
            <div style="font-family:var(--font-mono); font-size:12px; color:var(--muted-dim);">
              ${formatDate(p.published_at)}
              ${p.author ? ` · ${esc(p.author)}` : ''}
            </div>
            <h2 class="h4" style="margin:0;">${esc(p.title)}</h2>
            <p style="color:var(--muted); font-size:15px; margin:0;">${esc(p.excerpt || '')}</p>
            ${Array.isArray(p.tags) && p.tags.length ? `
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${p.tags.map((t) => `<span style="font-family:var(--font-mono); font-size:11px; color:var(--cyan); border:1px solid var(--line); border-radius:99px; padding:4px 10px;">#${esc(t)}</span>`).join('')}
              </div>` : ''}
            <a href="/blog/${encodeURIComponent(p.slug)}" class="btn btn--ghost btn--sm" style="align-self:flex-start; margin-top:auto;">Baca Artikel →</a>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  observeReveals(root);
}

// ------------------------------------------------------------------
// RENDER DETAIL
// ------------------------------------------------------------------
async function renderDetail(root, slug) {
  const post = await fetchPost(slug);

  if (!post) {
    root.innerHTML = `
      <div style="text-align:center; padding:80px 0;">
        <h1 class="h2">Artikel tidak ditemukan</h1>
        <p class="lead lead--center" style="margin-bottom:26px;">Might sudah dipindah atau belum dipublikasikan.</p>
        <a href="/blog" class="btn btn--primary">← Balik ke Blog</a>
      </div>
    `;
    return;
  }

  document.title = post.title + ' · Xinde Labs';
  const desc = document.getElementById('pageDesc');
  if (desc && post.excerpt) desc.setAttribute('content', post.excerpt);

  root.innerHTML = `
    <article style="max-width:760px; margin:0 auto;">
      <a href="/blog" class="btn btn--ghost btn--sm" style="margin-bottom:26px;">← Semua artikel</a>
      <div style="font-family:var(--font-mono); font-size:12.5px; color:var(--muted-dim); margin-bottom:14px;">
        ${formatDate(post.published_at)}${post.author ? ` · ${esc(post.author)}` : ''}
      </div>
      <h1 style="font-family:var(--font-display); font-weight:700; letter-spacing:-0.03em; line-height:1.1; font-size:clamp(32px,5vw,52px); margin-bottom:20px;">
        ${esc(post.title)}
      </h1>
      ${post.cover_image ? `<img src="${esc(post.cover_image)}" alt="${esc(post.title)}" style="width:100%; height:320px; object-fit:cover; border-radius:var(--radius); margin-bottom:32px; border:1px solid var(--line);">` : ''}
      ${post.excerpt ? `<p class="lead" style="font-size:18px; margin-bottom:30px;">${esc(post.excerpt)}</p>` : ''}
      <div id="postContent" style="color:var(--muted); font-size:16.5px; line-height:1.85;">
        ${renderBody(post.content || '')}
      </div>
      ${Array.isArray(post.tags) && post.tags.length ? `
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:38px; padding-top:26px; border-top:1px solid var(--line);">
          ${post.tags.map((t) => `<span style="font-family:var(--font-mono); font-size:11.5px; color:var(--cyan); border:1px solid var(--line); border-radius:99px; padding:5px 12px;">#${esc(t)}</span>`).join('')}
        </div>` : ''}
      <div class="card" style="margin-top:38px; padding:28px; display:flex; flex-wrap:wrap; gap:18px; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-family:var(--font-display); font-weight:700; font-size:19px; margin-bottom:6px;">Mau punya agent sendiri?</div>
          <div style="color:var(--muted); font-size:14.5px;">Bangun Hermes Agent lo — tanpa coding.</div>
        </div>
        <a href="/checkout.html" class="btn btn--primary">Daftar Course</a>
      </div>
    </article>
  `;
}

// ------------------------------------------------------------------
// BODY RENDERER — dukung Markdown (marked.js) + HTML mentah
// ------------------------------------------------------------------
function renderBody(content) {
  const raw = String(content || '');
  if (!raw.trim()) return '';

  // Kalau konten sudah berupa HTML dari admin, pakai apa adanya.
  if (/<\/?(p|h[1-6]|ul|ol|li|blockquote|pre|code|img|figure|table)\b/i.test(raw)) {
    return raw;
  }

  // Kalau Markdown, render pakai marked.js bila tersedia.
  if (typeof window !== 'undefined' && window.marked) {
    try {
      return window.marked.parse(raw);
    } catch (e) { /* fallback ke plain */ }
  }

  return `<p>${esc(raw).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
}

// ------------------------------------------------------------------
// REVEAL HELPER
// ------------------------------------------------------------------
function observeReveals(root) {
  const reveals = root.querySelectorAll('.reveal');
  if (!reveals.length) return;
  if (!('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
    return;
  }
  document.documentElement.classList.add('js');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach((el) => io.observe(el));
}

// ------------------------------------------------------------------
// BOOT
// ------------------------------------------------------------------
async function init() {
  const root = document.getElementById('blogRoot');
  if (!root) return;
  const loader = document.getElementById('blogLoader');
  const slug = getSlugFromLocation();

  if (slug) {
    await renderDetail(root, slug);
  } else {
    await renderList(root);
  }
  if (loader) loader.remove();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export default { init, renderList, renderDetail };
