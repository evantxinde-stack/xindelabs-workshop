-- Add WA admin contact
insert into public.settings (key, value) values
  ('wa_admin_number', '628xxxxxxxxxx')
on conflict (key) do nothing;
