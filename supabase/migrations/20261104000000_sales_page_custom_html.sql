-- Sales page: custom HTML embed + position. Additive only.
alter table public.sales_page_config add column if not exists custom_html text;
alter table public.sales_page_config add column if not exists custom_html_position text not null default 'mid';
alter table public.sales_page_config add constraint sales_page_config_custom_html_position_check
    check (custom_html_position in ('hero', 'mid', 'last'));
