import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { allowedPaymentOptions, classPrice, earlyBirdOpen } from "../src/lib/mayar.ts";
import { nextPaidUntil } from "../src/lib/billing.ts";

const checkout = await readFile(new URL('../src/app/api/checkout/route.ts', import.meta.url), 'utf8');
const form = await readFile(new URL('../src/app/checkout/[product]/checkout-form.tsx', import.meta.url), 'utf8');
const admin = await readFile(new URL('../src/app/api/admin/classes/route.ts', import.meta.url), 'utf8');
const lms = await readFile(new URL('../src/lib/lms.ts', import.meta.url), 'utf8');
const orders = await readFile(new URL('../src/lib/orders.ts', import.meta.url), 'utf8');

test('annual only offered when class allows it and has an annual price', () => {
  assert.deepEqual(allowedPaymentOptions({ payment_options: ["annual", "lifetime"], annual_price: 120 }), ["annual", "lifetime"]);
  assert.deepEqual(allowedPaymentOptions({ payment_options: ["annual", "lifetime"], annual_price: null }), ["lifetime"]);
  assert.deepEqual(allowedPaymentOptions({ payment_options: ["lifetime"] }), ["lifetime"]);
  assert.deepEqual(allowedPaymentOptions(null), ["lifetime"]);
});

test('annual price ignores early bird, lifetime price honours it', () => {
  const cls = { price: 999, annual_price: 599, lifetime_price: 999, early_bird_price: 499, early_bird_quota: 10, early_bird_used: 1 };
  assert.equal(classPrice(cls, "annual"), 599);
  assert.equal(classPrice(cls, "lifetime"), 499);
  assert.equal(earlyBirdOpen(cls), true);
});

test('checkout validates the option against the class instead of blocking annual', () => {
  assert.match(checkout, /allowedPaymentOptions\(cls\)/);
  assert.match(checkout, /paymentOption === "annual"/);
  assert.doesNotMatch(checkout, /Paket annual sedang disiapkan/);
  assert.match(form, /payment_option:paymentOption/);
});

test('admin catalog stores product type, annual/lifetime prices, and payment options', () => {
  assert.match(admin, /product_type/);
  assert.match(admin, /annual_price/);
  assert.match(admin, /lifetime_price/);
  assert.match(admin, /payment_options/);
  assert.match(admin, /early_bird_quota/);
});

test('paid annual order writes member billing window, paid order passes the option', () => {
  assert.match(lms, /payment_option: option/);
  assert.match(lms, /billing_status: "active"/);
  assert.match(lms, /nextPaidUntil\(option, existing\?\.paid_until\)/);
  assert.match(orders, /payment_option: \(order as any\)\.payment_option === "annual" \? "annual" : "lifetime"/);
});

test('paid_until: lifetime never expires, annual renews from the current period', () => {
  assert.equal(nextPaidUntil('lifetime', '2030-01-01'), null);
  const fresh = nextPaidUntil('annual', null);
  assert.match(fresh, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(new Date(fresh).getTime() > Date.now());
  const future = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const renewed = nextPaidUntil('annual', future);
  assert.equal(renewed, new Date(new Date(future).getTime() + 365 * 86400000).toISOString().slice(0, 10));
});
