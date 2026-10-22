// ============================================================
// ADMIN MODULE REGISTRY
// Dipanggil dari admin.html setelah sesi admin terverifikasi.
// ============================================================
import { createContext } from './context.js';
import * as dashboard from './dashboard.js';
import * as pipeline from './pipeline.js';
import * as funnels from './funnel-builder.js';
import * as blog from './blog-editor.js';
import * as lms from './lms-vip.js';
import * as hermes from './hermes-bridge.js';

export function initAdminModules(client, cfg) {
  if (window.__ADMIN_MODULES__) return window.__ADMIN_CONTEXT__;

  const ctx = createContext(client, cfg);

  dashboard.init(ctx);
  pipeline.init(ctx);
  funnels.init(ctx);
  blog.init(ctx);
  lms.init(ctx);
  hermes.init(ctx);

  window.__ADMIN_MODULES__ = { dashboard, pipeline, funnels, blog, lms, hermes };
  window.__ADMIN_CONTEXT__ = ctx;
  return ctx;
}
