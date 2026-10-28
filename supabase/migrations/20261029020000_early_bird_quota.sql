-- Early bird quota: price stays active until deadline passes OR quota filled.
alter table public.classes
  add column if not exists early_bird_quota integer;

-- Track which paid orders used the early bird price (quota counter source of truth).
alter table public.orders
  add column if not exists early_bird boolean not null default false;
