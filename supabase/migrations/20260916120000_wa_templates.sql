-- Template WhatsApp untuk follow-up manual dari dashboard admin.
-- Placeholder {{name}} diganti nama lead saat link wa.me dibuat.
create table if not exists public.wa_templates (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.wa_templates enable row level security;
drop policy if exists "admin all wa_templates" on public.wa_templates;
create policy "admin all wa_templates" on public.wa_templates
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Seed: template default, hanya jika tabel kosong (aman dijalankan ulang).
do $$
begin
  if exists (select 1 from public.wa_templates) then
    raise notice 'wa_templates sudah terisi; seed dilewati';
    return;
  end if;
  insert into public.wa_templates (name, content) values
  ('Follow-up standar', 'Halo {{name}}, ini dari Tim Tutorial Hermes. Gimana pengalaman kamu membaca tutorial gratis kemarin? Kalau ada bagian yang masih bingung atau mau dipandu lebih lanjut, aku siap bantu lewat program Fast-track. Cukup balas pesan ini ya.');
end $$;