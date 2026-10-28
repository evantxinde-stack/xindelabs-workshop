alter table public.sales_page_config
  add column if not exists is_default boolean not null default false;

create index if not exists sales_page_config_class_default_idx
  on public.sales_page_config(class_id, is_default, updated_at desc);

create unique index if not exists sales_page_one_default_per_class
  on public.sales_page_config(class_id)
  where is_default = true and class_id is not null;
