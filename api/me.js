/**
 * GET /api/me — info sesi aktif (dipakai halaman buat nampilin email + tombol keluar).
 */
export const config = { runtime: 'edge' };

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
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  if (b64url(sig) !== mac) return null;
  try {
    const obj = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    if (!obj.exp || Date.now() > obj.exp) return null;
    return obj;
  } catch (_) { return null; }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export default async function handler(request) {
  const secret = process.env.SESSION_SECRET || '';
  const json = (obj, status) => new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
  if (!secret) return json({ ok: false }, 503);

  const sess = await verifyToken(parseCookies(request.headers.get('cookie'))[COOKIE_NAME], secret);
  if (!sess) return json({ ok: false }, 401);
  return json({ ok: true, email: sess.e, tier: sess.t });
}
