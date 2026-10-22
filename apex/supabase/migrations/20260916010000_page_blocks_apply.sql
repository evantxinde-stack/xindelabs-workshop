-- Block-based CMS: tiap halaman = urutan block yang bisa diedit dari /admin.
create table if not exists public.page_blocks (
  id uuid not null default gen_random_uuid() primary key,
  page text not null,
  sort_order integer not null default 0,
  block_type text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_page_blocks_page_order on public.page_blocks(page, sort_order);

alter table public.page_blocks enable row level security;
drop policy if exists "admin all page_blocks" on public.page_blocks;
create policy "admin all page_blocks" on public.page_blocks
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Seed: default blocks (konten awal seperti sebelumnya). Hanya jika tabel kosong, aman dijalankan ulang.
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
('vip', 1, 'youtube', '{"url": ""}'::jsonb),
('vip', 2, 'feature_list', '{
  "section_title": "What You Get",
  "features": "Mentor 1-on-1|Sesi private bersama mentor\nReview pekerjaan|Portofolio dan proyekmu dievaluasi langsung\nAkses grup VIP|Komunitas eksklusif peserta VIP\nSesi live bulanan|Tanya jawab & studi kasus\nModul bonus|Materi di luar tutorial gratis"
}'::jsonb),
('vip', 3, 'cta_card', '{
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
  "badge": "Fast-track",
  "title_a": "Belajar Cepat,",
  "title_b": "Langsung Jadi",
  "subtitle": "Jalan pintas dari tutorial gratis: panduan terstruktur untuk membangun agent AI yang sebenarnya.",
  "center": "0",
  "form": "0"
}'::jsonb),
('fast_track', 1, 'youtube', '{"url": ""}'::jsonb),
('fast_track', 2, 'feature_list', '{
  "section_title": "Value Stack",
  "features": "Akses materi Fast-track|Semua part lengkap\nTemplate agent siap pakai|Tinggal modifikasi\nPanduan langkah demi langkah|Dari nol sampai deploy\nGrup Fast-track|Tanya sesama peserta"
}'::jsonb),
('fast_track', 3, 'cta_card', '{
  "offer_title": "Offer Stack",
  "offer_points": "40+ video tutorial terstruktur\nSource code & template lengkap\nAkses permanen + update\nHarga sekali bayar",
  "price": "Rp149.000",
  "cta_txt": "Ya, Saya Mau Fast-track",
  "cta_href": "/checkout/fast_track",
  "cta_external": "0",
  "secondary_txt": "Tidak, cukup yang gratis saja",
  "secondary_href": "/join-group",
  "secondary_external": "0"
}'::jsonb),

('join_group', 0, 'hero', '{
  "badge": "",
  "title_a": "Gabung Komunitas",
  "title_b": "Gratis",
  "subtitle": "Belajar tetap bisa bareng-bareng di grup komunitas. Saling bantu, share progres, dan dapat info tutorial terbaru.",
  "center": "1",
  "form": "0"
}'::jsonb),
('join_group', 1, 'cta_card', '{
  "offer_title": "",
  "offer_points": "",
  "price": "",
  "cta_txt": "Gabung via WhatsApp",
  "cta_href": "https://wa.me/?text=Aku%20mau%20gabung%20komunitas",
  "cta_external": "1",
  "secondary_txt": "",
  "secondary_href": "",
  "secondary_external": "0"
}'::jsonb),
('join_group', 2, 'text', '{
  "content": "Link grup final akan diganti di konfigurasi.",
  "center": "1"
}'::jsonb);
end $$;