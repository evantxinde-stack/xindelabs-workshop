alter table public.sales_page_config
  add column if not exists is_published boolean not null default true;

alter table public.sales_page_config enable row level security;

drop policy if exists "admin all sales_page_config" on public.sales_page_config;
create policy "admin all sales_page_config" on public.sales_page_config
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
