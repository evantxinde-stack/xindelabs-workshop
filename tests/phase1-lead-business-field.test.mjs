import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const api = await readFile(new URL('../src/app/api/lead/route.ts', import.meta.url), 'utf8');
const form = await readFile(new URL('../src/components/LeadForm.tsx', import.meta.url), 'utf8');
const hub = await readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
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
