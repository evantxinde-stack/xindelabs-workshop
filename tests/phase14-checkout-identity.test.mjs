import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(new URL('../src/app/api/checkout/route.ts', import.meta.url), 'utf8');
const form = await readFile(new URL('../src/app/checkout/[product]/checkout-form.tsx', import.meta.url), 'utf8');
const page = await readFile(new URL('../src/app/checkout/[product]/page.tsx', import.meta.url), 'utf8');

test('checkout collects the four onboarding identities', () => {
  for (const label of ['Nama lengkap', 'Email', 'No. WhatsApp', 'Discord User ID']) {
    assert.match(form, new RegExp(label));
  }
  assert.match(form, /name,email,whatsapp,/, 'form must post name/email/whatsapp');
  assert.doesNotMatch(form, /disabled=\{busy\|\|!leadId\}/, 'payment must not be blocked by a missing lead id');
});

test('checkout route creates or reuses a lead from the submitted identity', () => {
  assert.match(route, /Nama, email, dan nomor WhatsApp valid wajib diisi/);
  assert.match(route, /isValidEmail\(inputEmail\)/);
  assert.match(route, /validWhatsapp\(inputWhatsapp\)/);
  assert.match(route, /eq\("email",inputEmail\)/, 'lead is matched by submitted email');
  assert.match(route, /from\("leads"\)\.insert\(/, 'lead is created when neither id nor email matches');
  assert.match(route, /whatsapp:inputWhatsapp/);
  assert.match(route, /name:inputName/);
  assert.match(route, /discord_id:discordId/);
  assert.match(route, /eq\("email",inputEmail\)\.maybeSingle\(\)\)\.data;const memberPrice/, 'member lookup uses the submitted email');
});

test('checkout page resolves the identity from the session and the lead row', () => {
  assert.match(page, /learnMember/);
  assert.match(page, /leadId=\{leadId\}/);
  assert.match(page, /defaults=\{defaults\}/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /memberPrice/, 'member price must be decided server-side');
});
