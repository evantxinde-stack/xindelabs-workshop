-- Voucher system
create table if not exists vouchers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percent','fixed')),
  value numeric(12,2) not null,
  tier text not null default 'all' check (tier in ('all','yearly','lifetime')),
  max_uses integer,
  used_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table vouchers enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='vouchers' and policyname='vouchers_admin_all') then
    create policy vouchers_admin_all on vouchers for all using (true) with check (true);
  end if;
end $$;
