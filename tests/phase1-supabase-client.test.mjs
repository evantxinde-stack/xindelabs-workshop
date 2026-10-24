import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../js/config/supabase-client.js', import.meta.url), 'utf8');
const moduleSource = source.replace(
  /import \{ createClient \} from ['"][^'"]+['"];?/,
  'const createClient = globalThis.__createClient;'
);

async function load({ config, factory }) {
  globalThis.window = config === undefined ? undefined : { XINDE: config, localStorage: {} };
  globalThis.__createClient = factory;
  try {
    return await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}#${Math.random()}`);
  } finally {
    delete globalThis.window;
    delete globalThis.__createClient;
  }
}

test('returns null when public config is missing', async () => {
  let calls = 0;
  const mod = await load({ config: undefined, factory: () => { calls += 1; } });
  assert.equal(mod.supabase, null);
  assert.equal(mod.isSupabaseConfigured(), false);
  assert.equal(calls, 0);
});

test('creates one browser client with the existing public config', async () => {
  const calls = [];
  const expected = { client: true };
  const mod = await load({
    config: { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_ANON_KEY: 'anon-public-key' },
    factory: (...args) => { calls.push(args); return expected; }
  });

  assert.equal(mod.supabase, expected);
  assert.equal(mod.isSupabaseConfigured(), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://project.supabase.co');
  assert.equal(calls[0][1], 'anon-public-key');
  assert.equal(calls[0][2].auth.persistSession, true);
});

test('rejects a service-role JWT in browser config', async () => {
  const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
  await assert.rejects(
    load({
      config: { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_ANON_KEY: `x.${payload}.y` },
      factory: () => ({})
    }),
    /service-role/i
  );
});
