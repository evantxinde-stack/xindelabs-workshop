-- CMS landing: konten tiap halaman bisa diedit dari /admin.
create table if not exists public.site_content (
  page text not null,
  key text not null,
  value text not null default '',
  updated_at timestamptz not null default now(),
  primary key (page, key)
);

alter table public.site_content enable row level security;
create policy "admin all site_content" on public.site_content
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Seed default (sama dengan konten hardcoded awal).
insert into public.site_content (page, key, value) values
('home','badge_txt','Tutorial Gratis'),
('home','title_a','Tutorial Hermes'),
('home','title_b','Bangun Agent AI pertamamu'),
('home','subtitle','Pelajari cara membangun agent AI dari nol dengan materi ringkas, langkah demi langkah, yang langsung bisa kamu praktekan.'),
('home','bullets','Materi ringkas dan fokus, tanpa basa-basi
Langsung dipraktekkan, bukan cuma teori
Bisa dikerjakan dari HP maupun laptop'),
('home','form_title','Ambil Tutorial Gratis'),
('home','form_subtitle','Isi data di bawah, materi dikirim langsung ke email kamu.'),
('home','button_txt','Ambil Tutorial Gratis'),
('home','button_txt_loading','Memproses…'),
('home','button_note','Gratis selamanya. Tanpa kartu kredit.'),

('vip','badge_txt','Bimbingan VIP'),
('vip','title_a','Dibimbing Langsung'),
('vip','title_b','Sampai Paham'),
('vip','subtitle','Untuk yang tidak mau belajar sendiri dan ingin hasil lebih cepat, Bimbingan VIP mendampingi kamu 1-on-1.'),
('vip','section_title','What You Get'),
('vip','features','Mentor 1-on-1|Sesi private bersama mentor
Review pekerjaan|Portofolio dan proyekmu dievaluasi langsung
Akses grup VIP|Komunitas eksklusif peserta VIP
Sesi live bulanan|Tanya jawab & studi kasus
Modul bonus|Materi di luar tutorial gratis'),
('vip','offer_title','Penawaran Hari Ini'),
('vip','offer_points','4 sesi mentor 1-on-1
Akses penuh seluruh modul & bonus
Karena baru mulai: harga intro'),
('vip','price','Rp2.999.000'),
('vip','cta_txt','Ya, Saya Mau Bimbingan VIP'),
('vip','secondary_txt','Tidak, cukup Tutorial Gratis saja'),
('vip','youtube_url',''),

('fast_track','badge_txt','Fast-track'),
('fast_track','title_a','Belajar Cepat,'),
('fast_track','title_b','Langsung Jadi'),
('fast_track','subtitle','Jalan pintas dari tutorial gratis: panduan terstruktur untuk membangun agent AI yang sebenarnya.'),
('fast_track','section_title','Value Stack'),
('fast_track','features','Akses materi Fast-track|Semua part lengkap
Template agent siap pakai|Tinggal modifikasi
Panduan langkah demi langkah|Dari nol sampai deploy
Grup Fast-track|Tanya sesama peserta'),
('fast_track','offer_title','Offer Stack'),
('fast_track','offer_points','40+ video tutorial terstruktur
Source code & template lengkap
Akses permanen + update
Harga sekali bayar'),
('fast_track','price','Rp149.000'),
('fast_track','cta_txt','Ya, Saya Mau Fast-track'),
('fast_track','secondary_txt','Tidak, cukup yang gratis saja'),
('fast_track','youtube_url',''),

('join_group','title','Gabung Komunitas'), 
('join_group','title_accent','Gratis'),
('join_group','subtitle','Belajar tetap bisa bareng-bareng di grup komunitas. Saling bantu, share progres, dan dapat info tutorial terbaru.'),
('join_group','cta_txt','Gabung via WhatsApp'),
('join_group','note','Link grup final akan diganti di konfigurasi.'),
('join_group','wa_link','https://wa.me/?text=Aku%20mau%20gabung%20komunitas')
on conflict (page, key) do nothing;