// XindeLabs subdomain dispatcher. Pure resolveRoute() keeps routing testable.
const BASE_DOMAIN = 'xindelabs.web.id';
const PHYSICAL_PREFIXES = ['/auth', '/deck-workshop', '/pre-session'];
const RESERVED = new Set(['www', 'learn', 'kelas']);
const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

function cleanHost(hostname = '') {
  return String(hostname).trim().toLowerCase().replace(/\.$/, '');
}

function isPreviewHost(hostname) {
  return hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.vercel.app');
}

function querySubdomain(search = '') {
  const value = new URLSearchParams(search).get('subdomain');
  const subdomain = String(value || '').trim().toLowerCase();
  return LABEL.test(subdomain) ? subdomain : null;
}

function hostSubdomain(hostname) {
  if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) return null;
  const suffix = `.${BASE_DOMAIN}`;
  if (!hostname.endsWith(suffix)) return null;
  const subdomain = hostname.slice(0, -suffix.length);
  return LABEL.test(subdomain) && !RESERVED.has(subdomain) ? subdomain : null;
}

function appRoute(subdomain) {
  if (!subdomain) return { type: 'root', module: 'main-hub', subdomain: null };
  if (subdomain === 'admin') return { type: 'admin', module: 'admin-dashboard', subdomain };
  if (subdomain === 'member') return { type: 'member', module: 'member-lms', subdomain };
  return { type: 'funnel', module: 'funnel-engine', subdomain };
}

export function resolveRoute({ hostname = '', pathname = '/', search = '' } = {}) {
  if (PHYSICAL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname === `${prefix}.html`)) {
    return { type: 'physical', module: null, subdomain: null };
  }

  const host = cleanHost(hostname);
  const subdomain = isPreviewHost(host) ? querySubdomain(search) : hostSubdomain(host);
  return appRoute(subdomain);
}

export function getSubdomain() {
  if (typeof window === 'undefined') return null;
  return resolveRoute(window.location).subdomain;
}

export function getRoute() {
  if (typeof window === 'undefined') return appRoute(null);
  return resolveRoute(window.location);
}

export function initRouter() {
  const route = getRoute();
  if (typeof window !== 'undefined') {
    window.__XINDE_ROUTE__ = route;
    window.dispatchEvent(new CustomEvent('xinde:route-ready', { detail: route }));
  }
  return route;
}

export default { resolveRoute, getSubdomain, getRoute, initRouter };
