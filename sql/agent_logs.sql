-- ============================================================
-- HERMES ACTIVITY LOG - AMAN (never abort)
-- VERSI AMAN: semua statement dibungkus exception handler.
-- 1 statement gagal = hanya NOTICE, file LANJUT (tidak rollback).
-- Idempotent: aman dijalankan berulang kali.
-- Jalankan SETELAH sql/migrate_2026_admin.sql
-- ============================================================

do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists agent_name text default 'hermes'
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists action text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists action_label text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists status text default 'success'
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists trigger_source text default 'admin'
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists target_type text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists target_id text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists summary text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists detail jsonb default '{}'::jsonb
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists input text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists output text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists duration_ms integer
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.agent_logs add column if not exists created_at timestamptz default now()
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
update public.agent_logs set status = 'success' where status is null or status not in ('queued','running','success','error')
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table public.agent_logs drop constraint if exists agent_logs_status_check
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table public.agent_logs add constraint agent_logs_status_check check (status in ('queued','running','success','error'))
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
-- ============================================================
-- HERMES AGENT — LOG AKTIVITAS (standalone)
-- Jalankan file ini bila tidak mau menjalankan seluruh supabase_unified_schema.sql.
-- Idempotent: aman dijalankan berulang.
-- ============================================================
do $b$ begin
  execute $q$
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
  raise notice 'SKIP statement #% : %', 1, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_agent_logs_created on public.agent_logs (created_at desc)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 2, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_agent_logs_action on public.agent_logs (action)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 3, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create index if not exists idx_agent_logs_target on public.agent_logs (target_type, target_id)
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 4, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
alter table public.agent_logs enable row level security
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 5, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "agent_logs admin read" on public.agent_logs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 6, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "agent_logs admin read" on public.agent_logs
for select using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 7, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "agent_logs admin insert" on public.agent_logs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 8, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "agent_logs admin insert" on public.agent_logs
for insert with check (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 9, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "agent_logs admin delete" on public.agent_logs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 10, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "agent_logs admin delete" on public.agent_logs
for delete using (public.is_admin())
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 11, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
drop policy if exists "agent_logs service insert" on public.agent_logs
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 12, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
create policy "agent_logs service insert" on public.agent_logs
for insert with check (auth.role() = 'service_role')
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 13, sqlerrm;
end $b$;

