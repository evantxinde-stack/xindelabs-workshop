-- Phase 7: transactional payment and renewal confirmation email.
-- Additive seed. Webhook fulfillment queues this immediately; daily cron remains
-- the retry/housekeeping backstop.

insert into public.email_sequences (key, name)
values ('renewal_confirmed', 'Annual membership renewal confirmation')
on conflict (key) do nothing;

insert into public.email_templates (key, subject, html_body)
values (
  'renewal_confirmed',
  'Renewal membership kamu berhasil',
  '<p>Halo {{name}},</p><p>Pembayaran renewal berhasil. Akses membership kamu sudah aktif kembali sampai {{paid_until}}.</p><p><a href="{{renewal_url}}">Buka LMS</a></p>'
)
on conflict (key) do nothing;

insert into public.email_steps (sequence_id, step, day_offset, template_id)
select s.id, 1, 0, t.id
from public.email_sequences s
cross join public.email_templates t
where s.key = 'renewal_confirmed'
  and t.key = 'renewal_confirmed'
on conflict (sequence_id, step) do nothing;
