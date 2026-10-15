/**
 * Xinde Labs — Access Gate untuk Vercel (Edge Middleware)
 *
 * Cara kerja: Vercel jadi "pintu depan". Semua keputusan akses ditanyakan ke
 * gate VPS (43.133.131.126:3020 lewat HTTP), jadi kunci Supabase TIDAK perlu
 * ada di Vercel sama sekali. Hanya satu tempat yang pegang kunci: VPS.
 *
 * Alur:
 *   1. Request masuk ke /deck-workshop atau /pre-session
 *   2. Middleware tanya gate VPS: "cookie ini valid?"
 *   3. Valid   → lanjut ke file statik di Vercel (cepat, dari edge)
 *   4. Invalid → redirect ke /auth
 *
 * Endpoint /auth, /api/login, /api/logout, /api/me juga diteruskan ke VPS,
 * supaya logika login cuma ada di satu tempat.
 *
 * Env var yang dibutuhkan:
 *   GATE_ORIGIN — alamat gate VPS. Default:
 *                 https://gate.43-133-131-126.sslip.io
 *                 (boleh dibiarkan default; ganti kalau alamat VPS berubah)
 *
 * TIDAK butuh SESSION_SECRET maupun SUPABASE_SERVICE_KEY di Vercel —
 * kunci master cuma hidup di VPS.
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

// Alamat gate VPS. Bukan rahasia — cuma alamat. Boleh di-override lewat env var.
const GATE = (process.env.GATE_ORIGIN || 'https://gate.43-133-131-126.sslip.io').replace(/\/+$/, '');

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // ── Route khusus login: teruskan ke gate VPS, apa adanya (termasuk cookie) ──
  const isAuthRoute =
    path === '/auth' ||
    path === '/api/login' ||
    path === '/api/logout' ||
    path === '/api/me';

  if (isAuthRoute) {
    const target = GATE + path + (url.search || '');
    const proxied = new Request(target, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    });

    let res;
    try {
      res = await fetch(proxied);
    } catch (err) {
      return new Response(
        'Gate sedang tidak bisa dihubungi. Coba lagi sebentar.',
        { status: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    // Teruskan balik ke browser, termasuk Set-Cookie + Location (redirect).
    const headers = new Headers();
    for (const [k, v] of res.headers) {
      const lk = k.toLowerCase();
      if (lk === 'set-cookie' || lk === 'location' || lk === 'content-type' || lk === 'cache-control') {
        headers.append(k, v);
      }
    }
    // Cegah caching halaman login.
    headers.set('Cache-Control', 'no-store');

    return new Response(res.body, { status: res.status, headers });
  }

  // ── Halaman member: tanya gate VPS dulu ──
  const isProtected = path.startsWith('/deck-workshop') || path.startsWith('/pre-session');
  if (!isProtected) return;

  const next = encodeURIComponent(path + (url.search || ''));
  let verified = false;

  try {
    const r = await fetch(GATE + '/verify?next=' + next, {
      method: 'GET',
      headers: { cookie: request.headers.get('cookie') || '' },
      redirect: 'manual',
    });
    // 200 = cookie valid. 3xx = belum login / tidak valid.
    verified = r.status === 200;
    if (!verified) {
      const loc = r.headers.get('location') || '/auth?next=' + next;
      return new Response(null, { status: 302, headers: { Location: loc, 'Cache-Control': 'no-store' } });
    }
  } catch (err) {
    // Gate tidak bisa dihubungi → jangan buka akses (fail closed).
    return new Response(
      'Gate sedang tidak bisa dihubungi. Coba lagi sebentar.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  return; // lolos → lanjut layani file statik dari edge Vercel
}
