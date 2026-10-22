-- tambah key tracking
insert into public.settings (key, value) values
  ('funnel_events_enabled', '1')
on conflict (key) do nothing;
