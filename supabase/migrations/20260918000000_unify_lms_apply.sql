-- ============================================================
-- UNIFIKASI FUNNEL + LMS — jalankan di SQL Editor pada project
-- Supabase LMS qxzvmnbhplgmspdxdbmg (bukan project funnel lama).
--
-- URUTAN:
--   1) jalankan file ini (buat schema + seed)
--   2) jalankan file import data dari funnel (20260918010000_data_import_apply.sql)
--   3) jalankan file ini SEKALI LAGI (refresh copy "Video Workshop")
-- File ini idempotent; aman diulang.
-- ============================================================

-- ---------- 1. leads: kolom funnel yg dibutuhkan + anon read ----------
alter table public.leads add column if not exists current_stage text not null default 'new';

-- Dibutuhkan funnel utk .select("id") setelah insert (return=representation) & lookup duplikat email.
drop policy if exists "anon read leads" on public.leads;
create policy "anon read leads" on public.leads
  for select to anon using (true);

-- ---------- 2. members: kolom kredensial LMS ----------
alter table public.members add column if not exists lms_password text;

-- ---------- 3. Tabel funnel ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  product text not null check (product in ('vip','fast_track')),
  tier text,
  voucher_code text,
  amount numeric(12,2) not null,
  mayar_invoice_id text,
  mayar_transaction_id text,
  status text not null default 'pending'
    check (status in ('pending','paid','closed','expired')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.orders add column if not exists tier text;
alter table public.orders add column if not exists voucher_code text;

create table if not exists public.pipeline_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author text not null default 'admin',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_sequences (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  subject text not null,
  html_body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.email_sequences(id) on delete cascade,
  step integer not null,
  day_offset integer not null default 0,
  template_id uuid not null references public.email_templates(id) on delete cascade,
  unique (sequence_id, step)
);

create table if not exists public.email_enrollments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  sequence_id uuid not null references public.email_sequences(id) on delete cascade,
  current_step integer not null default 0,
  enrolled_at timestamptz not null default now(),
  unique (lead_id, sequence_id)
);

create table if not exists public.email_queue (
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

create table if not exists public.email_logs (
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

create table if not exists public.unsubscribes (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.wa_templates (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.page_blocks (
  id uuid not null default gen_random_uuid() primary key,
  page text not null,
  sort_order integer not null default 0,
  block_type text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_page_blocks_page_order on public.page_blocks(page, sort_order);
create index if not exists idx_email_queue_due on public.email_queue(status, scheduled_for);
create index if not exists idx_email_enrollments_lead on public.email_enrollments(lead_id);

-- ---------- 4. Fungsi ----------
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

create or replace function public.enroll_lead_sequence(p_lead_id uuid, p_sequence_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq public.email_sequences%rowtype;
  v_step record;
  v_tpl public.email_templates%rowtype;
  v_enrolled timestamptz := now();
  v_lead public.leads%rowtype;
begin
  select * into v_seq from public.email_sequences where key = p_sequence_key;
  if not found then
    raise exception 'sequence % not found', p_sequence_key;
  end if;

  insert into public.email_enrollments (lead_id, sequence_id, enrolled_at)
  values (p_lead_id, v_seq.id, v_enrolled)
  on conflict (lead_id, sequence_id) do nothing;

  select * into v_lead from public.leads where id = p_lead_id;
  if not found then
    raise exception 'lead % not found', p_lead_id;
  end if;

  for v_step in
    select es.step, es.day_offset, es.template_id
    from public.email_steps es
    where es.sequence_id = v_seq.id
    order by es.step
  loop
    delete from public.email_queue
    where lead_id = p_lead_id and sequence_id = v_seq.id and step = v_step.step;

    select * into v_tpl from public.email_templates where id = v_step.template_id;
    insert into public.email_queue (
      lead_id, sequence_id, template_id, step, scheduled_for
    ) values (
      p_lead_id, v_seq.id, v_step.template_id, v_step.step,
      v_enrolled + make_interval(days => v_step.day_offset)
    );
  end loop;
end;
$$;

create or replace function public.on_lead_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enroll_lead_sequence(new.id, 'free_vip_upsell');
  return new;
end;
$$;

drop trigger if exists on_lead_created on public.leads;
create trigger on_lead_created after insert on public.leads
for each row execute function public.on_lead_created();

-- ---------- 5. RLS + policies ----------
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
alter table public.wa_templates enable row level security;
alter table public.page_blocks enable row level security;

drop policy if exists "anon insert pipeline_events" on public.pipeline_events;
create policy "anon insert pipeline_events" on public.pipeline_events
  for insert to anon with check (true);
drop policy if exists "anon insert unsubscribes" on public.unsubscribes;
create policy "anon insert unsubscribes" on public.unsubscribes
  for insert to anon with check (true);

-- Policy admin (authenticated) utk semua tabel funnel
do $$
declare
  t record;
begin
  for t in select unnest(array[
    'orders','pipeline_events','notes','email_sequences','email_templates',
    'email_steps','email_enrollments','email_queue','email_logs','unsubscribes',
    'admin_profiles','wa_templates','page_blocks'
  ]) as tbl
  loop
    execute format('drop policy if exists "admin all %s" on public.%s', t.tbl, t.tbl);
    execute format('create policy "admin all %s" on public.%s for all to authenticated using (public.is_admin()) with check (public.is_admin())', t.tbl, t.tbl);
  end loop;
end $$;

-- ---------- 6. Seed (hanya jika kosong) ----------
do $$
begin
  if exists (select 1 from public.email_sequences) then
    raise notice 'email_sequences sudah terisi; seed dilewati';
    return;
  end if;

  insert into public.email_sequences (key, name) values
    ('free_vip_upsell', 'Tutorial gratis → upsell Bimbingan VIP'),
    ('fasttrack_access', 'Video Workshop akses + grup + upsell VIP'),
    ('vip_onboarding', 'Onboarding VIP + grup + email dasar'),
    ('abandoned_checkout', 'Reminder pembayaran tertunda');

  insert into public.email_templates (key, subject, html_body) values
  ('free_vip_intro', 'Tutorial Hermes kamu sudah siap 🚀 (+ tawaran spesial)', '<p>Halo {{name}},</p><p>Akses Tutorial Hermes minimalis: ada di email berikutnya. Sekalian saya kasih tahu — kalau kamu mau dibimbing langsung sampai paham, Bimbingan VIP cuma sedikit slotnya bulan ini.</p><p><a href="{{vip_url}}">Lihat detail Bimbingan VIP</a></p>'),
  ('free_vip_bonus', 'Bonus: 3 alasan Bimbingan VIP menyesal kalau dilewati', '<p>Halo {{name}},</p><p>Banyak yang merasa sendirian saat belajar. Bimbingan VIP memberi: mentor 1-on-1, review pekerjaan, dan komunitas.</p><p><a href="{{vip_url}}">Cek kuota yang tersisa</a></p>'),
  ('free_vip_followup', 'Masih mikir-mikir soal Bimbingan VIP?', '<p>Halo {{name}},</p><p>Pertanyaan jujur: bagian mana yang bikin ragu? Balas email ini, saya bantu jawab langsung.</p><p><a href="{{vip_url}}">Lihat penawaran lengkapnya</a></p>'),
  ('free_vip_lastchance', 'Terakhir kali harga normal sebelum naik', '<p>Halo {{name}},</p><p>Kalau kamu tetap bertahan di jalur gratis, tidak masalah — grup komunitas selalu terbuka. Tapi kalau mau akselerasi penuh, harga Bimbingan VIP akan naik minggu depan.</p><p><a href="{{vip_url}}">Amankan harga sekarang</a></p>'),
  ('fasttrack_access', 'Akses Video Workshop kamu sudah siap 🎬', '<p>Halo {{name}},</p><p>Selamat! Akses Video Workshop sudah aktif. Gunakan kredensial di bawah ini untuk login ke LMS kapan saja.</p><p>LMS: <a href="{{lms_url}}">{{lms_url}}</a><br/>Email login: <b>{{lms_email}}</b><br/>Password: <b>{{lms_password}}</b></p><p><a href="{{lms_url}}">Buka Video Workshop saya</a></p>'),
  ('fasttrack_group', 'Gabung grup Workshop, bangun bareng', '<p>Halo {{name}},</p><p>Jangan belajar sendirian — gabung grup Workshop, tanya di mana pun kamu mentok, dan tunjukkan progresmu.</p><p><a href="{{group_url}}">Gabung grup sekarang</a></p>'),
  ('fasttrack_vip_offer', 'Harga spesial: naik kelas dari Workshop ke VIP', '<p>Halo {{name}},</p><p>Karena kamu sudah memiliki Video Workshop, kamu dapat harga spesial untuk naik ke Bimbingan VIP. Kuota terbatas.</p><p><a href="{{vip_url}}">Klaim harga spesial</a></p>'),
  ('vip_access', 'Selamat — kamu resmi Bimbingan VIP!', '<p>Halo {{name}},</p><p>Pembayaranmu berhasil. Akses VIP sudah aktif dan undangan grup VIP menyusul di email berikutnya.</p><p><a href="{{vip_url}}">Mulai sesi pertamamu</a></p>'),
  ('vip_group', 'Undangan grup VIP: jangan lewatkan', '<p>Halo {{name}},</p><p>Dukungan komunitas adalah bagian terbesar dari nilai VIP. Gabung sekarang supaya tidak ketinggalan sesi.</p><p><a href="{{group_url}}">Gabung grup VIP</a></p>'),
  ('vip_basic1', 'Cara paling cepat selesaikan materi VIP minggu ini', '<p>Halo {{name}},</p><p>Pola hari ini: 1 materi singkat, 1 praktek, 1 tanya. Jangan menumpuk, lakukan sedikit demi sedikit.</p>'),
  ('vip_basic2', 'Check-in mingguan: progresmu minggu ini', '<p>Halo {{name}},</p><p>Sudah sampai mana materi kamu? Kirim progres ke mentor atau balas email ini supaya kami bisa bantu lewat.</p>'),
  ('checkout_reminder', 'Pesanan kamu masih menunggu pembayaran', '<p>Halo {{name}},</p><p>Link pembayaran kamu masih aktif. Jangan sampai kehilangan slot.</p><p><a href="{{checkout_url}}">Selesaikan pembayaran</a></p>'),
  ('checkout_lastcall', 'Sobat, ini pengingat terakhir pembayaranmu', '<p>Halo {{name}},</p><p>Invoice akan kedaluwarsa sebentar lagi. Selesaikan sekarang atau slot kembali ke antrian.</p><p><a href="{{checkout_url}}">Bayar sekarang</a></p>');

  insert into public.email_steps (sequence_id, step, day_offset, template_id)
  select s.id, x.step, x.day_offset, t.id
  from (values
    ('free_vip_upsell', 'free_vip_intro',            0,  0),
    ('free_vip_upsell', 'free_vip_bonus',            1,  3),
    ('free_vip_upsell', 'free_vip_followup',         2,  7),
    ('free_vip_upsell', 'free_vip_lastchance',       3, 14),
    ('fasttrack_access', 'fasttrack_access',         0,  0),
    ('fasttrack_access', 'fasttrack_group',          1,  1),
    ('fasttrack_access', 'fasttrack_vip_offer',      2,  5),
    ('vip_onboarding', 'vip_access',                 0,  0),
    ('vip_onboarding', 'vip_group',                  1,  1),
    ('vip_onboarding', 'vip_basic1',                 2,  5),
    ('vip_onboarding', 'vip_basic2',                 3, 10),
    ('abandoned_checkout', 'checkout_reminder',      0,  0),
    ('abandoned_checkout', 'checkout_lastcall',      1,  2)
  ) as x(seq_key, tpl_key, step, day_offset)
  join public.email_sequences s on s.key = x.seq_key
  join public.email_templates t on t.key = x.tpl_key;
end $$;

do $$
begin
  if exists (select 1 from public.wa_templates) then
    raise notice 'wa_templates sudah terisi; seed dilewati';
    return;
  end if;
  insert into public.wa_templates (name, content) values
  ('Follow-up standar', 'Halo {{name}}, ini dari Tim Tutorial Hermes. Gimana pengalaman kamu membaca tutorial gratis kemarin? Kalau ada bagian yang masih bingung atau mau dipandu lebih lanjut, aku siap bantu lewat Video Workshop. Cukup balas pesan ini ya.');
end $$;

do $$
begin
  if exists (select 1 from public.page_blocks) then
    raise notice 'page_blocks sudah terisi; seed dilewati';
    return;
  end if;
  insert into public.page_blocks (page, sort_order, block_type, props) values
  ('home', 0, 'hero', '{
    "badge": "Tutorial Gratis",
    "title_a": "Tutorial Hermes",
    "title_b": "Bangun Agent AI pertamamu",
    "subtitle": "Pelajari cara membangun agent AI dari nol dengan materi ringkas, langkah demi langkah, yang langsung bisa kamu praktekan.",
    "bullets": "Materi ringkas dan fokus, tanpa basa-basi\nLangsung dipraktekkan, bukan cuma teori\nBisa dikerjakan dari HP maupun laptop",
    "center": "0",
    "form": "1",
    "form_title": "Ambil Tutorial Gratis",
    "form_subtitle": "Isi data di bawah, materi dikirim langsung ke email kamu.",
    "button_txt": "Ambil Tutorial Gratis",
    "button_txt_loading": "Memproses…",
    "button_note": "Gratis selamanya. Tanpa kartu kredit."
  }'::jsonb),
  ('vip', 0, 'hero', '{
    "badge": "Bimbingan VIP",
    "title_a": "Dibimbing Langsung",
    "title_b": "Sampai Paham",
    "subtitle": "Untuk yang tidak mau belajar sendiri dan ingin hasil lebih cepat, Bimbingan VIP mendampingi kamu 1-on-1.",
    "center": "0",
    "form": "0"
  }'::jsonb),
  ('vip', 1, 'feature_list', '{
    "section_title": "What You Get",
    "features": "Mentor 1-on-1|Sesi private bersama mentor\nReview pekerjaan|Portofolio dan proyekmu dievaluasi langsung\nAkses grup VIP|Komunitas eksklusif peserta VIP\nSesi live bulanan|Tanya jawab & studi kasus\nModul bonus|Materi di luar tutorial gratis"
  }'::jsonb),
  ('vip', 2, 'cta_card', '{
    "offer_title": "Penawaran Hari Ini",
    "offer_points": "4 sesi mentor 1-on-1\nAkses penuh seluruh modul & bonus\nKarena baru mulai: harga intro",
    "price": "Rp2.999.000",
    "cta_txt": "Ya, Saya Mau Bimbingan VIP",
    "cta_href": "/checkout/vip",
    "cta_external": "0",
    "secondary_txt": "Tidak, cukup Tutorial Gratis saja",
    "secondary_href": "/fast-track",
    "secondary_external": "0"
  }'::jsonb),
  ('fast_track', 0, 'hero', '{
    "badge": "Video Workshop",
    "title_a": "Belajar Membangun Agent AI,",
    "title_b": "Langsung Dipraktikkan",
    "subtitle": "Video workshop terstruktur untuk membangun agent AI yang bantu kerjaan lo 24/7 — tanpa coding, dari nol sampai deploy.",
    "center": "0",
    "form": "0"
  }'::jsonb),
  ('fast_track', 1, 'feature_list', '{
    "section_title": "What You Get",
    "features": "9 modul video step-by-step|Dari nol sampai deploy\nTemplate agent siap pakai|Tinggal modifikasi\nAkses tahunan / seumur hidup|Sesuai paket yang dipilih\nGrup Workshop|Tanya sesama peserta"
  }'::jsonb),
  ('fast_track', 2, 'cta_card', '{
    "offer_title": "Offer Stack",
    "offer_points": "9 modul video workshop\nSource code & template lengkap\nPaket tahunan atau lifetime\nHarga sekali bayar",
    "price": "Rp599.000 / tahun · Rp999.000 lifetime",
    "cta_txt": "Ya, Saya Mau Video Workshop",
    "cta_href": "/checkout/fast_track",
    "cta_external": "0",
    "secondary_txt": "Tidak, cukup yang gratis saja",
    "secondary_href": "/join-group",
    "secondary_external": "0"
  }'::jsonb),
  ('join_group', 0, 'cta_card', '{
    "offer_title": "",
    "offer_points": "",
    "price": "",
    "cta_txt": "Gabung via WhatsApp",
    "cta_href": "https://wa.me/?text=Aku%20mau%20gabung%20komunitas",
    "cta_external": "1",
    "secondary_txt": "",
    "secondary_href": "",
    "secondary_external": "0"
  }'::jsonb);
end $$;

-- ---------- 7. Refresh copy "Video Workshop" (jalankan ulang SETELAH import data) ----------
delete from public.page_blocks where page = 'fast_track';
insert into public.page_blocks (page, sort_order, block_type, props) values
('fast_track', 0, 'hero', '{
  "badge": "Video Workshop",
  "title_a": "Belajar Membangun Agent AI,",
  "title_b": "Langsung Dipraktikkan",
  "subtitle": "Video workshop terstruktur untuk membangun agent AI yang bantu kerjaan lo 24/7 — tanpa coding, dari nol sampai deploy.",
  "center": "0",
  "form": "0"
}'::jsonb),
('fast_track', 1, 'feature_list', '{
  "section_title": "What You Get",
  "features": "9 modul video step-by-step|Dari nol sampai deploy\nTemplate agent siap pakai|Tinggal modifikasi\nAkses tahunan / seumur hidup|Sesuai paket yang dipilih\nGrup Workshop|Tanya sesama peserta"
}'::jsonb),
('fast_track', 2, 'cta_card', '{
  "offer_title": "Offer Stack",
  "offer_points": "9 modul video workshop\nSource code & template lengkap\nPaket tahunan atau lifetime\nHarga sekali bayar",
  "price": "Rp599.000 / tahun · Rp999.000 lifetime",
  "cta_txt": "Ya, Saya Mau Video Workshop",
  "cta_href": "/checkout/fast_track",
  "cta_external": "0",
  "secondary_txt": "Tidak, cukup yang gratis saja",
  "secondary_href": "/join-group",
  "secondary_external": "0"
}'::jsonb);

insert into public.email_templates (key, subject, html_body) values
('fasttrack_access', 'Akses Video Workshop kamu sudah siap 🎬', '<p>Halo {{name}},</p><p>Selamat! Akses Video Workshop sudah aktif. Gunakan kredensial di bawah ini untuk login ke LMS kapan saja.</p><p>LMS: <a href="{{lms_url}}">{{lms_url}}</a><br/>Email login: <b>{{lms_email}}</b><br/>Password: <b>{{lms_password}}</b></p><p><a href="{{lms_url}}">Buka Video Workshop saya</a></p>'),
('fasttrack_group', 'Gabung grup Workshop, bangun bareng', '<p>Halo {{name}},</p><p>Jangan belajar sendirian — gabung grup Workshop, tanya di mana pun kamu mentok, dan tunjukkan progresmu.</p><p><a href="{{group_url}}">Gabung grup sekarang</a></p>'),
('fasttrack_vip_offer', 'Harga spesial: naik kelas dari Workshop ke VIP', '<p>Halo {{name}},</p><p>Karena kamu sudah memiliki Video Workshop, kamu dapat harga spesial untuk naik ke Bimbingan VIP. Kuota terbatas.</p><p><a href="{{vip_url}}">Klaim harga spesial</a></p>')
on conflict (key) do update set subject = excluded.subject, html_body = excluded.html_body;

update public.wa_templates set content = 'Halo {{name}}, ini dari Tim Tutorial Hermes. Gimana pengalaman kamu membaca tutorial gratis kemarin? Kalau ada bagian yang masih bingung atau mau dipandu lebih lanjut, aku siap bantu lewat Video Workshop. Cukup balas pesan ini ya.'
where name = 'Follow-up standar';