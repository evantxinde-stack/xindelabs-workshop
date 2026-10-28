alter table public.sales_page_config
  add column if not exists hero_badge text,
  add column if not exists problem_blocks jsonb not null default '[]'::jsonb,
  add column if not exists stats jsonb not null default '[]'::jsonb,
  add column if not exists benefits jsonb not null default '[]'::jsonb,
  add column if not exists testimonials jsonb not null default '[]'::jsonb,
  add column if not exists cta_label text,
  add column if not exists final_headline text,
  add column if not exists final_subheadline text;
