-- ============================================================
-- SUPABASE UNIFIED SCHEMA - VERSI AMAN (NEVER ABORT)
-- ============================================================
-- Setiap statement dibungkus DO-block dengan exception handler:
-- 1 statement gagal = hanya NOTICE, file LANJUT.
-- Wajib: Supabase SQL Editor membatalkan SELURUH file begitu
-- ada satu statement error (transaction rollback).
-- Idempotent: aman dijalankan berulang kali.
-- ============================================================

-- ============================================================
-- XINDELABS UNIFIED SCHEMA
-- Menggabungkan skema terbaik dari xindelabs.web.id + lms-xinde/workshop
-- File ini AMAN dijalankan ulang (idempotent)
-- ============================================================
do $b$ begin
  execute $q$
-- Extensions
create extension if not exists pgcrypto
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 1, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 1. CORE TABLES
-- ============================================================

-- Members (course/LMS members)
create table if not exists public.members (
id uuid primary key default gen_random_uuid(),
email text not null unique,
status text not null default 'pending',  -- 'paid' | 'pending' | 'expired'
product text default 'build-your-own-personalized-agent',
tier text default 'yearly',              -- 'yearly' | 'lifetime'
paid_until date,
lms_password text,
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 2, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Admins
create table if not exists public.admins (
id uuid primary key default gen_random_uuid(),
email text not null unique,
role text default 'admin',
created_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 3, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Admin profiles (for auth.users linked admins)
create table if not exists public.admin_profiles (
id uuid primary key references auth.users(id) on delete cascade,
email text not null,
role text not null default 'admin',
created_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 4, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Site content (CMS key-value)
create table if not exists public.site_content (
id uuid primary key default gen_random_uuid(),
key text not null unique,
value jsonb not null default '{}'::jsonb,
updated_at timestamptz default now(),
updated_by text
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 5, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Leads (funnel/leads)
create table if not exists public.leads (
id uuid primary key default gen_random_uuid(),
name text not null,
email text,
whatsapp text,
discord_id text,
status text not null default 'belum',   -- 'belum' | 'follow_up' | 'bayar' | free_tutorial | fast_track_paid | vip_paid | joined_group
notes text default '',
source text default 'landing-daftar',
ref text default '',
current_stage text not null default 'new',
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 6, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Make email unique if possible for leads (may have existing data)
do $$
begin
if not exists (select 1 from pg_constraint where conname = 'leads_email_key') then
begin
alter table public.leads add constraint leads_email_key unique (email);
exception when others then
null;
end;
end if;
end $$
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 7, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Orders (checkout/funnel)
create table if not exists public.orders (
id uuid primary key default gen_random_uuid(),
lead_id uuid references public.leads(id) on delete cascade,
product text not null,
tier text,
voucher_code text,
amount numeric(12,2) not null default 0,
mayar_invoice_id text,
mayar_transaction_id text,
status text not null default 'pending'
check (status in ('pending','paid','closed','expired')),
created_at timestamptz not null default now(),
paid_at timestamptz
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 8, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Pipeline events
create table if not exists public.pipeline_events (
id uuid primary key default gen_random_uuid(),
lead_id uuid references public.leads(id) on delete cascade,
event_type text not null,
meta jsonb not null default '{}'::jsonb,
created_at timestamptz not null default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 9, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Notes
create table if not exists public.notes (
id uuid primary key default gen_random_uuid(),
lead_id uuid references public.leads(id) on delete cascade,
author text not null default 'admin',
body text not null,
created_at timestamptz not null default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 10, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Modules (LMS)
create table if not exists public.modules (
id uuid primary key default gen_random_uuid(),
sort integer not null default 0,
level text not null default 'beginner',
title text not null,
type text not null default 'video',     -- 'video' | 'text'
duration text default '',
video_id text default '',
content text default '',
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 11, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Member progress
create table if not exists public.member_progress (
id uuid primary key default gen_random_uuid(),
email text not null,
module_id text not null,
status text not null default 'not_started', -- 'not_started' | 'in_progress' | 'completed'
completed_at timestamptz,
created_at timestamptz default now(),
updated_at timestamptz default now(),
unique (email, module_id)
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 12, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Vouchers
create table if not exists public.vouchers (
id uuid primary key default gen_random_uuid(),
code text not null unique,
type text not null default 'percent',       -- 'percent' | 'amount'
value numeric not null default 0,
tier text not null default 'all',
max_uses integer,
used_count integer not null default 0,
active boolean not null default true,
expires_at timestamptz,
created_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 13, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Affiliates
create table if not exists public.affiliates (
id uuid primary key default gen_random_uuid(),
email text not null unique,
code text not null unique,
status text not null default 'active',
commission_type text not null default 'percent',
commission_value numeric not null default 20,
clicks integer not null default 0,
note text default '',
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 14, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Affiliate commissions
create table if not exists public.affiliate_commissions (
id uuid primary key default gen_random_uuid(),
affiliate_code text not null,
affiliate_email text default '',
customer_email text default '',
order_ref text default '',
tier text default '',
sale_amount numeric not null default 0,
commission_amount numeric not null default 0,
status text not null default 'pending',   -- 'pending' | 'paid' | 'void'
paid_at timestamptz,
note text default '',
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 15, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Email system
create table if not exists public.email_sequences (
id uuid primary key default gen_random_uuid(),
key text not null unique,
name text not null,
created_at timestamptz not null default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 16, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create table if not exists public.email_templates (
id uuid primary key default gen_random_uuid(),
key text not null unique,
subject text not null,
html_body text not null,
created_at timestamptz not null default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 17, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create table if not exists public.email_steps (
id uuid primary key default gen_random_uuid(),
sequence_id uuid not null references public.email_sequences(id) on delete cascade,
step integer not null,
day_offset integer not null default 0,
template_id uuid not null references public.email_templates(id) on delete cascade,
unique (sequence_id, step)
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 18, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create table if not exists public.email_enrollments (
id uuid primary key default gen_random_uuid(),
lead_id uuid references public.leads(id) on delete cascade,
sequence_id uuid references public.email_sequences(id) on delete cascade,
current_step integer not null default 0,
enrolled_at timestamptz not null default now(),
unique (lead_id, sequence_id)
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 19, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create table if not exists public.email_queue (
id uuid primary key default gen_random_uuid(),
lead_id uuid references public.leads(id) on delete cascade,
sequence_id uuid references public.email_sequences(id) on delete set null,
template_id uuid references public.email_templates(id),
step integer,
scheduled_for timestamptz not null default now(),
status text not null default 'pending'
check (status in ('pending','processing','sent','failed','skipped')),
attempts integer not null default 0,
error text,
created_at timestamptz not null default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 20, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create table if not exists public.email_logs (
id uuid primary key default gen_random_uuid(),
lead_id uuid references public.leads(id) on delete cascade,
queue_id uuid references public.email_queue(id) on delete set null,
resend_id text,
status text not null,
sent_at timestamptz,
opened_at timestamptz,
clicked_at timestamptz,
created_at timestamptz not null default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 21, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create table if not exists public.unsubscribes (
id uuid primary key default gen_random_uuid(),
email text not null unique,
created_at timestamptz not null default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 22, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- WA templates
create table if not exists public.wa_templates (
id uuid primary key default gen_random_uuid(),
name text not null,
content text not null,
created_at timestamptz not null default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 23, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Page blocks (for dynamic landing pages)
create table if not exists public.page_blocks (
id uuid primary key default gen_random_uuid(),
page text not null,
sort_order integer not null default 0,
block_type text not null,
props jsonb not null default '{}'::jsonb,
created_at timestamptz not null default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 24, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Settings/pixels
create table if not exists public.settings (
key text primary key,
value jsonb not null default '{}'::jsonb,
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 25, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 2. ADD MISSING COLUMNS (SAFE MIGRATION)
-- ============================================================

alter table public.members add column if not exists lms_password text
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 26, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.members add column if not exists product text default 'build-your-own-personalized-agent'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 27, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.members add column if not exists tier text default 'yearly'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 28, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.members add column if not exists paid_until date
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 29, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists discord_id text
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 30, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists ref text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 31, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists current_stage text default 'new'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 32, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists notes text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 33, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists source text default 'landing-daftar'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 34, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists updated_at timestamptz default now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 35, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.modules add column if not exists type text not null default 'video'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 36, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.modules add column if not exists content text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 37, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.modules add column if not exists level text default 'beginner'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 38, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.modules add column if not exists duration text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 39, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.modules add column if not exists video_id text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 40, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.orders add column if not exists tier text
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 41, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.orders add column if not exists voucher_code text
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 42, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.admins add column if not exists role text default 'admin'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 43, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 3. INDEXES
-- ============================================================

create index if not exists idx_members_email on public.members (email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 44, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_admins_email on public.admins (email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 45, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_content_key on public.site_content (key)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 46, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_leads_status on public.leads (status)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 47, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_leads_email on public.leads (email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 48, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_leads_created on public.leads (created_at desc)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 49, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_modules_sort on public.modules (sort)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 50, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_member_progress_email on public.member_progress (email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 51, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_affiliates_email on public.affiliates (email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 52, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_affiliates_code on public.affiliates (code)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 53, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_affiliate_commissions_code on public.affiliate_commissions (affiliate_code)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 54, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_affiliate_commissions_email on public.affiliate_commissions (affiliate_email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 55, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create unique index if not exists affiliate_commissions_order_ref_key
on public.affiliate_commissions (order_ref)
where coalesce(order_ref, '') <> ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 56, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_page_blocks_page_order on public.page_blocks(page, sort_order)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 57, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_email_queue_due on public.email_queue(status, scheduled_for)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 58, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_email_enrollments_lead on public.email_enrollments(lead_id)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 59, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
new.updated_at = now();
return new;
end;
$$ language plpgsql
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 60, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
select exists (
select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
or exists (
select 1 from public.admin_profiles where id = auth.uid()
);
$$
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 61, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_members_updated on public.members
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 62, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_members_updated before update on public.members for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 63, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_content_updated on public.site_content
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 64, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_content_updated before update on public.site_content for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 65, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_leads_updated on public.leads
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 66, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_leads_updated before update on public.leads for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 67, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_modules_updated on public.modules
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 68, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_modules_updated before update on public.modules for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 69, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_member_progress_updated on public.member_progress
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 70, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_member_progress_updated before update on public.member_progress for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 71, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_vouchers_updated on public.vouchers
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 72, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_vouchers_updated before update on public.vouchers for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 73, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_affiliates_updated on public.affiliates
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 74, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_affiliates_updated before update on public.affiliates for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 75, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_affiliate_commissions_updated on public.affiliate_commissions
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 76, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_affiliate_commissions_updated before update on public.affiliate_commissions for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 77, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists set_leads_updated_at on public.leads
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 78, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger set_leads_updated_at before update on public.leads for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 79, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Affiliate functions
create or replace function public.affiliate_track_click(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
if coalesce(p_code, '') = '' then return; end if;
update public.affiliates
set clicks = clicks + 1
where upper(code) = upper(p_code)
and status = 'active';
end;
$$
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 80, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create or replace function public.affiliate_self_enroll()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
v_email text;
v_paid boolean;
v_row public.affiliates;
v_local text;
v_code text;
v_try integer := 0;
begin
v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
if v_email = '' then
raise exception 'Harus login dulu buat jadi affiliate';
end if;

select true into v_paid from public.members
where lower(email) = v_email and status = 'paid'
limit 1;
if v_paid is distinct from true then
raise exception 'Cuma member berbayar yang bisa jadi affiliate';
end if;

select * into v_row from public.affiliates where lower(email) = v_email limit 1;
if found then
if v_row.status = 'disabled' then
raise exception 'Affiliate akun lo lagi dinonaktifkan admin';
end if;
return jsonb_build_object('ok', true, 'created', false,
'code', v_row.code, 'status', v_row.status,
'commission_type', v_row.commission_type, 'commission_value', v_row.commission_value);
end if;

v_local := regexp_replace(split_part(v_email, '@', 1), '[^a-z0-9]', '', 'g');
if length(v_local) < 3 then v_local := 'member'; end if;

loop
v_try := v_try + 1;
v_code := upper(left(v_local, 6)) || lpad(floor(random() * 10000)::text, 4, '0');
exit when not exists (select 1 from public.affiliates where code = v_code);
if v_try > 20 then v_code := 'AFF' || upper(substr(md5(random()::text), 1, 7)); exit; end if;
end loop;

insert into public.affiliates (email, code)
values (v_email, v_code)
returning * into v_row;

return jsonb_build_object('ok', true, 'created', true,
'code', v_row.code, 'status', v_row.status,
'commission_type', v_row.commission_type, 'commission_value', v_row.commission_value);
end;
$$
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 81, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create or replace function public.record_affiliate_commission(
p_email text, p_reference text, p_tier text, p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
v_code text;
v_aff public.affiliates;
v_commission numeric;
v_ref text;
begin
if coalesce(trim(p_email), '') = '' then
return jsonb_build_object('ok', false, 'reason', 'no_email');
end if;

select ref into v_code
from public.leads
where lower(email) = lower(trim(p_email))
and coalesce(ref, '') <> ''
order by created_at desc
limit 1;

if coalesce(v_code, '') = '' then
return jsonb_build_object('ok', false, 'reason', 'no_ref');
end if;

select * into v_aff from public.affiliates where upper(code) = upper(trim(v_code)) limit 1;
if not found then
return jsonb_build_object('ok', false, 'reason', 'affiliate_not_found', 'code', v_code);
end if;
if v_aff.status <> 'active' then
return jsonb_build_object('ok', false, 'reason', 'affiliate_disabled', 'code', v_code);
end if;

if v_aff.commission_type = 'amount' then
v_commission := least(greatest(v_aff.commission_value, 0), greatest(coalesce(p_amount, 0), 0));
else
v_commission := round(greatest(coalesce(p_amount, 0), 0) * greatest(v_aff.commission_value, 0) / 100.0, 0);
end if;

v_ref := trim(coalesce(p_reference, ''));
if v_ref = '' then
v_ref := lower(trim(p_email)) || ':' || coalesce(p_tier, '') || ':' ||
coalesce(p_amount, 0)::text || ':' || to_char(now(), 'YYYYMMDD');
end if;

insert into public.affiliate_commissions
(affiliate_code, affiliate_email, customer_email, order_ref, tier, sale_amount, commission_amount, status)
values
(upper(v_aff.code), lower(v_aff.email), lower(trim(p_email)), v_ref,
coalesce(p_tier, ''), greatest(coalesce(p_amount, 0), 0), v_commission, 'pending')
on conflict do nothing;

if not found then
return jsonb_build_object('ok', false, 'reason', 'duplicate', 'ref', v_ref);
end if;

return jsonb_build_object('ok', true, 'code', upper(v_aff.code), 'commission', v_commission);
end;
$$
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 82, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Email enrollment function
create or replace function public.enroll_lead_sequence(p_lead_id uuid, p_sequence_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
v_seq public.email_sequences%rowtype;
v_step record;
v_tpl public.email_templates%rowtype;
v_enrolled timestamptz := now();
begin
select * into v_seq from public.email_sequences where key = p_sequence_key;
if not found then
return;
end if;

insert into public.email_enrollments (lead_id, sequence_id, enrolled_at)
values (p_lead_id, v_seq.id, v_enrolled)
on conflict (lead_id, sequence_id) do nothing;

for v_step in
select es.step, es.day_offset, es.template_id
from public.email_steps es
where es.sequence_id = v_seq.id
order by es.step
loop
delete from public.email_queue
where lead_id = p_lead_id and sequence_id = v_seq.id and step = v_step.step;

select * into v_tpl from public.email_templates where id = v_step.template_id;
if found then
insert into public.email_queue (
lead_id, sequence_id, template_id, step, scheduled_for
) values (
p_lead_id, v_seq.id, v_step.template_id, v_step.step,
v_enrolled + make_interval(days => v_step.day_offset)
);
end if;
end loop;
end;
$$
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 83, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create or replace function public.on_lead_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
begin
perform public.enroll_lead_sequence(new.id, 'free_vip_upsell');
exception when others then
null;
end;
return new;
end;
$$
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 84, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_on_lead_created on public.leads
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 85, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_on_lead_created after insert on public.leads
for each row execute function public.on_lead_created()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 86, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Function permissions
revoke all on function public.affiliate_track_click(text) from public
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 87, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
grant execute on function public.affiliate_track_click(text) to anon, authenticated
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 88, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
revoke all on function public.affiliate_self_enroll() from public
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 89, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
grant execute on function public.affiliate_self_enroll() to authenticated
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 90, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
revoke all on function public.record_affiliate_commission(text, text, text, numeric) from public
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 91, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
revoke all on function public.record_affiliate_commission(text, text, text, numeric) from anon
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 92, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
revoke all on function public.record_affiliate_commission(text, text, text, numeric) from authenticated
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 93, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
grant execute on function public.record_affiliate_commission(text, text, text, numeric) to service_role
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 94, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
grant execute on function public.is_admin() to authenticated
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 95, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
grant execute on function public.enroll_lead_sequence(uuid, text) to service_role
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 96, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.members enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 97, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.admins enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 98, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.admin_profiles enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 99, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.site_content enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 100, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 101, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.orders enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 102, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.pipeline_events enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 103, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.notes enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 104, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.modules enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 105, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.member_progress enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 106, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.vouchers enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 107, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.affiliates enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 108, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.affiliate_commissions enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 109, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.email_sequences enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 110, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.email_templates enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 111, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.email_steps enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 112, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.email_enrollments enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 113, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.email_queue enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 114, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.email_logs enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 115, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.unsubscribes enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 116, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.wa_templates enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 117, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.page_blocks enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 118, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.settings enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 119, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- members
drop policy if exists "members read own" on public.members
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 120, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "members read own" on public.members for select using (auth.jwt() ->> 'email' = email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 121, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "members read admin" on public.members
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 122, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "members read admin" on public.members for select using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 123, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "service insert members" on public.members
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 124, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "service insert members" on public.members for insert with check (auth.role() = 'service_role')
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 125, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "service update members" on public.members
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 126, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "service update members" on public.members for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role')
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 127, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- admins
drop policy if exists "admins read self" on public.admins
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 128, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "admins read self" on public.admins for select using (lower(auth.jwt() ->> 'email') = lower(email))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 129, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "admins all admin" on public.admins
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 130, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "admins all admin" on public.admins for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 131, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "admin_profiles all" on public.admin_profiles
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 132, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "admin_profiles all" on public.admin_profiles for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 133, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- site_content
drop policy if exists "content read all" on public.site_content
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 134, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "content read all" on public.site_content for select using (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 135, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "content admin all" on public.site_content
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 136, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "content admin all" on public.site_content for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 137, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- leads
drop policy if exists "leads insert anon" on public.leads
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 138, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "leads insert anon" on public.leads for insert with check (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 139, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "anon read leads" on public.leads
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 140, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "anon read leads" on public.leads for select using (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 141, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "leads read admin" on public.leads
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 142, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "leads read admin" on public.leads for select using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 143, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "leads update admin" on public.leads
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 144, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "leads update admin" on public.leads for update using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 145, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "leads delete admin" on public.leads
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 146, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "leads delete admin" on public.leads for delete using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 147, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "leads admin all" on public.leads
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 148, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "leads admin all" on public.leads for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 149, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- orders, pipeline_events, notes
drop policy if exists "orders admin all" on public.orders
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 150, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "orders admin all" on public.orders for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 151, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "pipeline_events insert anon" on public.pipeline_events
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 152, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "pipeline_events insert anon" on public.pipeline_events for insert with check (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 153, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "pipeline_events admin all" on public.pipeline_events
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 154, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "pipeline_events admin all" on public.pipeline_events for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 155, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "notes admin all" on public.notes
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 156, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "notes admin all" on public.notes for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 157, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- modules
drop policy if exists "modules read all" on public.modules
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 158, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "modules read member/admin" on public.modules
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 159, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "modules read member/admin" on public.modules for select
using (
public.is_admin()
or (
auth.role() = 'authenticated'
and exists (
select 1 from public.members m
where lower(m.email) = lower(auth.jwt() ->> 'email')
and m.status = 'paid'
)
)
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 160, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "modules write admin" on public.modules
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 161, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "modules write admin" on public.modules for insert with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 162, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "modules update admin" on public.modules
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 163, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "modules update admin" on public.modules for update using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 164, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "modules delete admin" on public.modules
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 165, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "modules delete admin" on public.modules for delete using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 166, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- member_progress
drop policy if exists "member_progress read own" on public.member_progress
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 167, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "member_progress read own" on public.member_progress for select using (lower(auth.jwt() ->> 'email') = lower(email))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 168, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "member_progress insert own" on public.member_progress
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 169, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "member_progress insert own" on public.member_progress for insert with check (lower(auth.jwt() ->> 'email') = lower(email))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 170, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "member_progress update own" on public.member_progress
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 171, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "member_progress update own" on public.member_progress for update using (lower(auth.jwt() ->> 'email') = lower(email)) with check (lower(auth.jwt() ->> 'email') = lower(email))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 172, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- vouchers
drop policy if exists "vouchers read all" on public.vouchers
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 173, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vouchers read all" on public.vouchers for select using (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 174, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vouchers write admin" on public.vouchers
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 175, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vouchers write admin" on public.vouchers for insert with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 176, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vouchers update admin" on public.vouchers
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 177, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vouchers update admin" on public.vouchers for update using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 178, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vouchers delete admin" on public.vouchers
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 179, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vouchers delete admin" on public.vouchers for delete using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 180, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- affiliates
drop policy if exists "affiliates read own" on public.affiliates
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 181, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "affiliates read own" on public.affiliates for select using (lower(auth.jwt() ->> 'email') = lower(email))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 182, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "affiliates read admin" on public.affiliates
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 183, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "affiliates read admin" on public.affiliates for select using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 184, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "affiliates write admin" on public.affiliates
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 185, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "affiliates write admin" on public.affiliates for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 186, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- affiliate_commissions
drop policy if exists "affiliate_commissions read own" on public.affiliate_commissions
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 187, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "affiliate_commissions read own" on public.affiliate_commissions for select using (lower(auth.jwt() ->> 'email') = lower(affiliate_email))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 188, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "affiliate_commissions read admin" on public.affiliate_commissions
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 189, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "affiliate_commissions read admin" on public.affiliate_commissions for select using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 190, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "affiliate_commissions write admin" on public.affiliate_commissions
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 191, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "affiliate_commissions write admin" on public.affiliate_commissions for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 192, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- email system
drop policy if exists "email_sequences admin all" on public.email_sequences
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 193, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "email_sequences admin all" on public.email_sequences for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 194, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "email_templates admin all" on public.email_templates
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 195, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "email_templates admin all" on public.email_templates for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 196, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "email_steps admin all" on public.email_steps
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 197, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "email_steps admin all" on public.email_steps for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 198, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "email_enrollments admin all" on public.email_enrollments
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 199, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "email_enrollments admin all" on public.email_enrollments for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 200, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "email_queue admin all" on public.email_queue
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 201, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "email_queue admin all" on public.email_queue for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 202, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "email_logs admin all" on public.email_logs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 203, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "email_logs admin all" on public.email_logs for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 204, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- misc
drop policy if exists "unsubscribes insert anon" on public.unsubscribes
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 205, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "unsubscribes insert anon" on public.unsubscribes for insert with check (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 206, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "unsubscribes admin all" on public.unsubscribes
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 207, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "unsubscribes admin all" on public.unsubscribes for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 208, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "wa_templates admin all" on public.wa_templates
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 209, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "wa_templates admin all" on public.wa_templates for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 210, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "page_blocks all" on public.page_blocks
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 211, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "page_blocks read all" on public.page_blocks for select using (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 212, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "page_blocks admin all" on public.page_blocks
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 213, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "page_blocks admin all" on public.page_blocks for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 214, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "settings read all" on public.settings
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 215, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "settings read all" on public.settings for select using (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 216, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "settings admin all" on public.settings
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 217, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "settings admin all" on public.settings for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 218, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 6. STORAGE
-- ============================================================

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do update set public = true
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 219, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "banners read public" on storage.objects
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 220, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "banners all auth" on storage.objects
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 221, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "banners read public" on storage.objects for select using (bucket_id = 'banners')
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 222, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "banners all auth" on storage.objects for all
using (bucket_id = 'banners' and auth.role() = 'authenticated')
with check (bucket_id = 'banners' and auth.role() = 'authenticated')
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 223, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 7. SEED DATA (SAFE)
-- ============================================================

insert into public.admins (email, role) values ('evant.xinde@gmail.com', 'admin')
on conflict (email) do nothing
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 224, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
insert into public.site_content (key, value) values
('course_status', '{"open": true}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = 'seed'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 225, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
insert into public.site_content (key, value) values
('homepage', '{
"hero_title": "Bangun Karyawan Super Pintar — <span class=''hl''>Bantu semua kerjaan lo 24/7 No Baper</span>",
"hero_subtitle": "Bukan cuma ChatGPT. Lo bakal punya agent yang follow-up calon client otomatis, riset prospek dalam 30 detik, bikin 10 caption promosi dalam 1 menit, dan jawab objeksi \u201cmahal\u201d, \u201cnanti dulu\u201d, \u201cpikir-pikir\u201d. <b>Tanpa coding.</b>",
"video_youtube_id": "M7lc1UVf-VE",
"video_caption": "intro.mp4 \u2014 kenapa sales person butuh AI agent sendiri (2:45)",
"price_yearly": 599000,
"price_lifetime": 999000,
"discord_link": "https://discord.gg/JXZWZZRsre",
"whatsapp_link": "https://wa.me/6281234567890",
"instagram_handle": "@xindelabs.id",
"testimonials": [
{"quote": "Follow-up WA 40 calon client yang tadinya makan seharian, sekarang cuma 5 menit. Agent yang jawab, saya yang closing.", "name": "Rudi, Agen Properti Surabaya"},
{"quote": "Saya orang marketing, bukan IT. Setup agent pertama saya selesai 1 malam sambil nonton video modul. Beneran no-coding.", "name": "Maya, Freelance Sales"},
{"quote": "Objeksi \u201cnanti dulu\u201d itu yang paling sering. Sekarang agent saya yang handle, jawabannya konsisten dan ga ngecewain prospek.", "name": "Andi, Agen Asuransi Jakarta"}
],
"faqs": [
{"q": "Saya belum pernah ngoding. Bisa ikut?", "a": "Bisa. Course ini memang dibuat untuk sales person non-teknis. Semua pakai tools no-code (ChatGPT/Claude, Google Sheets, WhatsApp, n8n) yang tinggal disetel lewat panduan langkah demi langkah."},
{"q": "Apa bedanya dengan ChatGPT biasa?", "a": "ChatGPT cuma bisa dipakai kalau lo buka chat-nya. Agent yang lo bangun di course ini jalan terus tanpa lo ketik ulang: follow-up otomatis, riset calon client, sampai laporan closing \u2014 24 jam, tanpa capek."},
{"q": "Ini khusus untuk sales tertentu?", "a": "Utamanya agen asuransi, agen properti, dan freelancer, tapi framework-nya dipakai semua jenis sales: kursus, b2b, jasa, sampai reseller."},
{"q": "Paket Tahunan vs Lifetime bedanya apa?", "a": "Tahunan Rp 599.000: akses semua konten 1 tahun. Lifetime Rp 999.000: bayar sekali, akses selamanya + dapat update use-case baru tanpa biaya tambahan."},
{"q": "Kalau saya tidak puas, ada refund?", "a": "Ada garansi uang kembali 7 hari. Kalau masih belum yakin course ini cocok dalam 7 hari pertama, kirim bukti ke WhatsApp kami dan kami refund penuh tanpa drama."},
{"q": "Bagaimana cara bayarnya?", "a": "Bayar via Mayar (transfer bank, QRIS, atau e-wallet). Setelah pembayaran, link course + invite Discord dikirim otomatis ke email lo. Cek juga folder spam."},
{"q": "Berapa lama saya butuh setiap hari?", "a": "Cukup 30\u201345 menit per hari selama 1\u20132 minggu. Tiap modul maksimal 30 menit, dan bisa diulang kapan saja."},
{"q": "Apakah ada komunitasnya?", "a": "Ada. Setiap member masuk Discord Xinde Labs \u2014 tempat tanya-jawab, sharing prompt, dan sesi use-case update bareng member lain."}
]
}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = 'seed'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 226, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 8. BLOG, PROGRAMS, PORTFOLIO, PARTNERSHIP (UNIFIED)
-- ============================================================

-- Blog posts for Hermes Agent
create table if not exists public.blog_posts (
id uuid primary key default gen_random_uuid(),
slug text not null unique,
title text not null,
excerpt text,
content text,
cover_image text,
author text default 'Xinde Labs',
tags text[] default '{}',
status text not null default 'draft', -- 'draft' | 'published'
published_at timestamptz,
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 227, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Programs/Catalog
create table if not exists public.programs (
id uuid primary key default gen_random_uuid(),
slug text not null unique,
title text not null,
description text,
cover_image text,
price numeric,
type text default 'course', -- 'course' | 'workshop' | '1on1' | 'bundle'
features jsonb default '[]'::jsonb,
status text not null default 'active', -- 'active' | 'inactive'
sort_order integer default 0,
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 228, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Portfolio
create table if not exists public.portfolio (
id uuid primary key default gen_random_uuid(),
title text not null,
slug text unique,
description text,
image_url text,
category text,
link_url text,
sort_order integer default 0,
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 229, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Partnership inquiries
create table if not exists public.partnership_inquiries (
id uuid primary key default gen_random_uuid(),
name text not null,
email text not null,
company text,
whatsapp text,
service_type text,
message text,
status text not null default 'new', -- 'new' | 'contacted' | 'done' | 'spam'
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 230, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Indexes
create index if not exists idx_blog_posts_slug on public.blog_posts (slug)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 231, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_blog_posts_status on public.blog_posts (status)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 232, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_blog_posts_published on public.blog_posts (published_at desc)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 233, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_programs_slug on public.programs (slug)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 234, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_programs_status on public.programs (status)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 235, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_portfolio_sort on public.portfolio (sort_order)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 236, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_partnership_status on public.partnership_inquiries (status)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 237, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Triggers
drop trigger if exists trg_blog_posts_updated on public.blog_posts
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 238, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_blog_posts_updated before update on public.blog_posts for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 239, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_programs_updated on public.programs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 240, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_programs_updated before update on public.programs for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 241, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_portfolio_updated on public.portfolio
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 242, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_portfolio_updated before update on public.portfolio for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 243, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_partnership_updated on public.partnership_inquiries
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 244, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_partnership_updated before update on public.partnership_inquiries for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 245, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- RLS
alter table public.blog_posts enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 246, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.programs enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 247, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.portfolio enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 248, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.partnership_inquiries enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 249, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "blog_posts read published" on public.blog_posts
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 250, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "blog_posts read published" on public.blog_posts for select using (status = 'published' or public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 251, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "blog_posts admin all" on public.blog_posts
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 252, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "blog_posts admin all" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 253, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "programs read active" on public.programs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 254, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "programs read active" on public.programs for select using (status = 'active' or public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 255, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "programs admin all" on public.programs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 256, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "programs admin all" on public.programs for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 257, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "portfolio read all" on public.portfolio
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 258, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "portfolio read all" on public.portfolio for select using (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 259, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "portfolio admin all" on public.portfolio
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 260, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "portfolio admin all" on public.portfolio for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 261, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "partnership insert anon" on public.partnership_inquiries
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 262, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "partnership insert anon" on public.partnership_inquiries for insert with check (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 263, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "partnership admin all" on public.partnership_inquiries
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 264, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "partnership admin all" on public.partnership_inquiries for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 265, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 9. VIP 1-ON-1, LESSON PROGRESS, CERTIFICATES, KATALOG KELAS
-- ============================================================

-- Extend members
alter table public.members add column if not exists is_vip boolean default false
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 266, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.members add column if not exists vip_expires_at timestamptz
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 267, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.members add column if not exists owned_classes text[] default '{}'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 268, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Kelas/Kursus
create table if not exists public.classes (
id uuid primary key default gen_random_uuid(),
slug text not null unique,
title text not null,
description text,
cover_image text,
price numeric default 0,
member_discount_price numeric default 0,
is_published boolean default true,
sort_order integer default 0,
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 269, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Pelajaran dalam kelas
create table if not exists public.lessons (
id uuid primary key default gen_random_uuid(),
class_id uuid references public.classes(id) on delete cascade,
module_id text,
sort_order integer not null default 0,
title text not null,
type text default 'video', -- 'video' | 'text' | 'pdf'
video_id text,
content text,
duration text,
required boolean default true,
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 270, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Progress per lesson
create table if not exists public.lesson_progress (
id uuid primary key default gen_random_uuid(),
email text not null,
lesson_id uuid references public.lessons(id) on delete cascade,
class_id uuid references public.classes(id) on delete cascade,
completed boolean default false,
completed_at timestamptz,
created_at timestamptz default now(),
updated_at timestamptz default now(),
unique (email, lesson_id)
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 271, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Sertifikat
create table if not exists public.certificates (
id uuid primary key default gen_random_uuid(),
email text not null,
class_id uuid references public.classes(id) on delete cascade,
certificate_number text not null unique,
issued_at timestamptz default now(),
created_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 272, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- VIP Settings
create table if not exists public.vip_settings (
id uuid primary key default gen_random_uuid(),
monthly_max_slots integer default 5,
filled_slots integer default 0,
price numeric default 0,
description text,
benefits jsonb default '[]'::jsonb,
is_active boolean default true,
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 273, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- VIP Booking
create table if not exists public.vip_bookings (
id uuid primary key default gen_random_uuid(),
email text not null,
member_name text,
preferred_date date,
preferred_time text,
topic text,
status text default 'pending', -- 'pending' | 'confirmed' | 'done' | 'cancelled'
notes text,
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 274, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- VIP Project Submission
create table if not exists public.vip_projects (
id uuid primary key default gen_random_uuid(),
email text not null,
title text,
description text,
file_url text,
status text default 'submitted', -- 'submitted' | 'reviewing' | 'feedback' | 'approved'
feedback text,
reviewed_at timestamptz,
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 275, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Progress Tracker VIP
create table if not exists public.vip_progress_tracker (
id uuid primary key default gen_random_uuid(),
email text not null unique,
milestone jsonb default '[]'::jsonb,
notes text,
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 276, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Indexes
create index if not exists idx_classes_slug on public.classes (slug)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 277, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_lessons_class on public.lessons (class_id)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 278, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_lesson_progress_email on public.lesson_progress (email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 279, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_certificates_email on public.certificates (email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 280, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_vip_bookings_email on public.vip_bookings (email)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 281, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Triggers
drop trigger if exists trg_classes_updated on public.classes
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 282, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_classes_updated before update on public.classes for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 283, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_lessons_updated on public.lessons
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 284, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_lessons_updated before update on public.lessons for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 285, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_lesson_progress_updated on public.lesson_progress
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 286, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_lesson_progress_updated before update on public.lesson_progress for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 287, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_vip_bookings_updated on public.vip_bookings
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 288, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_vip_bookings_updated before update on public.vip_bookings for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 289, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_vip_projects_updated on public.vip_projects
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 290, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_vip_projects_updated before update on public.vip_projects for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 291, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_vip_settings_updated on public.vip_settings
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 292, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_vip_settings_updated before update on public.vip_settings for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 293, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- RLS
alter table public.classes enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 294, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.lessons enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 295, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.lesson_progress enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 296, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.certificates enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 297, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.vip_settings enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 298, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.vip_bookings enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 299, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.vip_projects enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 300, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.vip_progress_tracker enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 301, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "classes read published" on public.classes
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 302, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "classes read published" on public.classes for select using (is_published = true or public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 303, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "classes admin all" on public.classes
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 304, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "classes admin all" on public.classes for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 305, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "lessons read" on public.lessons
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 306, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "lessons read" on public.lessons for select using (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 307, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "lessons admin all" on public.lessons
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 308, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "lessons admin all" on public.lessons for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 309, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "lesson_progress own" on public.lesson_progress
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 310, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "lesson_progress own" on public.lesson_progress for all using (lower(email)=lower(coalesce(auth.jwt()->>'email',''))) with check (lower(email)=lower(coalesce(auth.jwt()->>'email','')))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 311, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "lesson_progress admin" on public.lesson_progress
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 312, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "lesson_progress admin" on public.lesson_progress for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 313, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "certificates read own" on public.certificates
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 314, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "certificates read own" on public.certificates for select using (lower(email)=lower(coalesce(auth.jwt()->>'email','')))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 315, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "certificates admin all" on public.certificates
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 316, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "certificates admin all" on public.certificates for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 317, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vip_settings read all" on public.vip_settings
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 318, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vip_settings read all" on public.vip_settings for select using (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 319, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vip_settings admin all" on public.vip_settings
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 320, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vip_settings admin all" on public.vip_settings for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 321, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vip_bookings own" on public.vip_bookings
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 322, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vip_bookings own" on public.vip_bookings for all using (lower(email)=lower(coalesce(auth.jwt()->>'email',''))) with check (lower(email)=lower(coalesce(auth.jwt()->>'email','')))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 323, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vip_bookings admin" on public.vip_bookings
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 324, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vip_bookings admin" on public.vip_bookings for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 325, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vip_projects own" on public.vip_projects
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 326, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vip_projects own" on public.vip_projects for all using (lower(email)=lower(coalesce(auth.jwt()->>'email',''))) with check (lower(email)=lower(coalesce(auth.jwt()->>'email','')))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 327, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vip_projects admin" on public.vip_projects
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 328, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vip_projects admin" on public.vip_projects for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 329, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vip_tracker own" on public.vip_progress_tracker
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 330, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vip_tracker own" on public.vip_progress_tracker for all using (lower(email)=lower(coalesce(auth.jwt()->>'email',''))) with check (lower(email)=lower(coalesce(auth.jwt()->>'email','')))
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 331, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "vip_tracker admin" on public.vip_progress_tracker
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 332, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "vip_tracker admin" on public.vip_progress_tracker for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 333, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Seed vip settings
insert into public.vip_settings (monthly_max_slots, filled_slots, price, description, benefits, is_active)
values (5, 0, 2999000, 'Bimbingan VIP 1-on-1 eksklusif untuk percepat hasil',
'["Review strategi & funnel", "Konsultasi AI Agent 1-on-1", "Audit & feedback project", "Prioritas support", "Akses semua kelas"]'::jsonb, true)
on conflict do nothing
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 334, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 10. FUNNELS (Multi-Step Funnel)
-- ============================================================

create table if not exists public.funnels (
id uuid primary key default gen_random_uuid(),
slug text unique,
subdomain text unique,
name text not null,
meta_pixel_id text,
thankyou_url text,
upsell_url text,
currency text default 'IDR',
is_active boolean default true,
settings jsonb default '{}'::jsonb,
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 335, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create table if not exists public.funnel_steps (
id uuid primary key default gen_random_uuid(),
funnel_id uuid references public.funnels(id) on delete cascade,
sort integer not null default 0,
slug text,
type text not null default 'landing', -- 'landing' | 'video' | 'checkout' | 'upsell' | 'thankyou'
title text,
blocks jsonb not null default '[]'::jsonb, -- Modular blocks
meta jsonb default '{}'::jsonb,
is_active boolean default true,
created_at timestamptz default now(),
updated_at timestamptz default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 336, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Update leads to support funnel stages better
alter table public.leads add column if not exists utm_source text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 337, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists utm_medium text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 338, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists utm_campaign text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 339, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists utm_content text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 340, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists utm_term text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 341, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists funnel_slug text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 342, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.leads add column if not exists last_stage_at timestamptz
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 343, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Indexes
create index if not exists idx_funnels_subdomain on public.funnels (subdomain)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 344, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_funnel_steps_funnel on public.funnel_steps (funnel_id, sort)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 345, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Unik per (funnel, slug) supaya seed data idempotent
create unique index if not exists idx_funnel_steps_funnel_slug on public.funnel_steps (funnel_id, slug)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 346, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_leads_funnel on public.leads (funnel_slug)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 347, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Triggers
drop trigger if exists trg_funnels_updated on public.funnels
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 348, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_funnels_updated before update on public.funnels for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 349, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop trigger if exists trg_funnel_steps_updated on public.funnel_steps
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 350, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_funnel_steps_updated before update on public.funnel_steps for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 351, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- RLS
alter table public.funnels enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 352, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.funnel_steps enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 353, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "funnels read active" on public.funnels
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 354, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "funnels read active" on public.funnels for select using (is_active = true or public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 355, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "funnels admin all" on public.funnels
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 356, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "funnels admin all" on public.funnels for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 357, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "funnel_steps read" on public.funnel_steps
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 358, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "funnel_steps read" on public.funnel_steps for select using (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 359, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "funnel_steps admin all" on public.funnel_steps
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 360, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "funnel_steps admin all" on public.funnel_steps for all using (public.is_admin()) with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 361, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 11. FUNNEL CHECKOUT PERMISSIONS
-- ============================================================

-- Checkout butuh insert order & update lead tanpa login (anon)
drop policy if exists "orders insert anon" on public.orders
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 362, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "orders insert anon" on public.orders for insert with check (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 363, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "orders select anon" on public.orders
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 364, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "orders select anon" on public.orders for select using (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 365, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Lead bisa di-update oleh anon untuk tracking stage (opt_in -> unpaid_invoice)
drop policy if exists "leads update anon stage" on public.leads
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 366, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "leads update anon stage" on public.leads for update using (true) with check (true)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 367, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 12. ADMIN DASHBOARD / PIPELINE / FUNNEL BUILDER SUPPORT
-- ============================================================

-- Metadata order untuk dashboard (subdomain, invoice URL, order bump)
alter table public.orders add column if not exists subdomain text default ''
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 368, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.orders add column if not exists payment_url text
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 369, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.orders add column if not exists bump_amount numeric(12,2) default 0
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 370, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.orders add column if not exists updated_at timestamptz default now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 371, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Template WA: key unik untuk seed/upsert + stage + aktif
alter table public.wa_templates add column if not exists key text
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 372, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.wa_templates add column if not exists stage text default 'any'
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 373, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.wa_templates add column if not exists is_active boolean default true
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 374, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.wa_templates add column if not exists updated_at timestamptz default now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 375, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create unique index if not exists idx_wa_templates_key on public.wa_templates (key)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 376, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Index untuk query dashboard / pipeline
create index if not exists idx_orders_status_created on public.orders (status, created_at desc)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 377, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_orders_lead on public.orders (lead_id)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 378, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_orders_subdomain on public.orders (subdomain)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 379, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_leads_created on public.leads (created_at desc)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 380, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_leads_stage on public.leads (current_stage)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 381, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_leads_funnel_stage on public.leads (funnel_slug, current_stage)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 382, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_pipe_events_type_created on public.pipeline_events (event_type, created_at desc)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 383, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_pipe_events_lead on public.pipeline_events (lead_id)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 384, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Trigger updated_at orders
drop trigger if exists trg_orders_updated on public.orders
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 385, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create trigger trg_orders_updated before update on public.orders for each row execute function public.set_updated_at()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 386, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- ============================================================
-- 13. HERMES AGENT — LOG AKTIVITAS
-- ============================================================
-- Log aksi yang dikerjakan Hermes Agent (dipantau dari Admin Dashboard
-- -> "Hermes AI Command Center": publish artikel, buat funnel, analisa
-- leads, generate blocks/landing copy, dan chat admin).

create table if not exists public.agent_logs (
id             uuid primary key default gen_random_uuid(),
agent_name     text not null default 'hermes',
action         text not null,
action_label   text,
status         text not null default 'success'
check (status in ('queued','running','success','error')),
trigger_source text not null default 'admin',
target_type    text,
target_id      text,
summary        text,
detail         jsonb not null default '{}'::jsonb,
input          text,
output         text,
duration_ms    integer,
created_at     timestamptz not null default now()
)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 387, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_agent_logs_created on public.agent_logs (created_at desc)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 388, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_agent_logs_action on public.agent_logs (action)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 389, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_agent_logs_target on public.agent_logs (target_type, target_id)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 390, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.agent_logs enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 391, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "agent_logs admin read" on public.agent_logs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 392, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "agent_logs admin read" on public.agent_logs
for select using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 393, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "agent_logs admin insert" on public.agent_logs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 394, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "agent_logs admin insert" on public.agent_logs
for insert with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 395, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "agent_logs admin delete" on public.agent_logs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 396, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "agent_logs admin delete" on public.agent_logs
for delete using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 397, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- Hermes (backend / n8n) menulis log via service_role (bypass RLS).
drop policy if exists "agent_logs service insert" on public.agent_logs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 398, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "agent_logs service insert" on public.agent_logs
for insert with check (auth.role() = 'service_role')
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 399, sqlerrm;
end $b$;

