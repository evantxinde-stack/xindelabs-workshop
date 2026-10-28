import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lines = await readFile(new URL('../src/lib/services.ts', import.meta.url), 'utf8');
const hub = await readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const service = await readFile(new URL('../src/app/service/page.tsx', import.meta.url), 'utf8');

const SLUGS = ['instalasi-ai', 'automation-bisnis', 'vibe-marketing', 'pembuatan-aplikasi'];

test('service lines live in one shared source of truth', () => {
  assert.match(lines, /export const SERVICE_LINES/);
  for (const slug of SLUGS) {
    assert.ok(lines.includes(`"${slug}"`), `missing slug ${slug}`);
  }
});

test('main hub renders the four service lines from that source', () => {
  assert.match(hub, /from "@\/lib\/services"/);
  assert.match(hub, /SERVICE_LINES/);
});

test('service page renders the same four lines with anchors', () => {
  assert.match(service, /from "@\/lib\/services"/);
  assert.match(service, /SERVICE_LINES/);
  assert.match(service, /id=\{.*slug/);
});

test('free tutorial funnel is untouched by phase 2', async () => {
  const funnel = await readFile(new URL('../src/app/tutorial/funnel.tsx', import.meta.url), 'utf8');
  assert.match(funnel, /lead_capture/);
  assert.match(funnel, /vip_offer_viewed/);
  assert.match(funnel, /course_downsell_viewed/);
  assert.match(funnel, /free_tutorial_viewed/);
});
