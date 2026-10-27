-- Course CRUD + invoice checkout mapping. Safe to run repeatedly.
alter table public.orders add column if not exists class_id uuid references public.classes(id) on delete set null;
alter table public.orders drop constraint if exists orders_product_check;
alter table public.orders add constraint orders_product_check
  check (product in ('vip', 'fast_track') or class_id is not null);
create index if not exists orders_class_id_idx on public.orders(class_id);

alter table public.classes add column if not exists archived_at timestamptz;
create index if not exists classes_published_idx on public.classes(is_published, sort_order);
