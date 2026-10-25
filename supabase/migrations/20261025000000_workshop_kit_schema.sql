-- Unified products + Workshop Kit schema. Idempotent; run after public.classes/members exist.

alter table public.members
  add column if not exists discord_id text,
  add column if not exists discord_role_id text,
  add column if not exists is_vip boolean not null default false,
  add column if not exists is_all_access boolean not null default false;

alter table public.orders
  add column if not exists discord_id text,
  add column if not exists discord_role_id text,
  add column if not exists voucher_code text,
  add column if not exists discount_amount bigint not null default 0;

alter table public.classes
  add column if not exists product_type text not null default 'course',
  add column if not exists member_cross_sell_price bigint,
  add column if not exists discord_role_id text,
  add column if not exists trailer_youtube_id text,
  add column if not exists workshop_date timestamptz,
  add column if not exists workshop_meet_url text,
  add column if not exists workshop_replay_url text;

alter table public.classes drop constraint if exists classes_product_type_check;
alter table public.classes add constraint classes_product_type_check
  check (product_type in ('course', 'workshop', 'vip', 'bundle'));

create table if not exists public.workshop_pre_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  video_url text,
  tools jsonb not null default '[]'::jsonb,
  downloads jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, slug)
);

create table if not exists public.workshop_decks (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  content_markdown text,
  code_language text not null default 'bash',
  external_embed_url text,
  theme text not null default 'futuristic-green',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workshop_pre_session_progress (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  pre_session_id uuid not null references public.workshop_pre_sessions(id) on delete cascade,
  completed_items jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  unique (member_id, pre_session_id)
);

create table if not exists public.sales_page_config (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  class_id uuid references public.classes(id) on delete set null,
  headline text,
  subheadline text,
  vsl_youtube_id text,
  countdown_type text not null default 'evergreen' check (countdown_type in ('fixed','evergreen','none')),
  countdown_ends_at timestamptz,
  countdown_duration_minutes integer not null default 30,
  sales_notification_enabled boolean not null default false,
  sales_notification_config jsonb not null default '{}'::jsonb,
  faq_items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.vip_config (
  id uuid primary key default gen_random_uuid(),
  month_label text not null,
  total_slots integer not null default 5,
  remaining_slots integer not null default 5,
  auto_decrement boolean not null default true,
  whatsapp_booking_url text not null default 'https://wa.me/62895335137700',
  updated_at timestamptz not null default now()
);

create table if not exists public.vip_workspace (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  title text,
  recording_url text,
  action_plan text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists workshop_pre_sessions_class_idx on public.workshop_pre_sessions(class_id, sort_order);
create index if not exists workshop_decks_class_idx on public.workshop_decks(class_id, sort_order);
create index if not exists workshop_progress_member_idx on public.workshop_pre_session_progress(member_id);
create index if not exists vip_workspace_member_idx on public.vip_workspace(member_id);
