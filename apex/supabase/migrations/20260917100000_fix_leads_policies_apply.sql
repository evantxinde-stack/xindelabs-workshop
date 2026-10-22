-- Perbaikan RLS produksi: policy anon-insert pada leads hilang sehingga
-- form funnel (anon key) gagal menyimpan lead (42501) -> checkout return 404.
-- Jalankan file ini di Supabase SQL Editor. Idempotent, aman diulang.

drop policy if exists "anon insert leads" on public.leads;
create policy "anon insert leads" on public.leads
  for insert to anon with check (true);

-- Dibutuhkan untuk .select("id") setelah insert (return=representation)
-- dan fallback lookup by email saat kena duplikat.
drop policy if exists "anon read leads" on public.leads;
create policy "anon read leads" on public.leads
  for select to anon using (true);