-- Membership billing state. Idempotent; existing products remain lifetime.
alter table public.classes
  add column if not exists payment_options text[] not null default array['lifetime']::text[],
  add column if not exists annual_price numeric(12,2),
  add column if not exists lifetime_price numeric(12,2),
  add column if not exists membership_metadata jsonb not null default '{}'::jsonb;

update public.classes
set lifetime_price = price
where lifetime_price is null;

alter table public.classes drop constraint if exists classes_payment_options_check;
alter table public.classes add constraint classes_payment_options_check
  check (payment_options <@ array['annual','lifetime']::text[] and cardinality(payment_options) > 0);

alter table public.orders
  add column if not exists payment_option text not null default 'lifetime',
  add column if not exists billing_status text not null default 'one_time',
  add column if not exists grace_until timestamptz,
  add column if not exists membership_metadata jsonb not null default '{}'::jsonb;

alter table public.orders drop constraint if exists orders_payment_option_check;
alter table public.orders add constraint orders_payment_option_check
  check (payment_option in ('annual','lifetime'));
alter table public.orders drop constraint if exists orders_billing_status_check;
alter table public.orders add constraint orders_billing_status_check
  check (billing_status in ('one_time','active','grace','read_only','revoked','upgraded'));

alter table public.members
  add column if not exists payment_option text not null default 'lifetime',
  add column if not exists billing_status text not null default 'active',
  add column if not exists grace_until timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists membership_metadata jsonb not null default '{}'::jsonb;

alter table public.members drop constraint if exists members_payment_option_check;
alter table public.members add constraint members_payment_option_check
  check (payment_option in ('annual','lifetime'));
alter table public.members drop constraint if exists members_billing_status_check;
alter table public.members add constraint members_billing_status_check
  check (billing_status in ('active','grace','read_only','revoked'));

update public.orders set payment_option = case when tier = 'yearly' then 'annual' else 'lifetime' end where payment_option = 'lifetime';
update public.members set payment_option = case when tier = 'yearly' then 'annual' else 'lifetime' end where payment_option = 'lifetime';
