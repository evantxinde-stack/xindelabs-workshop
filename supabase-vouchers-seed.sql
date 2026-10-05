-- ============================================================
-- SEED VOUCHER — kode promo yang diiklankan di landing page
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- Aman dijalankan berulang (idempotent).
-- ============================================================
--
-- PENTING: kolom 'value' adalah BESAR DISKON, bukan harga akhir.
--   type = 'amount'  → harga final = harga paket - value
--   type = 'percent' → harga final = harga paket - (harga paket * value / 100)
--
-- Harga paket: Tahunan Rp 599.000 · Lifetime Rp 999.000
--
-- Kode di bawah dibuat supaya landing page (section "voucher")
-- dan tabel 'vouchers' konsisten. Tanpa baris ini, kode yang
-- tampil di landing akan ditolak checkout: "tidak ditemukan".

-- 1) Kolom tier — dipakai untuk membatasi voucher per paket.
--    (Tabel live belum punya kolom ini; leaflet voucher admin
--     sudah otomatis handle kolom yang belum ada.)
alter table public.vouchers add column if not exists tier text not null default 'all';

-- 2) Seed kode promo. Nilai 'value' = besar diskon.
insert into public.vouchers (code, type, value, tier, max_uses, used_count, active, expires_at) values
  ('EARLYBIRD',  'amount', 400000, 'yearly',   5, 0, true, null), -- Tahunan → Rp 199.000
  ('FASE01',     'amount', 300000, 'yearly',  10, 0, true, null), -- Tahunan → Rp 299.000
  ('FASE02',     'amount', 200000, 'yearly',  20, 0, true, null), -- Tahunan → Rp 399.000
  ('FASE03',     'amount', 100000, 'yearly',  30, 0, true, null), -- Tahunan → Rp 499.000
  ('LIFETIME50', 'amount', 400000, 'lifetime',  2, 0, true, null)  -- Lifetime → Rp 599.000
on conflict (code) do nothing;

-- 3) Sanity check — harusnya muncul 5 baris baru.
select code, type, value, tier, max_uses, used_count, active, expires_at
from public.vouchers
order by code;