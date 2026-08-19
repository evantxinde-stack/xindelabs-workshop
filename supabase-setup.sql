-- ============================================================
-- SUPABASE SETUP v2 — members + CMS (jalankan di SQL Editor)
-- File ini AMAN dijalankan ulang (idempotent).
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

-- 4. Tabel leads (pendaftar course dari form landing)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  whatsapp text,                       -- nomor WA dalam format internasional (62…)
  discord_id text,
  status text not null default 'belum', -- 'belum' | 'follow_up' | 'bayar'
  notes text default '',
  source text default 'landing-daftar', -- darimana lead masuk
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Tabel modules (LMS — modul course, dikelola dari panel LMS admin)
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  sort integer not null default 0,
  level text not null default 'beginner', -- 'beginner' | 'level-up' | 'pro'
  title text not null,
  type text not null default 'video',     -- 'video' (YouTube) | 'text'
  duration text default '',
  video_id text default '',
  content text default '',                -- isi modul kalau type = 'text'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migrasi: kolom baru kalau tabel sudah pernah dibuat
alter table public.modules add column if not exists type text not null default 'video';
alter table public.modules add column if not exists content text default '';

-- 7. Tabel member_progress (progres belajar member per modul)
create table if not exists public.member_progress (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  module_id text not null,
  status text not null default 'not_started', -- 'not_started' | 'in_progress' | 'completed'
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (email, module_id)
);

-- 8. Tabel vouchers (kode diskon checkout)
create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null default 'percent',       -- 'percent' | 'amount'
  value numeric not null default 0,           -- persentase (10 = 10%) atau nominal (50000 = Rp 50.000)
  tier text not null default 'all',           -- 'yearly' | 'lifetime' | 'all'
  max_uses integer,                           -- null = unlimited
  used_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.members enable row level security;
alter table public.admins enable row level security;
alter table public.site_content enable row level security;
alter table public.leads enable row level security;
alter table public.modules enable row level security;
alter table public.member_progress enable row level security;
alter table public.vouchers enable row level security;

-- members: user cuma bisa baca baris sendiri
drop policy if exists "members read own" on public.members;
create policy "members read own" on public.members for select
  using (auth.jwt() ->> 'email' = email);

-- members: admin bisa baca semua member (dashboard)
drop policy if exists "members read admin" on public.members;
create policy "members read admin" on public.members for select
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

-- admins: user cuma bisa baca apakah dirinya admin (by email)
drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select
  using (auth.jwt() ->> 'email' = email);

-- site_content: SEMUA orang bisa baca (konten publik landing page)
drop policy if exists "content read all" on public.site_content;
create policy "content read all" on public.site_content for select
  using (true);

-- site_content: cuma ADMIN yang bisa tulis/ubah
drop policy if exists "content write admin" on public.site_content;
create policy "content write admin" on public.site_content for insert
  with check (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

drop policy if exists "content update admin" on public.site_content;
create policy "content update admin" on public.site_content for update
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

-- members: service_role (n8n) boleh tulis — anon ga bisa
drop policy if exists "service insert members" on public.members;
create policy "service insert members" on public.members for insert
  with check (true);
drop policy if exists "service update members" on public.members;
create policy "service update members" on public.members for update
  using (true);

-- leads: SIAPA PUN boleh daftar (form publik landing page)
drop policy if exists "leads insert anon" on public.leads;
create policy "leads insert anon" on public.leads for insert
  with check (true);

-- leads: cuma ADMIN yang bisa baca / ubah / hapus
drop policy if exists "leads read admin" on public.leads;
create policy "leads read admin" on public.leads for select
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

drop policy if exists "leads update admin" on public.leads;
create policy "leads update admin" on public.leads for update
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ))
  with check (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

drop policy if exists "leads delete admin" on public.leads;
create policy "leads delete admin" on public.leads for delete
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

-- modules: baca semua orang, tulis cuma admin
drop policy if exists "modules read all" on public.modules;
create policy "modules read all" on public.modules for select
  using (true);

drop policy if exists "modules write admin" on public.modules;
create policy "modules write admin" on public.modules for insert
  with check (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

drop policy if exists "modules update admin" on public.modules;
create policy "modules update admin" on public.modules for update
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ))
  with check (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

drop policy if exists "modules delete admin" on public.modules;
create policy "modules delete admin" on public.modules for delete
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

-- member_progress: member cuma bisa baca & tulis progresnya sendiri
drop policy if exists "member_progress read own" on public.member_progress;
create policy "member_progress read own" on public.member_progress for select
  using (auth.jwt() ->> 'email' = email);

drop policy if exists "member_progress insert own" on public.member_progress;
create policy "member_progress insert own" on public.member_progress for insert
  with check (auth.jwt() ->> 'email' = email);

drop policy if exists "member_progress update own" on public.member_progress;
create policy "member_progress update own" on public.member_progress for update
  using (auth.jwt() ->> 'email' = email)
  with check (auth.jwt() ->> 'email' = email);

-- vouchers: SEMUA orang bisa baca (validasi kode voucher di checkout)
drop policy if exists "vouchers read all" on public.vouchers;
create policy "vouchers read all" on public.vouchers for select
  using (true);

-- vouchers: cuma ADMIN yang bisa tulis/ubah/hapus
drop policy if exists "vouchers write admin" on public.vouchers;
create policy "vouchers write admin" on public.vouchers for insert
  with check (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

drop policy if exists "vouchers update admin" on public.vouchers;
create policy "vouchers update admin" on public.vouchers for update
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ))
  with check (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

drop policy if exists "vouchers delete admin" on public.vouchers;
create policy "vouchers delete admin" on public.vouchers for delete
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

-- ============================================================
-- SEED: konten default + admin pertama
-- ============================================================

-- Admin pertama (email lo)
insert into public.admins (email) values ('evant.xinde@gmail.com')
on conflict (email) do nothing;

-- Status course (panel LMS admin) — default buka
insert into public.site_content (key, value) values
('course_status', '{"open": true}')
on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = 'seed';

-- Konten landing page — re-run akan UPDATE ke copy terbaru
insert into public.site_content (key, value) values
('homepage', '{
  "hero_title": "Bangun Karyawan Super Pintar — <span class=''hl''>Bantu semua kerjaan lo 24/7 No Baper</span>",
  "hero_subtitle": "Bukan cuma ChatGPT. Lo bakal punya agent yang follow-up calon client otomatis, riset prospek dalam 30 detik, bikin 10 caption promosi dalam 1 menit, dan jawab objeksi “mahal”, “nanti dulu”, “pikir-pikir”. <b>Tanpa coding.</b>",
  "video_youtube_id": "M7lc1UVf-VE",
  "video_caption": "intro.mp4 — kenapa sales person butuh AI agent sendiri (2:45)",
  "price_yearly": 599000,
  "price_lifetime": 999000,
  "discord_link": "https://discord.gg/xindelabs",
  "whatsapp_link": "https://wa.me/6281234567890",
  "instagram_handle": "@xindelabs.id",
  "testimonials": [
    {"quote": "Follow-up WA 40 calon client yang tadinya makan seharian, sekarang cuma 5 menit. Agent yang jawab, saya yang closing.", "name": "Rudi, Agen Properti Surabaya"},
    {"quote": "Saya orang marketing, bukan IT. Setup agent pertama saya selesai 1 malam sambil nonton video modul. Beneran no-coding.", "name": "Maya, Freelance Sales"},
    {"quote": "Objeksi “nanti dulu” itu yang paling sering. Sekarang agent saya yang handle, jawabannya konsisten dan ga ngecewain prospek.", "name": "Andi, Agen Asuransi Jakarta"}
  ],
  "faqs": [
    {"q": "Saya belum pernah ngoding. Bisa ikut?", "a": "Bisa. Course ini memang dibuat untuk sales person non-teknis. Semua pakai tools no-code (ChatGPT/Claude, Google Sheets, WhatsApp, n8n) yang tinggal disetel lewat panduan langkah demi langkah."},
    {"q": "Apa bedanya dengan ChatGPT biasa?", "a": "ChatGPT cuma bisa dipakai kalau lo buka chat-nya. Agent yang lo bangun di course ini jalan terus tanpa lo ketik ulang: follow-up otomatis, riset calon client, sampai laporan closing — 24 jam, tanpa capek."},
    {"q": "Ini khusus untuk sales tertentu?", "a": "Utamanya agen asuransi, agen properti, dan freelancer, tapi framework-nya dipakai semua jenis sales: kursus, b2b, jasa, sampai reseller."},
    {"q": "Paket Tahunan vs Lifetime bedanya apa?", "a": "Tahunan Rp 599.000: akses semua konten 1 tahun. Lifetime Rp 999.000: bayar sekali, akses selamanya + dapat update use-case baru tanpa biaya tambahan."},
    {"q": "Kalau saya tidak puas, ada refund?", "a": "Ada garansi uang kembali 7 hari. Kalau masih belum yakin course ini cocok dalam 7 hari pertama, kirim bukti ke WhatsApp kami dan kami refund penuh tanpa drama."},
    {"q": "Bagaimana cara bayarnya?", "a": "Bayar via Mayar (transfer bank, QRIS, atau e-wallet). Setelah pembayaran, link course + invite Discord dikirim otomatis ke email lo. Cek juga folder spam."},
    {"q": "Berapa lama saya butuh setiap hari?", "a": "Cukup 30–45 menit per hari selama 1–2 minggu. Tiap modul maksimal 30 menit, dan bisa diulang kapan saja."},
    {"q": "Apakah ada komunitasnya?", "a": "Ada. Setiap member masuk Discord Xinde Labs — tempat tanya-jawab, sharing prompt, dan sesi use-case update bareng member lain."}
  ]
}')
on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = 'seed';

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

drop trigger if exists trg_leads_updated on public.leads;
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists trg_modules_updated on public.modules;
create trigger trg_modules_updated before update on public.modules
  for each row execute function public.set_updated_at();

drop trigger if exists trg_member_progress_updated on public.member_progress;
create trigger trg_member_progress_updated before update on public.member_progress
  for each row execute function public.set_updated_at();

drop trigger if exists trg_vouchers_updated on public.vouchers;
create trigger trg_vouchers_updated before update on public.vouchers
  for each row execute function public.set_updated_at();

-- Index
create index if not exists idx_members_email on public.members (email);
create index if not exists idx_admins_email on public.admins (email);
create index if not exists idx_content_key on public.site_content (key);
create index if not exists idx_leads_status on public.leads (status);
create index if not exists idx_leads_created on public.leads (created_at desc);
create index if not exists idx_modules_sort on public.modules (sort);
create index if not exists idx_member_progress_email on public.member_progress (email);

-- ============================================================
-- STORAGE: bucket 'banners' untuk promo banner upload
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('banners', 'banners', true)
  on conflict (id) do update set public = true;

-- Semua orang bisa baca banner (public bucket)
drop policy if exists "banners read public" on storage.objects;
create policy "banners read public" on storage.objects for select
  using (bucket_id = 'banners');

-- Admin bisa upload (insert) ke bucket banners
drop policy if exists "banners insert admin" on storage.objects;
create policy "banners insert admin" on storage.objects for insert
  with check (
    bucket_id = 'banners'
    and exists (select 1 from public.admins where email = auth.jwt() ->> 'email')
  );

-- Admin bisa update file di bucket banners
drop policy if exists "banners update admin" on storage.objects;
create policy "banners update admin" on storage.objects for update
  using (
    bucket_id = 'banners'
    and exists (select 1 from public.admins where email = auth.jwt() ->> 'email')
  );

-- Admin bisa hapus file di bucket banners
drop policy if exists "banners delete admin" on storage.objects;
create policy "banners delete admin" on storage.objects for delete
  using (
    bucket_id = 'banners'
    and exists (select 1 from public.admins where email = auth.jwt() ->> 'email')
  );
