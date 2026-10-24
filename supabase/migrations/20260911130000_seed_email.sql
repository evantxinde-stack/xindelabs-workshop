insert into public.email_sequences (key, name) values
  ('free_vip_upsell', 'Free tutorial → upsell Bimbingan VIP'),
  ('fasttrack_access', 'Fast-track akses + grup + upsell VIP'),
  ('vip_onboarding', 'Onboarding VIP + grup + email dasar'),
  ('abandoned_checkout', 'Reminder pembayaran tertunda');

insert into public.email_templates (key, subject, html_body) values
('free_vip_intro', 'Tutorial Hermes kamu sudah siap 🚀 (+ tawaran spesial)', '<p>Halo {{name}},</p><p>Akses Tutorial Hermes minimalis: ada di email berikutnya. Sekalian saya kasih tahu — kalau kamu mau dibimbing langsung sampai paham, Bimbingan VIP cuma sedikit slotnya bulan ini.</p><p><a href="{{vip_url}}">Lihat detail Bimbingan VIP</a></p>'),
('free_vip_bonus', 'Bonus: 3 alasan Bimbingan VIP menyesal kalau dilewati', '<p>Halo {{name}},</p><p>Banyak yang merasa sendirian saat belajar. Bimbingan VIP memberi: mentor 1-on-1, review pekerjaan, dan komunitas.</p><p><a href="{{vip_url}}">Cek kuota yang tersisa</a></p>'),
('free_vip_followup', 'Masih mikir-mikir soal Bimbingan VIP?', '<p>Halo {{name}},</p><p>Pertanyaan jujur: bagian mana yang bikin ragu? Balas email ini, saya bantu jawab langsung.</p><p><a href="{{vip_url}}">Lihat penawaran lengkapnya</a></p>'),
('free_vip_lastchance', 'Terakhir kali harga normal sebelum naik', '<p>Halo {{name}},</p><p>Kalau kamu tetap bertahan di jalur gratis, tidak masalah — grup komunitas selalu terbuka. Tapi kalau mau akselerasi penuh, harga Bimbingan VIP akan naik minggu depan.</p><p><a href="{{vip_url}}">Amankan harga sekarang</a></p>'),
('fasttrack_access', 'Akses Fast-track Build Agent kamu siap', '<p>Halo {{name}},</p><p>Selamat! Materi Fast-track Build Agent sudah aktif. Kerjakan step-by-step dan langsung praktekan.</p><p><a href="{{fast_track_url}}">Mulai belajar sekarang</a></p>'),
('fasttrack_group', 'Gabung grup Fast-track, bangun bareng', '<p>Halo {{name}},</p><p>Jangan belajar sendirian — gabung grup Fast-track, tanya di mana pun kamu mentok, dan tunjukkan progresmu.</p><p><a href="{{group_url}}">Gabung grup sekarang</a></p>'),
('fasttrack_vip_offer', 'Harga spesial: naik kelas dari Fast-track ke VIP', '<p>Halo {{name}},</p><p>Karena kamu sudah Fast-track, kamu dapat harga spesial untuk naik ke Bimbingan VIP. Kuota terbatas.</p><p><a href="{{vip_url}}">Klaim harga spesial</a></p>'),
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

create trigger on_lead_created after insert on public.leads
for each row execute function public.on_lead_created();