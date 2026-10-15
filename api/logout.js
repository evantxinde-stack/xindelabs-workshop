/**
 * GET /api/logout — hapus cookie sesi lalu balik ke halaman login.
 */
export const config = { runtime: 'edge' };

export default async function handler(request) {
  return new Response(null, {
    status: 303,
    headers: {
      'Set-Cookie': 'xinde_access=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0',
      Location: '/auth',
      'Cache-Control': 'no-store',
    },
  });
}
