-- Phase 4 checkout metadata. Additive; existing products remain unchanged.
alter table public.classes
  add column if not exists bump_class_id uuid references public.classes(id) on delete set null,
  add column if not exists bump_price numeric(12,2),
  add column if not exists bump_title text,
  add column if not exists bump_active boolean not null default false;

alter table public.orders
  add column if not exists bump_class_id uuid references public.classes(id) on delete set null;

create index if not exists classes_bump_class_id_idx on public.classes(bump_class_id);
