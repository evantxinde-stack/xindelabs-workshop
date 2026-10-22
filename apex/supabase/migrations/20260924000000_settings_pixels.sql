-- ---------- Settings (key-value): pixel Meta & TikTok dsb ----------
create table if not exists public.settings (
  key   text primary key,
  value text
);

alter table public.settings enable row level security;

create policy "settings baca publik" on public.settings
  for select using (true);

create policy "settings tulis admin" on public.settings
  for all using (public.is_admin());

-- Seed kosong (opsional — diisi lewat menu Admin > Pixel)
insert into public.settings (key, value) values
  ('meta_pixel', ''),
  ('tiktok_pixel', ''),
  ('meta_pixel_capi', ''),
  ('tiktok_pixel_capi', '')
on conflict (key) do nothing;