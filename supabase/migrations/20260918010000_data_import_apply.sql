-- Data funnel lama (uemupigkoluivuvygciy) -> project LMS (qxzvmnbhplgmspdxdbmg).
-- Idempotent. Jalankan SETELAH 20260918000000_unify_lms_apply.sql.
-- Resolusi email_steps/enrollments/queue memakai key (bukan UUID) => FK aman walau seed sudah jalan.

-- page_blocks home/join_group/vip: pakai konten project lama (hapus seed A lalu insert ulang).
-- fast_track (page 'fast_track'): skip, tetap pakai seed A (copy Video Workshop).
delete from public.page_blocks where page in ('home','join_group','vip');
insert into public.page_blocks ("id", "page", "sort_order", "block_type", "props", "created_at")
values ('5c14aa34-284c-4ccc-87ca-f3444e6baf38', 'vip', 0, 'hero', '{"form":"0","badge":"Bimbingan VIP","center":"0","title_a":"Dibimbing Langsung","title_b":"Sampai Paham","subtitle":"Untuk yang tidak mau belajar sendiri dan ingin hasil lebih cepat, Bimbingan VIP mendampingi kamu 1-on-1."}'::jsonb, '2026-09-16T10:38:24.686687+00:00')
on conflict do nothing;
insert into public.page_blocks ("id", "page", "sort_order", "block_type", "props", "created_at")
values ('80c0bc69-b486-4f94-a8b4-e939dfc6ee19', 'vip', 1, 'youtube', '{"url":"https://youtu.be/Nv5lqFi1zto"}'::jsonb, '2026-09-16T10:38:24.686687+00:00')
on conflict do nothing;
insert into public.page_blocks ("id", "page", "sort_order", "block_type", "props", "created_at")
values ('a100bccc-b6f2-4f17-8330-8ea5f37fcf00', 'vip', 2, 'feature_list', '{"features":"Mentor 1-on-1|Sesi private bersama mentor\nReview pekerjaan|Portofolio dan proyekmu dievaluasi langsung\nAkses grup VIP|Komunitas eksklusif peserta VIP\nSesi live bulanan|Tanya jawab & studi kasus\nModul bonus|Materi di luar tutorial gratis","section_title":"What You Get"}'::jsonb, '2026-09-16T10:38:24.686687+00:00')
on conflict do nothing;
insert into public.page_blocks ("id", "page", "sort_order", "block_type", "props", "created_at")
values ('3a6dbe58-8893-4f21-8752-a51ee9b79d1a', 'vip', 3, 'cta_card', '{"price":"Rp2.999.000","cta_txt":"Ya, Saya Mau Bimbingan VIP","cta_href":"/checkout/vip","offer_title":"Penawaran Hari Ini","cta_external":"0","offer_points":"4 sesi mentor 1-on-1\nAkses penuh seluruh modul & bonus\nKarena baru mulai: harga intro","secondary_txt":"Tidak, cukup Tutorial Gratis saja","secondary_href":"/fast-track","secondary_external":"0"}'::jsonb, '2026-09-16T10:38:24.686687+00:00')
on conflict do nothing;
insert into public.page_blocks ("id", "page", "sort_order", "block_type", "props", "created_at")
values ('f5ea1b8e-0a2e-4136-9b99-1c34364dcdb2', 'join_group', 0, 'hero', '{"form":"0","badge":"","center":"1","title_a":"AKSES MATERI GRATIS","title_b":"Gratis","subtitle":"Belajar Tutorial Hermes untuk kalian yang pemula step-by-step mudah diikuti."}'::jsonb, '2026-09-16T10:38:24.686687+00:00')
on conflict do nothing;
insert into public.page_blocks ("id", "page", "sort_order", "block_type", "props", "created_at")
values ('5fceb301-239d-4d1e-928f-4a805628dba1', 'join_group', 1, 'cta_card', '{"price":"","cta_txt":"Akses Tutorialnya","cta_href":"https://tutorial-hermes.vercel.app","offer_title":"","cta_external":"1","offer_points":"","secondary_txt":"","secondary_href":"","secondary_external":"0"}'::jsonb, '2026-09-16T10:38:24.686687+00:00')
on conflict do nothing;
insert into public.page_blocks ("id", "page", "sort_order", "block_type", "props", "created_at")
values ('1b8fdc3a-ffc1-43a0-9621-273e17ffcf42', 'home', 0, 'hero', '{"form":"1","badge":"Tutorial Gratis","center":"0","bullets":"Materi ringkas dan fokus, tanpa basa-basi\nLangsung dipraktekkan, bukan cuma teori\nBisa dikerjakan dari HP maupun laptop","title_a":"Tutorial Hermes","title_b":"Bangun Agent AI pertamamu","subtitle":"Pelajari cara membangun agent AI dari nol dengan materi ringkas, langkah demi langkah, yang langsung bisa kamu praktekan.","button_txt":"Ambil Tutorial Gratis","form_title":"Ambil Tutorial Gratis","button_note":"Gratis selamanya. Tanpa kartu kredit.","form_subtitle":"Isi data di bawah, materi dikirim langsung ke email kamu.","button_txt_loading":"Memproses…"}'::jsonb, '2026-09-16T10:38:24.686687+00:00')
on conflict do nothing;
-- leads: 2 baris
insert into public.leads ("id", "status", "created_at", "name", "email", "whatsapp", "source", "current_stage", "updated_at")
values ('1b7779d6-b62e-40f6-ba8f-eae8cfeac283', 'free_tutorial', '2026-09-17T08:08:51.697356+00:00', 'Evant Danamaya Liekas', 'pofviews@gmail.com', '085161688299', 'tutorial_hermes', 'new', NULL)
on conflict do nothing;
insert into public.leads ("id", "status", "created_at", "name", "email", "whatsapp", "source", "current_stage", "updated_at")
values ('dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', 'free_tutorial', '2026-09-17T08:57:59.04359+00:00', 'Evant Danamaya Liekas', 'evant.xinde@gmail.com', '085161688299', 'tutorial_hermes', 'new', NULL)
on conflict do nothing;
-- orders: 2 baris
insert into public.orders ("id", "lead_id", "product", "amount", "mayar_invoice_id", "mayar_transaction_id", "status", "created_at", "paid_at")
values ('7fccbd80-03b9-4a40-bac7-6ae1fb921e25', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', 'vip', 2999000, 'e008fbe5-3cd7-4061-ba21-cff8890ee9c8', 'd1897469-ebfb-42cc-8e10-20097c2a429a', 'pending', '2026-09-17T08:09:03.67426+00:00', NULL)
on conflict do nothing;
insert into public.orders ("id", "lead_id", "product", "amount", "mayar_invoice_id", "mayar_transaction_id", "status", "created_at", "paid_at")
values ('658bd2ae-b452-4ce0-b5fb-523ce33d7e55', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', 'fast_track', 149000, '6fe40d6b-8284-459d-8fe8-8581e7e13d72', 'c4e0a5cd-15db-4ee5-8463-783e5bc4de2f', 'pending', '2026-09-17T08:58:13.654493+00:00', NULL)
on conflict do nothing;
-- pipeline_events: 9 baris
insert into public.pipeline_events ("id", "lead_id", "created_at", "event_type", "meta")
values ('32aeed8a-499a-4305-86c0-5332655c333f', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', '2026-09-17T08:08:53.287256+00:00', 'vip_visited', '{}'::jsonb)
on conflict do nothing;
insert into public.pipeline_events ("id", "lead_id", "created_at", "event_type", "meta")
values ('25b0f403-f485-4c7e-986e-167ed8875081', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', '2026-09-17T08:08:56.388907+00:00', 'checkout_visited', '{"product":"vip"}'::jsonb)
on conflict do nothing;
insert into public.pipeline_events ("id", "lead_id", "created_at", "event_type", "meta")
values ('26d2176e-ce6e-4c33-b17e-33f2582aee27', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', '2026-09-17T08:09:05.277441+00:00', 'checkout_initiated', '{"product":"vip","invoice_id":"e008fbe5-3cd7-4061-ba21-cff8890ee9c8"}'::jsonb)
on conflict do nothing;
insert into public.pipeline_events ("id", "lead_id", "created_at", "event_type", "meta")
values ('b5162173-35ab-4621-b753-5e928847f049', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', '2026-09-17T08:58:00.655052+00:00', 'vip_visited', '{}'::jsonb)
on conflict do nothing;
insert into public.pipeline_events ("id", "lead_id", "created_at", "event_type", "meta")
values ('ace0db19-b493-4294-956a-7c1d8397cdb1', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', '2026-09-17T08:58:04.17325+00:00', 'fast_track_visited', '{}'::jsonb)
on conflict do nothing;
insert into public.pipeline_events ("id", "lead_id", "created_at", "event_type", "meta")
values ('0012a61e-7cfb-413b-a287-8774c29e0a2c', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', '2026-09-17T08:58:08.261745+00:00', 'checkout_visited', '{"product":"fast_track"}'::jsonb)
on conflict do nothing;
insert into public.pipeline_events ("id", "lead_id", "created_at", "event_type", "meta")
values ('061fb9c6-78ae-4b4a-8465-b1fbc83292eb', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', '2026-09-17T08:58:14.788247+00:00', 'checkout_initiated', '{"product":"fast_track","invoice_id":"6fe40d6b-8284-459d-8fe8-8581e7e13d72"}'::jsonb)
on conflict do nothing;
insert into public.pipeline_events ("id", "lead_id", "created_at", "event_type", "meta")
values ('9b556ccd-e8f7-47e6-837e-d083e6ae04e5', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', '2026-09-17T09:07:21.230576+00:00', 'join_group_visited', '{}'::jsonb)
on conflict do nothing;
insert into public.pipeline_events ("id", "lead_id", "created_at", "event_type", "meta")
values ('625afcd4-53ac-4ed3-9aae-9a0983763890', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', '2026-09-17T09:24:49.698808+00:00', 'vip_visited', '{}'::jsonb)
on conflict do nothing;
-- notes: 0 baris
-- email_sequences: 4 baris (skip jika key kembar dgn seed A)
insert into public.email_sequences ("id", "key", "name", "created_at")
values ('d6b8e883-ea18-438a-b7a2-76aebe5ffdbd', 'free_vip_upsell', 'Free tutorial → upsell Bimbingan VIP', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_sequences ("id", "key", "name", "created_at")
values ('d9bcdc34-66c4-4c37-8ab7-49915824d7d9', 'fasttrack_access', 'Fast-track akses + grup + upsell VIP', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_sequences ("id", "key", "name", "created_at")
values ('9aef244e-e819-4cf7-bcde-0b4677714220', 'vip_onboarding', 'Onboarding VIP + grup + email dasar', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_sequences ("id", "key", "name", "created_at")
values ('aac37f26-8967-476b-98f3-cf0bad523168', 'abandoned_checkout', 'Reminder pembayaran tertunda', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
-- email_templates: 13 baris (skip jika key kembar dgn seed A)
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('a43cb3b6-6673-4251-975c-9e50de7c579f', 'free_vip_intro', 'Tutorial Hermes kamu sudah siap 🚀 (+ tawaran spesial)', '<p>Halo {{name}},</p><p>Akses Tutorial Hermes minimalis: ada di email berikutnya. Sekalian saya kasih tahu — kalau kamu mau dibimbing langsung sampai paham, Bimbingan VIP cuma sedikit slotnya bulan ini.</p><p><a href="{{vip_url}}">Lihat detail Bimbingan VIP</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('2eca4f70-12b7-4866-8f5c-fe1bfcee2d6e', 'free_vip_bonus', 'Bonus: 3 alasan Bimbingan VIP menyesal kalau dilewati', '<p>Halo {{name}},</p><p>Banyak yang merasa sendirian saat belajar. Bimbingan VIP memberi: mentor 1-on-1, review pekerjaan, dan komunitas.</p><p><a href="{{vip_url}}">Cek kuota yang tersisa</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('41932d85-2a8b-4dd0-a886-b28093dcedfe', 'free_vip_followup', 'Masih mikir-mikir soal Bimbingan VIP?', '<p>Halo {{name}},</p><p>Pertanyaan jujur: bagian mana yang bikin ragu? Balas email ini, saya bantu jawab langsung.</p><p><a href="{{vip_url}}">Lihat penawaran lengkapnya</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('238e58aa-23d3-41a1-98fd-a2f424e8386c', 'free_vip_lastchance', 'Terakhir kali harga normal sebelum naik', '<p>Halo {{name}},</p><p>Kalau kamu tetap bertahan di jalur gratis, tidak masalah — grup komunitas selalu terbuka. Tapi kalau mau akselerasi penuh, harga Bimbingan VIP akan naik minggu depan.</p><p><a href="{{vip_url}}">Amankan harga sekarang</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('749c2796-eb58-49bc-8ceb-a8b688f0ff6d', 'fasttrack_access', 'Akses Fast-track Build Agent kamu siap', '<p>Halo {{name}},</p><p>Selamat! Materi Fast-track Build Agent sudah aktif. Kerjakan step-by-step dan langsung praktekan.</p><p><a href="{{fast_track_url}}">Mulai belajar sekarang</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('eb077433-8071-4392-aaf3-e733076b0a0e', 'fasttrack_group', 'Gabung grup Fast-track, bangun bareng', '<p>Halo {{name}},</p><p>Jangan belajar sendirian — gabung grup Fast-track, tanya di mana pun kamu mentok, dan tunjukkan progresmu.</p><p><a href="{{group_url}}">Gabung grup sekarang</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('0fc279e4-5507-46a7-a26f-ea1b229c97ba', 'fasttrack_vip_offer', 'Harga spesial: naik kelas dari Fast-track ke VIP', '<p>Halo {{name}},</p><p>Karena kamu sudah Fast-track, kamu dapat harga spesial untuk naik ke Bimbingan VIP. Kuota terbatas.</p><p><a href="{{vip_url}}">Klaim harga spesial</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('c8eb1569-d070-4fb9-af38-79947282bfd2', 'vip_access', 'Selamat — kamu resmi Bimbingan VIP!', '<p>Halo {{name}},</p><p>Pembayaranmu berhasil. Akses VIP sudah aktif dan undangan grup VIP menyusul di email berikutnya.</p><p><a href="{{vip_url}}">Mulai sesi pertamamu</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('adcd9b9e-c83d-48af-a93c-535e400e64c1', 'vip_group', 'Undangan grup VIP: jangan lewatkan', '<p>Halo {{name}},</p><p>Dukungan komunitas adalah bagian terbesar dari nilai VIP. Gabung sekarang supaya tidak ketinggalan sesi.</p><p><a href="{{group_url}}">Gabung grup VIP</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('a1bb5ad1-b4cc-470d-8a7c-9b111db39285', 'vip_basic1', 'Cara paling cepat selesaikan materi VIP minggu ini', '<p>Halo {{name}},</p><p>Pola hari ini: 1 materi singkat, 1 praktek, 1 tanya. Jangan menumpuk, lakukan sedikit demi sedikit.</p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('62b07305-65e4-4a55-bb44-c1333bd6f83f', 'vip_basic2', 'Check-in mingguan: progresmu minggu ini', '<p>Halo {{name}},</p><p>Sudah sampai mana materi kamu? Kirim progres ke mentor atau balas email ini supaya kami bisa bantu lewat.</p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('482f2026-6b3f-4ae2-ab36-6850fe100f9e', 'checkout_reminder', 'Pesanan kamu masih menunggu pembayaran', '<p>Halo {{name}},</p><p>Link pembayaran kamu masih aktif. Jangan sampai kehilangan slot.</p><p><a href="{{checkout_url}}">Selesaikan pembayaran</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
insert into public.email_templates ("id", "key", "subject", "html_body", "created_at")
values ('84c7a09b-f8c7-46a8-a3b8-873581f4cf19', 'checkout_lastcall', 'Sobat, ini pengingat terakhir pembayaranmu', '<p>Halo {{name}},</p><p>Invoice akan kedaluwarsa sebentar lagi. Selesaikan sekarang atau slot kembali ke antrian.</p><p><a href="{{checkout_url}}">Bayar sekarang</a></p>', '2026-09-11T05:00:08.628644+00:00')
on conflict do nothing;
-- email_steps: 13 baris (skip jika combo sequence+step sudah ada)
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('27deffae-610b-4d5d-b59a-88b3eef106dd', (select id from public.email_sequences where key = 'free_vip_upsell'), 0, 0, (select id from public.email_templates where key = 'free_vip_intro'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('69120042-6914-4728-ba16-1f241d0b6f23', (select id from public.email_sequences where key = 'free_vip_upsell'), 1, 3, (select id from public.email_templates where key = 'free_vip_bonus'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('e4a202f0-c1e7-469b-94fe-40acddd911b2', (select id from public.email_sequences where key = 'free_vip_upsell'), 2, 7, (select id from public.email_templates where key = 'free_vip_followup'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('00587642-00c9-4c11-a54c-6fa2a7cd6d65', (select id from public.email_sequences where key = 'free_vip_upsell'), 3, 14, (select id from public.email_templates where key = 'free_vip_lastchance'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('8a99a2f1-938e-4bf7-a3c7-1004e2a28db8', (select id from public.email_sequences where key = 'fasttrack_access'), 0, 0, (select id from public.email_templates where key = 'fasttrack_access'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('a821b039-2504-4af9-9305-b1bc16c0a289', (select id from public.email_sequences where key = 'fasttrack_access'), 1, 1, (select id from public.email_templates where key = 'fasttrack_group'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('ef7fd64e-078c-4a31-bd9c-8006d6c3a718', (select id from public.email_sequences where key = 'fasttrack_access'), 2, 5, (select id from public.email_templates where key = 'fasttrack_vip_offer'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('8a964445-48bf-475f-ae29-ec73d684f57a', (select id from public.email_sequences where key = 'vip_onboarding'), 0, 0, (select id from public.email_templates where key = 'vip_access'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('f9f9f206-b04a-4371-bc24-69d7c9a1dd49', (select id from public.email_sequences where key = 'vip_onboarding'), 1, 1, (select id from public.email_templates where key = 'vip_group'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('e432ba74-023a-42e2-89a7-e7e79e7d76e5', (select id from public.email_sequences where key = 'vip_onboarding'), 2, 5, (select id from public.email_templates where key = 'vip_basic1'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('c65d7e53-2bea-4588-90fc-d702e3bf11da', (select id from public.email_sequences where key = 'vip_onboarding'), 3, 10, (select id from public.email_templates where key = 'vip_basic2'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('7df55a3f-98a5-49df-a033-1dba34e11be1', (select id from public.email_sequences where key = 'abandoned_checkout'), 0, 0, (select id from public.email_templates where key = 'checkout_reminder'))
on conflict do nothing;
insert into public.email_steps ("id", "sequence_id", "step", "day_offset", "template_id")
values ('36d82015-12b2-4519-ab8b-dfe6007d108c', (select id from public.email_sequences where key = 'abandoned_checkout'), 1, 2, (select id from public.email_templates where key = 'checkout_lastcall'))
on conflict do nothing;
-- email_enrollments: 4 baris
insert into public.email_enrollments ("id", "lead_id", "sequence_id", "current_step", "enrolled_at")
values ('39b4ca82-2813-4fb2-86d6-20b9c7b1bf5b', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', (select id from public.email_sequences where key = 'free_vip_upsell'), 0, '2026-09-17T08:08:51.697356+00:00')
on conflict do nothing;
insert into public.email_enrollments ("id", "lead_id", "sequence_id", "current_step", "enrolled_at")
values ('86788ae3-1390-4347-ac9b-1343cbf1fe7f', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', (select id from public.email_sequences where key = 'abandoned_checkout'), 0, '2026-09-17T08:09:04.472077+00:00')
on conflict do nothing;
insert into public.email_enrollments ("id", "lead_id", "sequence_id", "current_step", "enrolled_at")
values ('d538dc71-16a4-4723-8adb-dc94d47c7f15', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', (select id from public.email_sequences where key = 'free_vip_upsell'), 0, '2026-09-17T08:57:59.04359+00:00')
on conflict do nothing;
insert into public.email_enrollments ("id", "lead_id", "sequence_id", "current_step", "enrolled_at")
values ('286797eb-d502-4eb8-8270-63f9950d8928', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', (select id from public.email_sequences where key = 'abandoned_checkout'), 0, '2026-09-17T08:58:14.487207+00:00')
on conflict do nothing;
-- email_queue: 12 baris
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('dfca6673-82d8-4caf-8ab3-e5fc9f243825', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', (select id from public.email_sequences where key = 'free_vip_upsell'), (select id from public.email_templates where key = 'free_vip_followup'), 2, '2026-09-24T08:08:51.697356+00:00', 'pending', 0, NULL, '2026-09-17T08:08:51.697356+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('947895e1-a42d-46f0-89d5-82a47b3ee89d', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', (select id from public.email_sequences where key = 'free_vip_upsell'), (select id from public.email_templates where key = 'free_vip_lastchance'), 3, '2026-10-01T08:08:51.697356+00:00', 'pending', 0, NULL, '2026-09-17T08:08:51.697356+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('d450dc2f-ee99-4474-b30c-730e79001f70', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', (select id from public.email_sequences where key = 'free_vip_upsell'), (select id from public.email_templates where key = 'free_vip_intro'), 0, '2026-09-17T08:08:51.697356+00:00', 'sent', 0, NULL, '2026-09-17T08:08:51.697356+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('1d4fae99-dc74-43ec-81f9-e3c3f64f41b3', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', (select id from public.email_sequences where key = 'abandoned_checkout'), (select id from public.email_templates where key = 'checkout_reminder'), 0, '2026-09-17T08:09:04.472077+00:00', 'sent', 0, NULL, '2026-09-17T08:09:04.472077+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('074f0dc6-695d-4628-a01a-e813f357cfbb', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', (select id from public.email_sequences where key = 'free_vip_upsell'), (select id from public.email_templates where key = 'free_vip_followup'), 2, '2026-09-24T08:57:59.04359+00:00', 'pending', 0, NULL, '2026-09-17T08:57:59.04359+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('d79adac8-1274-43be-b0b7-341c0f9629d0', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', (select id from public.email_sequences where key = 'free_vip_upsell'), (select id from public.email_templates where key = 'free_vip_lastchance'), 3, '2026-10-01T08:57:59.04359+00:00', 'pending', 0, NULL, '2026-09-17T08:57:59.04359+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('8d9ae3d6-665c-4eb8-95a5-711e988636ba', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', (select id from public.email_sequences where key = 'free_vip_upsell'), (select id from public.email_templates where key = 'free_vip_intro'), 0, '2026-09-17T08:57:59.04359+00:00', 'sent', 0, NULL, '2026-09-17T08:57:59.04359+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('37c16537-c50a-46d4-a1b6-6f88a1f783af', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', (select id from public.email_sequences where key = 'abandoned_checkout'), (select id from public.email_templates where key = 'checkout_reminder'), 0, '2026-09-17T08:58:14.487207+00:00', 'sent', 0, NULL, '2026-09-17T08:58:14.487207+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('5dff43c3-cf03-403b-8998-9d81967cb9da', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', (select id from public.email_sequences where key = 'abandoned_checkout'), (select id from public.email_templates where key = 'checkout_lastcall'), 1, '2026-09-19T08:09:04.472077+00:00', 'sent', 0, NULL, '2026-09-17T08:09:04.472077+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('8356e182-80c0-4459-86c4-ba556b882549', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', (select id from public.email_sequences where key = 'abandoned_checkout'), (select id from public.email_templates where key = 'checkout_lastcall'), 1, '2026-09-19T08:58:14.487207+00:00', 'sent', 0, NULL, '2026-09-17T08:58:14.487207+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('4dbfbfbf-7be6-4cae-b897-750f21a83037', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', (select id from public.email_sequences where key = 'free_vip_upsell'), (select id from public.email_templates where key = 'free_vip_bonus'), 1, '2026-09-20T08:08:51.697356+00:00', 'sent', 0, NULL, '2026-09-17T08:08:51.697356+00:00')
on conflict do nothing;
insert into public.email_queue ("id", "lead_id", "sequence_id", "template_id", "step", "scheduled_for", "status", "attempts", "error", "created_at")
values ('5999206e-d77b-41a8-9615-0a4bbb4f8a69', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', (select id from public.email_sequences where key = 'free_vip_upsell'), (select id from public.email_templates where key = 'free_vip_bonus'), 1, '2026-09-20T08:57:59.04359+00:00', 'sent', 0, NULL, '2026-09-17T08:57:59.04359+00:00')
on conflict do nothing;
-- email_logs: 8 baris
insert into public.email_logs ("id", "lead_id", "queue_id", "resend_id", "status", "sent_at", "opened_at", "clicked_at", "created_at")
values ('ce10a963-4852-4ca7-89aa-281927e77eda', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', 'd450dc2f-ee99-4474-b30c-730e79001f70', '01a0ae6a-66d1-7439-ac73-4c3234bea5cc', 'delivered', '2026-09-17T08:10:00.645+00:00', NULL, NULL, '2026-09-17T08:10:05.43588+00:00')
on conflict do nothing;
insert into public.email_logs ("id", "lead_id", "queue_id", "resend_id", "status", "sent_at", "opened_at", "clicked_at", "created_at")
values ('d870171a-adaa-42fa-bde7-e2e50bc995f4', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', '1d4fae99-dc74-43ec-81f9-e3c3f64f41b3', '01a0ae6a-742b-70ca-92fd-dae6d5eb7ade', 'delivered', '2026-09-17T08:10:00.645+00:00', NULL, NULL, '2026-09-17T08:10:08.365083+00:00')
on conflict do nothing;
insert into public.email_logs ("id", "lead_id", "queue_id", "resend_id", "status", "sent_at", "opened_at", "clicked_at", "created_at")
values ('c687fc08-49cb-42a2-8755-5675132400ff', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', '8d9ae3d6-665c-4eb8-95a5-711e988636ba', '01a0ae98-2e16-758a-aa79-5348c45c3b25', 'delivered', '2026-09-17T09:00:00.375+00:00', NULL, NULL, '2026-09-17T09:00:04.916562+00:00')
on conflict do nothing;
insert into public.email_logs ("id", "lead_id", "queue_id", "resend_id", "status", "sent_at", "opened_at", "clicked_at", "created_at")
values ('340767e3-d3ef-4b01-bfb5-8240bc5730cf', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', '37c16537-c50a-46d4-a1b6-6f88a1f783af', '01a0ae98-3dbb-71df-ae8f-75720371e3a2', 'delivered', '2026-09-17T09:00:00.375+00:00', NULL, NULL, '2026-09-17T09:00:10.359103+00:00')
on conflict do nothing;
insert into public.email_logs ("id", "lead_id", "queue_id", "resend_id", "status", "sent_at", "opened_at", "clicked_at", "created_at")
values ('bf7d9ecc-52f7-4ad0-8f09-f3973410bd8a', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', '5dff43c3-cf03-403b-8998-9d81967cb9da', '01a0b8b7-1eaa-72fe-b59c-43af33f184dd', 'delivered', '2026-09-19T08:10:00.326+00:00', NULL, NULL, '2026-09-19T08:10:05.40819+00:00')
on conflict do nothing;
insert into public.email_logs ("id", "lead_id", "queue_id", "resend_id", "status", "sent_at", "opened_at", "clicked_at", "created_at")
values ('9d3decde-de6a-4d61-a46c-d37a9e8187ef', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', '8356e182-80c0-4459-86c4-ba556b882549', '01a0b8e4-e7d4-769f-b862-b2058320a2f3', 'delivered', '2026-09-19T09:00:00.406+00:00', NULL, NULL, '2026-09-19T09:00:06.141519+00:00')
on conflict do nothing;
insert into public.email_logs ("id", "lead_id", "queue_id", "resend_id", "status", "sent_at", "opened_at", "clicked_at", "created_at")
values ('33fe2f96-5dd4-4e8a-bf43-e7bac8f815c6', '1b7779d6-b62e-40f6-ba8f-eae8cfeac283', '4dbfbfbf-7be6-4cae-b897-750f21a83037', '01a0bddd-7aa8-75db-b70c-a35322a19bd3', 'delivered', '2026-09-20T08:10:00.318+00:00', NULL, NULL, '2026-09-20T08:10:04.846069+00:00')
on conflict do nothing;
insert into public.email_logs ("id", "lead_id", "queue_id", "resend_id", "status", "sent_at", "opened_at", "clicked_at", "created_at")
values ('60d0c08c-3410-40b3-abb5-8841c860a77b', 'dcfd528b-b9c4-4ede-810b-fc8e9e12b2ab', '5999206e-d77b-41a8-9615-0a4bbb4f8a69', '01a0be0b-450b-728a-a0f5-d7fd9d9a1f56', 'delivered', '2026-09-20T09:00:00.328+00:00', NULL, NULL, '2026-09-20T09:00:06.338281+00:00')
on conflict do nothing;
-- unsubscribes: 1 baris
insert into public.unsubscribes ("id", "created_at", "email")
values ('17313a64-5ac2-4206-8506-de507213e9fa', '2026-09-11T16:10:10.512723+00:00', 'abandon-x@e.com')
on conflict do nothing;
-- admin_profiles: 0 baris
-- wa_templates: 1 baris
insert into public.wa_templates ("id", "created_at", "name", "content")
values ('4783dc4d-e20b-4e6d-9b0b-c06a8cad1939', '2026-09-17T04:28:39.241132+00:00', 'Follow-up standar', 'Halo {{name}}, ini dari Tim Tutorial Hermes. Gimana pengalaman kamu membaca tutorial gratis kemarin? Kalau ada bagian yang masih bingung atau mau dipandu lebih lanjut, aku siap bantu lewat program Fast-track. Cukup balas pesan ini ya.')
on conflict do nothing;
