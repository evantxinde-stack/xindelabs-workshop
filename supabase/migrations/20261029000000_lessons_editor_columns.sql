-- Lessons editor columns: admin UI reads/writes youtube_id, prompt, pdf_url.
alter table public.lessons
  add column if not exists youtube_id text,
  add column if not exists prompt text,
  add column if not exists pdf_url text;
