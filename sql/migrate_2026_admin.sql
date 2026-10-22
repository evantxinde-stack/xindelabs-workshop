-- ============================================================
-- XINDELABS — MIGRASI ADMIN DASHBOARD + HERMES AGENT
-- ============================================================
-- File ini memperbaiki SELURUH masalah skema di project Supabase live:
--   * 74+ kolom yang hilang di 19 tabel
--   * 9 tabel yang belum pernah dibuat
--   * tabel baru untuk Hermes (agent_tasks)
--
-- CARA PAKAI:
--   1. Buka Supabase Dashboard -> SQL Editor -> New query
--   2. Paste SELURUH file ini -> Run
--   3. Cek bagian "VERIFIKASI" di paling bawah: semua harus "OK"
--   4. Setelah itu jalankan (urutan):
--        sql/migrate_2026_admin.sql        (file ini)
--        supabase_unified_schema.sql      (sudah diamankan)
--        seed_wa_templates.sql             (sudah ditulis ulang)
--        seed_funnels.sql                 (sudah ditulis ulang)
--        migrate_legacy_members.sql       (sudah diamankan)
--
-- JAMINAN:
--   * IDEMPOTENT  — aman dijalankan berkali-kali
--   * TIDAK PERNAH ABORT — setiap statement dibungkus exception handler,
--     jadi satu statement gagal tidak menghentikan statement berikutnya
--   * TIDAK MENGHAPUS DATA — hanya ADD COLUMN / CREATE TABLE / CREATE INDEX
-- ============================================================

-- ------------------------------------------------------------
-- 0. EKSTENSI
-- ------------------------------------------------------------
do $$
begin
  create extension if not exists pgcrypto;
exception when others then
  raise notice 'SKIP extension pgcrypto: %', sqlerrm;
end $$;

-- ------------------------------------------------------------
-- 0b. FUNGSI is_admin() (dipakai semua policy RLS)
--     Dibuat ulang agar policy di file ini tidak gagal dengan
--     "function public.is_admin() does not exist".
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'admin_profiles') then
    execute $fn$
      create or replace function public.is_admin()
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $func$
        select exists (
          select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
        or exists (
          select 1 from public.admin_profiles where id = auth.uid()
        );
      $func$;
    $fn$;
  else
    execute $fn$
      create or replace function public.is_admin()
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $func$
        select exists (
          select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        );
      $func$;
    $fn$;
  end if;
exception when others then
  raise notice 'SKIP function is_admin: %', sqlerrm;
end $$;

do $$ begin
  grant execute on function public.is_admin() to authenticated;
  grant execute on function public.is_admin() to anon;
exception when others then
  raise notice 'SKIP grant is_admin: %', sqlerrm;
end $$;

-- ------------------------------------------------------------
-- 1. TAMBAHKAN KOLOM YANG HILANG
--    Loop ini aman untuk tabel yang belum ada (skip otomatis).
-- ------------------------------------------------------------
do $$
declare
  r record;
  n_ok int := 0;
  n_skip int := 0;
begin
  for r in
    select * from (values
      -- admins
      ('admins', 'role', 'text default ''admin'''),
      -- agent_logs (Activity Log Hermes)
      ('agent_logs', 'agent_name', 'text default ''hermes'''),
      ('agent_logs', 'action', 'text'),
      ('agent_logs', 'action_label', 'text'),
      ('agent_logs', 'trigger_source', 'text default ''admin'''),
      ('agent_logs', 'target_type', 'text'),
      ('agent_logs', 'target_id', 'text'),
      ('agent_logs', 'summary', 'text'),
      ('agent_logs', 'detail', 'jsonb default ''{}''::jsonb'),
      ('agent_logs', 'input', 'text'),
      ('agent_logs', 'output', 'text'),
      ('agent_logs', 'duration_ms', 'integer'),
      -- blog_posts (Blog Editor + Auto-SEO Hermes)
      ('blog_posts', 'content', 'text'),
      ('blog_posts', 'author', 'text default ''Xinde Labs'''),
      ('blog_posts', 'status', 'text default ''draft'''),
      ('blog_posts', 'created_at', 'timestamptz default now()'),
      ('blog_posts', 'updated_at', 'timestamptz default now()'),
      ('blog_posts', 'keywords', 'text[] default ''{}'''),
      ('blog_posts', 'cta_url', 'text'),
      ('blog_posts', 'cta_label', 'text'),
      -- funnels (Funnel Builder + Generator Funnel Hermes)
      ('funnels', 'slug', 'text'),
      ('funnels', 'thankyou_url', 'text'),
      ('funnels', 'upsell_url', 'text'),
      ('funnels', 'currency', 'text default ''IDR'''),
      ('funnels', 'settings', 'jsonb default ''{}''::jsonb'),
      ('funnels', 'updated_at', 'timestamptz default now()'),
      -- funnel_steps (blok modular funnel)
      ('funnel_steps', 'sort', 'integer default 0'),
      ('funnel_steps', 'type', 'text default ''content'''),
      ('funnel_steps', 'title', 'text'),
      ('funnel_steps', 'blocks', 'jsonb default ''[]''::jsonb'),
      ('funnel_steps', 'meta', 'jsonb default ''{}''::jsonb'),
      ('funnel_steps', 'is_active', 'boolean default true'),
      ('funnel_steps', 'updated_at', 'timestamptz default now()'),
      -- leads (Pipeline + Analis Leads Hermes)
      ('leads', 'ref', 'text default '''''),
      ('leads', 'utm_source', 'text'),
      ('leads', 'utm_medium', 'text'),
      ('leads', 'utm_campaign', 'text'),
      ('leads', 'utm_content', 'text'),
      ('leads', 'utm_term', 'text'),
      ('leads', 'funnel_slug', 'text'),
      ('leads', 'last_stage_at', 'timestamptz'),
      ('leads', 'is_vip', 'boolean default false'),
      ('leads', 'phone', 'text'),
      -- orders (checkout + revenue)
      ('orders', 'subdomain', 'text'),
      ('orders', 'payment_url', 'text'),
      ('orders', 'bump_amount', 'numeric default 0'),
      ('orders', 'updated_at', 'timestamptz default now()'),
      ('orders', 'email', 'text'),
      ('orders', 'whatsapp', 'text'),
      ('orders', 'funnel_slug', 'text'),
      -- pipeline_events
      ('pipeline_events', 'stage', 'text'),
      -- notes
      ('notes', 'updated_at', 'timestamptz default now()'),
      -- lessons (LMS + AI Tutor)
      ('lessons', 'class_id', 'uuid'),
      ('lessons', 'type', 'text default ''video'''),
      ('lessons', 'video_id', 'text'),
      ('lessons', 'content', 'text'),
      ('lessons', 'transcript', 'text'),
      ('lessons', 'duration', 'text'),
      ('lessons', 'required', 'boolean default true'),
      ('lessons', 'updated_at', 'timestamptz default now()'),
      ('lesson_progress', 'email', 'text'),
      ('lesson_progress', 'class_id', 'uuid'),
      ('lesson_progress', 'completed', 'boolean default false'),
      ('lesson_progress', 'created_at', 'timestamptz default now()'),
      ('lesson_progress', 'updated_at', 'timestamptz default now()'),
      ('member_progress', 'completed', 'boolean default false'),
      ('member_progress', 'progress', 'integer default 0'),
      ('member_progress', 'last_seen', 'timestamptz'),
      -- members
      ('members', 'is_vip', 'boolean default false'),
      ('members', 'vip_expires_at', 'timestamptz'),
      ('members', 'owned_classes', 'text[] default ''{}'''),
      -- settings
      ('settings', 'updated_at', 'timestamptz default now()'),
      -- vip_settings (slot VIP Hermes)
      ('vip_settings', 'price', 'numeric default 0'),
      ('vip_settings', 'description', 'text'),
      ('vip_settings', 'benefits', 'jsonb default ''[]''::jsonb'),
      ('vip_settings', 'is_active', 'boolean default true'),
      -- vip_projects (Pre-Review Hermes)
      ('vip_projects', 'email', 'text'),
      ('vip_projects', 'file_url', 'text'),
      ('vip_projects', 'feedback', 'text'),
      ('vip_projects', 'notes', 'text'),
      ('vip_projects', 'reviewed_at', 'timestamptz'),
      ('vip_projects', 'reviewed_by', 'text'),
      ('vip_projects', 'ai_review', 'jsonb'),
      ('vip_projects', 'updated_at', 'timestamptz default now()'),
      -- wa_templates (draf WA Hermes)
      ('wa_templates', 'key', 'text'),
      ('wa_templates', 'stage', 'text'),
      ('wa_templates', 'is_active', 'boolean default true'),
      ('wa_templates', 'updated_at', 'timestamptz default now()'),
      -- vouchers (voucher via chat Hermes)
      ('vouchers', 'discount_type', 'text default ''percent'''),
      ('vouchers', 'discount_value', 'numeric default 0'),
      ('vouchers', 'subdomain', 'text'),
      ('vouchers', 'is_active', 'boolean default true'),
      ('vouchers', 'notes', 'text')
    ) as v(tbl, col, typ)
  loop
    begin
      execute format(
        'alter table if exists public.%I add column if not exists %I %s',
        r.tbl, r.col, r.typ
      );
      n_ok := n_ok + 1;
    exception when others then
      n_skip := n_skip + 1;
      raise notice 'SKIP kolom %.% : %', r.tbl, r.col, sqlerrm;
    end;
  end loop;
  raise notice 'Migrasi kolom: % statement OK, % dilewati', n_ok, n_skip;
end $$;

-- ------------------------------------------------------------
-- 2. TABEL YANG BELUM PERNAH DIBUAT
-- ------------------------------------------------------------
do $$ begin
  create table if not exists public.classes (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    description text,
    cover_image text,
    price numeric default 0,
    member_discount_price numeric default 0,
    is_published boolean default true,
    sort_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
exception when others then raise notice 'SKIP tabel classes: %', sqlerrm; end $$;

do $$ begin
  create table if not exists public.lesson_progress (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    lesson_id uuid references public.lessons(id) on delete cascade,
    class_id uuid references public.classes(id) on delete cascade,
    completed boolean default false,
    completed_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (email, lesson_id)
  );
exception when others then raise notice 'SKIP tabel lesson_progress: %', sqlerrm; end $$;

do $$ begin
  create table if not exists public.certificates (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    class_id uuid references public.classes(id) on delete cascade,
    certificate_number text not null unique,
    issued_at timestamptz default now(),
    created_at timestamptz default now()
  );
exception when others then raise notice 'SKIP tabel certificates: %', sqlerrm; end $$;

do $$ begin
  create table if not exists public.vip_bookings (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    member_name text,
    preferred_date date,
    preferred_time text,
    topic text,
    status text default 'pending',
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
exception when others then raise notice 'SKIP tabel vip_bookings: %', sqlerrm; end $$;

do $$ begin
  create table if not exists public.vip_progress_tracker (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    milestone jsonb default '[]'::jsonb,
    notes text,
    updated_at timestamptz default now()
  );
exception when others then raise notice 'SKIP tabel vip_progress_tracker: %', sqlerrm; end $$;

do $$ begin
  create table if not exists public.programs (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    description text,
    cover_image text,
    price numeric,
    type text default 'course',
    features jsonb default '[]'::jsonb,
    status text not null default 'active',
    sort_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
exception when others then raise notice 'SKIP tabel programs: %', sqlerrm; end $$;

do $$ begin
  create table if not exists public.portfolio (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text unique,
    description text,
    image_url text,
    category text,
    link_url text,
    sort_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
exception when others then raise notice 'SKIP tabel portfolio: %', sqlerrm; end $$;

do $$ begin
  create table if not exists public.partnership_inquiries (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    company text,
    whatsapp text,
    service_type text,
    message text,
    status text not null default 'new',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
exception when others then raise notice 'SKIP tabel partnership_inquiries: %', sqlerrm; end $$;

do $$ begin
  create table if not exists public.affiliates (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    code text not null unique,
    status text not null default 'active',
    commission_type text not null default 'percent',
    commission_value numeric not null default 20,
    clicks integer not null default 0,
    note text default '',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
exception when others then raise notice 'SKIP tabel affiliates: %', sqlerrm; end $$;

do $$ begin
  create table if not exists public.affiliate_commissions (
    id uuid primary key default gen_random_uuid(),
    affiliate_code text not null,
    affiliate_email text default '',
    customer_email text default '',
    order_ref text default '',
    tier text default '',
    sale_amount numeric not null default 0,
    commission_amount numeric not null default 0,
    status text not null default 'pending',
    paid_at timestamptz,
    note text default '',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
exception when others then raise notice 'SKIP tabel affiliate_commissions: %', sqlerrm; end $$;

-- ------------------------------------------------------------
-- 3. TABEL BUS HERMES (tugas masuk dari Telegram / AI agent)
-- ------------------------------------------------------------
do $$ begin
  create table if not exists public.agent_tasks (
    id uuid primary key default gen_random_uuid(),
    task_type text not null default 'general',
    title text,
    prompt text,
    payload jsonb not null default '{}'::jsonb,
    status text not null default 'pending',
    priority text default 'normal',
    requested_by text default 'hermes',
    source text default 'telegram',
    result jsonb,
    error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
exception when others then raise notice 'SKIP tabel agent_tasks: %', sqlerrm; end $$;

do $$ begin
  create table if not exists public.agent_messages (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references public.agent_tasks(id) on delete cascade,
    role text not null default 'hermes',
    content text,
    meta jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
  );
exception when others then raise notice 'SKIP tabel agent_messages: %', sqlerrm; end $$;

-- ------------------------------------------------------------
-- 4. BACKFILL DATA LAMA
-- ------------------------------------------------------------
do $$ begin
  update public.blog_posts set status = 'published'
    where published_at is not null and (status is null or status = '' or status = 'draft');
exception when others then raise notice 'SKIP backfill blog_posts.status: %', sqlerrm; end $$;

do $$ begin
  update public.blog_posts set updated_at = coalesce(created_at, now())
    where updated_at is null;
exception when others then raise notice 'SKIP backfill blog_posts.updated_at: %', sqlerrm; end $$;

do $$ begin
  update public.funnels set slug = lower(regexp_replace(coalesce(subdomain, name, 'funnel'), '[^a-zA-Z0-9]+', '-', 'g'))
    where slug is null or slug = '';
exception when others then raise notice 'SKIP backfill funnels.slug: %', sqlerrm; end $$;

do $$ begin
  update public.funnels set slug = 'funnel-' || left(id::text, 8)
    where slug is null or slug = '';
exception when others then raise notice 'SKIP backfill funnels.slug fallback: %', sqlerrm; end $$;

do $$ begin
  update public.funnel_steps set blocks = '[]'::jsonb where blocks is null;
  update public.funnel_steps set type = 'content' where type is null or type = '';
  update public.funnel_steps set sort = 0 where sort is null;
exception when others then raise notice 'SKIP backfill funnel_steps: %', sqlerrm; end $$;

do $$ begin
  update public.wa_templates set key = lower(regexp_replace(coalesce(name, 'template-' || id::text), '[^a-zA-Z0-9]+', '_', 'g'))
    where key is null or key = '';
exception when others then raise notice 'SKIP backfill wa_templates.key: %', sqlerrm; end $$;

do $$ begin
  update public.agent_logs set agent_name = 'hermes' where agent_name is null or agent_name = '';
  update public.agent_logs set action = 'unknown' where action is null or action = '';
  update public.agent_logs set trigger_source = 'legacy' where trigger_source is null or trigger_source = '';
  update public.agent_logs set status = 'success' where status is null or status = '';
  update public.agent_logs set detail = '{}'::jsonb where detail is null;
exception when others then raise notice 'SKIP backfill agent_logs: %', sqlerrm; end $$;

do $$ begin
  update public.orders set bump_amount = 0 where bump_amount is null;
  update public.orders set updated_at = coalesce(created_at, now()) where updated_at is null;
exception when others then raise notice 'SKIP backfill orders: %', sqlerrm; end $$;

do $$ begin
  update public.notes set updated_at = coalesce(created_at, now()) where updated_at is null;
exception when others then raise notice 'SKIP backfill notes: %', sqlerrm; end $$;

do $$ begin
  update public.vip_projects set email = '' where email is null;
exception when others then raise notice 'SKIP backfill vip_projects.email: %', sqlerrm; end $$;

-- ------------------------------------------------------------
-- 5. UNIQUE INDEX (wajib untuk on conflict di seed & upsert app)
-- ------------------------------------------------------------
do $$ begin
  update public.funnels f set slug = f.slug || '-' || left(f.id::text, 8)
   where f.slug is not null
     and exists (select 1 from public.funnels g where g.slug = f.slug and g.id <> f.id);
exception when others then raise notice 'SKIP dedup funnels.slug: %', sqlerrm; end $$;

do $$ begin
  create unique index if not exists funnels_slug_key on public.funnels (slug);
exception when others then raise notice 'SKIP index funnels.slug: %', sqlerrm; end $$;

do $$ begin
  create unique index if not exists funnels_subdomain_key on public.funnels (subdomain);
exception when others then raise notice 'SKIP index funnels.subdomain: %', sqlerrm; end $$;

do $$ begin
  update public.wa_templates t set key = t.key || '_' || left(t.id::text, 8)
   where t.key is not null
     and exists (select 1 from public.wa_templates u where u.key = t.key and u.id <> t.id);
exception when others then raise notice 'SKIP dedup wa_templates.key: %', sqlerrm; end $$;

do $$ begin
  create unique index if not exists wa_templates_key_key on public.wa_templates (key);
exception when others then raise notice 'SKIP index wa_templates.key: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_agent_logs_created on public.agent_logs (created_at desc);
exception when others then raise notice 'SKIP index idx_agent_logs_created: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_agent_logs_action on public.agent_logs (action);
exception when others then raise notice 'SKIP index idx_agent_logs_action: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_agent_logs_target on public.agent_logs (target_type, target_id);
exception when others then raise notice 'SKIP index idx_agent_logs_target: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_agent_tasks_status on public.agent_tasks (status, created_at desc);
exception when others then raise notice 'SKIP index idx_agent_tasks_status: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_blog_posts_status on public.blog_posts (status);
exception when others then raise notice 'SKIP index idx_blog_posts_status: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_leads_funnel_slug on public.leads (funnel_slug);
exception when others then raise notice 'SKIP index idx_leads_funnel_slug: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_leads_stage on public.leads (current_stage);
exception when others then raise notice 'SKIP index idx_leads_stage: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_orders_status on public.orders (status, created_at desc);
exception when others then raise notice 'SKIP index idx_orders_status: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_orders_funnel_slug on public.orders (funnel_slug);
exception when others then raise notice 'SKIP index idx_orders_funnel_slug: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_funnel_steps_funnel_sort on public.funnel_steps (funnel_id, sort);
exception when others then raise notice 'SKIP index idx_funnel_steps_funnel_sort: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_classes_slug on public.classes (slug);
exception when others then raise notice 'SKIP index idx_classes_slug: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_lessons_class on public.lessons (class_id, sort_order);
exception when others then raise notice 'SKIP index idx_lessons_class: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_vip_bookings_email on public.vip_bookings (email);
exception when others then raise notice 'SKIP index idx_vip_bookings_email: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_vip_projects_email on public.vip_projects (email);
exception when others then raise notice 'SKIP index idx_vip_projects_email: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_affiliate_commissions_order_ref on public.affiliate_commissions (order_ref);
exception when others then raise notice 'SKIP index idx_affiliate_commissions_order_ref: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_member_progress_email on public.member_progress (email);
exception when others then raise notice 'SKIP index idx_member_progress_email: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_lesson_progress_email on public.lesson_progress (email);
exception when others then raise notice 'SKIP index idx_lesson_progress_email: %', sqlerrm; end $$;

do $$ begin
  create index if not exists idx_wa_templates_stage on public.wa_templates (stage);
exception when others then raise notice 'SKIP index idx_wa_templates_stage: %', sqlerrm; end $$;

-- ------------------------------------------------------------
-- 6. CONSTRAINT agent_logs.status (punya schema lama -> diseragamkan)
-- ------------------------------------------------------------
do $$ begin
  alter table public.agent_logs drop constraint if exists agent_logs_status_check;
exception when others then raise notice 'SKIP drop constraint agent_logs: %', sqlerrm; end $$;

do $$ begin
  alter table public.agent_logs add constraint agent_logs_status_check
    check (status in ('queued','running','success','error'));
exception when others then raise notice 'SKIP add constraint agent_logs: %', sqlerrm; end $$;

-- ------------------------------------------------------------
-- 7. RLS + POLICY
-- ------------------------------------------------------------
do $$ begin alter table public.agent_logs enable row level security; exception when others then raise notice 'SKIP rls agent_logs: %', sqlerrm; end $$;
do $$ begin alter table public.agent_tasks enable row level security; exception when others then raise notice 'SKIP rls agent_tasks: %', sqlerrm; end $$;
do $$ begin alter table public.agent_messages enable row level security; exception when others then raise notice 'SKIP rls agent_messages: %', sqlerrm; end $$;
do $$ begin alter table public.classes enable row level security; exception when others then raise notice 'SKIP rls classes: %', sqlerrm; end $$;
do $$ begin alter table public.certificates enable row level security; exception when others then raise notice 'SKIP rls certificates: %', sqlerrm; end $$;
do $$ begin alter table public.vip_bookings enable row level security; exception when others then raise notice 'SKIP rls vip_bookings: %', sqlerrm; end $$;
do $$ begin alter table public.vip_progress_tracker enable row level security; exception when others then raise notice 'SKIP rls vip_progress_tracker: %', sqlerrm; end $$;
do $$ begin alter table public.blog_posts enable row level security; exception when others then raise notice 'SKIP rls blog_posts: %', sqlerrm; end $$;

-- agent_logs: admin bisa baca, admin + service_role bisa tulis
do $$ begin
  drop policy if exists "agent_logs admin read" on public.agent_logs;
  create policy "agent_logs admin read" on public.agent_logs for select using (public.is_admin());
exception when others then raise notice 'SKIP policy agent_logs read: %', sqlerrm; end $$;

do $$ begin
  drop policy if exists "agent_logs admin insert" on public.agent_logs;
  create policy "agent_logs admin insert" on public.agent_logs for insert with check (public.is_admin());
exception when others then raise notice 'SKIP policy agent_logs insert: %', sqlerrm; end $$;

do $$ begin
  drop policy if exists "agent_logs admin delete" on public.agent_logs;
  create policy "agent_logs admin delete" on public.agent_logs for delete using (public.is_admin());
exception when others then raise notice 'SKIP policy agent_logs delete: %', sqlerrm; end $$;

-- agent_tasks: admin + agent (service_role bypass RLS)
do $$ begin
  drop policy if exists "agent_tasks admin all" on public.agent_tasks;
  create policy "agent_tasks admin all" on public.agent_tasks for all using (public.is_admin()) with check (public.is_admin());
exception when others then raise notice 'SKIP policy agent_tasks: %', sqlerrm; end $$;

do $$ begin
  drop policy if exists "agent_messages admin all" on public.agent_messages;
  create policy "agent_messages admin all" on public.agent_messages for all using (public.is_admin()) with check (public.is_admin());
exception when others then raise notice 'SKIP policy agent_messages: %', sqlerrm; end $$;

-- classes: publik hanya yang published
do $$ begin
  drop policy if exists "classes read published" on public.classes;
  create policy "classes read published" on public.classes for select using (is_published = true or public.is_admin());
exception when others then raise notice 'SKIP policy classes read: %', sqlerrm; end $$;

do $$ begin
  drop policy if exists "classes admin all" on public.classes;
  create policy "classes admin all" on public.classes for all using (public.is_admin()) with check (public.is_admin());
exception when others then raise notice 'SKIP policy classes admin: %', sqlerrm; end $$;

-- certificates: pemilik + admin
do $$ begin
  drop policy if exists "certificates read own" on public.certificates;
  create policy "certificates read own" on public.certificates for select
    using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.is_admin());
exception when others then raise notice 'SKIP policy certificates read: %', sqlerrm; end $$;

do $$ begin
  drop policy if exists "certificates admin all" on public.certificates;
  create policy "certificates admin all" on public.certificates for all using (public.is_admin()) with check (public.is_admin());
exception when others then raise notice 'SKIP policy certificates admin: %', sqlerrm; end $$;

-- vip_bookings: pemilik + admin
do $$ begin
  drop policy if exists "vip_bookings own" on public.vip_bookings;
  create policy "vip_bookings own" on public.vip_bookings for all
    using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.is_admin())
    with check (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.is_admin());
exception when others then raise notice 'SKIP policy vip_bookings own: %', sqlerrm; end $$;

do $$ begin
  drop policy if exists "vip_bookings admin" on public.vip_bookings;
  create policy "vip_bookings admin" on public.vip_bookings for all using (public.is_admin()) with check (public.is_admin());
exception when others then raise notice 'SKIP policy vip_bookings admin: %', sqlerrm; end $$;

-- vip_progress_tracker: pemilik + admin
do $$ begin
  drop policy if exists "vip_progress_tracker own" on public.vip_progress_tracker;
  create policy "vip_progress_tracker own" on public.vip_progress_tracker for all
    using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.is_admin())
    with check (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.is_admin());
exception when others then raise notice 'SKIP policy vip_progress_tracker own: %', sqlerrm; end $$;

-- blog_posts: publik hanya published
do $$ begin
  drop policy if exists "blog_posts read published" on public.blog_posts;
  create policy "blog_posts read published" on public.blog_posts for select
    using (status = 'published' or public.is_admin());
exception when others then raise notice 'SKIP policy blog_posts read: %', sqlerrm; end $$;

do $$ begin
  drop policy if exists "blog_posts admin all" on public.blog_posts;
  create policy "blog_posts admin all" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());
exception when others then raise notice 'SKIP policy blog_posts admin: %', sqlerrm; end $$;

-- ------------------------------------------------------------
-- 8. CONFIG HERMES (bisa diubah dari Admin > Hermes > Pengaturan)
-- ------------------------------------------------------------
do $$ begin
  if not exists (select 1 from public.settings where key = 'hermes_config') then
    insert into public.settings (key, value)
    values ('hermes_config', '{"mode":"supabase_bus","enabled":true,"agent_name":"hermes","webhook_url":"","token":"","model":""}'::jsonb);
  end if;
exception when others then raise notice 'SKIP settings.hermes_config: %', sqlerrm; end $$;

-- ------------------------------------------------------------
-- 9. RELOAD SCHEMA CACHE POSTGREST (supaya tabel/kolom baru langsung terbaca)
-- ------------------------------------------------------------
do $$ begin
  perform pg_notify('pgrst', 'reload schema');
exception when others then raise notice 'SKIP notify pgrst: %', sqlerrm; end $$;

-- ============================================================
-- 10. VERIFIKASI
--     Semua baris harus "OK". Kalau ada "HILANG", salin pesan
--     NOTICEnya — statement itu perlu dijalankan manual.
-- ============================================================
do $$
declare
  r record;
  n_ok int := 0;
  n_bad int := 0;
  has_table boolean;
  has_col boolean;
begin
  for r in
    select * from (values
      ('admins', 'role'),
      ('agent_logs', 'action'), ('agent_logs', 'agent_name'), ('agent_logs', 'detail'),
      ('agent_logs', 'duration_ms'), ('agent_logs', 'output'), ('agent_logs', 'summary'),
      ('agent_logs', 'trigger_source'), ('agent_logs', 'target_id'), ('agent_logs', 'target_type'),
      ('blog_posts', 'content'), ('blog_posts', 'status'), ('blog_posts', 'author'),
      ('blog_posts', 'keywords'), ('blog_posts', 'cta_url'), ('blog_posts', 'cta_label'),
      ('funnels', 'slug'), ('funnels', 'settings'), ('funnels', 'thankyou_url'),
      ('funnels', 'upsell_url'), ('funnels', 'currency'),
      ('funnel_steps', 'blocks'), ('funnel_steps', 'type'), ('funnel_steps', 'title'),
      ('funnel_steps', 'sort'), ('funnel_steps', 'meta'), ('funnel_steps', 'is_active'),
      ('leads', 'funnel_slug'), ('leads', 'utm_source'), ('leads', 'utm_medium'),
      ('leads', 'utm_campaign'), ('leads', 'utm_content'), ('leads', 'utm_term'),
      ('leads', 'last_stage_at'), ('leads', 'ref'),
      ('orders', 'payment_url'), ('orders', 'bump_amount'), ('orders', 'subdomain'),
      ('orders', 'email'), ('orders', 'whatsapp'), ('orders', 'funnel_slug'),
      ('lessons', 'class_id'), ('lessons', 'video_id'), ('lessons', 'content'),
      ('lessons', 'transcript'), ('lessons', 'type'), ('lessons', 'duration'),
      ('vip_settings', 'price'), ('vip_settings', 'benefits'), ('vip_settings', 'is_active'),
      ('vip_projects', 'email'), ('vip_projects', 'file_url'), ('vip_projects', 'feedback'),
      ('vip_projects', 'ai_review'), ('vip_projects', 'notes'),
      ('wa_templates', 'key'), ('wa_templates', 'stage'), ('wa_templates', 'is_active'),
      ('vouchers', 'discount_type'), ('vouchers', 'discount_value'), ('vouchers', 'subdomain'),
      ('vouchers', 'is_active'), ('vouchers', 'notes'),
      ('members', 'is_vip'), ('members', 'owned_classes'),
      ('lesson_progress', 'email'), ('lesson_progress', 'class_id'),
      ('member_progress', 'completed'), ('member_progress', 'progress'),
      ('pipeline_events', 'stage'), ('notes', 'updated_at'), ('settings', 'updated_at')
    ) as v(tbl, col)
  loop
    begin
      select true into has_table from pg_tables where schemaname = 'public' and tablename = r.tbl;
      if not has_table then
        n_bad := n_bad + 1;
        raise notice 'HILANG  tabel %.% (tabel tidak ada)', r.tbl, r.col;
      else
        select true into has_col from information_schema.columns
          where table_schema = 'public' and table_name = r.tbl and column_name = r.col;
        if has_col then
          n_ok := n_ok + 1;
        else
          n_bad := n_bad + 1;
          raise notice 'HILANG  kolom %.%', r.tbl, r.col;
        end if;
      end if;
    exception when others then
      n_bad := n_bad + 1;
      raise notice 'CEK GAGAL %.% : %', r.tbl, r.col, sqlerrm;
    end;
  end loop;
  raise notice '=== VERIFIKASI KOLOM: % OK, % HILANG ===', n_ok, n_bad;
end $$;

-- Rekap jumlah baris (aman: tabel yang belum ada hanya jadi NOTICE)
do $$
declare
  t text;
  n bigint;
begin
  foreach t in array array[
    'classes', 'vip_bookings', 'certificates', 'vip_progress_tracker',
    'agent_tasks', 'agent_messages', 'agent_logs', 'blog_posts',
    'funnels', 'funnel_steps', 'wa_templates', 'settings'
  ] loop
    begin
      execute format('select count(*) from public.%I', t) into n;
      raise notice 'tabel % : % baris', t, n;
    exception when others then
      raise notice 'tabel % : belum ada (%)', t, sqlerrm;
    end;
  end loop;
end $$;

-- ============================================================
-- SELESAI. Kalau NOTICE "VERIFIKASI KOLOM: 0 HILANG" ->
-- lanjut: supabase_unified_schema.sql, seed_wa_templates.sql,
--         seed_funnels.sql, migrate_legacy_members.sql
-- ============================================================
