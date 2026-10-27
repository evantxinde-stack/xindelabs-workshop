import test from 'node:test';
import assert from 'node:assert';
import { isPaymentOption, classPrice } from '../../src/lib/mayar.ts';
test('payment options validate and price from selected class field', () => {
  assert.equal(isPaymentOption('annual'), true);
  assert.equal(isPaymentOption('monthly'), false);
  assert.equal(classPrice({ annual_price: 120, lifetime_price: 300, price: 999 }, 'annual'), 120);
  assert.equal(classPrice({ lifetime_price: null, price: 999 }, 'lifetime'), 999);
});

import {
  mapSource,
  parseWorkshopAmountFromNotes,
  buildUnifiedLeads,
  uniquePaidCustomers,
  computeRevenueDetailed,
} from '../../src/lib/unified-funnel.ts';

test('1. Mapping semua source', () => {
  assert.deepEqual(mapSource('tutorial_hermes'), { source: 'tutorial_hermes', label: 'Tutorial Free', group: 'Tutorial' });
  assert.deepEqual(mapSource('landing-daftar'), { source: 'landing-daftar', label: 'Workshop Landing', group: 'Workshop' });
  assert.deepEqual(mapSource('checkout'), { source: 'checkout', label: 'Workshop Checkout', group: 'Workshop' });
  assert.deepEqual(mapSource('komunitas'), { source: 'komunitas', label: 'Komunitas Gratis', group: 'Komunitas' });
  assert.deepEqual(mapSource('test'), { source: 'test', label: 'Internal Test', group: 'Internal' });
  assert.deepEqual(mapSource(null), { source: '', label: 'Other', group: 'Other' });
  assert.deepEqual(mapSource(undefined), { source: '', label: 'Other', group: 'Other' });
  assert.deepEqual(mapSource('unknown'), { source: 'unknown', label: 'Other', group: 'Other' });
});

test('2. Parse harga:199000', () => {
  assert.equal(parseWorkshopAmountFromNotes('harga:199000'), 199000);
});

test('3. Parse harga: 599000', () => {
  assert.equal(parseWorkshopAmountFromNotes('harga: 599000'), 599000);
});

test('4. Invalid/missing harga menghasilkan null', () => {
  assert.equal(parseWorkshopAmountFromNotes(null), null);
  assert.equal(parseWorkshopAmountFromNotes(undefined), null);
  assert.equal(parseWorkshopAmountFromNotes('no price here'), null);
  assert.equal(parseWorkshopAmountFromNotes('harga:'), null);
  assert.equal(parseWorkshopAmountFromNotes('harga:abc'), null);
});

test('5. Workshop member paid mengoverride lead bayar', () => {
  const leads = [{
    id: 'l1',
    name: 'A',
    email: 'a@test.com',
    whatsapp: null,
    status: 'bayar',
    source: 'checkout',
    current_stage: null,
    created_at: '2025-01-01',
  }];
  const members = [{
    id: 'm1',
    email: 'a@test.com',
    status: 'paid',
    product: 'Workshop',
    tier: 'yearly',
    paid_until: '2026-01-01',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  }];
  const orders: any[] = [];
  const notes = new Map([['l1', 'harga:199000']]);
  const unified = buildUnifiedLeads(leads, members, orders, notes);
  assert.equal(unified[0].display_status, 'Paid');
  assert.equal(unified[0].amount_paid, 199000);
});

test('6. Paid order mengoverride raw lead status', () => {
  const leads = [{
    id: 'l2',
    name: 'B',
    email: 'b@test.com',
    whatsapp: null,
    status: 'belum',
    source: 'tutorial_hermes',
    current_stage: null,
    created_at: '2025-01-01',
  }];
  const members: any[] = [];
  const orders = [{
    id: 'o1',
    lead_id: 'l2',
    product: 'VIP',
    tier: null,
    voucher_code: null,
    amount: 500000,
    mayar_invoice_id: 'inv1',
    mayar_transaction_id: 'tr1',
    status: 'paid',
    created_at: '2025-01-01',
    paid_at: '2025-01-01',
  }];
  const unified = buildUnifiedLeads(leads, members, orders);
  assert.equal(unified[0].display_status, 'Paid');
  assert.equal(unified[0].amount_paid, 500000);
});

test('7. Unique paid customers case-insensitive', () => {
  const leads = [
    { id: 'l1', name: 'A', email: 'A@test.com', whatsapp: null, status: 'paid', source: 'test', current_stage: null, created_at: '2025-01-01' },
    { id: 'l2', name: 'B', email: 'a@test.com', whatsapp: null, status: 'paid', source: 'test', current_stage: null, created_at: '2025-01-01' },
  ];
  const members: any[] = [];
  const orders: any[] = [];
  const unified = buildUnifiedLeads(leads, members, orders);
  const paid = uniquePaidCustomers(unified);
  assert.equal(paid.size, 1);
});

test('8. Revenue tidak memasukkan amount null', () => {
  const leads = [
    { id: 'l1', name: 'A', email: 'a@test.com', whatsapp: null, status: 'bayar', source: 'checkout', current_stage: null, created_at: '2025-01-01' }, // paid workshop but amount missing
  ];
  const members = [{
    id: 'm1',
    email: 'a@test.com',
    status: 'paid',
    product: 'Workshop',
    tier: 'lifetime',
    paid_until: null,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  }];
  const orders: any[] = [];
  // no notes with price
  const rev = computeRevenueDetailed(leads, members, orders);
  assert.equal(rev.revenueRecorded, 0);
  assert.equal(rev.amountUnrecordedCount, 1);
});

test('9. Revenue tidak double count', () => {
  const leads = [{
    id: 'l1',
    name: 'A',
    email: 'a@test.com',
    whatsapp: null,
    status: 'paid',
    source: 'checkout',
    current_stage: null,
    created_at: '2025-01-01',
  }];
  const members = [{
    id: 'm1',
    email: 'a@test.com',
    status: 'paid',
    product: 'Workshop',
    tier: 'yearly',
    paid_until: '2026-01-01',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  }];
  const orders = [{
    id: 'o1',
    lead_id: 'l1',
    product: 'Workshop Yearly',
    tier: 'yearly',
    voucher_code: null,
    amount: 199000,
    mayar_invoice_id: null,
    mayar_transaction_id: null,
    status: 'paid',
    created_at: '2025-01-01',
    paid_at: '2025-01-01',
  }];
  const notes = new Map([['l1', 'harga:199000']]);
  const rev = computeRevenueDetailed(leads, members, orders, notes);
  // Should not double count - order gives amount
  assert.ok(rev.revenueRecorded <= 199000);
});

test('10. Existing workshop buyer merge dengan email lowercase', () => {
  const leads = [{
    id: 'l1',
    name: 'Zofi',
    email: 'Zofinofriandi23@gmail.com',
    whatsapp: null,
    status: 'bayar',
    source: 'checkout',
    current_stage: null,
    created_at: '2025-01-01',
  }];
  const members = [{
    id: 'm1',
    email: 'zofinofriandi23@gmail.com',
    status: 'paid',
    product: 'Workshop',
    tier: 'yearly',
    paid_until: '2026-01-01',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  }];
  const orders: any[] = [];
  const notes = new Map([['l1', 'harga:199000']]);
  const unified = buildUnifiedLeads(leads, members, orders, notes);
  assert.equal(unified[0].amount_paid, 199000);
});
