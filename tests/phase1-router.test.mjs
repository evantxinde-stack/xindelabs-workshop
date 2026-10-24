import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../js/router/subdomain-router.js', import.meta.url), 'utf8');
const router = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('routes production hosts deterministically', () => {
  assert.deepEqual(router.resolveRoute({ hostname: 'xindelabs.web.id' }), {
    type: 'root', module: 'main-hub', subdomain: null
  });
  assert.deepEqual(router.resolveRoute({ hostname: 'www.xindelabs.web.id' }), {
    type: 'root', module: 'main-hub', subdomain: null
  });
  assert.equal(router.resolveRoute({ hostname: 'admin.xindelabs.web.id' }).type, 'admin');
  assert.equal(router.resolveRoute({ hostname: 'member.xindelabs.web.id' }).type, 'member');
  assert.deepEqual(router.resolveRoute({ hostname: 'promo.xindelabs.web.id' }), {
    type: 'funnel', module: 'funnel-engine', subdomain: 'promo'
  });
});

test('does not treat Vercel preview host as a funnel slug', () => {
  assert.equal(router.resolveRoute({
    hostname: 'xindelabs-workshop-git-main-x.vercel.app'
  }).type, 'root');
});

test('allows ?subdomain only on local or preview hosts', () => {
  assert.equal(router.resolveRoute({
    hostname: 'localhost', search: '?subdomain=admin'
  }).type, 'admin');
  assert.equal(router.resolveRoute({
    hostname: 'xindelabs-workshop-git-main-x.vercel.app', search: '?subdomain=promo'
  }).subdomain, 'promo');
  assert.equal(router.resolveRoute({
    hostname: 'xindelabs.web.id', search: '?subdomain=admin'
  }).type, 'root');
});

test('keeps protected physical paths out of app dispatch', () => {
  for (const pathname of ['/auth', '/auth.html', '/deck-workshop', '/pre-session']) {
    assert.deepEqual(router.resolveRoute({
      hostname: 'member.xindelabs.web.id', pathname
    }), { type: 'physical', module: null, subdomain: null });
  }
});

test('rejects invalid dynamic subdomain labels', () => {
  assert.equal(router.resolveRoute({ hostname: 'bad_name.xindelabs.web.id' }).type, 'root');
  assert.equal(router.resolveRoute({ hostname: '-bad.xindelabs.web.id' }).type, 'root');
});
