-- ============================================================
-- SEED FUNNEL - AMAN (never abort)
-- VERSI AMAN: semua statement dibungkus exception handler.
-- 1 statement gagal = hanya NOTICE, file LANJUT (tidak rollback).
-- Idempotent: aman dijalankan berulang kali.
-- Jalankan SETELAH sql/migrate_2026_admin.sql
-- ============================================================

do $b$ begin
  execute $q$
alter table if exists public.funnels add column if not exists slug text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnels add column if not exists subdomain text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnels add column if not exists thankyou_url text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnels add column if not exists upsell_url text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnels add column if not exists currency text default 'IDR'
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnels add column if not exists settings jsonb default '{}'::jsonb
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnels add column if not exists updated_at timestamptz default now()
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnels add column if not exists meta_pixel_id text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnels add column if not exists is_active boolean default true
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnel_steps add column if not exists sort integer default 0
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnel_steps add column if not exists type text default 'content'
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnel_steps add column if not exists title text
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnel_steps add column if not exists blocks jsonb default '[]'::jsonb
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnel_steps add column if not exists meta jsonb default '{}'::jsonb
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnel_steps add column if not exists is_active boolean default true
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
alter table if exists public.funnel_steps add column if not exists updated_at timestamptz default now()
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
update public.funnels set slug = lower(regexp_replace(coalesce(subdomain,name,'funnel'),'[^a-zA-Z0-9]+','-','g')) where slug is null or slug = ''
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
update public.funnels f set slug = f.slug || '-' || left(f.id::text,8) where f.slug is not null and exists (select 1 from public.funnels g where g.slug = f.slug and g.id <> f.id)
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
create unique index if not exists funnels_subdomain_key on public.funnels (subdomain)
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
create unique index if not exists funnels_slug_key on public.funnels (slug)
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
do $b$ begin
  execute $q$
create unique index if not exists funnel_steps_funnel_slug_key on public.funnel_steps (funnel_id, slug)
  $q$;
exception when others then
  raise notice 'SKIP: %', sqlerrm;
end $b$;
-- ============================================================
-- SEED DATA untuk Funnel Engine (aman dijalankan ulang)
-- Jalankan di Supabase SQL Editor
-- ============================================================
do $b$ begin
  execute $q$
-- 1) Funnel utama: slug 'hermes' -> heremes.xindelabs.web.id
insert into public.funnels (slug, subdomain, name, meta_pixel_id, thankyou_url, upsell_url, currency, is_active, settings)
values (
'hermes',
'hermes',
'Hermes Agent - Multi Step Funnel',
'921699146613715',
'/thankyou',
'/upsell',
'IDR',
true,
'{"checkout_mode":"embedded","skip_upsell":false}'::jsonb
)
on conflict (subdomain) do update
set name = excluded.name,
meta_pixel_id = excluded.meta_pixel_id,
settings = excluded.settings,
updated_at = now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 1, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- 2) Funnel contoh kedua: subdomain 'promo'
insert into public.funnels (slug, subdomain, name, meta_pixel_id, thankyou_url, upsell_url, currency, is_active, settings)
values (
'promo',
'promo',
'Promo Kursus - Standalone Checkout',
'921699146613715',
'/thankyou',
'/upsell',
'IDR',
true,
'{"checkout_mode":"standalone","skip_upsell":false}'::jsonb
)
on conflict (subdomain) do update
set name = excluded.name,
settings = excluded.settings,
updated_at = now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 2, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- 3) Step 1: Landing (Hero + Problem + Video VSL + Benefit)
insert into public.funnel_steps (funnel_id, sort, slug, type, title, blocks)
select f.id, 1, 'landing', 'landing', 'Kenalan Dulu',
$$[
{"type":"hero","data":{
"eyebrow":"Kelas Praktis 2026",
"title":"Bangun Hermes Agent Lo Sendiri",
"subtitle":"Belajar fundamental cara ngomong ke AI, loop engineering, sampai hubungkan AI agent ke channel kerja lo. Tanpa coding.",
"cta_text":"Tonton Kelas Gratis",
"cta_anchor":"cta",
"badge":"Maksimal 50 peserta"
}},
{"type":"problem","data":{
"title":"Kenapa AI Agent Lo Belum Nggak Ngefes?",
"description":"Masalah yang hampir semua tim sales & marketing temuin.",
"items":[
{"title":"ChatGPT Ketinggalan Konteks","desc":"Setiap obrolan baru mulai dari nol, harus briefing ulang tiap hari."},
{"title":"Follow-up Lupa","desc":"Calon client yang belum di-chat hari ini langsung hilang dari radar."},
{"title":"Data Berantakan","desc":"Prospek, order, dan laporan nyebar di chat, sheet, dan kepala masing-masing."}
]
}},
{"type":"video_vsl","data":{
"video_url":"https://www.youtube.com/embed/M7lc1UVf-VE",
"caption":"Intro: kenapa sales person butuh AI agent sendiri (2:45)"
}},
{"type":"benefit","data":{
"title":"Yang Kamu Dapat Setelah Selesai",
"items":[
{"title":"Agent yang Menjual","desc":"AI agent yang follow-up calon client otomatis 24/7 tanpa baper."},
{"title":"Riset 30 Detik","desc":"Riset prospek & bikin konten promosi dalam hitungan detik."},
{"title":"Rekap Otomatis","desc":"Laporan harian ke channel kerja lo tanpa harus ngerangkum manual."}
]
}}
]$$::jsonb
from public.funnels f where f.subdomain = 'hermes'
on conflict (funnel_id, slug) do update set blocks = excluded.blocks, title = excluded.title, sort = excluded.sort, updated_at = now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 3, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- 4) Step 2: Kurikulum + Pricing
insert into public.funnel_steps (funnel_id, sort, slug, type, title, blocks)
select f.id, 2, 'kurikulum', 'landing', 'Kurikulum & Harga',
$$[
{"type":"kurikulum","data":{
"title":"Apa yang Bakal Lo Kuasai",
"items":[
{"title":"Modul 1 - Fondasi Ngobrol AI","desc":"Membedah cara kerja LLM, prompt engineering untuk sales, dan cara bikin AI yang ngerti konteks bisnis lo."},
{"title":"Modul 2 - Loop Engineering","desc":"Membangun alur kerja agent: input, proses, output, dan feedback loop yang jalan otomatis."},
{"title":"Modul 3 - Integrasi Channel","desc":"Menyambungkan agent ke WhatsApp, Google Sheets, dan n8n tanpa coding."},
{"title":"Modul 4 - Scaling & Optimasi","desc":"Cara bikin agent makin pintar dari data, plus template siap pakai untuk 12 use case."}
]
}},
{"type":"pricing","data":{
"title":"Pilih Paket yang Sesuai",
"description":"Bayar sekali, akses selamanya. Upgrade kapan saja.",
"tiers":[
{"id":"yearly","name":"Tahunan","price":599000,"original_price":999000,"period":"per tahun","highlight":true,"cta_text":"Ambil Paket Tahunan","features":["Semua modul + update","Template siap pakai","Group komunitas","Konsultasi 2x/bulan"]},
{"id":"lifetime","name":"Lifetime","price":999000,"period":"sekali bayar, selamanya","cta_text":"Ambil Paket Lifetime","features":["Semua modul + update seumur hidup","Template siap pakai","Group komunitas VIP","Konsultasi unlimited 1 tahun"]}
]
}},
{"type":"faq","data":{
"title":"Pertanyaan yang Sering Muncul",
"items":[
{"q":"Saya belum pernah ngoding. Bisa ikut?","a":"Bisa. Semua pakai tools no-code (ChatGPT/Claude, Google Sheets, WhatsApp, n8n) yang tinggal disetel lewat panduan langkah demi langkah."},
{"q":"Berapa lama aksesnya?","a":"Paket tahunan berlaku 1 tahun sejak aktivasi. Paket lifetime berlaku selamanya, termasuk update modul berikutnya."},
{"q":"Kalau ngerasa kurang cocok gimana?","a":"Ada garansi 7 hari. Kalau modul tidak membantu, cukup kirim bukti dan dana dikembalikan penuh."}
]
}}
]$$::jsonb
from public.funnels f where f.subdomain = 'hermes'
on conflict (funnel_id, slug) do update set blocks = excluded.blocks, title = excluded.title, sort = excluded.sort, updated_at = now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 4, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- 5) Step 3: CTA + Opt-in Form
insert into public.funnel_steps (funnel_id, sort, slug, type, title, blocks)
select f.id, 3, 'cta', 'landing', 'Ambil Kelas Gratis',
$$[
{"type":"cta","data":{
"title":"Mulai dari Tutorial Gratis Dulu",
"subtitle":"Isi form di bawah, kamu langsung dapat akses video tutorial gratis + template agent siap pakai.",
"primary_text":"Lihat Harga & Daftar",
"form":true,
"form_title":"Dapatkan Akses Tutorial Gratis",
"form_description":"Tanpa akun, tanpa password. Cuma nama + email.",
"form_button":"Kirim & Dapatkan Akses"
}}
]$$::jsonb
from public.funnels f where f.subdomain = 'hermes'
on conflict (funnel_id, slug) do update set blocks = excluded.blocks, title = excluded.title, sort = excluded.sort, updated_at = now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 5, sqlerrm;
end $b$;

do $b$ begin
  execute $q$
-- 6) Step 4 (checkout) untuk funnel 'promo' (mode standalone)
insert into public.funnel_steps (funnel_id, sort, slug, type, title, blocks)
select f.id, 1, 'offer', 'landing', 'Penawaran Kursus',
$$[
{"type":"hero","data":{
"eyebrow":"Promo Terbatas",
"title":"Kursus Hermes Agent Lengkap",
"subtitle":"Semua modul, template siap pakai, dan komunitas private. Harga naik bulan depan.",
"cta_text":"Ambil Sekarang"
}},
{"type":"pricing","data":{
"title":"Pilih Tier",
"tiers":[
{"id":"starter","name":"Starter","price":299000,"features":["Modul 1-2","Template dasar"],"cta_text":"Pilih Starter"},
{"id":"pro","name":"Pro","price":599000,"highlight":true,"features":["Semua modul","Semua template","Konsultasi bulanan"],"cta_text":"Pilih Pro"}
]
}}
]$$::jsonb
from public.funnels f where f.subdomain = 'promo'
on conflict (funnel_id, slug) do update set blocks = excluded.blocks, title = excluded.title, sort = excluded.sort, updated_at = now()
  $q$;
exception when others then
  raise notice 'SKIP statement #% : %', 6, sqlerrm;
end $b$;

