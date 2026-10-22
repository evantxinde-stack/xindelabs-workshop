-- ============================================================
-- SEED HOME CONTENT — Xinde Labs (per 22 Oktober 2026)
-- Mengisi data yang dipakai home unified di app apex:
--   programs, classes, portfolio, blog_posts
-- Plus funnel utk subdomain: workshop, kelas, hermes, promo
-- IDEMPOTENT + NEVER-ABORT (aman di Supabase SQL Editor)
-- ============================================================

-- HATI-HATI: baris di bawah dibuat ulang dari data LIVE per 22 Okt 2026.
-- Jalankan ulang file ini kapan saja; data yang sudah ada tidak ditimpa
-- kecuali kuncinya (slug) belum ada.


-- ============================================================
-- programs
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.programs WHERE "slug" = 'hermes-agent-workshop') THEN
    INSERT INTO public.programs ("slug", "title", "description", "price", "type", "features", "status", "sort_order")
    VALUES ('hermes-agent-workshop', 'Workshop Hermes Agent', 'Workshop 1 hari: dari bikin AI agent pertama sampai nyambung ke channel sales lo. Praktik langsung, bawa pulang agent yang jalan.', 599000, 'Workshop', ARRAY['Bikin AI agent dari nol dalam 1 hari', 'Agent yang bales chat leads 24/7', 'Integrasi WhatsApp & follow-up otomatis', 'Template siap pakai + sesi tanya jawab']::text[], 'published', 1);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.programs WHERE "slug" = 'kelas-hermes-starter') THEN
    INSERT INTO public.programs ("slug", "title", "description", "price", "type", "features", "status", "sort_order")
    VALUES ('kelas-hermes-starter', 'Kelas Hermes Starter', 'Kelas online untuk menguasai dasar AI agent: prompt engineering, memory, dan alur kerja otomatis.', 299000, 'Kelas', ARRAY['6 sesi video + handout PDF', 'Kelas online via Zoom', 'KGrup WhatsApp Lifetime', 'Sesi tanya jawab tiap minggu']::text[], 'published', 2);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.programs WHERE "slug" = 'bimbingan-vip-agent') THEN
    INSERT INTO public.programs ("slug", "title", "description", "price", "type", "features", "status", "sort_order")
    VALUES ('bimbingan-vip-agent', 'Bimbingan VIP Agent', 'Pendampingan 1-on-1 selama 30 hari: personal branding, agent AI, dan digital business lo dibedah bareng.', 2999000, 'VIP', ARRAY['30 hari pendampingan 1-on-1', 'Audit personal branding & funnel', 'Agent AI dibangun khusus untuk bisnis lo', 'Support WhatsApp priority']::text[], 'published', 4);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.programs WHERE "slug" = 'setup-brand-agent') THEN
    INSERT INTO public.programs ("slug", "title", "description", "price", "type", "features", "status", "sort_order")
    VALUES ('setup-brand-agent', 'Setup Brand + Agent', 'Paket servo: positioning, visual brand, website/landing, dan AI agent yang siap dipakai bisnis lo.', 2500000, 'Servis', ARRAY['Brand positioning + tone of voice', 'Desain visual & landing page', 'AI agent sales + knowledge base', 'Serah terima + pelatihan tim']::text[], 'published', 5);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.programs WHERE "slug" = 'kelas-agent-sales') THEN
    INSERT INTO public.programs ("slug", "title", "description", "price", "type", "features", "status", "sort_order")
    VALUES ('kelas-agent-sales', 'Kelas Agent Sales', 'Fokus pada agent yang closing: handle objections, follow-up leads yang dingin, dan script closing yang dipakai agent.', 499000, 'Kelas', ARRAY['Script sales yang dipakai agent', 'Pipeline follow-up 7 hari', 'Studi kasus closing real', 'Bonus template 30 caption']::text[], 'published', 3);
  END IF;
END $$;

-- ============================================================
-- classes
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE "slug" = 'kelas-hermes-starter') THEN
    INSERT INTO public.classes ("slug", "title", "description", "price", "member_discount_price", "is_published", "sort_order")
    VALUES ('kelas-hermes-starter', 'Kelas Hermes Starter', 'Kelas online fundamental AI agent. Dari nol sampai punya agent yang jalan.', 299000, 249000, true, 1);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE "slug" = 'kelas-agent-sales') THEN
    INSERT INTO public.classes ("slug", "title", "description", "price", "member_discount_price", "is_published", "sort_order")
    VALUES ('kelas-agent-sales', 'Kelas Agent Sales', 'Kelas agent sales: closing script, objection handling, dan follow-up otomatis.', 499000, 399000, true, 2);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE "slug" = 'kelas-content-agent') THEN
    INSERT INTO public.classes ("slug", "title", "description", "price", "member_discount_price", "is_published", "sort_order")
    VALUES ('kelas-content-agent', 'Kelas Content Agent', 'Bikin content system: 1 ide menjspawn 30 caption + jadwal posting otomatis.', 399000, 329000, true, 3);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE "slug" = 'mentoring-vip-bulanan') THEN
    INSERT INTO public.classes ("slug", "title", "description", "price", "member_discount_price", "is_published", "sort_order")
    VALUES ('mentoring-vip-bulanan', 'Mentoring VIP Bulanan', 'Mentoring 1-on-1 dengan Evant: brand, agent, dan growth bareng setiap minggu.', 2999000, 2499000, true, 4);
  END IF;
END $$;

-- ============================================================
-- portfolio
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.portfolio WHERE "slug" = 'brand-personal-xinde') THEN
    INSERT INTO public.portfolio ("slug", "title", "description", "image_url", "category", "link_url", "sort_order")
    VALUES ('brand-personal-xinde', 'Brand Personal "Bangun Karyawan Super Pintar"', 'Positioning dan messaging personal brand yang mengubah audience jadi leads tanpa hard selling.', NULL, 'Branding', NULL, 1);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.portfolio WHERE "slug" = 'agent-sales-klinik') THEN
    INSERT INTO public.portfolio ("slug", "title", "description", "image_url", "category", "link_url", "sort_order")
    VALUES ('agent-sales-klinik', 'Agent Sales Klinik Kecantikan', 'AI agent yang handle WhatsApp leads, jawab FAQ treatment, dan booking janji temu otomatis 24/7.', NULL, 'AI Agent', NULL, 2);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.portfolio WHERE "slug" = 'landing-funnel-kelas') THEN
    INSERT INTO public.portfolio ("slug", "title", "description", "image_url", "category", "link_url", "sort_order")
    VALUES ('landing-funnel-kelas', 'Landing Page & Funnel Kelas', 'Funnel landing multi-step dengan opt-in, checkout Mayar, dan upsell otomatis.', NULL, 'Web', NULL, 3);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.portfolio WHERE "slug" = 'otomasi-konten-ig') THEN
    INSERT INTO public.portfolio ("slug", "title", "description", "image_url", "category", "link_url", "sort_order")
    VALUES ('otomasi-konten-ig', 'Otomasi Konten Instagram 30 Hari', 'Sistem konten yang mengubah 1 brief mingguan jadi 30 caption + jadwal posting otomatis.', NULL, 'AI Agent', NULL, 4);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.portfolio WHERE "slug" = 'onboarding-member-kelas') THEN
    INSERT INTO public.portfolio ("slug", "title", "description", "image_url", "category", "link_url", "sort_order")
    VALUES ('onboarding-member-kelas', 'Sistem Onboarding Member Kelas', 'Alur welcomes member, provisioning LMS otomatis, dan email onboarding berjenjang.', NULL, 'Sistem', NULL, 5);
  END IF;
END $$;

-- ============================================================
-- blog_posts
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE "slug" = 'sistem-konten-otomatis') THEN
    INSERT INTO public.blog_posts ("slug", "title", "excerpt", "content_markdown", "category", "tags", "author", "status", "published_at", "cta_url", "cta_label")
    VALUES ('sistem-konten-otomatis', 'Sistem Konten Otomatis: Dari 1 Brief Mingguan Jadi 30 Caption', 'Content system yang bisa jalan: satu brief, satu voice note, satu agent yang kerja tiap hari.', 'Kebanyakan orang gagal konsisten karena bikini konten dari nol tiap hari. Solusinya: pindahkan keputusan ke batch.

Alurnya:
1. Sunday batch — 30 menit, catat 5 ide dari satu brief.
2. Agent bikin draft — prompt per platform (IG, LinkedIn, Threads).
3. Jadwal posting — satu tool, semua channel.
4. Review 5 menit/hari — hanya yang perlu diubah.

Yang bikin sistem ini Prematur: nada bicara harus dalam satu voice note, dan aturan brand ditulis eksplisit. Kalau aturannya ada di kepala lo saja, agent akan keluar jalur dalam 2 minggu.', 'Content', ARRAY['content', 'automation', 'sistem']::text[], 'Evant', 'published', '2026-09-28T02:00:00+00:00', '/blog', 'Baca Artikel Lainnya');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE "slug" = 'cara-bikin-agent-ai-sales') THEN
    INSERT INTO public.blog_posts ("slug", "title", "excerpt", "content_markdown", "category", "tags", "author", "status", "published_at", "cta_url", "cta_label")
    VALUES ('cara-bikin-agent-ai-sales', 'Cara Bikin AI Agent yang Ngejual: 5 Langkah Praktis', 'Agent yang cuma chat lucu itu belum berarti jualan. Ini 5 langkah bikin AI agent yang beneran ngomong sama leads dan close.', 'AI agent yang sudah banyak belum tentu bisa closing. Yang bikin agent berguna bukan prompt-nya, tapi data dan alurnya.

1. Kasih agent satu pekerjaan jelas
Agent yang tasked "bantu jualan" akan ngasap random. Kasih satu job: bales inbound, tanya kebutuhan, book janji temu, terus serahin ke manusia kalau sudah panas.

2. Masukkan data produk lo
Masukkan katalog, FAQ, harga, dan aturan diskon ke knowledge base. Agent yang punya data benar akan jelas dan tidak mengarang.

3. Bikin tone yang konsisten
Tentukan cara ngomong: bahasa santai, boleh pake emoji, selalu tawarkan langkah berikutnya. Konsistensi bikin audience nyaman.

4. Sambungkan ke kanal nyata
WhatsApp, Instagram, atau web chat. Jangan biarkan agent cuma ngobrol di demo — agent harus masuk ke jalur yang lead beneran datang.

5. Ukur dan perbaiki tiap minggu
Catat obrolan yang gagal, perbarui, dan ulangi. Agent bagus itu hasil iterasi, bukan sekali setting.', 'AI Agent', ARRAY['ai-agent', 'sales', 'automation']::text[], 'Evant', 'published', '2026-10-18T02:00:00+00:00', '/tutorial', 'Mulai Bangun Agent Pertama');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE "slug" = 'personal-branding-di-era-ai') THEN
    INSERT INTO public.blog_posts ("slug", "title", "excerpt", "content_markdown", "category", "tags", "author", "status", "published_at", "cta_url", "cta_label")
    VALUES ('personal-branding-di-era-ai', 'Personal Branding di Era AI: Kenapa Lo Masih Perlu Punya', 'AI bikin konten jadi murah. Justru itu yang bikin personal branding makin mahal dan bernilai.', 'Dulu bikin konten itu mahal: foto, edit, nulis. Sekarang AI bikin 30 caption dalam 5 menit. Konsekuensinya, konten sendiri kehilangan nilai.

Yang tidak bisa ditiru AI adalah dirimu: pengalaman, judgment, dan track record. Orang beli dari orang.

Jadi strateginya berubah: bukan lagi "buat banyak konten", tapi "punya satu hal yang benar-benar lo kuasai, lalu bangun trust di atasnya".

Tiga langkah yang masih kepakai:
1. Kirim bukti, bukan klaim. Tunjukkan hasil, proses, dan angka.
2. Publish konsisten. Konsistensi menandakan keseriusan.
3. Punya aset yang bisa dipakai AI: knowledge base, SOP, dan library prompt — ini yang bikin AI lo beda dari AI orang lain.

Personal branding + AI agent yang lo pakai sendiri = keunggulan yang sulit ditiru.', 'Branding', ARRAY['personal-branding', 'content', 'ai']::text[], 'Evant', 'published', '2026-10-05T02:00:00+00:00', '/portofolio', 'Lihat Portofolio');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE "slug" = 'follow-up-whatsapp-otomatis') THEN
    INSERT INTO public.blog_posts ("slug", "title", "excerpt", "content_markdown", "category", "tags", "author", "status", "published_at", "cta_url", "cta_label")
    VALUES ('follow-up-whatsapp-otomatis', 'Follow-up WhatsApp Otomatis: Template 7 Hari untuk Leads Dingin', 'Lead dingin bukan mati, cuma belum kepangen. Ini template follow-up 7 hari yang tetap natural dan nggak bikin kena spam.', 'Kebanyakan lead hilang bukan karena nggak tertarik, tapi karena kita berhenti chat duluan. Follow-up yang sopan dan terstruktur mengubah itu.

Hari 1 — Balas: "Halo Kak {nama}, aku {nama} dari {bisnis}. Sempat nanya soal {produk}, mau kubantu jelasin singkat?"
Hari 2 — Kirim satu insight atau studi kasus singkat.
Hari 3 — Kasih garansi: "Kalau ga cocok, uang kembali."
Hari 4 — Tanya timescale: "RenFV planning mulai bulan ini?"
Hari 5 — Kirim bonus yang relevan (template/bot).
Hari 6 — Tawarkan bundling atau diskon singkat.
Hari 7 — Penutup halus: "Kalau belum, aku tidak ganggu lagi ya. Good luck!"

Aturan main: satu pesan satu tujuan, sertakan opt-out, dan berhenti di hari 7 kalau belum ada respons. Automasi follow-up harus tetap terasa manusiawi — bukan ledakan 10 chat dalam 5 menit.', 'Sales', ARRAY['follow-up', 'whatsapp', 'funnel']::text[], 'Evant', 'published', '2026-10-12T02:00:00+00:00', '/blog', 'Baca Artikel Lainnya');
  END IF;
END $$;

-- ============================================================
-- funnels (subdomain: workshop, kelas, hermes, promo)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.funnels WHERE "subdomain" = 'workshop') THEN
    INSERT INTO public.funnels ("subdomain","name","slug","meta_pixel_id","checkout_mode","is_active","currency","thankyou_url","upsell_url","settings")
    VALUES ('workshop', 'Workshop Hermes Agent', 'workshop', '921699146613715', 'embedded', true, 'IDR', '/thankyou', '/upsell', '{"skip_upsell":false,"checkout_mode":"embedded"}'::jsonb);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.funnels WHERE "subdomain" = 'kelas') THEN
    INSERT INTO public.funnels ("subdomain","name","slug","meta_pixel_id","checkout_mode","is_active","currency","thankyou_url","upsell_url","settings")
    VALUES ('kelas', 'Kelas Hermes Agent', 'kelas', '921699146613715', 'embedded', true, 'IDR', '/thankyou', '/upsell', '{"skip_upsell":false,"checkout_mode":"embedded"}'::jsonb);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.funnels WHERE "subdomain" = 'hermes') THEN
    INSERT INTO public.funnels ("subdomain","name","slug","meta_pixel_id","checkout_mode","is_active","currency","thankyou_url","upsell_url","settings")
    VALUES ('hermes', 'Hermes Agent - Multi Step Funnel', 'hermes', '921699146613715', 'embedded', true, 'IDR', '/thankyou', '/upsell', '{"skip_upsell":false,"checkout_mode":"embedded"}'::jsonb);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.funnels WHERE "subdomain" = 'promo') THEN
    INSERT INTO public.funnels ("subdomain","name","slug","meta_pixel_id","checkout_mode","is_active","currency","thankyou_url","upsell_url","settings")
    VALUES ('promo', 'Promo Kursus - Standalone Checkout', 'promo', '921699146613715', 'embedded', true, 'IDR', '/thankyou', '/upsell', '{"skip_upsell":false,"checkout_mode":"embedded"}'::jsonb);
  END IF;
END $$;

-- ============================================================
-- funnel_steps (landing page per funnel)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.funnel_steps
    WHERE "funnel_id" = (SELECT id FROM public.funnels WHERE "subdomain" = 'workshop' LIMIT 1) AND "slug" = 'landing'
  ) THEN
    INSERT INTO public.funnel_steps ("funnel_id","slug","step_name","step_order","sort","type","title","blocks","blocks_json","meta","is_active")
    VALUES ((SELECT id FROM public.funnels WHERE "subdomain" = 'workshop' LIMIT 1), 'landing', 'Landing Page', 1, 1, 'landing', 'Workshop Hermes Agent — Landing', '[{"data":{"badge":"Kapasitas terbatas 30 peserta","title":"Bangun AI Agent Sales Pertamamu","eyebrow":"WORKSHOP 1 HARI","cta_text":"Ambil Seat Workshop","subtitle":"Dari nol sampai punya agent yang bales leads, ngejar closing, dan jalan 24/7. Praktik langsung, bawa pulang agent yang bisa langsung dipake.","cta_anchor":"#pricing"},"type":"hero"},{"data":{"items":[{"desc":"Leads datang malam, baru dibalas besok — dan sudah kecewa.","title":"Balas chat same-day?"},{"desc":"Deal sauce dibikin tapi nobody yang nge-follow-up lagi.","title":"Follow-up lupa?"},{"desc":"Tambah orang berarti nambah biaya, belum tentu nambah hasil.","title":"Mau scale tapi biaya?"}],"title":"Kenapa lo masih kerja manual?"},"type":"problem"},{"data":{"items":[{"desc":"Bales inbound, jawab FAQ, book janji temu, terus eskalasi ke lo.","title":"Agent jalan di jam kerja lo"},{"desc":"Prompt agent, alur follow-up 7 hari, dan script closing.","title":"Template siap pakai"},{"desc":"Dibangun bareng pakai data produk dan alur sales sebenarnya.","title":"Bisa apply ke bisnis lo"}],"title":"Yang lo dapet di workshop"},"type":"benefit"},{"data":{"items":[{"desc":"Bedah cara kerja agent: prompt, memory, tools, dan knowledge base.","title":"Sesi 1 — Fundamental AI Agent"},{"desc":"Nyusun alur: greet, qualify, tawarkan, handle objection, closing.","title":"Sesi 2 — Bikin Agent Sales"},{"desc":"Menyambungkan agent ke WhatsApp dan web chat, plus setup notifikasi ke lo.","title":"Sesi 3 — Integrasi Kanal"},{"desc":"Uji agent, ukur metrik, perbaiki, dan siap dipakai hari itu juga.","title":"Sesi 4 — Launch & Optimasi"}],"title":"Materi 4 Sesi"},"type":"kurikulum"},{"data":{"tiers":[{"id":"early-bird","name":"Early Bird","badge":"Hemat 40%","price":599000,"period":"sekali bayar","cta_text":"Ambil Early Bird","features":["4 sesi workshop + rekaman","Modul & template agent","Kelas komunitas 1 bulan","Sesi tanya jawab"],"highlight":true,"original_price":999000},{"id":"regular","name":"Regular","price":899000,"period":"sekali bayar","cta_text":"Daftar Regular","features":["4 sesi workshop + rekaman","Modul & template agent","Kelas komunitas 1 bulan"]}],"title":"Pilih Paket","description":"Early bird tutup 3 hari lagi atau setelah kuota tercapai."},"type":"pricing"},{"data":{"items":[{"a":"Tidak masalah. Sesi 1 mulai dari nol dan ada pendampingan sampai agent lo jalan.","q":"Sudah pernah pakai AI sama sekali?"},{"a":"Online via Zoom, direkam, dan bisa ditonton ulang.","q":"Metanya online atau offline?"},{"a":"Cukup WhatsApp + AI agent. Sisanya kami bantu rekomendasikan.","q":"Pakai tools apa aja?"},{"a":"Ada sertifikat-workshop untuk peserta yang hadir minimal 3 sesi.","q":"Ada sertifikat?"}],"title":"Pertanyaan yang Sering Muncul"},"type":"faq"},{"data":{"form":true,"title":"Siap Bangun Agent Pertama lo?","subtitle":"Kursi terbatas 30 peserta. Daftar sekarang biar dapet harga early bird.","form_title":"Kirim email, kirim detail seat","form_button":"Kirim & Ambil Seat","primary_text":"Ambil Seat Workshop","form_description":"Kami kirim link pembayaran & jadwal workshop ke email lo."},"type":"cta"}]'::jsonb, '[{"data":{"badge":"Kapasitas terbatas 30 peserta","title":"Bangun AI Agent Sales Pertamamu","eyebrow":"WORKSHOP 1 HARI","cta_text":"Ambil Seat Workshop","subtitle":"Dari nol sampai punya agent yang bales leads, ngejar closing, dan jalan 24/7. Praktik langsung, bawa pulang agent yang bisa langsung dipake.","cta_anchor":"#pricing"},"type":"hero"},{"data":{"items":[{"desc":"Leads datang malam, baru dibalas besok — dan sudah kecewa.","title":"Balas chat same-day?"},{"desc":"Deal sauce dibikin tapi nobody yang nge-follow-up lagi.","title":"Follow-up lupa?"},{"desc":"Tambah orang berarti nambah biaya, belum tentu nambah hasil.","title":"Mau scale tapi biaya?"}],"title":"Kenapa lo masih kerja manual?"},"type":"problem"},{"data":{"items":[{"desc":"Bales inbound, jawab FAQ, book janji temu, terus eskalasi ke lo.","title":"Agent jalan di jam kerja lo"},{"desc":"Prompt agent, alur follow-up 7 hari, dan script closing.","title":"Template siap pakai"},{"desc":"Dibangun bareng pakai data produk dan alur sales sebenarnya.","title":"Bisa apply ke bisnis lo"}],"title":"Yang lo dapet di workshop"},"type":"benefit"},{"data":{"items":[{"desc":"Bedah cara kerja agent: prompt, memory, tools, dan knowledge base.","title":"Sesi 1 — Fundamental AI Agent"},{"desc":"Nyusun alur: greet, qualify, tawarkan, handle objection, closing.","title":"Sesi 2 — Bikin Agent Sales"},{"desc":"Menyambungkan agent ke WhatsApp dan web chat, plus setup notifikasi ke lo.","title":"Sesi 3 — Integrasi Kanal"},{"desc":"Uji agent, ukur metrik, perbaiki, dan siap dipakai hari itu juga.","title":"Sesi 4 — Launch & Optimasi"}],"title":"Materi 4 Sesi"},"type":"kurikulum"},{"data":{"tiers":[{"id":"early-bird","name":"Early Bird","badge":"Hemat 40%","price":599000,"period":"sekali bayar","cta_text":"Ambil Early Bird","features":["4 sesi workshop + rekaman","Modul & template agent","Kelas komunitas 1 bulan","Sesi tanya jawab"],"highlight":true,"original_price":999000},{"id":"regular","name":"Regular","price":899000,"period":"sekali bayar","cta_text":"Daftar Regular","features":["4 sesi workshop + rekaman","Modul & template agent","Kelas komunitas 1 bulan"]}],"title":"Pilih Paket","description":"Early bird tutup 3 hari lagi atau setelah kuota tercapai."},"type":"pricing"},{"data":{"items":[{"a":"Tidak masalah. Sesi 1 mulai dari nol dan ada pendampingan sampai agent lo jalan.","q":"Sudah pernah pakai AI sama sekali?"},{"a":"Online via Zoom, direkam, dan bisa ditonton ulang.","q":"Metanya online atau offline?"},{"a":"Cukup WhatsApp + AI agent. Sisanya kami bantu rekomendasikan.","q":"Pakai tools apa aja?"},{"a":"Ada sertifikat-workshop untuk peserta yang hadir minimal 3 sesi.","q":"Ada sertifikat?"}],"title":"Pertanyaan yang Sering Muncul"},"type":"faq"},{"data":{"form":true,"title":"Siap Bangun Agent Pertama lo?","subtitle":"Kursi terbatas 30 peserta. Daftar sekarang biar dapet harga early bird.","form_title":"Kirim email, kirim detail seat","form_button":"Kirim & Ambil Seat","primary_text":"Ambil Seat Workshop","form_description":"Kami kirim link pembayaran & jadwal workshop ke email lo."},"type":"cta"}]'::jsonb, '{}'::jsonb, true);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.funnel_steps
    WHERE "funnel_id" = (SELECT id FROM public.funnels WHERE "subdomain" = 'kelas' LIMIT 1) AND "slug" = 'landing'
  ) THEN
    INSERT INTO public.funnel_steps ("funnel_id","slug","step_name","step_order","sort","type","title","blocks","blocks_json","meta","is_active")
    VALUES ((SELECT id FROM public.funnels WHERE "subdomain" = 'kelas' LIMIT 1), 'landing', 'Landing Page', 1, 1, 'landing', 'Kelas Hermes Agent — Landing', '[{"data":{"badge":"Kelas batch berikutnya mulai 2 minggu lagi","title":"Kelas Hermes: Dari Nol ke Punya AI Agent","eyebrow":"KELAS ONLINE","cta_text":"Lihat Kurikulum","subtitle":"Kelas online 6 sesi buat kamu yang mau punya AI agent sendiri — fundamentals, sales agent, dan sistem konten, step by step.","cta_anchor":"#kurikulum"},"type":"hero"},{"data":{"items":[{"desc":"Dasar prompt, konteks, dan cara bikin AI ngerti bisnismu.","title":"Sesi 1 — Chat dengan AI yang Berguna"},{"desc":"Memory, tools, knowledge base, dan alur kerja otomatis.","title":"Sesi 2 — Membangun Agent"},{"desc":"Bikin agent yang qualify lead, nawarin, dan handle objection.","title":"Sesi 3 — Agent untuk Sales"},{"desc":"Sambungkan agent ke kanal chat dan set up notifikasi.","title":"Sesi 4 — Integrasi WhatsApp"},{"desc":"1 brief jadi 30 caption dengan tone brand lo.","title":"Sesi 5 — Sistem Konten"},{"desc":"Jual jasa atau produk dengan sistem yang lo bangun sendiri.","title":"Sesi 6 — Monetisasi"}],"title":"Kurikulum 6 Sesi"},"type":"kurikulum"},{"data":{"items":[{"desc":"Tonton kapan saja, plus handout tiap sesi.","title":"Rekaman 6 sesi"},{"desc":"Komunitas + tanya jawab tiap minggu.","title":"KGrup WhatsApp"},{"desc":"30 prompt, template agent, dan script closing.","title":"Bonus template"}],"title":"Yang kamu dapat"},"type":"benefit"},{"data":{"tiers":[{"id":"early-bird","name":"Early Bird","badge":"Hemat 33%","price":299000,"period":"sekali bayar","cta_text":"Ambil Kelas Early Bird","features":["6 sesi + rekaman","Handout PDF","KGrup WhatsApp","Bonus template agent"],"highlight":true,"original_price":449000},{"id":"regular","name":"Regular","price":449000,"period":"sekali bayar","cta_text":"Daftar Regular","features":["6 sesi + rekaman","Handout PDF","KGrup WhatsApp"]}],"title":"Pilih Paket Kelas","description":"Early bird untuk 50 peserta pertama."},"type":"pricing"},{"data":{"items":[{"a":"Live 6 sesi, dan semuanya direkam untuk akses selamanya.","q":"Kelas live atau rekaman?"},{"a":"Cuma laptop/HP dan niat belajar. Semua materi dari nol.","q":"Syarat?"},{"a":"Bisa request kelas private offline, hubungi lewat form di halaman depan.","q":"Ada kelas Offline?"}],"title":"FAQ Kelas"},"type":"faq"},{"data":{"form":true,"title":"Slot Terbatas","subtitle":"Registrasi early bird ditutup setelah kuota 50 peserta tercapai.","form_title":"Ambil akses kelas","form_button":"Kirim & Daftar","primary_text":"Daftar Kelas Sekarang","form_description":"Kirim email, kami kirim link pembayaran & jadwal live session."},"type":"cta"}]'::jsonb, '[{"data":{"badge":"Kelas batch berikutnya mulai 2 minggu lagi","title":"Kelas Hermes: Dari Nol ke Punya AI Agent","eyebrow":"KELAS ONLINE","cta_text":"Lihat Kurikulum","subtitle":"Kelas online 6 sesi buat kamu yang mau punya AI agent sendiri — fundamentals, sales agent, dan sistem konten, step by step.","cta_anchor":"#kurikulum"},"type":"hero"},{"data":{"items":[{"desc":"Dasar prompt, konteks, dan cara bikin AI ngerti bisnismu.","title":"Sesi 1 — Chat dengan AI yang Berguna"},{"desc":"Memory, tools, knowledge base, dan alur kerja otomatis.","title":"Sesi 2 — Membangun Agent"},{"desc":"Bikin agent yang qualify lead, nawarin, dan handle objection.","title":"Sesi 3 — Agent untuk Sales"},{"desc":"Sambungkan agent ke kanal chat dan set up notifikasi.","title":"Sesi 4 — Integrasi WhatsApp"},{"desc":"1 brief jadi 30 caption dengan tone brand lo.","title":"Sesi 5 — Sistem Konten"},{"desc":"Jual jasa atau produk dengan sistem yang lo bangun sendiri.","title":"Sesi 6 — Monetisasi"}],"title":"Kurikulum 6 Sesi"},"type":"kurikulum"},{"data":{"items":[{"desc":"Tonton kapan saja, plus handout tiap sesi.","title":"Rekaman 6 sesi"},{"desc":"Komunitas + tanya jawab tiap minggu.","title":"KGrup WhatsApp"},{"desc":"30 prompt, template agent, dan script closing.","title":"Bonus template"}],"title":"Yang kamu dapat"},"type":"benefit"},{"data":{"tiers":[{"id":"early-bird","name":"Early Bird","badge":"Hemat 33%","price":299000,"period":"sekali bayar","cta_text":"Ambil Kelas Early Bird","features":["6 sesi + rekaman","Handout PDF","KGrup WhatsApp","Bonus template agent"],"highlight":true,"original_price":449000},{"id":"regular","name":"Regular","price":449000,"period":"sekali bayar","cta_text":"Daftar Regular","features":["6 sesi + rekaman","Handout PDF","KGrup WhatsApp"]}],"title":"Pilih Paket Kelas","description":"Early bird untuk 50 peserta pertama."},"type":"pricing"},{"data":{"items":[{"a":"Live 6 sesi, dan semuanya direkam untuk akses selamanya.","q":"Kelas live atau rekaman?"},{"a":"Cuma laptop/HP dan niat belajar. Semua materi dari nol.","q":"Syarat?"},{"a":"Bisa request kelas private offline, hubungi lewat form di halaman depan.","q":"Ada kelas Offline?"}],"title":"FAQ Kelas"},"type":"faq"},{"data":{"form":true,"title":"Slot Terbatas","subtitle":"Registrasi early bird ditutup setelah kuota 50 peserta tercapai.","form_title":"Ambil akses kelas","form_button":"Kirim & Daftar","primary_text":"Daftar Kelas Sekarang","form_description":"Kirim email, kami kirim link pembayaran & jadwal live session."},"type":"cta"}]'::jsonb, '{}'::jsonb, true);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.funnel_steps
    WHERE "funnel_id" = (SELECT id FROM public.funnels WHERE "subdomain" = 'hermes' LIMIT 1) AND "slug" = 'landing'
  ) THEN
    INSERT INTO public.funnel_steps ("funnel_id","slug","step_name","step_order","sort","type","title","blocks","blocks_json","meta","is_active")
    VALUES ((SELECT id FROM public.funnels WHERE "subdomain" = 'hermes' LIMIT 1), 'landing', 'Landing Page', 1, 1, 'landing', 'Hermes Agent - Multi Step Funnel — Landing', '[{"data":{"title":"Kuasai Hermes Agent dari Nol","eyebrow":"FUNNEL HERMES","cta_text":"Ambil Tutorial Gratis","subtitle":"Panduan step-by-step untuk membangun AI agent pertamamu — gratis.","cta_anchor":"#cta"},"type":"hero"},{"data":{"items":[{"desc":"Agent tidak tahu produk, tone, dan audiens-mu.","title":"Konteks kurang"},{"desc":"Belum jelas kapan agent harus lanjut dan kapan serahin ke manusia.","title":"Alur belum detail"}],"title":"Kenapa agent-mu sering gagal?"},"type":"problem"},{"data":{"form":true,"title":"Ambil Tutorial Gratis","subtitle":"Kirim email, kami kirim link tutorial Hermes.","form_title":"Dapatkan Tutorial Hermes Gratis","form_button":"Kirim & Dapatkan Akses","primary_text":"Ambil Tutorial Gratis"},"type":"cta"}]'::jsonb, '[{"data":{"title":"Kuasai Hermes Agent dari Nol","eyebrow":"FUNNEL HERMES","cta_text":"Ambil Tutorial Gratis","subtitle":"Panduan step-by-step untuk membangun AI agent pertamamu — gratis.","cta_anchor":"#cta"},"type":"hero"},{"data":{"items":[{"desc":"Agent tidak tahu produk, tone, dan audiens-mu.","title":"Konteks kurang"},{"desc":"Belum jelas kapan agent harus lanjut dan kapan serahin ke manusia.","title":"Alur belum detail"}],"title":"Kenapa agent-mu sering gagal?"},"type":"problem"},{"data":{"form":true,"title":"Ambil Tutorial Gratis","subtitle":"Kirim email, kami kirim link tutorial Hermes.","form_title":"Dapatkan Tutorial Hermes Gratis","form_button":"Kirim & Dapatkan Akses","primary_text":"Ambil Tutorial Gratis"},"type":"cta"}]'::jsonb, '{}'::jsonb, true);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.funnel_steps
    WHERE "funnel_id" = (SELECT id FROM public.funnels WHERE "subdomain" = 'promo' LIMIT 1) AND "slug" = 'landing'
  ) THEN
    INSERT INTO public.funnel_steps ("funnel_id","slug","step_name","step_order","sort","type","title","blocks","blocks_json","meta","is_active")
    VALUES ((SELECT id FROM public.funnels WHERE "subdomain" = 'promo' LIMIT 1), 'landing', 'Landing Page', 1, 1, 'landing', 'Promo Kursus - Standalone Checkout — Landing', '[{"data":{"title":"Promo Kursus Xinde Labs","eyebrow":"PROMO KURSUS","cta_text":"Lihat Paket","subtitle":"Harga khusus untuk batch terbatas.","cta_anchor":"#pricing"},"type":"hero"},{"data":{"tiers":[{"id":"promo","name":"Paket Promo","price":299000,"period":"sekali bayar","cta_text":"Beli Sekarang","features":["Akses kelas online","Modul dan template","Sesi tanya jawab"],"highlight":true}],"title":"Pilih Paket"},"type":"pricing"},{"data":{"form":true,"title":"Siap Join?","form_title":"Ambil paket promo","form_button":"Lanjut ke Pembayaran","primary_text":"Checkout Sekarang"},"type":"cta"}]'::jsonb, '[{"data":{"title":"Promo Kursus Xinde Labs","eyebrow":"PROMO KURSUS","cta_text":"Lihat Paket","subtitle":"Harga khusus untuk batch terbatas.","cta_anchor":"#pricing"},"type":"hero"},{"data":{"tiers":[{"id":"promo","name":"Paket Promo","price":299000,"period":"sekali bayar","cta_text":"Beli Sekarang","features":["Akses kelas online","Modul dan template","Sesi tanya jawab"],"highlight":true}],"title":"Pilih Paket"},"type":"pricing"},{"data":{"form":true,"title":"Siap Join?","form_title":"Ambil paket promo","form_button":"Lanjut ke Pembayaran","primary_text":"Checkout Sekarang"},"type":"cta"}]'::jsonb, '{}'::jsonb, true);
  END IF;
END $$;