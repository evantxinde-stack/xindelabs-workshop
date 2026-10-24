create extension if not exists pgcrypto;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  whatsapp text,
  source text not null default 'tutorial_hermes',
  status text not null default 'free_tutorial'
    check (status in ('free_tutorial','fast_track_paid','vip_paid','joined_group')),
  current_stage text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  product text not null check (product in ('vip','fast_track')),
  amount numeric(12,2) not null,
  mayar_invoice_id text,
  mayar_transaction_id text,
  status text not null default 'pending'
    check (status in ('pending','paid','closed','expired')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table public.pipeline_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author text not null default 'admin',
  body text not null,
  created_at timestamptz not null default now()
);

create table public.email_sequences (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  subject text not null,
  html_body text not null,
  created_at timestamptz not null default now()
);

create table public.email_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.email_sequences(id) on delete cascade,
  step integer not null,
  day_offset integer not null default 0,
  template_id uuid not null references public.email_templates(id) on delete cascade,
  unique (sequence_id, step)
);

create table public.email_enrollments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  sequence_id uuid not null references public.email_sequences(id) on delete cascade,
  current_step integer not null default 0,
  enrolled_at timestamptz not null default now(),
  unique (lead_id, sequence_id)
);

create table public.email_queue (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  sequence_id uuid references public.email_sequences(id) on delete set null,
  template_id uuid not null references public.email_templates(id),
  step integer,
  scheduled_for timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending','processing','sent','failed','skipped')),
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  queue_id uuid references public.email_queue(id) on delete set null,
  resend_id text,
  status text not null,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.unsubscribes (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create index idx_email_queue_due on public.email_queue(status, scheduled_for);
create index idx_email_enrollments_lead on public.email_enrollments(lead_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid()
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_leads_updated_at before update on public.leads
for each row execute function public.set_updated_at();

alter table public.leads enable row level security;
alter table public.orders enable row level security;
alter table public.pipeline_events enable row level security;
alter table public.notes enable row level security;
alter table public.email_sequences enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_steps enable row level security;
alter table public.email_enrollments enable row level security;
alter table public.email_queue enable row level security;
alter table public.email_logs enable row level security;
alter table public.unsubscribes enable row level security;
alter table public.admin_profiles enable row level security;

create policy "anon insert leads" on public.leads
  for insert to anon with check (true);
create policy "admin all leads" on public.leads
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admin all orders" on public.orders
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "anon insert pipeline_events" on public.pipeline_events
  for insert to anon with check (true);
create policy "admin all pipeline_events" on public.pipeline_events
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin all notes" on public.notes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin all email_sequences" on public.email_sequences
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin all email_templates" on public.email_templates
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin all email_steps" on public.email_steps
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin all email_enrollments" on public.email_enrollments
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin all email_queue" on public.email_queue
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin all email_logs" on public.email_logs
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin all admin_profiles" on public.admin_profiles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "anon insert unsubscribes" on public.unsubscribes
  for insert to anon with check (true);
create policy "admin all unsubscribes" on public.unsubscribes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());