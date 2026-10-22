-- ============================================================
-- MIGRASI MEMBER LAMA - AMAN (never abort)
-- VERSI AMAN: semua statement dibungkus exception handler.
-- 1 statement gagal = hanya NOTICE, file LANJUT (tidak rollback).
-- Idempotent: aman dijalankan berulang kali.
-- Jalankan SETELAH sql/migrate_2026_admin.sql
-- ============================================================

do $b$ begin
  execute $q$
create table if not exists public.affiliate_commissions (id uuid primary key default gen_random_uuid(), affiliate_code text not null, affiliate_email text default '', customer_email text default '', order_ref text default '', tier text default '', sale_amount numeric not null default 0, commission_amount numeric not null default 0, status text not null default 'pending', paid_at timestamptz, note text default '', created_at timestamptz default now(), updated_at timestamptz default now())
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
-- ============================================================
-- MIGRASI DATA AMAN UNTUK MEMBER LAMA
-- Jalankan setelah supabase_unified_schema.sql di DB yang SUDAH LIVE
-- Fokus: jaga data member aktif 100% aman, kompatibel skema baru
-- ============================================================
do $b$ begin
  execute $q$
-- 1) Pastikan kolom penting ada (double safety)
alter table public.members add column if not exists lms_password text
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 1, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.members add column if not exists product text default 'build-your-own-personalized-agent'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 2, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.members add column if not exists tier text default 'yearly'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 3, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.members add column if not exists paid_until date
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 4, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.members add column if not exists updated_at timestamptz default now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 5, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- 2) Normalisasi status & tier untuk data lama
update public.members
set status = lower(trim(status))
where status is not null and status <> lower(trim(status))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 6, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
update public.members
set tier = lower(trim(tier))
where tier is not null and tier <> lower(trim(tier))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 7, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
update public.members
set product = coalesce(nullif(trim(product), ''), 'build-your-own-personalized-agent')
where product is null or trim(product) = ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 8, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Set default untuk tier/status yang kosong/aneh
update public.members
set tier = 'yearly'
where tier is null or tier not in ('yearly', 'lifetime')
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 9, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
update public.members
set status = 'pending'
where status is null or status not in ('paid', 'pending', 'expired')
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 10, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- 3) Leads - pastikan kompatibel
alter table public.leads add column if not exists discord_id text
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 11, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists ref text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 12, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists current_stage text default 'new'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 13, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists notes text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 14, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists source text default 'landing-daftar'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 15, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists updated_at timestamptz default now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 16, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
update public.leads set current_stage = coalesce(nullif(trim(current_stage), ''), 'new') where current_stage is null or trim(current_stage) = ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 17, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
update public.leads set ref = coalesce(ref, '') where ref is null
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 18, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
update public.leads set source = coalesce(nullif(trim(source), ''), 'landing-daftar') where source is null or trim(source) = ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 19, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- 4) Modules - pastikan struktur kompatibel untuk LMS lama
alter table public.modules add column if not exists type text not null default 'video'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 20, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.modules add column if not exists content text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 21, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.modules add column if not exists level text default 'beginner'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 22, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.modules add column if not exists duration text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 23, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.modules add column if not exists video_id text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 24, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
update public.modules set type = coalesce(nullif(trim(type), ''), 'video') where type is null or trim(type) = ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 25, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
update public.modules set level = coalesce(nullif(trim(level), ''), 'beginner') where level is null or trim(level) = ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 26, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
update public.modules set video_id = coalesce(video_id, '') where video_id is null
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 27, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
update public.modules set content = coalesce(content, '') where content is null
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 28, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- 5) Pastikan index penting ada (tidak mengganggu tabel)
create index if not exists idx_members_email on public.members (email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 29, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_leads_email on public.leads (email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 30, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_affiliate_commissions_order_ref_key
on public.affiliate_commissions (order_ref)
where coalesce(order_ref, '') <> ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 31, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- 6) Verifikasi cepat (opsional - hanya untuk info)
-- SELECT count(*) as total_members, count(*) filter (where status='paid') as paid_members FROM public.members
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 32, sqlerrm;
end $b$;

