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
  key text not null unique,        -- 'homepage' (landing utama) atau 'lp_<slug>' (landing custom)
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

-- 9. Tabel affiliates (program referral — member berbayar)
create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,               -- harus email member berbayar
  code text not null unique,                -- kode referral (dipakai di ?ref=)
  status text not null default 'active',    -- 'active' | 'disabled'
  commission_type text not null default 'percent', -- 'percent' | 'amount'
  commission_value numeric not null default 20,    -- 20 = 20% atau 20000 = Rp 20.000
  clicks integer not null default 0,        -- jumlah klik link referral
  note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. Tabel affiliate_commissions (komisi per penjualan yang berhasil)
create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_code text not null,
  affiliate_email text default '',
  customer_email text default '',
  order_ref text default '',                -- referensi transaksi Mayar (anti dobel)
  tier text default '',
  sale_amount numeric not null default 0,   -- harga yang dibayar customer
  commission_amount numeric not null default 0,
  status text not null default 'pending',   -- 'pending' | 'paid' | 'void'
  paid_at timestamptz,
  note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Leads: simpan kode referral yang dipakai saat checkout
alter table public.leads add column if not exists ref text default '';

create index if not exists idx_affiliate_commissions_code on public.affiliate_commissions (affiliate_code);
create unique index if not exists affiliate_commissions_order_ref_key
  on public.affiliate_commissions (order_ref)
  where coalesce(order_ref, '') <> '';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.affiliates enable row level security;
alter table public.affiliate_commissions enable row level security;
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

-- site_content: cuma ADMIN yang bisa tulis/ubah
drop policy if exists "content read all" on public.site_content;
drop policy if exists "content write admin" on public.site_content;
drop policy if exists "content update admin" on public.site_content;

create policy "content read all" on public.site_content for select
  using (true);

create policy "content admin all" on public.site_content for all
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ))
  with check (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

-- members: HANYA service_role (n8n) yang boleh tulis.
-- wajib: tanpa ini, siapa pun yang punya anon key bisa update status='paid' ke dirinya sendiri.
drop policy if exists "service insert members" on public.members;
create policy "service insert members" on public.members for insert
  with check (auth.role() = 'service_role');
drop policy if exists "service update members" on public.members;
create policy "service update members" on public.members for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

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

-- modules: baca cuma ADMIN atau MEMBER BERBAYAR, tulis cuma admin.
-- wajib: kolom video_id isinya ID video YouTube course — kalau publik, semua
-- video bisa ditarik anon lewat PostgREST tanpa login.
drop policy if exists "modules read all" on public.modules;
drop policy if exists "modules read member/admin" on public.modules;
create policy "modules read member/admin" on public.modules for select
  using (
    exists (select 1 from public.admins where email = auth.jwt() ->> 'email')
    or (
      auth.role() = 'authenticated'
      and exists (
        select 1 from public.members m
        where m.email = auth.jwt() ->> 'email'
          and m.status = 'paid'
      )
    )
  );

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

-- affiliates: member cuma bisa baca barisnya sendiri, admin kelola semua.
-- Baris affiliate BARU dibuat lewat RPC affiliate_self_enroll() (anti tamper:
-- member tidak boleh nentuin commission_value sendiri).
drop policy if exists "affiliates read own" on public.affiliates;
create policy "affiliates read own" on public.affiliates for select
  using (auth.jwt() ->> 'email' = email);

drop policy if exists "affiliates read admin" on public.affiliates;
create policy "affiliates read admin" on public.affiliates for select
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

drop policy if exists "affiliates write admin" on public.affiliates;
create policy "affiliates write admin" on public.affiliates for all
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ))
  with check (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

-- affiliate_commissions: member baca komisi sendiri, admin kelola semua.
-- Baris komisi dibuat oleh n8n lewat RPC record_affiliate_commission() (service_role).
drop policy if exists "affiliate_commissions read own" on public.affiliate_commissions;
create policy "affiliate_commissions read own" on public.affiliate_commissions for select
  using (auth.jwt() ->> 'email' = affiliate_email);

drop policy if exists "affiliate_commissions read admin" on public.affiliate_commissions;
create policy "affiliate_commissions read admin" on public.affiliate_commissions for select
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ));

drop policy if exists "affiliate_commissions write admin" on public.affiliate_commissions;
create policy "affiliate_commissions write admin" on public.affiliate_commissions for all
  using (exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  ))
  with check (exists (
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

drop trigger if exists trg_affiliates_updated on public.affiliates;
create trigger trg_affiliates_updated before update on public.affiliates
  for each row execute function public.set_updated_at();

drop trigger if exists trg_affiliate_commissions_updated on public.affiliate_commissions;
create trigger trg_affiliate_commissions_updated before update on public.affiliate_commissions
  for each row execute function public.set_updated_at();

-- Index
create index if not exists idx_members_email on public.members (email);
create index if not exists idx_admins_email on public.admins (email);
create index if not exists idx_content_key on public.site_content (key);
create index if not exists idx_leads_status on public.leads (status);
create index if not exists idx_leads_created on public.leads (created_at desc);
create index if not exists idx_modules_sort on public.modules (sort);
create index if not exists idx_member_progress_email on public.member_progress (email);
create index if not exists idx_affiliates_email on public.affiliates (email);
create index if not exists idx_affiliates_code on public.affiliates (code);
create index if not exists idx_affiliate_commissions_email on public.affiliate_commissions (affiliate_email);

-- ============================================================
-- FUNGSI AFFILIATE (lihat bagian AFFILIATE di bawah untuk penjelasan)
-- ============================================================
create or replace function public.affiliate_track_click(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(p_code, '') = '' then return; end if;
  update public.affiliates
     set clicks = clicks + 1
   where upper(code) = upper(p_code)
     and status = 'active';
end;
$$;

create or replace function public.affiliate_self_enroll()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_paid boolean;
  v_row public.affiliates;
  v_local text;
  v_code text;
  v_try integer := 0;
begin
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' then
    raise exception 'Harus login dulu buat jadi affiliate';
  end if;

  select true into v_paid from public.members
   where lower(email) = v_email and status = 'paid'
   limit 1;
  if v_paid is distinct from true then
    raise exception 'Cuma member berbayar yang bisa jadi affiliate';
  end if;

  select * into v_row from public.affiliates where lower(email) = v_email limit 1;
  if found then
    if v_row.status = 'disabled' then
      raise exception 'Affiliate akun lo lagi dinonaktifkan admin';
    end if;
    return jsonb_build_object('ok', true, 'created', false,
      'code', v_row.code, 'status', v_row.status,
      'commission_type', v_row.commission_type, 'commission_value', v_row.commission_value);
  end if;

  v_local := regexp_replace(split_part(v_email, '@', 1), '[^a-z0-9]', '', 'g');
  if length(v_local) < 3 then v_local := 'member'; end if;

  loop
    v_try := v_try + 1;
    v_code := upper(left(v_local, 6)) || lpad(floor(random() * 10000)::text, 4, '0');
    exit when not exists (select 1 from public.affiliates where code = v_code);
    if v_try > 20 then v_code := 'AFF' || upper(substr(md5(random()::text), 1, 7)); exit; end if;
  end loop;

  insert into public.affiliates (email, code)
  values (v_email, v_code)
  returning * into v_row;

  return jsonb_build_object('ok', true, 'created', true,
    'code', v_row.code, 'status', v_row.status,
    'commission_type', v_row.commission_type, 'commission_value', v_row.commission_value);
end;
$$;

create or replace function public.record_affiliate_commission(
  p_email text, p_reference text, p_tier text, p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_aff public.affiliates;
  v_commission numeric;
  v_ref text;
begin
  if coalesce(trim(p_email), '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'no_email');
  end if;

  -- Cari kode referral dari lead terakhir dengan email yang sama (diisi saat checkout)
  select ref into v_code
    from public.leads
   where lower(email) = lower(trim(p_email))
     and coalesce(ref, '') <> ''
   order by created_at desc
   limit 1;

  if coalesce(v_code, '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'no_ref');
  end if;

  select * into v_aff from public.affiliates where upper(code) = upper(trim(v_code)) limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'affiliate_not_found', 'code', v_code);
  end if;
  if v_aff.status <> 'active' then
    return jsonb_build_object('ok', false, 'reason', 'affiliate_disabled', 'code', v_code);
  end if;

  if v_aff.commission_type = 'amount' then
    v_commission := least(greatest(v_aff.commission_value, 0), greatest(coalesce(p_amount, 0), 0));
  else
    v_commission := round(greatest(coalesce(p_amount, 0), 0) * greatest(v_aff.commission_value, 0) / 100.0, 0);
  end if;

  -- order_ref: kalau kosong, bikin kunci fallback supaya tetap anti-dobel
  v_ref := trim(coalesce(p_reference, ''));
  if v_ref = '' then
    v_ref := lower(trim(p_email)) || ':' || coalesce(p_tier, '') || ':' ||
             coalesce(p_amount, 0)::text || ':' || to_char(now(), 'YYYYMMDD');
  end if;

  insert into public.affiliate_commissions
    (affiliate_code, affiliate_email, customer_email, order_ref, tier, sale_amount, commission_amount, status)
  values
    (upper(v_aff.code), lower(v_aff.email), lower(trim(p_email)), v_ref,
     coalesce(p_tier, ''), greatest(coalesce(p_amount, 0), 0), v_commission, 'pending')
  on conflict do nothing;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'duplicate', 'ref', v_ref);
  end if;

  return jsonb_build_object('ok', true, 'code', upper(v_aff.code), 'commission', v_commission);
end;
$$;

-- Hak akses fungsi (penting: commission cuma boleh dipanggil service_role/n8n)
revoke all on function public.affiliate_track_click(text) from public;
grant execute on function public.affiliate_track_click(text) to anon, authenticated;

revoke all on function public.affiliate_self_enroll() from public;
grant execute on function public.affiliate_self_enroll() to authenticated;

revoke all on function public.record_affiliate_commission(text, text, text, numeric) from public;
revoke all on function public.record_affiliate_commission(text, text, text, numeric) from anon;
revoke all on function public.record_affiliate_commission(text, text, text, numeric) from authenticated;
grant execute on function public.record_affiliate_commission(text, text, text, numeric) to service_role;

-- ============================================================
-- STORAGE: bucket 'banners' untuk promo banner upload
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('banners', 'banners', true)
  on conflict (id) do update set public = true;

-- Admin bisa upload/update/hapus file di bucket banners
drop policy if exists "banners insert admin" on storage.objects;
drop policy if exists "banners update admin" on storage.objects;
drop policy if exists "banners delete admin" on storage.objects;
drop policy if exists "banners read public" on storage.objects;
drop policy if exists "banners all auth" on storage.objects;

create policy "banners read public" on storage.objects for select
  using (bucket_id = 'banners');

create policy "banners all auth" on storage.objects for all
  using (bucket_id = 'banners' and auth.role() = 'authenticated')
  with check (bucket_id = 'banners' and auth.role() = 'authenticated');

-- ============================================================
-- MIGRATION 2026-10-02 — keamanan RLS (jalankan di DB yang SUDAH live)
-- 1) members: tulis hanya service_role (sebelumnya anon bisa set status='paid')
-- 2) modules: baca hanya admin / member paid (sebelumnya video_id bocor ke publik)
-- ============================================================
drop policy if exists "service insert members" on public.members;
create policy "service insert members" on public.members for insert
  with check (auth.role() = 'service_role');

drop policy if exists "service update members" on public.members;
create policy "service update members" on public.members for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "modules read all" on public.modules;
drop policy if exists "modules read member/admin" on public.modules;
create policy "modules read member/admin" on public.modules for select
  using (
    exists (select 1 from public.admins where email = auth.jwt() ->> 'email')
    or (
      auth.role() = 'authenticated'
      and exists (
        select 1 from public.members m
        where m.email = auth.jwt() ->> 'email'
          and m.status = 'paid'
      )
    )
  );

-- ============================================================
-- MIGRATION 2026-10-03 — SISTEM AFFILIATE
-- Jalankan blok ini di DB yang SUDAH live (bagian atas file juga
-- memuat definisi yang sama untuk instalasi baru).
-- Ringkas: tabel affiliates & affiliate_commissions, kolom leads.ref,
-- RLS, dan 3 fungsi (track click, self-enroll, catat komisi).
-- ============================================================
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

alter table public.leads add column if not exists ref text default '';

create index if not exists idx_affiliate_commissions_code on public.affiliate_commissions (affiliate_code);
create index if not exists idx_affiliates_email on public.affiliates (email);
create index if not exists idx_affiliates_code on public.affiliates (code);
create index if not exists idx_affiliate_commissions_email on public.affiliate_commissions (affiliate_email);
create unique index if not exists affiliate_commissions_order_ref_key
  on public.affiliate_commissions (order_ref)
  where coalesce(order_ref, '') <> '';

alter table public.affiliates enable row level security;
alter table public.affiliate_commissions enable row level security;

drop policy if exists "affiliates read own" on public.affiliates;
create policy "affiliates read own" on public.affiliates for select
  using (auth.jwt() ->> 'email' = email);
drop policy if exists "affiliates read admin" on public.affiliates;
create policy "affiliates read admin" on public.affiliates for select
  using (exists (select 1 from public.admins where email = auth.jwt() ->> 'email'));
drop policy if exists "affiliates write admin" on public.affiliates;
create policy "affiliates write admin" on public.affiliates for all
  using (exists (select 1 from public.admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from public.admins where email = auth.jwt() ->> 'email'));

drop policy if exists "affiliate_commissions read own" on public.affiliate_commissions;
create policy "affiliate_commissions read own" on public.affiliate_commissions for select
  using (auth.jwt() ->> 'email' = affiliate_email);
drop policy if exists "affiliate_commissions read admin" on public.affiliate_commissions;
create policy "affiliate_commissions read admin" on public.affiliate_commissions for select
  using (exists (select 1 from public.admins where email = auth.jwt() ->> 'email'));
drop policy if exists "affiliate_commissions write admin" on public.affiliate_commissions;
create policy "affiliate_commissions write admin" on public.affiliate_commissions for all
  using (exists (select 1 from public.admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from public.admins where email = auth.jwt() ->> 'email'));

drop trigger if exists trg_affiliates_updated on public.affiliates;
create trigger trg_affiliates_updated before update on public.affiliates
  for each row execute function public.set_updated_at();
drop trigger if exists trg_affiliate_commissions_updated on public.affiliate_commissions;
create trigger trg_affiliate_commissions_updated before update on public.affiliate_commissions
  for each row execute function public.set_updated_at();

-- Fungsi affiliate (definisi sama seperti di bagian atas file)
create or replace function public.affiliate_track_click(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(p_code, '') = '' then return; end if;
  update public.affiliates
     set clicks = clicks + 1
   where upper(code) = upper(p_code)
     and status = 'active';
end;
$$;

create or replace function public.affiliate_self_enroll()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_paid boolean;
  v_row public.affiliates;
  v_local text;
  v_code text;
  v_try integer := 0;
begin
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' then
    raise exception 'Harus login dulu buat jadi affiliate';
  end if;

  select true into v_paid from public.members
   where lower(email) = v_email and status = 'paid'
   limit 1;
  if v_paid is distinct from true then
    raise exception 'Cuma member berbayar yang bisa jadi affiliate';
  end if;

  select * into v_row from public.affiliates where lower(email) = v_email limit 1;
  if found then
    if v_row.status = 'disabled' then
      raise exception 'Affiliate akun lo lagi dinonaktifkan admin';
    end if;
    return jsonb_build_object('ok', true, 'created', false,
      'code', v_row.code, 'status', v_row.status,
      'commission_type', v_row.commission_type, 'commission_value', v_row.commission_value);
  end if;

  v_local := regexp_replace(split_part(v_email, '@', 1), '[^a-z0-9]', '', 'g');
  if length(v_local) < 3 then v_local := 'member'; end if;

  loop
    v_try := v_try + 1;
    v_code := upper(left(v_local, 6)) || lpad(floor(random() * 10000)::text, 4, '0');
    exit when not exists (select 1 from public.affiliates where code = v_code);
    if v_try > 20 then v_code := 'AFF' || upper(substr(md5(random()::text), 1, 7)); exit; end if;
  end loop;

  insert into public.affiliates (email, code)
  values (v_email, v_code)
  returning * into v_row;

  return jsonb_build_object('ok', true, 'created', true,
    'code', v_row.code, 'status', v_row.status,
    'commission_type', v_row.commission_type, 'commission_value', v_row.commission_value);
end;
$$;

create or replace function public.record_affiliate_commission(
  p_email text, p_reference text, p_tier text, p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_aff public.affiliates;
  v_commission numeric;
  v_ref text;
begin
  if coalesce(trim(p_email), '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'no_email');
  end if;

  select ref into v_code
    from public.leads
   where lower(email) = lower(trim(p_email))
     and coalesce(ref, '') <> ''
   order by created_at desc
   limit 1;

  if coalesce(v_code, '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'no_ref');
  end if;

  select * into v_aff from public.affiliates where upper(code) = upper(trim(v_code)) limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'affiliate_not_found', 'code', v_code);
  end if;
  if v_aff.status <> 'active' then
    return jsonb_build_object('ok', false, 'reason', 'affiliate_disabled', 'code', v_code);
  end if;

  if v_aff.commission_type = 'amount' then
    v_commission := least(greatest(v_aff.commission_value, 0), greatest(coalesce(p_amount, 0), 0));
  else
    v_commission := round(greatest(coalesce(p_amount, 0), 0) * greatest(v_aff.commission_value, 0) / 100.0, 0);
  end if;

  v_ref := trim(coalesce(p_reference, ''));
  if v_ref = '' then
    v_ref := lower(trim(p_email)) || ':' || coalesce(p_tier, '') || ':' ||
             coalesce(p_amount, 0)::text || ':' || to_char(now(), 'YYYYMMDD');
  end if;

  insert into public.affiliate_commissions
    (affiliate_code, affiliate_email, customer_email, order_ref, tier, sale_amount, commission_amount, status)
  values
    (upper(v_aff.code), lower(v_aff.email), lower(trim(p_email)), v_ref,
     coalesce(p_tier, ''), greatest(coalesce(p_amount, 0), 0), v_commission, 'pending')
  on conflict do nothing;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'duplicate', 'ref', v_ref);
  end if;

  return jsonb_build_object('ok', true, 'code', upper(v_aff.code), 'commission', v_commission);
end;
$$;

revoke all on function public.affiliate_track_click(text) from public;
grant execute on function public.affiliate_track_click(text) to anon, authenticated;

revoke all on function public.affiliate_self_enroll() from public;
grant execute on function public.affiliate_self_enroll() to authenticated;

revoke all on function public.record_affiliate_commission(text, text, text, numeric) from public;
revoke all on function public.record_affiliate_commission(text, text, text, numeric) from anon;
revoke all on function public.record_affiliate_commission(text, text, text, numeric) from authenticated;
grant execute on function public.record_affiliate_commission(text, text, text, numeric) to service_role;
