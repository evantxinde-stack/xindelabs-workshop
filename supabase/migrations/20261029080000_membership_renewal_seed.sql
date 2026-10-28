-- Phase 6 renewal reminders. Additive seed; email dispatcher already exists.
insert into public.email_sequences (key, name)
values ('renewal_reminder', 'Annual membership renewal reminders')
on conflict (key) do nothing;

insert into public.email_templates (key, subject, html_body)
values (
  'renewal_reminder_due',
  'Membership kamu akan segera diperpanjang',
  '<p>Halo {{name}},</p><p>Akses membership annual kamu akan berakhir pada {{paid_until}}.</p><p><a href="{{renewal_url}}">Perpanjang akses sekarang</a></p>'
)
on conflict (key) do nothing;
