// ============================================================
// LAZY RECHARTS LOADER (CDN, hanya saat dashboard dibuka)
// Recharts 2.x UMD butuh React, PropTypes, ReactDOM.
// ============================================================

const CDN = {
  react: 'https://unpkg.com/react@18/umd/react.production.min.js',
  propTypes: 'https://unpkg.com/prop-types@15.8.1/prop-types.min.js',
  reactDom: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  recharts: 'https://unpkg.com/recharts@2.12.7/umd/Recharts.js'
};

let loadPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-admin-chart="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Gagal load ' + src)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.dataset.adminChart = src;
    s.onload = () => { s.dataset.loaded = '1'; resolve(); };
    s.onerror = () => reject(new Error('Gagal load ' + src));
    document.head.appendChild(s);
  });
}

export function chartsReady() {
  return !!(window.React && window.ReactDOM && window.PropTypes && window.Recharts);
}

export function ensureRecharts() {
  if (chartsReady()) return Promise.resolve(true);
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    await loadScript(CDN.react);
    await loadScript(CDN.propTypes);
    await loadScript(CDN.reactDom);
    await loadScript(CDN.recharts);
    return chartsReady();
  })().catch((err) => {
    loadPromise = null;
    throw err;
  });
  return loadPromise;
}

/**
 * Render komponen Recharts ke container.
 * @param {HTMLElement} container
 * @param {string} name nama komponen Recharts (mis. 'AreaChart')
 * @param {Array} children array element React
 * @param {Object} extraProps
 */
export function mountChart(container, name, children, extraProps = {}) {
  if (!container) return null;
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  const R = window.Recharts;
  if (!React || !ReactDOM || !R || !R[name]) return null;

  if (container._chartRoot) {
    try { container._chartRoot.unmount(); } catch (e) {}
    container._chartRoot = null;
  }

  const chart = React.createElement(
    R.ResponsiveContainer,
    { width: '100%', height: '100%' },
    React.createElement(R[name], extraProps, children)
  );
  const root = ReactDOM.createRoot(container);
  root.render(chart);
  container._chartRoot = root;
  return root;
}

export function chartEl(name, props, ...children) {
  const R = window.Recharts;
  const React = window.React;
  if (!R || !React || !R[name]) return null;
  return React.createElement(R[name], props, ...children.filter(Boolean));
}

export { CDN as CHART_CDN };
