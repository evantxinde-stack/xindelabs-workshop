// ============================================================
// MAIN HUB — Root Domain (xindelabs.web.id)
// Hero Personal Branding, Katalog Program (dari DB), Portofolio,
// Blog Preview, dan Form Ker Mathsama.
//
// Modul ini MENAMBAHKAN section baru di bawah landing CMS yang
// sudah ada (LandingBoot / LPRender) tanpa merusak landing utama.
// ============================================================
import { supabase, isSupabaseConfigured } from '../config/supabase-client.js';

const formatIDR = (n) => {
  const num = Number(n || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
};

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
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return '';
  }
};

const FALLBACK_PROGRAMS = [
  {
    slug: 'build-your-own-personalized-agent',
    title: 'Build Your Own Personalized Agent',
    description: 'Bangun AI Agent pribadi untuk follow-up sales, riset prospek & bikin konten — tanpa coding.',
    type: 'course',
    price: 599000
  }
];

const FALLBACK_PORTFOLIO = [
  {
    title: 'Hermes AI Sales Agent',
    description: 'Sistem follow-up 24/7 untuk tim sales — lead tidak pernah bocor lagi.',
    category: 'AI Agent'
  }
];

const FALLBACK_POSTS = [
  {
    slug: 'membangun-ai-agent-untuk-sales-person',
    title: 'Membangun AI Agent untuk Sales Person',
    excerpt: 'Panduan praktis bikin agent pertama tanpa ngoding sama sekali.'
  }
];

// ------------------------------------------------------------------
// HERO — Personal Branding
// ------------------------------------------------------------------
function renderHero() {
  return `
    <section class="section" style="padding-top:140px; padding-bottom:90px;">
      <div class="wrap">
        <div class="reveal">
          <span class="eyebrow">
            <span class="dot dot--pulse"></span> personal branding · ai · digital business
          </span>
          <h1 class="h1" style="max-width:920px; margin-bottom:24px;">
            Bangun <span class="hl">Identitas Digital</span> yang Mengubah Attention Jadi Closing
          </h1>
          <p class="lead" style="max-width:700px; margin-bottom:36px;">
            Xinde Labs bantu founder, sales person, dan creator membangun personal brand,
            AI agent, dan funnel penjualan yang jalan 24/7 — tanpa burnout, tanpa ribet.
          </p>
          <div style="display:flex; gap:14px; flex-wrap:wrap; align-items:center;">
            <a href="#katalog" class="btn btn--primary">Lihat Program <span class="arw__glyph">→</span></a>
            <a href="#kerjasama" class="btn btn--ghost">Ajukan Kerjasama</a>
          </div>
          <p style="margin-top:26px; font-family:var(--font-mono); font-size:13px; color:var(--muted);">
            mulai <b style="color:var(--green);">Rp 599.000/tahun</b> · akses 24/7 dari HP · tanpa coding
          </p>
        </div>
      </div>
    </section>
  `;
}

// ------------------------------------------------------------------
// KATALOG PROGRAM (otomatis dari database)
// ------------------------------------------------------------------
async function renderKatalog(container) {
  container.innerHTML = `
    <div class="section-head">
      <span class="eyebrow"><span class="dot"></span> katalog program</span>
      <h2 class="h2">Seluruh Program Xinde Labs</h2>
      <p class="lead lead--center">Workshop, course, dan pendampingan 1-on-1 — semuanya dari satu tempat.</p>
    </div>
    <div id="katalogGrid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:22px;">
      <div class="card" style="padding:26px; color:var(--muted);">Memuat katalog…</div>
    </div>
  `;

  let programs = FALLBACK_PROGRAMS;
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });
      if (!error && data && data.length) programs = data;
    } catch (e) { /* fallback */ }
  }

  const grid = document.getElementById('katalogGrid');
  if (!grid) return;

  grid.innerHTML = programs.map((p) => {
    const features = Array.isArray(p.features) ? p.features : [];
    return `
      <article class="card reveal" style="overflow:hidden; display:flex; flex-direction:column;">
        ${p.cover_image ? `<img src="${esc(p.cover_image)}" alt="${esc(p.title)}" style="width:100%; height:190px; object-fit:cover;">` : ''}
        <div style="padding:24px; display:flex; flex-direction:column; gap:12px; flex:1;">
          <span class="eyebrow" style="font-size:11px; margin-bottom:0;">
            <span class="dot"></span> ${esc(p.type || 'program')}
          </span>
          <h3 class="h4" style="margin:0;">${esc(p.title)}</h3>
          <p style="color:var(--muted); font-size:15px; margin:0;">${esc(p.description || '')}</p>
          ${features.length ? `
            <ul style="list-style:none; display:grid; gap:8px; font-family:var(--font-mono); font-size:13px; color:var(--muted);">
              ${features.map((f) => `<li style="display:flex; gap:9px; align-items:baseline;">
                <span style="color:var(--green); flex-shrink:0;">→</span><span>${esc(f)}</span>
              </li>`).join('')}
            </ul>` : ''}
          <div style="margin-top:auto; padding-top:8px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            ${p.price ? `<span style="font-family:var(--font-mono); color:var(--green); font-size:16px;">${formatIDR(p.price)}</span>` : '<span></span>'}
            <a href="/checkout.html" class="btn btn--ghost btn--sm">Lihat Detail</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ------------------------------------------------------------------
// PORTOFOLIO
// ------------------------------------------------------------------
async function renderPortofolio(container) {
  container.innerHTML = `
    <div class="section-head">
      <span class="eyebrow"><span class="dot"></span> portofolio</span>
      <h2 class="h2">Yang Pernah Kami Bangun</h2>
      <p class="lead lead--center">Funnel, landing page, sistem AI, dan automasi yang jalan real.</p>
    </div>
    <div id="portoGrid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:22px;">
      <div class="card" style="padding:26px; color:var(--muted);">Memuat portofolio…</div>
    </div>
  `;

  let items = FALLBACK_PORTFOLIO;
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('sort_order', { ascending: true })
        .limit(6);
      if (!error && data && data.length) items = data;
    } catch (e) { /* fallback */ }
  }

  const grid = document.getElementById('portoGrid');
  if (!grid) return;

  grid.innerHTML = items.map((p) => `
    <article class="card reveal" style="overflow:hidden;">
      ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.title)}" style="width:100%; height:200px; object-fit:cover;">` : ''}
      <div style="padding:24px;">
        ${p.category ? `<span class="eyebrow" style="font-size:11px; margin-bottom:12px;"><span class="dot"></span> ${esc(p.category)}</span>` : ''}
        <h3 class="h4" style="margin:0 0 10px;">${esc(p.title)}</h3>
        <p style="color:var(--muted); font-size:15px; margin:0;">${esc(p.description || '')}</p>
        ${p.link_url ? `<a href="${esc(p.link_url)}" target="_blank" rel="noopener noreferrer" class="btn btn--ghost btn--sm" style="margin-top:16px;">Lihat Project →</a>` : ''}
      </div>
    </article>
  `).join('');
}

// ------------------------------------------------------------------
// BLOG PREVIEW
// ------------------------------------------------------------------
async function renderBlogPreview(container) {
  container.innerHTML = `
    <div class="section-head">
      <span class="eyebrow"><span class="dot"></span> blog hermes agent</span>
      <h2 class="h2">Insight untuk Build & Scale</h2>
      <p class="lead lead--center">Tips AI agent, personal branding, dan sistem penjualan.</p>
    </div>
    <div id="blogGrid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:22px; margin-bottom:34px;">
      <div class="card" style="padding:26px; color:var(--muted);">Memuat artikel…</div>
    </div>
    <div style="text-align:center;">
      <a href="/blog" class="btn btn--ghost">Lihat Semua Artikel →</a>
    </div>
  `;

  let posts = FALLBACK_POSTS;
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug,title,excerpt,cover_image,published_at,tags')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);
      if (!error && data && data.length) posts = data;
    } catch (e) { /* fallback */ }
  }

  const grid = document.getElementById('blogGrid');
  if (!grid) return;

  grid.innerHTML = posts.map((post) => `
    <article class="card reveal" style="overflow:hidden;">
      ${post.cover_image ? `<img src="${esc(post.cover_image)}" alt="${esc(post.title)}" style="width:100%; height:180px; object-fit:cover;">` : ''}
      <div style="padding:24px;">
        <div style="font-family:var(--font-mono); font-size:12px; color:var(--muted-dim); margin-bottom:12px;">
          ${formatDate(post.published_at)}
        </div>
        <h3 class="h4" style="margin:0 0 10px;">${esc(post.title)}</h3>
        <p style="color:var(--muted); font-size:15px; margin:0 0 16px;">${esc(post.excerpt || '')}</p>
        <a href="/blog/${encodeURIComponent(post.slug)}" class="btn btn--ghost btn--sm">Baca Selengkapnya →</a>
      </div>
    </article>
  `).join('');
}

// ------------------------------------------------------------------
// FORM KERJASAMA
// ------------------------------------------------------------------
function renderKerjasama(container) {
  container.innerHTML = `
    <div class="section-head">
      <span class="eyebrow"><span class="dot"></span> form kerjasama</span>
      <h2 class="h2">Mari Bangun Bersama</h2>
      <p class="lead lead--center">Punya proyek, kolaborasi, atau ingin jadi partner? Ceritakan di sini.</p>
    </div>
    <div class="card" style="max-width:700px; margin:0 auto; padding:clamp(24px,4vw,40px);">
      <form id="kerjasamaForm" style="display:grid; gap:18px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:18px;">
          <div>
            <label style="display:block; font-family:var(--font-mono); font-size:13px; color:var(--muted); margin-bottom:8px;">Nama Lengkap *</label>
            <input name="name" required autocomplete="name" style="width:100%; padding:12px 16px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text); font-family:var(--font-body); font-size:15px;">
          </div>
          <div>
            <label style="display:block; font-family:var(--font-mono); font-size:13px; color:var(--muted); margin-bottom:8px;">Email *</label>
            <input name="email" type="email" required autocomplete="email" style="width:100%; padding:12px 16px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text); font-family:var(--font-body); font-size:15px;">
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:18px;">
          <div>
            <label style="display:block; font-family:var(--font-mono); font-size:13px; color:var(--muted); margin-bottom:8px;">Perusahaan / Brand</label>
            <input name="company" style="width:100%; padding:12px 16px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text); font-family:var(--font-body); font-size:15px;">
          </div>
          <div>
            <label style="display:block; font-family:var(--font-mono); font-size:13px; color:var(--muted); margin-bottom:8px;">No. WhatsApp</label>
            <input name="whatsapp" style="width:100%; padding:12px 16px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text); font-family:var(--font-body); font-size:15px;">
          </div>
        </div>
        <div>
          <label style="display:block; font-family:var(--font-mono); font-size:13px; color:var(--muted); margin-bottom:8px;">Jenis Kerjasama</label>
          <select name="service_type" style="width:100%; padding:12px 16px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text); font-family:var(--font-body); font-size:15px;">
            <option value="">Pilih…</option>
            <option value="funnel">Funnel &amp; Landing Page</option>
            <option value="ai-agent">AI Agent &amp; Automasi</option>
            <option value="brand">Personal Branding</option>
            <option value="partnership">Partnership / Affiliate</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        <div>
          <label style="display:block; font-family:var(--font-mono); font-size:13px; color:var(--muted); margin-bottom:8px;">Pesan *</label>
          <textarea name="message" required rows="5" style="width:100%; padding:12px 16px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text); font-family:var(--font-body); font-size:15px; resize:vertical;"></textarea>
        </div>
        <button type="submit" class="btn btn--primary" style="justify-self:start;">Kirim Pengajuan</button>
        <p id="kerjasamaMsg" style="font-family:var(--font-mono); font-size:13px; color:var(--muted); margin:0;"></p>
      </form>
    </div>
  `;

  const form = document.getElementById('kerjasamaForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('kerjasamaMsg');
    const btn = form.querySelector('button[type=submit]');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Mengirim…';
    msg.style.color = 'var(--muted)';
    msg.textContent = '';

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('partnership_inquiries').insert([data]);
        if (error) throw error;
        msg.style.color = 'var(--green)';
        msg.textContent = '✓ Pengajuan terkirim. Kami akan menghubungi kamu segera.';
      } else {
        msg.style.color = 'var(--green)';
        msg.textContent = '✓ Pengajuan tercatat (mode demo).';
      }
      form.reset();
    } catch (err) {
      msg.style.color = 'var(--danger)';
      msg.textContent = '✕ Gagal mengirim. Coba lagi atau hubungi kami via WhatsApp.';
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

// ------------------------------------------------------------------
// RENDER UTAMA
// ------------------------------------------------------------------
export async function render(containerId = 'hubRoot') {
  const app = document.getElementById(containerId);
  if (!app) return;

  app.innerHTML = `
    ${renderHero()}
    <section id="katalog" class="section"><div class="wrap" id="katalogSection"></div></section>
    <section id="portofolio" class="section" style="background:var(--bg-2);"><div class="wrap" id="portoSection"></div></section>
    <section id="blog" class="section"><div class="wrap" id="blogSection"></div></section>
    <section id="kerjasama" class="section" style="background:var(--bg-2);"><div class="wrap" id="kerjasamaSection"></div></section>
  `;

  await renderKatalog(document.getElementById('katalogSection'));
  await renderPortofolio(document.getElementById('portoSection'));
  await renderBlogPreview(document.getElementById('blogSection'));
  renderKerjasama(document.getElementById('kerjasamaSection'));

  // Reveal on scroll
  const reveals = app.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
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
}

export default { render };
