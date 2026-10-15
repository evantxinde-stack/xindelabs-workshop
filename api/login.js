/**
 * POST /api/login — Vercel Edge Function
 *
 * Terima: email + code (form-urlencoded) + next
 * Cek ke Supabase tabel `members` (status paid/active, lms_password cocok)
 * Kalau valid → set cookie sesi HMAC-signed → redirect ke `next`
 * Kalau gagal   → redirect balik ke /auth?e=<pesan>&next=<next>
 *
 * Env var: SESSION_SECRET, SUPABASE_SERVICE_KEY
 */

export const config = { runtime: 'edge' };

const SB_URL = process.env.SB_URL || 'https://qxzvmnbhplgmspdxdbmg.supabase.co';
const COOKIE_NAME = 'xinde_access';
const SESSION_DAYS = 30;
const OK_STATUS = new Set(['paid', 'active', 'lifetime', 'trial']);

function b64url(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(payloadObj, secret) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify(payloadObj)));
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return payload + '.' + b64url(sig);
}

function constantTimeEqual(a, b) {
  const A = new TextEncoder().encode(String(a));
  const B = new TextEncoder().encode(String(b));
  if (A.length !== B.length) return false;
  let diff = 0;
  for (let i = 0; i < A.length; i++) diff |= A[i] ^ B[i];
  return diff === 0;
}

async function findMember(email, serviceKey) {
  const em = String(email || '').trim().toLowerCase();
  if (!em || em.length > 200) return null;
  const q = SB_URL + '/rest/v1/members?select=email,status,tier,paid_until,lms_password&email=eq.' +
    encodeURIComponent(em) + '&limit=1';
  const r = await fetch(q, {
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, Accept: 'application/json' },
  });
  if (!r.ok) throw new Error('Supabase ' + r.status);
  const rows = await r.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function stillValid(m) {
  if (!OK_STATUS.has(String(m.status || '').toLowerCase())) return false;
  if (m.paid_until) {
    const t = Date.parse(m.paid_until);
    if (!isNaN(t) && Date.now() > t + 24 * 3600 * 1000) return false;
  }
  return true;
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const secret = process.env.SESSION_SECRET || '';
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
  if (!secret || !serviceKey) {
    return new Response('Konfigurasi server belum lengkap (SESSION_SECRET / SUPABASE_SERVICE_KEY).', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    const form = await request.formData();
    const email = String(form.get('email') || '');
    let code = String(form.get('code') || '');
    let next = String(form.get('next') || '');
    if (!(next.startsWith('/') && !next.startsWith('//'))) next = '';

    const back = (msg) => {
      const u = new URL('/auth', request.url);
      if (msg) u.searchParams.set('e', msg);
      if (next) u.searchParams.set('next', next);
      return new Response(null, { status: 303, headers: { Location: u.pathname + u.search, 'Cache-Control': 'no-store' } });
    };

    if (!email || !code) return back('Email dan kode akses wajib diisi.');

    const member = await findMember(email, serviceKey);
    // Pesan disamakan supaya email terdaftar tidak bisa ditebak.
    if (!member) return back('Email atau kode akses salah.');
    if (!constantTimeEqual(code, member.lms_password)) return back('Email atau kode akses salah.');
    if (!stillValid(member)) return back('Akses untuk akun ini sudah tidak aktif. Hubungi admin.');

    const exp = Date.now() + SESSION_DAYS * 24 * 3600 * 1000;
    const token = await sign({ e: member.email, t: member.tier || '', exp }, secret);

    const cookie = [
      COOKIE_NAME + '=' + encodeURIComponent(token),
      'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure',
      'Max-Age=' + (SESSION_DAYS * 24 * 3600),
    ].join('; ');

    const dest = next || '/';
    return new Response(null, {
      status: 303,
      headers: { Location: dest, 'Set-Cookie': cookie, 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const u = new URL('/auth', request.url);
    u.searchParams.set('e', 'Server sedang sibuk. Coba lagi sebentar.');
    return new Response(null, { status: 303, headers: { Location: u.pathname + u.search } });
  }
}
