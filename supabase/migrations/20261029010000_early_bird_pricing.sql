-- Early bird pricing for classes. Admin sets both; checkout picks early bird while active.
alter table public.classes
  add column if not exists early_bird_price numeric(12,2),
  add column if not exists early_bird_until timestamptz;
