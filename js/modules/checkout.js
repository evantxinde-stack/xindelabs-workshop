// Checkout Component - 2 modes: embedded (di bawah landing page) & standalone (/checkout)
// Fitur: Tier selection, Order Bump, Kode Voucher, Upsell, integrasi webhook n8n/Mayar
import { supabase } from '../config/supabase-client.js';

const DEFAULT_WEBHOOK = () => {
  try {
    if (window.XINDE && window.XINDE.N8N_WEBHOOK) return window.XINDE.N8N_WEBHOOK;
  } catch (e) {}
  return 'https://n8n.43-133-131-126.sslip.io/webhook/create-payment';
};

const VOUCHERS = {
  XINDE10: { type: 'percent', value: 0.1, label: 'Diskon 10%' },
  HEMAT100K: { type: 'fixed', value: 100000, label: 'Potongan Rp 100.000' },
  FREEUPGRADE: { type: 'bumpfree', value: 0, label: 'Gratis Order Bump' }
};

const ORDER_BUMP_DEFAULT = {
  enabled: true,
  price: 149000,
  label: 'Order Bump - Tambahan Spesial',
  description: 'Bonus eksklusif khusus pembelian ini'
};

export function getBumpConfig(funnel) {
  const raw = funnel && funnel.settings ? funnel.settings.order_bump : null;
  if (raw === false) return { ...ORDER_BUMP_DEFAULT, enabled: false };
  if (!raw || typeof raw !== 'object') return ORDER_BUMP_DEFAULT;
  return {
    enabled: raw.enabled !== false,
    price: raw.price != null ? Number(raw.price) || 0 : ORDER_BUMP_DEFAULT.price,
    label: raw.label || ORDER_BUMP_DEFAULT.label,
    description: raw.description || ORDER_BUMP_DEFAULT.description
  };
}

export function getUTM() {
  const p = new URLSearchParams(location.search);
  return {
    utm_source: p.get('utm_source') || '',
    utm_medium: p.get('utm_medium') || '',
    utm_campaign: p.get('utm_campaign') || '',
    utm_content: p.get('utm_content') || '',
    utm_term: p.get('utm_term') || '',
    ref: p.get('ref') || (window.XINDE_AFF ? window.XINDE_AFF.getRef() : '') || ''
  };
}

export function getWebhookUrl(funnel) {
  const fromFunnel = funnel && funnel.settings ? funnel.settings.webhook_url : null;
  return fromFunnel || DEFAULT_WEBHOOK();
}

export function formatNumber(n) {
  return Number(n || 0).toLocaleString('id-ID');
}

export function escapeHtml(s = '') {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

export function validateVoucher(code, subtotal) {
  const key = String(code || '').trim().toUpperCase();
  const v = VOUCHERS[key];
  if (!v) return { valid: false, discount: 0, message: 'Kode voucher tidak valid' };
  if (v.type === 'percent') {
    const d = Math.round(subtotal * v.value);
    return { valid: true, discount: d, code: key, message: `Voucher ${key} berhasil (${v.label})` };
  }
  if (v.type === 'fixed') {
    const d = Math.min(v.value, subtotal);
    return { valid: true, discount: d, code: key, message: `Voucher ${key} berhasil (${v.label})` };
  }
  return { valid: true, discount: 0, code: key, freeBump: true, message: `Voucher ${key} berhasil (${v.label})` };
}

/**
 * Render komponen checkout ke sebuah container.
 * @param {HTMLElement} el container
 * @param {Object} opts { funnel, tier: {id,name,price}, onSuccess }
 */
export function renderCheckout(el, opts) {
  const funnel = opts.funnel || {};
  const tiers = getTiers(funnel);
  const bumpCfg = getBumpConfig(funnel);

  // Rekonsiliasi tier yang diminta dengan daftar tier yang tersedia
  let initialId = opts.tier && opts.tier.id != null ? String(opts.tier.id) : '';
  let matched = tiers.find((t) => String(t.id) === initialId) || null;
  if (!matched && tiers.length) matched = tiers[0];

  const state = {
    tierId: matched ? matched.id : initialId || 'default',
    tierName: matched ? matched.name : (opts.tier && opts.tier.name) || 'Paket Xindelabs',
    tierPrice: matched
      ? Number(matched.price) || 0
      : opts.tier && opts.tier.price != null
        ? Number(opts.tier.price)
        : 0,
    bump: 0,
    bumpChecked: false,
    discount: 0,
    voucherCode: '',
    freeBump: false
  };

  el.innerHTML = `
    <div class="co-checkout space-y-5">
      ${
        tiers.length > 1
          ? `<div class="co-field">
              <label class="co-label" for="co-tier">Pilih Tier</label>
              <select id="co-tier" name="tier" class="co-input">
                ${tiers
                  .map(
                    (t) =>
                      `<option value="${escapeHtml(t.id)}" data-name="${escapeHtml(t.name)}" data-price="${t.price}" ${
                        String(t.id) === String(state.tierId) ? 'selected' : ''
                      }>${escapeHtml(t.name)} — Rp ${formatNumber(t.price)}</option>`
                  )
                  .join('')}
              </select>
            </div>`
          : ''
      }

      <div class="co-summary p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-white/60">Paket yang dipilih</div>
            <div class="font-semibold" id="co-tier-name">${escapeHtml(state.tierName)}</div>
          </div>
          <div class="text-xl font-bold" id="co-tier-price">Rp ${formatNumber(state.tierPrice)}</div>
        </div>
      </div>

      <form id="co-form" class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div class="co-field">
            <label class="co-label" for="co-name">Nama lengkap</label>
            <input id="co-name" name="name" required placeholder="Nama lengkap" class="co-input" autocomplete="name">
          </div>
          <div class="co-field">
            <label class="co-label" for="co-email">Email</label>
            <input id="co-email" name="email" type="email" required placeholder="Email" class="co-input" autocomplete="email">
          </div>
        </div>
        <div class="co-field">
          <label class="co-label" for="co-wa">No. WhatsApp</label>
          <input id="co-wa" name="whatsapp" required placeholder="08xxxxxxxxxx" class="co-input" autocomplete="tel">
        </div>

        <label class="co-bump flex items-start gap-3 p-4 rounded-xl border border-emerald-400/30 bg-emerald-400/5 cursor-pointer" id="co-bump-wrap" ${bumpCfg.enabled ? '' : 'style="display:none"'}>
          <input type="checkbox" id="co-bump" class="mt-1 co-checkbox">
          <div>
            <div class="font-semibold">${escapeHtml(bumpCfg.label)}</div>
            <div class="text-sm text-white/60">${escapeHtml(bumpCfg.description)} (+Rp ${formatNumber(bumpCfg.price)})</div>
          </div>
        </label>

        <div class="co-field">
          <label class="co-label" for="co-voucher">Kode Voucher</label>
          <div class="flex gap-2">
            <input id="co-voucher" name="voucher_code" placeholder="Masukkan kode voucher" class="co-input flex-1" autocomplete="off">
            <button type="button" id="co-apply-voucher" class="co-btn co-btn--ghost">Terapkan</button>
          </div>
          <div id="co-voucher-msg" class="co-note"></div>
        </div>

        <div class="co-totals p-4 rounded-xl bg-white/5 space-y-2">
          <div class="flex justify-between"><span>Subtotal</span><span id="co-subtotal">Rp ${formatNumber(state.tierPrice)}</span></div>
          <div class="flex justify-between text-emerald-300"><span>Order Bump</span><span id="co-bump-amount">Rp 0</span></div>
          <div class="flex justify-between text-emerald-300"><span>Diskon Voucher</span><span id="co-discount">Rp 0</span></div>
          <div class="border-t border-white/10 pt-2 flex justify-between font-semibold text-lg"><span>Total</span><span id="co-total">Rp ${formatNumber(state.tierPrice)}</span></div>
        </div>

        <div id="co-error" class="co-note co-note--error"></div>
        <button type="submit" id="co-submit" class="co-btn co-btn--primary w-full">Lanjut ke Pembayaran</button>
        <p class="text-xs text-white/40 text-center">Klik tombol di atas berarti kamu menyetujui seluruh ketentuan program.</p>
      </form>
    </div>
  `;

  const $ = (id) => el.querySelector(id);

  function recalc() {
    const subtotal = Number(state.tierPrice) || 0;
    const bump = state.freeBump ? 0 : state.bumpChecked && bumpCfg.enabled ? bumpCfg.price : 0;
    const total = Math.max(0, subtotal + bump - state.discount);
    $('#co-subtotal').textContent = 'Rp ' + formatNumber(subtotal);
    $('#co-bump-amount').textContent = 'Rp ' + formatNumber(bump);
    $('#co-discount').textContent = '-Rp ' + formatNumber(state.discount);
    $('#co-total').textContent = 'Rp ' + formatNumber(total);
    return total;
  }

  const tierSelect = $('#co-tier');
  if (tierSelect) {
    tierSelect.addEventListener('change', (e) => {
      const opt = e.target.selectedOptions[0];
      state.tierId = opt.value;
      state.tierName = opt.dataset.name;
      state.tierPrice = Number(opt.dataset.price) || 0;
      state.discount = 0;
      $('#co-voucher-msg').textContent = '';
      $('#co-voucher-msg').className = 'co-note';
      recalc();
    });
  }

  const bumpEl = $('#co-bump');
  if (bumpEl) {
    bumpEl.addEventListener('change', (e) => {
      state.bumpChecked = e.target.checked;
      recalc();
    });
  }

  $('#co-apply-voucher').addEventListener('click', () => {
    const code = $('#co-voucher').value.trim();
    const msg = $('#co-voucher-msg');
    const res = validateVoucher(code, Number(state.tierPrice) || 0);
    state.voucherCode = res.valid ? res.code : '';
    state.discount = res.valid ? res.discount : 0;
    state.freeBump = !!(res.valid && res.freeBump);
    msg.textContent = res.message;
    msg.className = 'co-note ' + (res.valid ? 'co-note--ok' : 'co-note--error');
    recalc();
  });

  $('#co-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#co-submit');
    btn.disabled = true;
    btn.textContent = 'Memproses...';
    try {
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      const total = recalc();
      const bumpAmount = state.freeBump ? 0 : state.bumpChecked && bumpCfg.enabled ? bumpCfg.price : 0;
      const result = await submitCheckout(
        { ...data, tier: state.tierId, tier_name: state.tierName, total, bump_amount: bumpAmount },
        funnel
      );
      if (result && opts.onSuccess) opts.onSuccess(result);
      else redirectAfterCheckout(result, funnel);
    } catch (err) {
      console.error(err);
      const errEl = $('#co-error');
      errEl.textContent = 'Terjadi kesalahan saat memproses checkout. Silakan coba lagi.';
      errEl.className = 'co-note co-note--error';
      btn.disabled = false;
      btn.textContent = 'Lanjut ke Pembayaran';
    }
  });

  recalc();
  return { state, recalc };
}

function getTiers(funnel) {
  const steps = funnel && funnel._steps ? funnel._steps : [];
  for (const step of steps) {
    const blocks = Array.isArray(step.blocks) ? step.blocks : [];
    for (const b of blocks) {
      if (b.type === 'pricing' && b.data && Array.isArray(b.data.tiers) && b.data.tiers.length) {
        return b.data.tiers.map((t, i) => ({
          id: t.id || String(i),
          name: t.name || `Tier ${i + 1}`,
          price: Number(t.price) || 0
        }));
      }
    }
  }
  return [];
}

/**
 * Simpan lead + order, catat stage, kirim ke webhook n8n/Mayar.
 */
export async function submitCheckout(data, funnel) {
  const utm = getUTM();
  const funnelSlug = (funnel && (funnel.slug || funnel.subdomain)) || 'default';
  const subdomain = (funnel && (funnel.subdomain || funnel.slug)) || funnelSlug;
  const tierPrice = Number(data.tier_price) || 0;
  const totalAmount = Number(data.total) || 0;
  const bumpAmount =
    data.bump_amount != null
      ? Math.max(0, Number(data.bump_amount) || 0)
      : Math.max(0, totalAmount - tierPrice);
  const isBump = bumpAmount > 0;

  // 1) Upsert lead
  let leadId = localStorage.getItem('xinde_lead_id');
  const payload = {
    name: data.name,
    email: data.email,
    whatsapp: data.whatsapp,
    status: 'belum',
    source: 'funnel-checkout',
    current_stage: 'unpaid_invoice',
    funnel_slug: funnelSlug,
    ref: data.ref || funnelSlug,
    last_stage_at: new Date().toISOString(),
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_content: utm.utm_content,
    utm_term: utm.utm_term
  };

  if (leadId) {
    const { error } = await supabase.from('leads').update(payload).eq('id', leadId);
    if (error) leadId = null;
  }
  if (!leadId) {
    const { data: lead, error } = await supabase.from('leads').insert(payload).select().single();
    if (error) throw error;
    leadId = lead.id;
    localStorage.setItem('xinde_lead_id', leadId);
    localStorage.setItem('xinde_lead_email', data.email || '');
  }

  // 2) Create order
  const { data: order } = await supabase
    .from('orders')
    .insert({
      lead_id: leadId,
      product: data.tier_name || data.product || funnelSlug,
      tier: data.tier || 'default',
      voucher_code: data.voucher_code || null,
      amount: totalAmount,
      bump_amount: bumpAmount,
      subdomain: subdomain,
      status: 'pending'
    })
    .select()
    .single();

  // 3) Pipeline event
  await supabase.from('pipeline_events').insert({
    lead_id: leadId,
    event_type: 'unpaid_invoice',
    meta: { tier: data.tier, amount: totalAmount, funnel: funnelSlug, order_bump: isBump, bump_amount: bumpAmount }
  });

  // 4) Kirim ke webhook n8n/Mayar
  //    Field `nama`/`wa`/`discord`/`voucher_code` mengikuti kontrak
  //    workflow n8n existing (create-payment). Alias `name`/`whatsapp`
  //    tetap dikirim agar kompatibel dengan integrasi lain.
  const refCode = (data.ref || utm.ref || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
  const webhookPayload = {
    // kontrak n8n existing
    nama: data.name,
    email: data.email,
    wa: data.whatsapp,
    discord: data.discord || '',
    voucher_code: data.voucher_code || '',
    tier: data.tier || 'default',
    ref: refCode,
    // alias & metadata tambahan
    name: data.name,
    whatsapp: data.whatsapp,
    discord_id: data.discord || '',
    tier_name: data.tier_name || '',
    product: data.tier_name || funnelSlug,
    amount: totalAmount,
    order_bump: isBump,
    bump_amount: bumpAmount,
    subdomain: subdomain,
    voucher: data.voucher_code || null,
    funnel: funnelSlug,
    funnel_slug: funnelSlug,
    lead_id: leadId,
    order_id: order ? order.id : null,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_content: utm.utm_content,
    utm_term: utm.utm_term
  };

  let webhookOk = false;
  let webhookData = null;
  try {
    const res = await fetch(getWebhookUrl(funnel), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
      keepalive: true
    });
    webhookOk = res.ok;
    if (res.ok) {
      try {
        webhookData = await res.json();
      } catch (e) {
        webhookData = null;
      }
    }
  } catch (e) {
    console.warn('Webhook n8n gagal:', e);
  }

  // 4b) Simpan payment URL / invoice id dari webhook ke order
  if (order && order.id && webhookData) {
    const paymentUrl =
      webhookData.payment_url || webhookData.paymentUrl || webhookData.invoice_url ||
      webhookData.invoiceUrl || webhookData.link || null;
    const invoiceId =
      webhookData.mayar_invoice_id || webhookData.invoice_id || webhookData.invoiceId ||
      webhookData.id || null;
    if (paymentUrl || invoiceId) {
      const patch = {};
      if (paymentUrl) patch.payment_url = paymentUrl;
      if (invoiceId) patch.mayar_invoice_id = String(invoiceId);
      try {
        const { data: updated } = await supabase.from('orders').update(patch).eq('id', order.id).select().single();
        if (updated) Object.assign(order, updated);
      } catch (e) {
        console.warn('Gagal simpan payment_url:', e);
      }
    }
  }

  // 5) Meta Pixel
  try {
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', { value: totalAmount, currency: 'IDR' });
    }
  } catch (e) {}

  return { leadId, order, webhookOk, webhookData, data };
}

export function redirectAfterCheckout(result, funnel) {
  const settings = (funnel && funnel.settings) || {};
  const slug = funnel && (funnel.slug || funnel.subdomain);
  const upsell = withFunnelParam(settings.upsell_url || (funnel && funnel.upsell_url) || '/upsell', slug);
  const thankyou = withFunnelParam(settings.thankyou_url || (funnel && funnel.thankyou_url) || '/thankyou', slug);

  // Jika n8n mengembalikan URL invoice (Mayar), redirect ke sana
  const wd = (result && result.webhookData) || {};
  const paymentUrl = wd.payment_url || wd.paymentUrl || wd.link || (result && result.paymentUrl);
  if (paymentUrl) {
    window.location.href = paymentUrl;
    return;
  }
  if (settings.skip_upsell) {
    window.location.href = thankyou;
  } else {
    window.location.href = upsell;
  }
}

function withFunnelParam(url, slug) {
  if (!slug || !url) return url;
  if (/[?&]funnel=/.test(url)) return url;
  return url + (url.includes('?') ? '&' : '?') + 'funnel=' + encodeURIComponent(slug);
}

/**
 * Catat stage `checkout_initiated` (dipakai halaman /checkout standalone
 * dan juga dari funnel-engine saat tombol checkout diklik).
 */
export async function trackCheckoutStage(funnel, tier) {
  const utm = getUTM();
  const funnelSlug = (funnel && (funnel.slug || funnel.subdomain)) || 'default';
  try {
    const leadId = localStorage.getItem('xinde_lead_id');
    const patch = {
      current_stage: 'checkout_initiated',
      last_stage_at: new Date().toISOString(),
      funnel_slug: funnelSlug
    };
    // Hanya kirim parameter UTM yang terisi (hindari payload JSON rusak)
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
      if (utm[k]) patch[k] = utm[k];
    });
    if (leadId) {
      await supabase.from('leads').update(patch).eq('id', leadId);
      await supabase.from('pipeline_events').insert({
        lead_id: leadId,
        event_type: 'checkout_initiated',
        meta: { funnel: funnelSlug, tier: tier ? tier.id : null, ...utm }
      });
    }
    try {
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          value: tier && tier.price ? Number(tier.price) : 0,
          currency: 'IDR'
        });
      }
    } catch (e) {}
  } catch (e) {
    console.warn('[checkout] trackCheckoutStage gagal:', e);
  }
}

/**
 * Mode embedded: buka modal checkout di atas halaman landing.
 */
export function openCheckoutModal(opts) {
  const funnel = opts.funnel || {};
  let modal = document.getElementById('checkout-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.className = 'co-modal';
    modal.innerHTML = `
      <div class="co-modal__panel" role="dialog" aria-modal="true" aria-label="Checkout">
        <div class="co-modal__head">
          <h2 class="text-xl font-semibold">Checkout</h2>
          <button id="co-modal-close" class="co-modal__close" aria-label="Tutup">&times;</button>
        </div>
        <div id="co-modal-body" class="co-modal__body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#co-modal-close').addEventListener('click', () => closeCheckoutModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCheckoutModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCheckoutModal();
    });
  }
  modal.style.display = 'flex';
  modal.classList.add('is-open');
  const body = modal.querySelector('#co-modal-body');
  renderCheckout(body, opts);
  return body;
}

export function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('is-open');
  }
}

/**
 * Mode standalone: navigasi ke /checkout dengan tier terpilih.
 */
export function goToStandaloneCheckout(opts) {
  const funnel = opts.funnel || {};
  const tier = opts.tier || {};
  const p = new URLSearchParams({
    funnel: funnel.slug || funnel.subdomain || 'default',
    tier: tier.id || 'default',
    tier_name: tier.name || '',
    tier_price: String(tier.price != null ? tier.price : 0)
  });
  if (opts.utm) p.set('utm_source', opts.utm.utm_source || '');
  window.location.href = '/checkout?' + p.toString();
}
