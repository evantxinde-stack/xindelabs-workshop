-- ============================================================
-- SUPABASE SETUP v2 — members + CMS (jalankan di SQL Editor)
-- ============================================================

-- 1. Tabel members (member course)
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'pending',  -- 'paid' | 'pending' | 'expired'
  product text default 'build-your-own-personalized-agent',
  tier text default 'yearly',              -- 'yearly' (599rb) | 'lifetime' (999rb)
  paid_until date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tabel admins (yang boleh edit CMS)
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

-- 3. Tabel CMS (konten landing page — key-value)
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,        -- 'homepage', 'pricing', dll
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  updated_by text
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.members enable row level security;
alter table public.admins enable row level security;
alter table public.site_content enable row level security;

-- members: user cuma bisa baca baris sendiri
create policy "members read own" on public.members for select
  using (auth.jwt() ->> 'email' = email);

-- admins: user cuma bisa baca apakah dirinya admin (by email)
create policy "admins read self" on public.admins for select
  using (auth.jwt() ->> 'email' = email);

-- site_content: SEMUA orang bisa baca (konten publik landing page)
create policy "content read all" on public.site_content for select
  using (true);

-- site_content: cuma ADMIN yang bisa tulis/ubah
create policy "content write admin" on public.site_content for insert
  with check (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

create policy "content update admin" on public.site_content for update
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

-- members: service_role (n8n) boleh tulis — anon ga bisa
create policy "service insert members" on public.members for insert
  with check (true);
create policy "service update members" on public.members for update
  using (true);

-- ============================================================
-- SEED: konten default + admin pertama
-- ============================================================

-- Admin pertama: GANTI email ini dengan email lo
insert into public.admins (email) values ('GANTI_EMAIL_ADMIN_LO@email.com')
on conflict (email) do nothing;

-- Konten default landing page
insert into public.site_content (key, value) values
('homepage', '{
  "hero_title": "Bukan karena lo kurang jualan — tapi karena lo masih kerjain semuanya sendiri.",
  "hero_subtitle": "Belajar bangun AI Agent pribadi lo sendiri — yang follow-up otomatis, riset calon client, bikin konten promosi, dan bales pertanyaan 24 jam. Tanpa coding. Tanpa jago teknologi.",
  "video_youtube_id": "YOUTUBE_VIDEO_ID",
  "video_caption": "INTRO — 2 MENIT · Liat duluan kayak gimana rasanya",
  "price_yearly": 599000,
  "price_lifetime": 999000,
  "discord_link": "https://discord.gg/G3EXTQt9e",
  "whatsapp_link": "https://wa.me/62895335137700",
  "instagram_handle": "@xindelabs.id"
}')
on conflict (key) do nothing;

-- ============================================================
-- TRIGGER updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_members_updated on public.members;
create trigger trg_members_updated before update on public.members
  for each row execute function public.set_updated_at();

drop trigger if exists trg_content_updated on public.site_content;
create trigger trg_content_updated before update on public.site_content
  for each row execute function public.set_updated_at();

-- Index
create index if not exists idx_members_email on public.members (email);
create index if not exists idx_admins_email on public.admins (email);
create index if not exists idx_content_key on public.site_content (key);
