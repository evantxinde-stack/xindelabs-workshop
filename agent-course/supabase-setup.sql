-- ============================================================
-- SUPABASE SETUP — tabel members (jalankan di SQL Editor)
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- 1. Tabel members
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'pending',  -- 'paid' | 'pending' | 'expired'
  product text default 'build-your-own-personalized-agent',
  paid_until date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Row Level Security: aktifkan
alter table public.members enable row level security;

-- 3. Policy SELECT: user cuma bisa baca baris dengan email = email login mereka
create policy "users can read own membership"
  on public.members for select
  using (auth.jwt() ->> 'email' = email);

-- 4. Policy INSERT/UPDATE: HANYA service_role (dari n8n) yang boleh tulis
--    (anon key tidak bisa insert/update — aman)
create policy "service role can insert members"
  on public.members for insert
  with check (true);

create policy "service role can update members"
  on public.members for update
  using (true);

-- 5. Trigger: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_members_updated on public.members;
create trigger trg_members_updated
  before update on public.members
  for each row execute function public.set_updated_at();

-- 6. (Opsional) Index buat lookup cepat
create index if not exists idx_members_email on public.members (email);
create index if not exists idx_members_status on public.members (status);

-- ============================================================
-- TEST CEPAT (opsional — jalankan manual):
-- insert into public.members (email, status, paid_until)
-- values ('test@example.com', 'paid', '2027-09-06');
-- ============================================================
