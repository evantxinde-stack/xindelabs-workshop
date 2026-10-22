// Funnel Engine - Multi-Step Funnel renderer untuk [subdomain].xindelabs.web.id
// Data来源: tabel `funnels` (by subdomain) + `funnel_steps` (blocks JSONB)
// Modular blocks: hero, video_vsl, problem, benefit, kurikulum, pricing, faq, cta, custom_html_embed
import { supabase } from '../config/supabase-client.js';
import {
  openCheckoutModal,
  goToStandaloneCheckout,
  getUTM,
  formatNumber,
  escapeHtml
} from './checkout.js';

const STAGES = {
  OPT_IN: 'opt_in',
  WATCHING: 'watching_tutorial',
  CHECKOUT: 'checkout_initiated',
  UNPAID: 'unpaid_invoice'
};

let ctx = {
  funnel: null,
  steps: [],
  currentStep: 0
};

// ============================================================
// INIT
// ============================================================
export async function initFunnel(route) {
  const subdomain = (route && route.subdomain) || getSubdomainFromHost();
  if (!subdomain) return;

  try {
    const { data: funnel, error: funnelErr } = await supabase
      .from('funnels')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .maybeSingle();

    if (funnelErr || !funnel) {
      console.error('[funnel] Funnel tidak ditemukan:', funnelErr);
      renderNotFound(subdomain);
      return;
    }

    const { data: steps, error: stepsErr } = await supabase
      .from('funnel_steps')
      .select('*')
      .eq('funnel_id', funnel.id)
      .eq('is_active', true)
      .order('sort', { ascending: true });

    if (stepsErr) {
      console.error('[funnel] Gagal load steps:', stepsErr);
      renderNotFound(subdomain);
      return;
    }

    const list = Array.isArray(steps) ? steps : [];
    if (!list.length) {
      renderNotFound(subdomain, 'Funnel ini belum memiliki step.');
      return;
    }

    ctx.funnel = funnel;
    ctx.steps = list;
    funnel._steps = list; // dipakai checkout.js untuk mendeteksi tier

    injectMetaPixel(funnel.meta_pixel_id);
    hideCmsLanding();

    const container = document.getElementById('funnelRoot') || document.body;
    container.innerHTML = '';

    const app = document.createElement('div');
    app.id = 'funnel-app';
    app.className = 'funnel-app';
    container.appendChild(app);

    renderStepper(app);
    const stepHost = document.createElement('div');
    stepHost.id = 'funnel-step-host';
    stepHost.className = 'funnel-step-host';
    app.appendChild(stepHost);

    // Step pertama
    await gotoStep(0);

    // Track pageview funnel
    trackStage('landing_view');
  } catch (e) {
    console.error('[funnel] init error:', e);
    renderNotFound(subdomain);
  }
}

function getSubdomainFromHost() {
  const host = location.hostname;
  if (host.includes('localhost') || host === '127.0.0.1') {
    return new URLSearchParams(location.search).get('subdomain');
  }
  const parts = host.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') return parts[0].toLowerCase();
  return null;
}

function renderNotFound(subdomain, msg) {
  const container = document.getElementById('funnelRoot') || document.body;
  container.innerHTML = `
    <div class="funnel-empty">
      <h1>Funnel tidak ditemukan</h1>
      <p>${escapeHtml(msg || `Tidak ada funnel aktif untuk subdomain "${subdomain}".`)}</p>
    </div>
  `;
}

function hideCmsLanding() {
  ['lpRoot', 'hubRoot', 'lpFooter', 'lpNav', 'timerSticky', 'salesNotif'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.body.classList.add('funnel-mode');
}

// ============================================================
// META PIXEL DINAMIS
// ============================================================
function injectMetaPixel(pixelId) {
  if (!pixelId) return;
  if (window.fbq) return;

  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
  window.__XINDE_PIXEL_ID__ = pixelId;
}

function trackPixel(event, params) {
  try {
    if (window.fbq) window.fbq('track', event, params || {});
  } catch (e) {}
}

// ============================================================
// MULTI-STEP NAVIGATION
// ============================================================
function renderStepper(app) {
  if (ctx.steps.length <= 1) return;
  const bar = document.createElement('nav');
  bar.className = 'funnel-stepper';
  bar.innerHTML = ctx.steps
    .map((s, i) => {
      const label = s.title || s.slug || `Step ${i + 1}`;
      return `<button class="funnel-stepper__item" data-step-index="${i}">${escapeHtml(label)}</button>`;
    })
    .join('');
  app.appendChild(bar);
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-step-index]');
    if (!btn) return;
    gotoStep(Number(btn.dataset.stepIndex));
  });
}

async function gotoStep(index) {
  const step = ctx.steps[index];
  if (!step) return;
  ctx.currentStep = index;

  const host = document.getElementById('funnel-step-host');
  if (!host) return;
  host.innerHTML = '';
  host.dataset.stepType = step.type || 'landing';
  host.dataset.stepSlug = step.slug || '';

  // Highlight stepper
  document.querySelectorAll('.funnel-stepper__item').forEach((b) => {
    b.classList.toggle('is-active', Number(b.dataset.stepIndex) === index);
  });

  await renderStep(host, step, ctx.funnel);

  // Step bertipe video: stage watching_tutorial begitu halaman video dibuka
  if (step.type === 'video') {
    trackStage(STAGES.WATCHING);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderStepNav(host, index) {
  const nav = document.createElement('div');
  nav.className = 'funnel-nav';
  const hasPrev = index > 0;
  const hasNext = index < ctx.steps.length - 1;
  nav.innerHTML = `
    ${hasPrev ? '<button class="co-btn co-btn--ghost" data-nav="prev">&larr; Sebelumnya</button>' : '<span></span>'}
    ${hasNext ? '<button class="co-btn co-btn--primary" data-nav="next">Lanjut &rarr;</button>' : '<span></span>'}
  `;
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-nav]');
    if (!btn) return;
    if (btn.dataset.nav === 'prev') gotoStep(index - 1);
    else gotoStep(index + 1);
  });
  host.appendChild(nav);
}

// ============================================================
// BLOCK RENDERERS
// ============================================================
const BLOCK_RENDERERS = {
  hero: renderHero,
  video_vsl: renderVideoVSL,
  problem: renderProblem,
  benefit: renderBenefit,
  kurikulum: renderKurikulum,
  pricing: renderPricing,
  faq: renderFAQ,
  cta: renderCTA,
  custom_html_embed: renderCustomHTML
};

async function renderStep(host, step, funnel) {
  const blocks = Array.isArray(step.blocks) ? step.blocks : [];

  if (!blocks.length) {
    host.innerHTML = `<div class="funnel-section"><h1>${escapeHtml(step.title || '')}</h1></div>`;
    renderStepNav(host, ctx.currentStep);
    return;
  }

  for (const block of blocks) {
    const renderer = BLOCK_RENDERERS[block.type] || renderCustomHTML;
    const el = await renderer(block, step, funnel);
    if (el) host.appendChild(el);
  }

  renderStepNav(host, ctx.currentStep);
}

function blockData(block) {
  return block && block.data && typeof block.data === 'object' ? block.data : block || {};
}

function renderHero(block) {
  const d = blockData(block);
  const el = document.createElement('section');
  el.className = 'funnel-section funnel-hero';
  el.innerHTML = `
    ${
      d.eyebrow
        ? `<div class="funnel-eyebrow">${escapeHtml(d.eyebrow)}</div>`
        : ''
    }
    <h1 class="funnel-h1">${escapeHtml(d.title || '')}</h1>
    ${d.subtitle ? `<p class="funnel-lead">${escapeHtml(d.subtitle)}</p>` : ''}
    ${
      d.cta_text
        ? `<a href="${escapeHtml(d.cta_anchor ? '#' + d.cta_anchor : '#cta')}" class="co-btn co-btn--primary co-btn--lg">${escapeHtml(d.cta_text)}</a>`
        : ''
    }
    ${d.image ? `<img class="funnel-hero__img" src="${escapeHtml(d.image)}" alt="">` : ''}
    ${d.badge ? `<div class="funnel-badge">${escapeHtml(d.badge)}</div>` : ''}
  `;
  return el;
}

function renderVideoVSL(block) {
  const d = blockData(block);
  const el = document.createElement('section');
  el.className = 'funnel-section funnel-video';
  el.innerHTML = `
    <div class="funnel-video__frame">
      ${
        d.video_url
          ? `<video class="funnel-video__player" src="${escapeHtml(d.video_url)}" controls playsinline preload="metadata"></video>`
          : `<div class="funnel-video__placeholder">Video VSL</div>`
      }
    </div>
    ${d.caption ? `<p class="funnel-caption">${escapeHtml(d.caption)}</p>` : ''}
  `;

  const video = el.querySelector('video');
  if (video) {
    // VSL = Video Sales Letter -> stage watching_tutorial saat diputar
    video.addEventListener('play', () => trackStage(STAGES.WATCHING), { once: true });
    // Tracking 25% diputar (VSL watched)
    video.addEventListener('timeupdate', () => {
      if (video.duration && video.currentTime / video.duration >= 0.25) {
        trackStage(STAGES.WATCHING);
      }
    });

    // "Buka halaman video": saat player mulai terlihat di viewport
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              trackStage(STAGES.WATCHING);
              io.disconnect();
            }
          });
        },
        { threshold: [0.5] }
      );
      io.observe(video);
    }
  }
  return el;
}

function renderProblem(block) {
  const d = blockData(block);
  const items = Array.isArray(d.items) ? d.items : [];
  const el = document.createElement('section');
  el.className = 'funnel-section';
  el.innerHTML = `
    <h2 class="funnel-h2">${escapeHtml(d.title || 'Masalah yang Sering Dihadapi')}</h2>
    ${d.description ? `<p class="funnel-lead">${escapeHtml(d.description)}</p>` : ''}
    <div class="funnel-grid funnel-grid--2">
      ${items
        .map(
          (it) => `<div class="funnel-card">
            <h3>${escapeHtml(it.title || it.label || '')}</h3>
            <p>${escapeHtml(it.desc || it.description || '')}</p>
          </div>`
        )
        .join('')}
    </div>
  `;
  return el;
}

function renderBenefit(block) {
  const d = blockData(block);
  const items = Array.isArray(d.items) ? d.items : [];
  const el = document.createElement('section');
  el.className = 'funnel-section';
  el.innerHTML = `
    <h2 class="funnel-h2">${escapeHtml(d.title || 'Manfaat yang Akan Kamu Dapatkan')}</h2>
    ${d.description ? `<p class="funnel-lead">${escapeHtml(d.description)}</p>` : ''}
    <div class="funnel-grid funnel-grid--3">
      ${items
        .map(
          (it) => `<div class="funnel-card funnel-card--accent">
            <h3>${escapeHtml(it.title || it.label || '')}</h3>
            <p>${escapeHtml(it.desc || it.description || '')}</p>
          </div>`
        )
        .join('')}
    </div>
  `;
  return el;
}

function renderKurikulum(block) {
  const d = blockData(block);
  const items = Array.isArray(d.items) ? d.items : [];
  const el = document.createElement('section');
  el.className = 'funnel-section';
  el.innerHTML = `
    <h2 class="funnel-h2">${escapeHtml(d.title || 'Kurikulum')}</h2>
    ${d.description ? `<p class="funnel-lead">${escapeHtml(d.description)}</p>` : ''}
    <div class="funnel-accordion">
      ${items
        .map(
          (it, i) => `<details class="funnel-accordion__item">
            <summary><span class="funnel-accordion__num">${String(i + 1).padStart(2, '0')}</span><span>${escapeHtml(it.title || '')}</span><span class="funnel-accordion__chev">⌄</span></summary>
            <div class="funnel-accordion__body">${escapeHtml(it.desc || it.description || '')}</div>
          </details>`
        )
        .join('')}
    </div>
  `;
  return el;
}

function renderPricing(block) {
  const d = blockData(block);
  const tiers = Array.isArray(d.tiers) ? d.tiers : [];
  const el = document.createElement('section');
  el.className = 'funnel-section';
  el.innerHTML = `
    <h2 class="funnel-h2">${escapeHtml(d.title || 'Pilih Paket')}</h2>
    ${d.description ? `<p class="funnel-lead">${escapeHtml(d.description)}</p>` : ''}
    <div class="funnel-grid funnel-grid--${Math.min(tiers.length, 3) || 1}">
      ${tiers
        .map((t, i) => {
          const id = t.id || String(i);
          return `<div class="funnel-tier ${t.highlight ? 'is-highlight' : ''}">
            ${t.highlight ? '<div class="funnel-tier__flag">Paling Populer</div>' : ''}
            <h3>${escapeHtml(t.name || '')}</h3>
            ${t.badge ? `<div class="funnel-tier__badge">${escapeHtml(t.badge)}</div>` : ''}
            <div class="funnel-tier__price">
              <span class="funnel-tier__amount">Rp ${formatNumber(t.price || 0)}</span>
              ${t.original_price ? `<span class="funnel-tier__strike">Rp ${formatNumber(t.original_price)}</span>` : ''}
            </div>
            ${t.period ? `<div class="funnel-tier__period">${escapeHtml(t.period)}</div>` : ''}
            <ul class="funnel-tier__features">
              ${(Array.isArray(t.features) ? t.features : [])
                .map((f) => `<li>${escapeHtml(f)}</li>`)
                .join('')}
            </ul>
            <button class="co-btn ${t.highlight ? 'co-btn--primary' : 'co-btn--ghost'} funnel-tier-btn"
              data-tier-id="${escapeHtml(id)}"
              data-tier-name="${escapeHtml(t.name || '')}"
              data-tier-price="${Number(t.price) || 0}">${escapeHtml(t.cta_text || 'Daftar Sekarang')}</button>
          </div>`;
        })
        .join('')}
    </div>
  `;

  el.querySelectorAll('.funnel-tier-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tier = {
        id: btn.dataset.tierId,
        name: btn.dataset.tierName,
        price: Number(btn.dataset.tierPrice) || 0
      };
      handleCheckoutIntent(tier);
    });
  });

  return el;
}

function renderFAQ(block) {
  const d = blockData(block);
  const items = Array.isArray(d.items) ? d.items : [];
  const el = document.createElement('section');
  el.className = 'funnel-section';
  el.innerHTML = `
    <h2 class="funnel-h2">${escapeHtml(d.title || 'Pertanyaan yang Sering Muncul')}</h2>
    <div class="funnel-faq">
      ${items
        .map(
          (it) => `<details class="funnel-faq__item">
            <summary>${escapeHtml(it.q || it.question || '')}<span class="funnel-faq__chev">⌄</span></summary>
            <div class="funnel-faq__body">${escapeHtml(it.a || it.answer || '')}</div>
          </details>`
        )
        .join('')}
    </div>
  `;
  return el;
}

function renderCTA(block) {
  const d = blockData(block);
  const el = document.createElement('section');
  el.className = 'funnel-section funnel-cta';
  el.innerHTML = `
    <h2 class="funnel-h2">${escapeHtml(d.title || 'Siap Mulai Sekarang?')}</h2>
    ${d.subtitle ? `<p class="funnel-lead">${escapeHtml(d.subtitle)}</p>` : ''}
    <div class="funnel-cta__actions">
      ${
        d.primary_text
          ? `<button class="co-btn co-btn--primary co-btn--lg" data-funnel-cta>${escapeHtml(d.primary_text)}</button>`
          : ''
      }
      ${d.secondary_text ? `<a href="${escapeHtml(d.secondary_url || '#')}" class="co-btn co-btn--ghost co-btn--lg">${escapeHtml(d.secondary_text)}</a>` : ''}
    </div>
    ${
      d.form !== false
        ? `<div class="funnel-optin">
            <h3>${escapeHtml(d.form_title || 'Dapatkan Akses Tutorial Gratis')}</h3>
            ${d.form_description ? `<p>${escapeHtml(d.form_description)}</p>` : ''}
            <form id="funnel-optin-form" class="funnel-optin__form" novalidate>
              <input name="name" required placeholder="Nama lengkap" autocomplete="name">
              <input name="email" type="email" required placeholder="Email" autocomplete="email">
              <input name="whatsapp" placeholder="No. WhatsApp (opsional)" autocomplete="tel">
              <button class="co-btn co-btn--primary" type="submit">${escapeHtml(d.form_button || 'Kirim & Dapatkan Akses')}</button>
              <div id="funnel-optin-msg" class="funnel-optin__msg"></div>
            </form>
          </div>`
        : ''
    }
  `;

  const ctaBtn = el.querySelector('[data-funnel-cta]');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      handleCheckoutIntent({ id: 'default', name: d.primary_text || 'Paket Xindelabs', price: 0 });
    });
  }

  const form = el.querySelector('#funnel-optin-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitOptIn(Object.fromEntries(new FormData(form).entries()), form);
    });
  }

  return el;
}

function renderCustomHTML(block) {
  const d = blockData(block);
  const el = document.createElement('section');
  el.className = 'funnel-section funnel-embed';
  el.innerHTML = d.html || d.content || block.html || '';
  // Render ulang script di dalam embed
  el.querySelectorAll('script').forEach((old) => {
    const s = document.createElement('script');
    Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
    s.textContent = old.textContent;
    old.parentNode.replaceChild(s, old);
  });
  return el;
}

// ============================================================
// LEAD & STAGE TRACKING
// ============================================================
async function submitOptIn(data, form) {
  const msg = form.querySelector('#funnel-optin-msg');
  const funnel = ctx.funnel;
  const utm = getUTM();
  const funnelSlug = funnel.slug || funnel.subdomain;

  // Validasi sederhana (tanpa akun Auth)
  if (!data.name || !data.name.trim()) {
    msg.textContent = 'Nama wajib diisi.';
    msg.className = 'funnel-optin__msg is-error';
    return;
  }
  if (!data.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    msg.textContent = 'Email tidak valid.';
    msg.className = 'funnel-optin__msg is-error';
    return;
  }

  const payload = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    whatsapp: data.whatsapp || null,
    status: 'belum',
    source: 'funnel-optin',
    current_stage: STAGES.OPT_IN,
    funnel_slug: funnelSlug,
    ref: data.ref || funnelSlug,
    last_stage_at: new Date().toISOString(),
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_content: utm.utm_content,
    utm_term: utm.utm_term
  };

  try {
    // Kalau lead dengan email sama sudah ada -> update, else insert
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('email', payload.email)
      .maybeSingle();

    let leadId = existing ? existing.id : null;
    if (leadId) {
      await supabase.from('leads').update(payload).eq('id', leadId);
    } else {
      const { data: lead, error } = await supabase.from('leads').insert(payload).select().single();
      if (error) throw error;
      leadId = lead.id;
    }

    localStorage.setItem('xinde_lead_id', leadId);
    localStorage.setItem('xinde_lead_email', payload.email);

    await supabase.from('pipeline_events').insert({
      lead_id: leadId,
      event_type: STAGES.OPT_IN,
      meta: { funnel: funnelSlug, source: 'free_tutorial_form', ...utm }
    });

    trackPixel('Lead', { value: 0, currency: 'IDR' });
    trackStage(STAGES.OPT_IN, { silent: true });

    msg.textContent = 'Berhasil! Cek email atau WhatsApp kamu untuk akses tutorial gratis.';
    msg.className = 'funnel-optin__msg is-ok';
    form.reset();
  } catch (e) {
    console.error('[funnel] opt-in gagal:', e);
    msg.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
    msg.className = 'funnel-optin__msg is-error';
  }
}

/**
 * Rekam pergerakan stage lead:
 * opt_in | watching_tutorial | checkout_initiated | unpaid_invoice
 */
export async function trackStage(stage, opts = {}) {
  const funnel = ctx.funnel;
  if (!funnel) return;
  const funnelSlug = funnel.slug || funnel.subdomain;
  const utm = getUTM();

  try {
    if (opts.silent) return; // sudah ditulis saat form submit

    const leadId = localStorage.getItem('xinde_lead_id');
    const email = localStorage.getItem('xinde_lead_email');
    const patch = {
      current_stage: stage,
      last_stage_at: new Date().toISOString(),
      funnel_slug: funnelSlug,
      utm_source: utm.utm_source || undefined,
      utm_medium: utm.utm_medium || undefined,
      utm_campaign: utm.utm_campaign || undefined,
      utm_content: utm.utm_content || undefined,
      utm_term: utm.utm_term || undefined
    };

    let resolvedLeadId = leadId;
    if (!resolvedLeadId && email) {
      const { data } = await supabase.from('leads').select('id').eq('email', email).maybeSingle();
      resolvedLeadId = data ? data.id : null;
    }

    if (resolvedLeadId) {
      // Buang nilai undefined agar tidak merusak payload JSON
      const clean = {};
      Object.keys(patch).forEach((k) => {
        if (patch[k] !== undefined && patch[k] !== null) clean[k] = patch[k];
      });
      await supabase.from('leads').update(clean).eq('id', resolvedLeadId);
      await supabase.from('pipeline_events').insert({
        lead_id: resolvedLeadId,
        event_type: stage,
        meta: { funnel: funnelSlug, ...utm }
      });
      localStorage.setItem('xinde_lead_stage', stage);
    }
  } catch (e) {
    console.warn('[funnel] trackStage gagal:', e);
  }
}

// ============================================================
// CHECKOUT
// ============================================================
function handleCheckoutIntent(tier) {
  const funnel = ctx.funnel;
  const settings = funnel.settings || {};
  const mode = settings.checkout_mode || 'embedded'; // 'embedded' | 'standalone'

  // Stage: checkout_initiated
  trackStage(STAGES.CHECKOUT);
  trackPixel('AddToCart', { value: Number(tier.price) || 0, currency: 'IDR' });

  if (mode === 'standalone') {
    goToStandaloneCheckout({ funnel, tier, utm: getUTM() });
    return;
  }

  openCheckoutModal({
    funnel,
    tier
    // Tanpa onSuccess → komponen checkout memakai redirectAfterCheckout:
    // ke payment_url Mayar (dari webhook) atau ke halaman upsell/thankyou.
  });
}
