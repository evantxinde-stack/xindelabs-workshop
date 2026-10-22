-- ============================================================
-- SEED TEMPLATE WHATSAPP - AMAN (never abort)
-- VERSI AMAN: semua statement dibungkus exception handler.
-- 1 statement gagal = hanya NOTICE, file LANJUT (tidak rollback).
-- Idempotent: aman dijalankan berulang kali.
-- Jalankan SETELAH sql/migrate_2026_admin.sql
-- ============================================================

do $b$ begin
  execute $q$
alter table if exists public.wa_templates add column if not exists key text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.wa_templates add column if not exists stage text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.wa_templates add column if not exists is_active boolean default true
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.wa_templates add column if not exists updated_at timestamptz default now()
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.wa_templates add column if not exists content text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
update public.wa_templates set key = lower(regexp_replace(coalesce(name,'template-'||id::text),'[^a-zA-Z0-9]+','_','g')) where key is null or key = ''
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
update public.wa_templates t set key = t.key || '_' || left(t.id::text,8) where t.key is not null and exists (select 1 from public.wa_templates u where u.key = t.key and u.id <> t.id)
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
create unique index if not exists wa_templates_key_key on public.wa_templates (key)
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
-- ============================================================
-- SEED TEMPLATE FOLLOW-UP WHATSAPP
-- Variabel: {{name}}, {{subdomain}}, {{payment_url}}
-- Aman dijalankan ulang (upsert by key)
-- ============================================================
do $b$ begin
  execute $q$
insert into public.wa_templates (key, name, stage, content, is_active)
values
(
'followup_opt_in',
'Opt-in · Belum Nonton',
'opt_in',
$$Halo {{name}}! 👋

Makasih udah ambil tutorial gratis di {{subdomain}}.

Udah sempat buka videonya belum? Di situ gue jelasin cara bikin agent AI yang bisa follow-up calon client otomatis — tanpa coding.

Kalau ada yang bikin bingung, balas chat ini aja ya. Gue bantu jawab. 😊$$,
true
),
(
'followup_watching',
'Nonton · Belum Selesai',
'watching_tutorial',
$$Halo {{name}}, gue lihat kamu udah mulai nonton tutorial di {{subdomain}} — mantap! 🔥

Sisa videonya cuma beberapa menit lagi, dan di bagian akhir ada contoh agent yang langsung bisa kamu pakai.

Kalau mau langsung praktik, aku bisa bantu arahin mulai dari mana. Mau?$$,
true
),
(
'followup_checkout',
'Checkout · Belum Bayar',
'checkout_initiated',
$$Halo {{name}}! 👋

Tadi kamu sempat buka halaman checkout di {{subdomain}}, tapi sepertinya belum selesai.

Kalau ada kendala pembayaran atau mau tanya dulu sebelum lanjut, tinggal balas chat ini ya.

Kalau mau lanjut, link pembayarannya masih aktif di sini:
{{payment_url}}$$,
true
),
(
'followup_unpaid',
'Invoice · Belum Dibayar',
'unpaid_invoice',
$$Halo {{name}}, pesanan kamu di {{subdomain}} sudah dibuat tapi pembayarannya belum selesai.

Supaya nggak kehilangan akses, kamu bisa selesaikan di link ini:
{{payment_url}}

Kalau link-nya sudah kedaluwarsa, bilang aja — nanti aku bikinin link baru. 🙌$$,
true
),
(
'followup_generic',
'Follow-up Umum',
'any',
$$Halo {{name}}! 👋

Sekadar follow-up dari Xinde Labs ({{subdomain}}). Ada yang bisa gue bantu soal AI agent buat sales kamu?

Kalau mau lihat detail paketnya, tinggal balas chat ini ya.$$,
true
)
on conflict (key) do update set
name = excluded.name,
stage = excluded.stage,
content = excluded.content,
is_active = excluded.is_active,
updated_at = now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 1, sqlerrm;
end $b$;

