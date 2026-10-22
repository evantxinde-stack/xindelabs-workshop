// ============================================================
// XINDE LABS — HERMES PROXY (Vercel Serverless Function)
// ============================================================
// Objectives: forward request dari Admin Dashboard ke Hermes Agent
// (webhook n8n) TANPA membocorkan token ke browser.
//
// Env vars (set di Vercel Project > Settings > Environment Variables):
//   HERMES_WEBHOOK   = https://n8n.xxx/webhook/hermes-agent   (wajib)
//   HERMES_TOKEN     = Bearer token webhook                    (opsional)
//   HERMES_AGENT_NAME= hermes                                 (opsional)
//   HERMES_TIMEOUT_MS= 180000                                 (opsional)
//
// Contract (sama persis dengan yang dipakai bridge di browser):
//   POST /api/hermes
//   { action, payload, source, agent, requested_at }
//   ->  { ok, output, data, upstream_status }
//
// Catatan: endpoint HANYA boleh HERMES_WEBHOOK dari environment.
// URL dari request body diabaikan (anti SSRF).
// ============================================================

function pickOutput(data) {
  if (data == null) return '';
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data;
  if (typeof data !== 'object') return String(data);

  const cands = [
    data.output, data.reply, data.text, data.content, data.result, data.answer, data.response,
    data.data && data.data.output, data.data && data.data.reply, data.data && data.data.text,
    data.data && data.data.content, data.data && data.data.result,
    data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content,
    data.choices && data.choices[0] && data.choices[0].text
  ];
  for (const c of cands) {
    if (c !== undefined && c !== null && c !== '') return c;
  }
  return '';
}

function readBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') {
    try { return JSON.parse(b); } catch (e) { return {}; }
  }
  return b;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'xinde-hermes-proxy',
      configured: !!process.env.HERMES_WEBHOOK
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const url = process.env.HERMES_WEBHOOK;
  if (!url) {
    return res.status(500).json({
      ok: false,
      error: 'HERMES_WEBHOOK belum diatur di environment Vercel'
    });
  }

  const body = readBody(req);
  const payload = {
    action: body.action || 'ping',
    payload: body.payload || {},
    source: body.source || 'admin',
    agent: body.agent || process.env.HERMES_AGENT_NAME || 'hermes',
    requested_at: body.requested_at || new Date().toISOString()
  };

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
  if (process.env.HERMES_TOKEN) {
    headers.Authorization = 'Bearer ' + process.env.HERMES_TOKEN;
  }

  const timeout = Number(process.env.HERMES_TIMEOUT_MS) || 180000;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => { if (controller) controller.abort(); }, timeout);

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    });

    const text = await upstream.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

    return res.status(upstream.status).json({
      ok: upstream.ok,
      output: pickOutput(data),
      data,
      upstream_status: upstream.status
    });
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    return res.status(aborted ? 504 : 502).json({
      ok: false,
      error: aborted
        ? 'Timeout ke Hermes Agent (' + Math.round(timeout / 1000) + ' detik)'
        : ((err && err.message) || 'Gagal menghubungi Hermes Agent')
    });
  } finally {
    clearTimeout(timer);
  }
}
