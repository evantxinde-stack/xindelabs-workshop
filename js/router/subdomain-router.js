// Subdomain Router - Unified Ecosystem
// Supports: xindelabs.web.id, admin.xindelabs.web.id, member.xindelabs.web.id, *.xindelabs.web.id
// Localhost support via ?subdomain=nama

export function getSubdomain() {
  if (typeof window === 'undefined') return null;
  
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.');
  
  if (isLocal) {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subdomain');
    if (sub && sub.trim()) return sub.trim().toLowerCase();
    return null; // root on localhost
  }
  
  // Production
  const parts = host.split('.');
  if (parts.length < 3) return null; // root domain
  
  const subdomain = parts[0].toLowerCase();
  if (subdomain === 'www') return null;
  
  return subdomain;
}

export function getRoute() {
  const subdomain = getSubdomain();
  
  if (!subdomain) {
    return { type: 'root', module: 'main-hub', subdomain: null };
  }
  
  if (subdomain === 'admin') {
    return { type: 'admin', module: 'admin-dashboard', subdomain: 'admin' };
  }
  
  if (subdomain === 'member') {
    return { type: 'member', module: 'member-lms', subdomain: 'member' };
  }
  
  // Wildcard/dynamic subdomain - funnel engine
  return { type: 'funnel', module: 'funnel-engine', subdomain };
}

export function initRouter() {
  const route = getRoute();
  
  // Dispatch event for modules to listen to
  if (typeof window !== 'undefined') {
    window.__XINDE_ROUTE__ = route;
    window.dispatchEvent(new CustomEvent('xinde:route-ready', { detail: route }));
  }
  
  return route;
}

// Auto-init
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initRouter);
}

export default { getSubdomain, getRoute, initRouter };
