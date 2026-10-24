-- Email template: tambah mode teks biasa (tanpa HTML).
-- body_text != '' dipakai utk render; fallback ke html_body.
alter table public.email_templates add column if not exists body_text text;