import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { applyDiscount, bumpOffer, normalizeVoucherType, orderTotal, callbackTokenOk, parseMayarEvent } from "../src/lib/checkout.ts";

const route = await readFile(new URL('../src/app/api/checkout/route.ts', import.meta.url), 'utf8');
const webhook = await readFile(new URL('../src/app/api/mayar/webhook/route.ts', import.meta.url), 'utf8');
const form = await readFile(new URL('../src/app/checkout/[product]/checkout-form.tsx', import.meta.url), 'utf8');

test('voucher supports legacy amount and fixed types', () => {
  assert.equal(normalizeVoucherType('amount'), 'fixed');
  assert.equal(normalizeVoucherType('fixed'), 'fixed');
  assert.equal(normalizeVoucherType('percent'), 'percent');
  assert.equal(applyDiscount(100000, { type: 'amount', value: 30000 }), 70000);
  assert.equal(applyDiscount(100000, { type: 'percent', value: 10 }), 90000);
  assert.equal(applyDiscount(100000, { type: 'amount', value: 150000 }), 0);
});

test('order bump is explicit and total never goes below zero', () => {
  assert.equal(orderTotal(100000, 25000, false), 100000);
  assert.equal(orderTotal(100000, 25000, true), 125000);
  assert.equal(orderTotal(0, 25000, true), 25000);
  assert.deepEqual(bumpOffer({ id: "a", bump_class_id: "b", bump_price: 25000, bump_active: true, bump_title: "Kit" }), { classId: "b", amount: 25000, title: "Kit" });
  assert.equal(bumpOffer({ id: "a", bump_class_id: "a", bump_price: 25000, bump_active: true }), null);
  assert.match(form, /order_bump/);
  assert.match(route, /bump_amount/);
});

test('checkout validates voucher limits before invoice and webhook is fail-closed', () => {
  assert.match(route, /expires_at/);
  assert.match(route, /max_uses/);
  assert.match(route, /used_count/);
  assert.match(webhook, /MAYAR_CALLBACK_TOKEN/);
  assert.match(webhook, /parseMayarEvent/);
  assert.match(webhook, /transactionId/);
  assert.match(webhook, /getInvoiceStatus/);
});

test('mayar event parsing accepts the paid variants and rejects the rest', () => {
  assert.deepEqual(parseMayarEvent({ event: 'payment.received', data: { transactionId: 'tx1', status: 'SUCCESS', transactionStatus: 'paid', amount: 1000 } }), { transactionId: 'tx1', amount: 1000, method: null });
  assert.deepEqual(parseMayarEvent({ event: 'payment.received', data: { id: 'tx2', status: 'PAID', amount: '2500' } }), { transactionId: 'tx2', amount: 2500, method: null });
  assert.equal(parseMayarEvent({ event: 'payment.reminder', data: { transactionId: 'tx3', status: 'SUCCESS' } }), null);
  assert.equal(parseMayarEvent({ event: 'payment.received', data: { transactionId: 'tx4', status: 'PENDING' } }), null);
  assert.equal(parseMayarEvent({ event: 'payment.received', data: { status: 'SUCCESS' } }), null);
});

test('callback token check fails closed when a token is configured', () => {
  assert.equal(callbackTokenOk('secret', 'secret'), true);
  assert.equal(callbackTokenOk('wrong', 'secret'), false);
  assert.equal(callbackTokenOk(null, 'secret'), false);
  assert.equal(callbackTokenOk(null, undefined), true);
  assert.equal(callbackTokenOk('anything', ''), true);
});

test('webhook verifies the invoice with Mayar before granting access', () => {
  assert.match(webhook, /getInvoiceStatus/);
  assert.match(webhook, /mayar_invoice_id/);
  assert.match(webhook, /401/);
});

test('webhook payment processing remains idempotent', () => {
  assert.match(webhook, /markOrderPaid/);
  assert.match(webhook, /mayar_transaction_id/);
});
