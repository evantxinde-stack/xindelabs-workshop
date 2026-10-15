/**
 * Xinde Labs — Access Gate untuk Vercel (Edge Middleware)
 *
 * Melindungi /deck-workshop dan /pre-session supaya cuma member yang udah beli
 * workshop yang bisa buka.
 *
 * Alur:
 *   1. Request masuk ke /deck-workshop atau /pre-session
 *   2. Middleware cek cookie `xinde_access` (HMAC-SHA256, ditandatangani di server)
 *   3. Valid   → lanjut ke file statik
 *   4. Invalid → redirect ke /auth?next=<path>
 *
 * Env var yang dibutuhkan (set di Vercel → Settings → Environment Variables):
 *   SESSION_SECRET       — sama persis dengan yang dipakai gate di VPS
 *   GATE_ORIGIN          — (opsional) origin gate VPS kalau mau pakai login di sana
 *
 * Catatan: middleware ini TIDAK menyimpan kode akses. Verifikasi email + kode
 * dilakukan di /api/login (lihat /api/login.js), yang memanggil Supabase.
 */

export const config = {
  matcher: [
    '/deck-workshop',
    '/deck-workshop/:path*',
    '/pre-session',
    '/pre-session/:path*',
    '/auth',
    '/api/login',
    '/api/logout',
    '/api/me',
  ],
};

const COOKIE_NAME = 'xinde_access';

function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64url(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function verifyToken(token, secret) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) return null;
  const [payload, mac] = token.split('.');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  // Bandingkan tanda tangan
  if (b64url(sig) !== mac) return null;
  try {
    const obj = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    if (!obj.exp || Date.now() > obj.exp) return null;
    return obj;
  } catch (_) {
    return null;
  }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const secret = process.env.SESSION_SECRET || '';

  // Route login/api selalu dilayani (mereka yang memutuskan sendiri).
  if (path.startsWith('/auth') || path.startsWith('/api/')) {
    return; // lanjutkan ke handler masing-masing
  }

  const isProtected = path.startsWith('/deck-workshop') || path.startsWith('/pre-session');
  if (!isProtected) return;

  // Kalau SESSION_SECRET belum diset, JANGAN buka akses — tolak dengan jelas.
  if (!secret) {
    return new Response(
      'Konfigurasi server belum lengkap (SESSION_SECRET belum diset).',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const cookies = parseCookies(request.headers.get('cookie'));
  const sess = await verifyToken(cookies[COOKIE_NAME], secret);

  if (sess) return; // sesi valid → lanjut ke file statik

  const next = encodeURIComponent(path + url.search);
  return Response.redirect(new URL('/auth?next=' + next, request.url), 302);
}
