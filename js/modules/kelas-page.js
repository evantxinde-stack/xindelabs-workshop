// Halaman marketing "Kelas" — daftar kelas publik + link checkout.
// Redirect ke login kalau user belum punya akun? Tidak: katalog publik.
import { supabase, isSupabaseConfigured } from '../config/supabase-client.js';

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatIDR = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

const FALLBACK = [
  {
    id: 'byopa',
    slug: 'build-your-own-personalized-agent',
    title: 'Build Your Own Personalized Agent',
    description:
      'Bangun AI Agent pribadi buat follow-up sales, riset prospek, dan produksi konten — tanpa coding. Modul bertahap + sertifikat.',
    price: 599000,
    type: 'course',
  },
];

function card(c) {
  const price = Number(c.member_discount_price || c.price || 0);
  return `
    <div class="card" style="padding:26px; display:flex; flex-direction:column; gap:14px;">
      <span class="badge">${esc(c.type || 'kelas')}</span>
      <h3 class="h3" style="font-size:20px;">${esc(c.title)}</h3>
      <p style="color:var(--muted); font-size:14.5px; line-height:1.6;">${esc(c.description)}</p>
      <div style="margin-top:auto; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <span style="font-family:var(--font-mono); color:var(--green); font-size:16px;">${formatIDR(price)}</span>
        <a class="btn btn--primary btn--sm"
           href="/checkout.html?class=${encodeURIComponent(c.id)}&class_name=${encodeURIComponent(c.title)}&class_price=${price}">
           Ambil Kelas Ini
        </a>
      </div>
    </div>`;
}

export async function render(containerId = 'kelasRoot') {
  const el = document.getElementById(containerId);
  if (!el) return;

  let classes = FALLBACK;
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('classes')
        .select('id,slug,title,description,price,member_discount_price,type')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (data && data.length) classes = data;
    } catch (e) {
      console.warn('[kelas] gagal muat katalog', e);
    }
  }

  el.innerHTML = `
    <section class="section" style="padding-top:140px; padding-bottom:70px;">
      <div class="wrap">
        <span class="eyebrow"><span class="dot dot--pulse"></span> kelas</span>
        <h1 class="h1" style="max-width:860px; margin:18px 0 20px;">
          Belajar bikin <span class="hl">sistemnya sendiri</span>, bukan cuma nonton tutorial.
        </h1>
        <p class="lead" style="max-width:680px;">
          Semua kelas ditulis dari project yang jalan tiap hari. Beli sekali, akses member area langsung terbuka.
        </p>
        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:28px;">
          <a class="btn btn--ghost" href="https://learn.xindelabs.web.id/member">Login Member</a>
          <a class="btn btn--ghost" href="https://learn.xindelabs.web.id/workshop">Liat Workshop</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head" style="text-align:left;">
          <span class="eyebrow"><span class="dot"></span> katalog</span>
          <h2 class="h2">Kelas yang Tersedia</h2>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:22px;">
          ${classes.map(card).join('')}
        </div>
      </div>
    </section>
  `;
}

export default { render };
