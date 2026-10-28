import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const api = await readFile(new URL('../src/app/api/lead/route.ts', import.meta.url), 'utf8');
const form = await readFile(new URL('../src/components/LeadForm.tsx', import.meta.url), 'utf8');
const hub = await readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const funnel = await readFile(new URL('../src/app/tutorial/funnel.tsx', import.meta.url), 'utf8');
const migration = await readFile(
  new URL('../supabase/migrations/20261029060000_lead_business_field.sql', import.meta.url),
  'utf8'
);

test('migration adds business_field additively', () => {
  assert.match(migration, /add column if not exists business_field/);
});

test('lead API persists optional business_field', () => {
  assert.match(api, /body\.business_field/);
  assert.match(api, /business_field/);
});

test('lead form collects business field', () => {
  assert.match(form, /name="business_field"/);
});

test('main hub renders the lead form', () => {
  assert.match(hub, /LeadForm/);
});

test('main hub leads are attributed separately from the free tutorial funnel', () => {
  assert.match(form, /source\?: string/);
  assert.match(hub, /source="main-hub-contact"/);
});

test('free tutorial funnel keeps its own capture flow', () => {
  assert.match(funnel, /source: "tutorial_hermes"/);
  assert.match(funnel, /vip_offer_viewed/);
  assert.match(funnel, /course_downsell_viewed/);
  assert.match(funnel, /free_tutorial_viewed/);
});
