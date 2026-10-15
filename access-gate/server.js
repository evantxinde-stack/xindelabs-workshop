#!/usr/bin/env node
/**
 * Xinde Labs — Access Gate untuk halaman member-only
 * (/deck-workshop dan /pre-session)
 *
 * Cara kerja:
 *  1. Pengunjung buka /deck-workshop → Caddy panggil endpoint /verify (forward_auth).
 *  2. Kalau cookie sesi valid → 200, halaman dilayani.
 *  3. Kalau tidak → 302 ke /auth?next=<path> (halaman login).
 *  4. Halaman login kirim email + kode akses → POST /api/login → cek ke Supabase
 *     (tabel `members`: status harus paid/active, lms_password harus cocok).
 *  5. Kalau cocok → set cookie HttpOnly sesi (HMAC-signed, 30 hari) → balik ke halaman.
 *
 * Keamanan:
 *  - Kode akses tidak pernah dikirim ke browser; hanya dibandingkan di server.
 *  - Cookie ditandatangani HMAC-SHA256; isi tidak bisa diubah tanpa SECRET.
 *  - Rate-limit per IP untuk mencegah brute-force.
 *  - Service-role key hanya hidup di proses ini (file mode 600), tidak pernah ke client.
 */

'use strict';

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ──────────────────────────── Konfigurasi ────────────────────────────
const PORT = Number(process.env.GATE_PORT || 3020);
const SB_URL = process.env.SB_URL || 'https://qxzvmnbhplgmspdxdbmg.supabase.co';
const SB_SERVICE_KEY = (process.env.SB_SERVICE_KEY || readSecret('/etc/xinde-gate/supabase-service.key', '/tmp/srk.txt')).trim();
const SESSION_SECRET = (process.env.SESSION_SECRET || readSecret('/etc/xinde-gate/session.secret')).trim();
const COOKIE_NAME = 'xinde_access';
const SESSION_DAYS = 30;

// Halaman yang dilindungi
const PROTECTED = ['/deck-workshop', '/pre-session'];

// Status member yang dianggap punya akses
const OK_STATUS = new Set(['paid', 'active', 'lifetime', 'trial']);

function readSecret(...candidates) {
  for (const c of candidates) {
    try { return fs.readFileSync(c, 'utf8'); } catch (_) { /* lanjut */ }
  }
  return '';
}

if (!SB_SERVICE_KEY) { console.error('FATAL: Supabase service key tidak ditemukan'); process.exit(1); }
if (!SESSION_SECRET || SESSION_SECRET.length < 32) { console.error('FATAL: SESSION_SECRET tidak ditemukan / terlalu pendek'); process.exit(1); }

// ──────────────────────────── Util ────────────────────────────
const log = (...a) => console.log(new Date().toISOString(), ...a);

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function sign(payloadObj) {
  const payload = b64url(JSON.stringify(payloadObj));
  const mac = b64url(crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest());
  return payload + '.' + mac;
}

function verify(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) return null;
  const [payload, mac] = token.split('.');
  const expected = b64url(crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest());
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(b64urlDecode(payload).toString('utf8'));
    if (!obj.exp || Date.now() > obj.exp) return null;
    return obj;
  } catch (_) { return null; }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

/** HTTPS GET ke Supabase REST. */
function sbGet(pathname) {
  return new Promise((resolve, reject) => {
    const u = new URL(SB_URL + '/rest/v1/' + pathname);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        apikey: SB_SERVICE_KEY,
        Authorization: 'Bearer ' + SB_SERVICE_KEY,
        Accept: 'application/json',
      },
      timeout: 10000,
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error('Supabase ' + res.statusCode + ': ' + data.slice(0, 200)));
        try { resolve(JSON.parse(data || '[]')); } catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('Supabase timeout')); });
    req.on('error', reject);
    req.end();
  });
}

async function findMember(email) {
  const em = String(email || '').trim().toLowerCase();
  if (!em || em.length > 200) return null;
  const q = 'members?select=email,status,tier,paid_until,lms_password&email=eq.' + encodeURIComponent(em) + '&limit=1';
  const rows = await sbGet(q);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/** Bandingkan kode akses dengan aman (timing-safe). */
function codeMatches(input, stored) {
  if (!stored) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(String(stored));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Member masih berlaku? paid_until null = berlaku selamanya. */
function stillValid(member) {
  if (!OK_STATUS.has(String(member.status || '').toLowerCase())) return false;
  if (member.paid_until) {
    const t = Date.parse(member.paid_until);
    // paid_until tanggal saja, atau timestamp — anggap akhir hari.
    if (!isNaN(t) && Date.now() > t + 24 * 3600 * 1000) return false;
  }
  return true;
}

// ──────────────────────────── Rate limit ────────────────────────────
// Kunci rate limit: gabungan IP + email. IP saja tidak cukup karena
// proxy Vercel bisa memakai IP keluar yang berbeda tiap request.
// Email saja juga tidak cukup (penyerang bisa ganti-ganti email).
const attempts = new Map();
const MAX_ATTEMPTS = 5;          // percobaan gagal sebelum diblokir
const WINDOW_MS = 15 * 60 * 1000; // jendela 15 menit

function rlKey(ip, email) {
  return String(ip || '-') + '|' + String(email || '').trim().toLowerCase().slice(0, 120);
}
function rateLimited(ip, email) {
  const now = Date.now();
  const keys = [rlKey(ip, email), 'ip|' + String(ip || '-'), 'em|' + String(email || '').trim().toLowerCase().slice(0, 120)];
  for (const k of keys) {
    const rec = attempts.get(k);
    if (rec && rec.until > now && rec.n >= MAX_ATTEMPTS) return true;
  }
  return false;
}
function noteAttempt(ip, email) {
  const now = Date.now();
  const keys = [rlKey(ip, email), 'ip|' + String(ip || '-'), 'em|' + String(email || '').trim().toLowerCase().slice(0, 120)];
  for (const k of keys) {
    let rec = attempts.get(k);
    if (!rec || rec.until <= now) rec = { n: 0, until: now + WINDOW_MS };
    rec.n++;
    attempts.set(k, rec);
  }
  if (attempts.size > 20000) attempts.clear();
}
function clearAttempts(ip, email) {
  attempts.delete(rlKey(ip, email));
}

// ──────────────────────────── Halaman login ────────────────────────────
const LOGIN_HTML = fs.readFileSync(path.join(__dirname, 'login.html'), 'utf8');

function loginPage({ error, next }) {
  return LOGIN_HTML
    .replace(/__ERROR__/g, (error || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])))
    .replace(/__NEXT__/g, (next || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])));
}

/** Redirect balik ke halaman login sambil bawa pesan error + tujuan. */
function backToLogin(res, error, next) {
  const q = new URLSearchParams();
  if (error) q.set('e', error);
  if (next && next.startsWith('/') && !next.startsWith('//')) q.set('next', next);
  const loc = '/auth' + (q.toString() ? '?' + q.toString() : '');
  return send(res, 303, '', { Location: loc });
}

// ──────────────────────────── Server ────────────────────────────
function send(res, code, body, headers = {}) {
  res.writeHead(code, Object.assign({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  }, headers));
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const cookies = parseCookies(req.headers.cookie);
  const sess = verify(cookies[COOKIE_NAME]);

  // ── 1) forward_auth: Caddy tanya "boleh lewat?" ──
  if (p === '/verify') {
    if (sess) return send(res, 200, 'ok', { 'X-Auth-Email': sess.e || '' });
    const next = u.searchParams.get('next') || '';
    const target = '/auth' + (next ? '?next=' + encodeURIComponent(next) : '');
    return send(res, 302, '', { Location: target });
  }

  // ── 2) Halaman login ──
  if (p === '/auth' && req.method === 'GET') {
    if (sess) return send(res, 302, '', { Location: u.searchParams.get('next') || '/' });
    return send(res, 200, loginPage({ next: u.searchParams.get('next') || '' }), { 'Content-Type': 'text/html; charset=utf-8' });
  }

  // ── 3) Proses login ──
  if (p === '/api/login' && req.method === 'POST') {
    // Catatan: rate limit butuh email, jadi dicek setelah body dibaca (di bawah).
    let body = '';
    req.on('data', c => { body += c; if (body.length > 10000) req.destroy(); });
    req.on('end', async () => {
      try {
        const params = new URLSearchParams(body);
        const email = params.get('email') || '';
        const code = params.get('code') || '';
        const next = params.get('next') || '';
        const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '';

        if (rateLimited(ip, email)) {
          log('RATE LIMITED', ip, email.slice(0, 60));
          return backToLogin(res, 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.', safeNext);
        }

        if (!email || !code) {
          noteAttempt(ip, email);
          return backToLogin(res, 'Email dan kode akses wajib diisi.', safeNext);
        }

        const member = await findMember(email);

        // Pesan error disamakan supaya tidak bisa dipakai menebak email terdaftar.
        const genericFail = () => {
          noteAttempt(ip, email);
          log('LOGIN FAIL', ip, email.slice(0, 60));
          return backToLogin(res, 'Email atau kode akses salah.', safeNext);
        };

        if (!member) return genericFail();
        if (!codeMatches(code, member.lms_password)) return genericFail();
        if (!stillValid(member)) {
          noteAttempt(ip, email);
          return backToLogin(res, 'Akses untuk akun ini sudah tidak aktif. Hubungi admin.', safeNext);
        }

        clearAttempts(ip, email);
        const exp = Date.now() + SESSION_DAYS * 24 * 3600 * 1000;
        const token = sign({ e: member.email, t: member.tier || '', exp });
        log('LOGIN OK', ip, member.email, member.tier || '-');

        const cookie = [
          COOKIE_NAME + '=' + encodeURIComponent(token),
          'Path=/',
          'HttpOnly',
          'SameSite=Lax',
          'Max-Age=' + (SESSION_DAYS * 24 * 3600),
        ];
        if ((req.headers['x-forwarded-proto'] || '') === 'https') cookie.push('Secure');
        return send(res, 302, '', {
          'Set-Cookie': cookie.join('; '),
          Location: safeNext || '/',
        });
      } catch (err) {
        log('LOGIN ERROR', String(err && err.message));
        return backToLogin(res, 'Server sedang sibuk. Coba lagi sebentar.', '');
      }
    });
    return;
  }

  // ── 4) Logout ──
  if (p === '/api/logout') {
    return send(res, 302, '', {
      'Set-Cookie': COOKIE_NAME + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
      Location: '/auth',
    });
  }

  // ── 5) Status sesi (buat halaman yang mau nampilin email) ──
  if (p === '/api/me') {
    if (!sess) return send(res, 401, JSON.stringify({ ok: false }));
    return send(res, 200, JSON.stringify({ ok: true, email: sess.e, tier: sess.t }), { 'Content-Type': 'application/json' });
  }

  // ── 6) Health ──
  if (p === '/health') return send(res, 200, 'ok');

  return send(res, 404, 'not found');
});

server.listen(PORT, '127.0.0.1', () => {
  log('Xinde access gate jalan di http://127.0.0.1:' + PORT);
  log('Halaman dilindungi:', PROTECTED.join(', '));
});
