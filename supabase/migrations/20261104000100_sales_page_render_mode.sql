-- Sales page: template vs custom-only render mode. Additive only.
alter table public.sales_page_config add column if not exists render_mode text not null default 'template';
alter table public.sales_page_config add constraint sales_page_config_render_mode_check
    check (render_mode in ('template', 'custom'));
